from __future__ import annotations

import argparse
import concurrent.futures
import json
import logging
import os
import time
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from context_manager import load_context, save_context as _save_context
from exceptions import LLMFailure
from pipeline_context import PipelineContext


LOGGER = logging.getLogger(__name__)
_LAST_SAVE_NS = 0


def _base_dir() -> Path:
    override = os.environ.get("RESUME_PIPELINE_BASE_DIR")
    if override:
        return Path(override).resolve()
    return Path(__file__).resolve().parent


def _load_json(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save_context(ctx: PipelineContext, path: str) -> None:
    global _LAST_SAVE_NS

    _save_context(ctx, path)
    unique_ns = max(time.time_ns(), _LAST_SAVE_NS + 10_000_000)
    os.utime(path, ns=(unique_ns, unique_ns))
    _LAST_SAVE_NS = unique_ns


def run_path(ctx: PipelineContext) -> Path:
    metadata_path = ctx.metadata.get("context_path")
    if metadata_path:
        return Path(str(metadata_path))
    return _base_dir() / "runs" / str(ctx.metadata.get("run_id", "default")) / "context.json"


def _jd_raw_text(jd: dict) -> str:
    if isinstance(jd.get("raw_text"), str) and jd["raw_text"].strip():
        return jd["raw_text"].strip()

    parts: list[str] = []
    for key in ("title", "company", "summary", "description"):
        value = jd.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())

    requirements = jd.get("requirements", [])
    if isinstance(requirements, list):
        parts.extend(str(item).strip() for item in requirements if str(item).strip())

    return "\n".join(parts).strip()


def initialise_context(candidate: dict, jd: dict, run_id: str | None = None) -> PipelineContext:
    resolved_run_id = run_id or str(uuid4())
    context_path = _base_dir() / "runs" / resolved_run_id / "context.json"

    ctx = PipelineContext(
        candidate=candidate,
        jd=jd,
        jd_analysis={},
        scored_evidence={},
        gap_analysis={},
        content={},
        ats_optimised={},
        section_order={},
        assembled_resume={},
        qa_report={},
        skill_match_details=[],
        ats_report={},
        metadata={
            "run_id": resolved_run_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "retry_count": 0,
            "agent_timings": {},
            "context_path": str(context_path),
        },
    )
    save_context(ctx, str(context_path))
    return ctx


def _default_agent_modules() -> dict[str, Any]:
    from agents import agent_01_jd_analyser
    from agents import agent_02_profile_scorer
    from agents import agent_03_gap_analyser
    from agents import agent_04_content_writer
    from agents import agent_05_ats_optimiser
    from agents import agent_06_section_ranker
    from agents import agent_07_assembler
    from agents import agent_08_qa_reviewer

    return {
        "agent_01": agent_01_jd_analyser,
        "agent_02": agent_02_profile_scorer,
        "agent_03": agent_03_gap_analyser,
        "agent_04": agent_04_content_writer,
        "agent_05": agent_05_ats_optimiser,
        "agent_06": agent_06_section_ranker,
        "agent_07": agent_07_assembler,
        "agent_08": agent_08_qa_reviewer,
    }


def _default_llm_client() -> Any:
    import llm_client

    return llm_client


def log_warning(message: str) -> None:
    LOGGER.warning(message)


def _agent_completed(name: str, ctx: PipelineContext) -> bool:
    if name == "agent_01":
        return bool(ctx.jd_analysis)
    if name == "agent_02":
        return bool(ctx.scored_evidence)
    if name == "agent_03":
        return bool(ctx.gap_analysis)
    if name == "agent_04":
        return bool(ctx.content)
    if name == "agent_05":
        return bool(ctx.ats_optimised)
    if name == "agent_06":
        return bool(ctx.section_order)
    if name == "agent_07":
        return bool(ctx.assembled_resume)
    if name == "agent_08":
        return bool(ctx.qa_report) and "pass" in ctx.qa_report
    return False


def _record_timing(ctx: PipelineContext, name: str, started_at: float) -> None:
    ctx.metadata.setdefault("agent_timings", {})
    ctx.metadata["agent_timings"][name] = round((time.perf_counter() - started_at) * 1000)


def run_agent(
    name: str,
    fn,
    args: tuple,
    ctx: PipelineContext,
    llm_client,
) -> Any:
    started_at = time.perf_counter()
    try:
        result = fn(*args, llm_client, ctx)
        _record_timing(ctx, name, started_at)
        save_context(ctx, str(run_path(ctx)))
        print(f"{name} completed in {ctx.metadata['agent_timings'][name]}ms")
        return result
    except LLMFailure as exc:
        _record_timing(ctx, name, started_at)
        log_warning(f"{name} failed: {exc}. Skipping.")
        ctx.qa_report.setdefault("warnings", []).append(f"{name} skipped due to LLMFailure")
        save_context(ctx, str(run_path(ctx)))
        return None


