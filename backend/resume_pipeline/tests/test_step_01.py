from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from context_manager import load_context, save_context
from pipeline_context import PipelineContext


def make_context() -> PipelineContext:
    return PipelineContext(
        candidate={"name": "Test Candidate", "skills": ["Python", "SQL"]},
        jd={"title": "Data Engineer", "requirements": ["Python"]},
        jd_analysis={"keywords": ["python"]},
        scored_evidence={"projects": [{"name": "pipeline"}]},
        gap_analysis={"missing": ["aws"]},
        content={"summary": "Builder"},
        ats_optimised={"score": 88},
        section_order={"order": ["summary", "experience"]},
        assembled_resume={"sections": 2},
        qa_report={"passed": True},
        metadata={
            "run_id": "test-run-id",
            "timestamp": "2026-04-18T00:00:00+00:00",
            "retry_count": 0,
            "agent_timings": {"init": 0.1},
        },
    )


def run_pipeline(temp_base_dir: Path) -> tuple[subprocess.CompletedProcess[str], str]:
    pipeline_dir = Path(__file__).resolve().parents[1]
    candidate = pipeline_dir / "fixtures" / "sample_candidate.json"
    jd = pipeline_dir / "fixtures" / "sample_jd.json"
    env = os.environ.copy()
    env["RESUME_PIPELINE_BASE_DIR"] = str(temp_base_dir)

    result = subprocess.run(
        [
            sys.executable,
            str(pipeline_dir / "pipeline.py"),
            "--candidate",
            str(candidate),
            "--jd",
            str(jd),
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(pipeline_dir),
        env=env,
    )

    run_id = result.stdout.strip().split(": ", maxsplit=1)[1]
    return result, run_id


def test_context_serialises_to_json_and_back(tmp_path: Path) -> None:
    ctx = make_context()
    target = tmp_path / "context.json"

    save_context(ctx, str(target))
    restored = load_context(str(target))

    assert restored == ctx


def test_context_saves_to_correct_path(tmp_path: Path) -> None:
    ctx = make_context()
    target = tmp_path / "nested" / "context.json"

    save_context(ctx, str(target))

    assert target.exists()


def test_load_context_restores_all_fields(tmp_path: Path) -> None:
    original = make_context()
    target = tmp_path / "context.json"

    save_context(original, str(target))
    restored = load_context(str(target))

    assert restored.candidate == original.candidate
    assert restored.jd == original.jd
    assert restored.jd_analysis == original.jd_analysis
    assert restored.scored_evidence == original.scored_evidence
    assert restored.gap_analysis == original.gap_analysis
    assert restored.content == original.content
    assert restored.ats_optimised == original.ats_optimised
    assert restored.section_order == original.section_order
    assert restored.assembled_resume == original.assembled_resume
    assert restored.qa_report == original.qa_report
    assert restored.metadata == original.metadata


def test_pipeline_cli_creates_run_directory(tmp_path: Path) -> None:
    result, run_id = run_pipeline(tmp_path)

    assert result.returncode == 0, result.stderr
    assert (tmp_path / "runs" / run_id).is_dir()
    assert (tmp_path / "runs" / run_id / "context.json").is_file()


def test_run_id_is_unique_per_invocation(tmp_path: Path) -> None:
    _, run_id_1 = run_pipeline(tmp_path / "first")
    _, run_id_2 = run_pipeline(tmp_path / "second")

    assert run_id_1 != run_id_2