def _run_parallel_agent(name: str, fn, args: tuple, llm_client, ctx: PipelineContext) -> tuple[str, Any, int | None, str | None]:
    started_at = time.perf_counter()
    try:
        result = fn(*args, llm_client, ctx)
        elapsed_ms = round((time.perf_counter() - started_at) * 1000)
        return name, result, elapsed_ms, None
    except LLMFailure as exc:
        elapsed_ms = round((time.perf_counter() - started_at) * 1000)
        return name, None, elapsed_ms, str(exc)


def _parallel_ctx(ctx: PipelineContext, agent_name: str) -> PipelineContext:
    cloned = deepcopy(ctx)
    cloned.metadata = dict(ctx.metadata)
    cloned.metadata["context_path"] = str(run_path(ctx).with_name(f"context.{agent_name}.json"))
    return cloned


def _save_result_for_agent(ctx: PipelineContext, name: str, result: Any, elapsed_ms: int | None = None) -> None:
    if result is not None:
        if name == "agent_03":
            ctx.gap_analysis = result
            ctx.skill_match_details = result.get("skill_match_details", [])
        elif name == "agent_06":
            ctx.section_order = result
        elif name == "agent_01":
            ctx.jd_analysis = result
        elif name == "agent_02":
            ctx.scored_evidence = result
        elif name == "agent_04":
            ctx.content = result
        elif name == "agent_05":
            ctx.ats_optimised = result
        elif name == "agent_07":
            ctx.assembled_resume = result
        elif name == "agent_08":
            warnings = list(ctx.qa_report.get("warnings", []))
            ctx.qa_report = result
            if warnings:
                ctx.qa_report["warnings"] = warnings
    if elapsed_ms is not None:
        ctx.metadata.setdefault("agent_timings", {})
        ctx.metadata["agent_timings"][name] = elapsed_ms
    save_context(ctx, str(run_path(ctx)))


def _resume_or_initialise(candidate: dict, jd: dict, run_id: str | None) -> PipelineContext:
    if run_id:
        context_path = _base_dir() / "runs" / run_id / "context.json"
        if context_path.exists():
            return load_context(str(context_path))
    return initialise_context(candidate, jd, run_id=run_id)


def run_qa_retry_loop(
    ctx: PipelineContext,
    llm_client,
    *,
    agent_04_module=None,
    agent_05_module=None,
    agent_07_module=None,
    agent_08_module=None,
) -> dict:
    if agent_04_module is None:
        from agents import agent_04_content_writer as agent_04_module
    if agent_05_module is None:
        from agents import agent_05_ats_optimiser as agent_05_module
    if agent_07_module is None:
        from agents import agent_07_assembler as agent_07_module
    if agent_08_module is None:
        from agents import agent_08_qa_reviewer as agent_08_module

    warnings = list(ctx.qa_report.get("warnings", []))
    qa_report = agent_08_module.run(
        ctx.assembled_resume,
        ctx.candidate,
        ctx.jd_analysis,
        llm_client,
        ctx,
    )
    if warnings:
        qa_report["warnings"] = warnings
        ctx.qa_report["warnings"] = warnings

    if qa_report.get("pass") is False and int(ctx.metadata.get("retry_count", 0)) < 1:
        ctx.metadata["retry_count"] = int(ctx.metadata.get("retry_count", 0)) + 1
        save_context(ctx, str(Path(ctx.metadata.get("context_path", _base_dir() / "runs" / str(ctx.metadata.get("run_id", "default")) / "context.json"))))

        flagged_ids: list[str] = []
        for item in qa_report.get("fix_instructions", []):
            if not isinstance(item, dict):
                continue
            evidence_id = str(item.get("evidence_id", "")).strip()
            if evidence_id and evidence_id not in flagged_ids:
                flagged_ids.append(evidence_id)

        agent_04_module.run(
            ctx.scored_evidence,
            ctx.jd_analysis,
            ctx.gap_analysis,
            llm_client,
            ctx,
            evidence_ids=flagged_ids,
        )
        agent_05_module.run(
            ctx.content,
            ctx.jd_analysis,
            llm_client,
            ctx,
        )
        agent_07_module.run(
            ctx.ats_optimised,
            ctx.section_order,
            ctx.scored_evidence,
            ctx.content,
            llm_client,
            ctx,
        )
        qa_report = agent_08_module.run(
            ctx.assembled_resume,
            ctx.candidate,
            ctx.jd_analysis,
            llm_client,
            ctx,
        )
        if warnings:
            qa_report["warnings"] = warnings
            ctx.qa_report["warnings"] = warnings
    elif qa_report.get("pass") is False:
        log_warning("QA failed after retry — proceeding with flagged content")

    return qa_report


def run_pipeline(
    candidate: dict,
    jd: dict,
    run_id: str | None = None,
    *,
    llm_client_module=None,
    agent_modules: dict[str, Any] | None = None,
) -> PipelineContext:
    llm_client = llm_client_module or _default_llm_client()
    agents = agent_modules or _default_agent_modules()
    ctx = _resume_or_initialise(candidate, jd, run_id)

    if not _agent_completed("agent_01", ctx):
        result = run_agent(
            "agent_01",
            agents["agent_01"].run,
            (_jd_raw_text(ctx.jd),),
            ctx,
            llm_client,
        )
        if result is not None:
            ctx.jd_analysis = result

    if not _agent_completed("agent_02", ctx):
        result = run_agent(
            "agent_02",
            agents["agent_02"].run,
            (ctx.candidate, ctx.jd_analysis),
            ctx,
            llm_client,
        )
        if result is not None:
            ctx.scored_evidence = result

    needs_agent_03 = not _agent_completed("agent_03", ctx)
    needs_agent_06 = not _agent_completed("agent_06", ctx)
    if needs_agent_03 or needs_agent_06:
        futures: dict[concurrent.futures.Future, str] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            if needs_agent_03:
                futures[
                    pool.submit(
                        _run_parallel_agent,
                        "agent_03",
                        agents["agent_03"].run,
                        (ctx.jd_analysis, ctx.scored_evidence, ctx.candidate),
                        llm_client,
                        _parallel_ctx(ctx, "agent_03"),
                    )
                ] = "agent_03"
            if needs_agent_06:
                futures[
                    pool.submit(
                        _run_parallel_agent,
                        "agent_06",
                        agents["agent_06"].run,
                        (ctx.candidate, ctx.jd_analysis, ctx.scored_evidence),
                        llm_client,
                        _parallel_ctx(ctx, "agent_06"),
                    )
                ] = "agent_06"

            for future in concurrent.futures.as_completed(futures):
                name, result, elapsed_ms, error_message = future.result()
                if error_message is not None:
                    ctx.metadata.setdefault("agent_timings", {})
                    ctx.metadata["agent_timings"][name] = elapsed_ms
                    log_warning(f"{name} failed: {error_message}. Skipping.")
                    ctx.qa_report.setdefault("warnings", []).append(f"{name} skipped due to LLMFailure")
                    save_context(ctx, str(run_path(ctx)))
                    continue
                _save_result_for_agent(ctx, name, result, elapsed_ms)
                print(f"{name} completed in {elapsed_ms}ms")

    if not _agent_completed("agent_04", ctx):
        result = run_agent(
            "agent_04",
            agents["agent_04"].run,
            (ctx.scored_evidence, ctx.jd_analysis, ctx.gap_analysis),
            ctx,
            llm_client,
        )
        if result is not None:
            ctx.content = result

    if not _agent_completed("agent_05", ctx):
        result = run_agent(
            "agent_05",
            agents["agent_05"].run,
            (ctx.content, ctx.jd_analysis),
            ctx,
            llm_client,
        )
        if result is not None:
            ctx.ats_optimised = result

    if not _agent_completed("agent_07", ctx):
        result = run_agent(
            "agent_07",
            agents["agent_07"].run,
            (ctx.ats_optimised, ctx.section_order, ctx.scored_evidence, ctx.content),
            ctx,
            llm_client,
        )
        if result is not None:
            ctx.assembled_resume = result

    if not _agent_completed("agent_08", ctx):
        result = run_agent(
            "agent_08",
            agents["agent_08"].run,
            (ctx.assembled_resume, ctx.candidate, ctx.jd_analysis),
            ctx,
            llm_client,
        )
        if result is not None:
            warnings = list(ctx.qa_report.get("warnings", []))
            ctx.qa_report = result
            if warnings:
                ctx.qa_report["warnings"] = warnings

    if ctx.qa_report and ctx.qa_report.get("pass") is False and int(ctx.metadata.get("retry_count", 0)) < 1:
        run_qa_retry_loop(
            ctx,
            llm_client,
            agent_04_module=agents["agent_04"],
            agent_05_module=agents["agent_05"],
            agent_07_module=agents["agent_07"],
            agent_08_module=agents["agent_08"],
        )

    save_context(ctx, str(run_path(ctx)))
    return ctx


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialise the resume pipeline.")
    parser.add_argument("--candidate", required=True, help="Path to candidate JSON")
    parser.add_argument("--jd", required=True, help="Path to job description JSON")
    args = parser.parse_args()

    candidate = _load_json(args.candidate)
    jd = _load_json(args.jd)
    ctx = initialise_context(candidate, jd)
    print(f"Pipeline initialised: {ctx.metadata['run_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
