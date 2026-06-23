from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from ats_simulator import ats_report_to_dict, simulate_ats
from context_manager import save_context
from pipeline_context import PipelineContext


FORBIDDEN_PHRASES = [
    "responsible for",
    "helped with",
    "worked on",
    "assisted",
    "familiar with",
    "exposure to",
]
PAST_TENSE_VERBS = {
    "accelerated",
    "achieved",
    "adapted",
    "architected",
    "automated",
    "boosted",
    "built",
    "centralized",
    "consolidated",
    "created",
    "cut",
    "decreased",
    "delivered",
    "deployed",
    "designed",
    "developed",
    "drove",
    "eliminated",
    "enabled",
    "engineered",
    "enhanced",
    "expanded",
    "generated",
    "implemented",
    "improved",
    "increased",
    "integrated",
    "launched",
    "led",
    "lowered",
    "migrated",
    "modernized",
    "optimised",
    "optimized",
    "orchestrated",
    "owned",
    "reduced",
    "refactored",
    "resolved",
    "revamped",
    "scaled",
    "shipped",
    "simplified",
    "spearheaded",
    "stabilized",
    "standardized",
    "streamlined",
    "strengthened",
    "transformed",
    "trimmed",
    "upgraded",
}


def _base_dir() -> Path:
    from os import environ

    override = environ.get("RESUME_PIPELINE_BASE_DIR")
    if override:
        return Path(override).resolve()
    return Path(__file__).resolve().parents[1]


def _context_path(ctx: PipelineContext) -> Path:
    metadata_path = ctx.metadata.get("context_path")
    if metadata_path:
        return Path(metadata_path)

    run_id = ctx.metadata.get("run_id", "default")
    return _base_dir() / "runs" / str(run_id) / "context.json"


def _load_prompt() -> str:
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "08_qa_reviewer.md"
    return prompt_path.read_text(encoding="utf-8")


def _iter_resume_bullets(assembled_resume: dict) -> list[str]:
    bullets: list[str] = []

    for entry in assembled_resume.get("experience", []):
        if isinstance(entry, dict):
            bullets.extend(
                str(bullet).strip()
                for bullet in entry.get("bullets", [])
                if str(bullet).strip()
            )

    for entry in assembled_resume.get("projects", []):
        if isinstance(entry, dict):
            bullets.extend(
                str(bullet).strip()
                for bullet in entry.get("bullets", [])
                if str(bullet).strip()
            )

    bullets.extend(
        str(item).strip()
        for item in assembled_resume.get("achievements", [])
        if str(item).strip()
    )

    return bullets


def _source_sections(ctx: PipelineContext) -> dict:
    return ctx.ats_optimised.get("revised_sections") or ctx.content.get("sections", {})


def _build_source_bullet_meta(ctx: PipelineContext) -> list[dict]:
    sections = _source_sections(ctx)
    meta: list[dict] = []

    for section_name in ("experience", "projects"):
        for entry in sections.get(section_name, []):
            if not isinstance(entry, dict):
                continue
            evidence_id = str(entry.get("evidence_id", ""))
            for bullet in entry.get("bullets", []):
                if not isinstance(bullet, dict):
                    continue
                text = str(bullet.get("text", "")).strip()
                if not text:
                    continue
                meta.append(
                    {
                        "text": text,
                        "evidence_id": evidence_id,
                        "inferred": bool(bullet.get("inferred", False)),
                    }
                )

    competitive = sections.get("competitive_programming", {})
    if isinstance(competitive, dict):
        for bullet in competitive.get("bullets", []):
            if not isinstance(bullet, dict):
                continue
            text = str(bullet.get("text", "")).strip()
            if not text:
                continue
            meta.append(
                {
                    "text": text,
                    "evidence_id": "competitive_programming",
                    "inferred": bool(bullet.get("inferred", False)),
                }
            )

    return meta


def _build_bullet_records(assembled_resume: dict, ctx: PipelineContext) -> list[dict]:
    source_meta = _build_source_bullet_meta(ctx)
    bucket: dict[str, list[dict]] = {}
    for item in source_meta:
        bucket.setdefault(item["text"], []).append(item)

    records: list[dict] = []
    for bullet_text in _iter_resume_bullets(assembled_resume):
        matched = bucket.get(bullet_text, [])
        if matched:
            item = matched.pop(0)
            records.append(
                {
                    "text": bullet_text,
                    "evidence_id": item["evidence_id"],
                    "inferred": item["inferred"],
                }
            )
        else:
            records.append({"text": bullet_text, "evidence_id": "", "inferred": False})
    return records


def check_forbidden_phrases(resume: dict) -> list[str]:
    flags: list[str] = []
    for bullet in _iter_resume_bullets(resume):
        lowered = bullet.lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase in lowered:
                flags.append(f"Forbidden phrase '{phrase}' found in bullet: {bullet}")
                break
    return flags


def check_bullet_tense(resume: dict) -> list[str]:
    flags: list[str] = []
    for bullet in _iter_resume_bullets(resume):
        words = bullet.split()
        first_word = words[0].lower() if words else ""
        if first_word and first_word not in PAST_TENSE_VERBS:
            flags.append(f"Bullet does not start with a past-tense verb: {bullet}")
    return flags


def check_inferred_rate(resume: dict, ctx: PipelineContext) -> list[str]:
    bullet_records = _build_bullet_records(resume, ctx)
    if not bullet_records:
        return []

    inferred_count = sum(1 for item in bullet_records if item["inferred"] is True)
    inferred_rate = inferred_count / len(bullet_records)
    if inferred_rate > 0.4:
        return [f"Inferred metric rate {inferred_rate:.2f} exceeds 0.40 threshold"]
    return []


def _collect_forbidden_phrase_flags(resume: dict, ctx: PipelineContext) -> list[dict]:
    bullet_records = _build_bullet_records(resume, ctx)
    flags: list[dict] = []
    for item in bullet_records:
        lowered = item["text"].lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase in lowered:
                flags.append(
                    {
                        "bullet_text": item["text"],
                        "flag_reason": f"Contains forbidden phrase '{phrase}'",
                        "evidence_id": item["evidence_id"],
                    }
                )
                break
    return flags


def _collect_tense_flags(resume: dict, ctx: PipelineContext) -> list[dict]:
    bullet_records = _build_bullet_records(resume, ctx)
    flags: list[dict] = []
    for item in bullet_records:
        words = item["text"].split()
        first_word = words[0].lower() if words else ""
        if first_word and first_word not in PAST_TENSE_VERBS:
            flags.append(
                {
                    "bullet_text": item["text"],
                    "flag_reason": "Bullet must start with a past-tense action verb",
                    "evidence_id": item["evidence_id"],
                }
            )
    return flags


def _inferred_rate_and_flags(resume: dict, ctx: PipelineContext) -> tuple[float, list[dict]]:
    bullet_records = _build_bullet_records(resume, ctx)
    if not bullet_records:
        return 0.0, []

    inferred_items = [item for item in bullet_records if item["inferred"] is True]
    inferred_rate = round(len(inferred_items) / len(bullet_records), 2)
    if inferred_rate <= 0.4:
        return inferred_rate, []

    return inferred_rate, [
        {
            "bullet_text": item["text"],
            "flag_reason": "Too many inferred metrics across the resume; replace with source-backed claims where possible",
            "evidence_id": item["evidence_id"],
        }
        for item in inferred_items
    ]


def _relevant_candidate_slices(candidate: dict) -> dict:
    return {
        "linkedin": {
            "experience": candidate.get("linkedin", {}).get("experience", []),
            "education": candidate.get("linkedin", {}).get("education", []),
        },
        "github": {
            "projects": candidate.get("github", {}).get("projects", []),
        },
        "leetcode": candidate.get("leetcode", {}),
        "codeforces": candidate.get("codeforces", {}),
        "old_resume": {
            "experience": candidate.get("old_resume", {}).get("experience", []),
            "projects": candidate.get("old_resume", {}).get("projects", []),
        },
    }


def _validate_llm_flags(raw: Any) -> tuple[list[dict], list[dict]]:
    if not isinstance(raw, dict):
        raise ValueError("QA reviewer response must be an object")

    fact_check_flags = raw.get("fact_check_flags", [])
    tone_flags = raw.get("tone_flags", [])
    if not isinstance(fact_check_flags, list):
        raise ValueError("fact_check_flags must be a list")
    if not isinstance(tone_flags, list):
        raise ValueError("tone_flags must be a list")

    validated_fact_flags = []
    for item in fact_check_flags:
        if not isinstance(item, dict):
            raise ValueError("fact_check_flags entries must be objects")
        validated_fact_flags.append(
            {
                "bullet_text": str(item.get("bullet_text", "")).strip(),
                "flag_reason": str(item.get("flag_reason", "")).strip(),
                "evidence_id": str(item.get("evidence_id", "")).strip(),
            }
        )

    validated_tone_flags = []
    for item in tone_flags:
        if isinstance(item, dict):
            validated_tone_flags.append(
                {
                    "bullet_text": str(item.get("bullet_text", "")).strip(),
                    "flag_reason": str(item.get("flag_reason", "")).strip(),
                    "evidence_id": str(item.get("evidence_id", "")).strip(),
                }
            )
        else:
            validated_tone_flags.append(
                {
                    "bullet_text": "",
                    "flag_reason": str(item).strip(),
                    "evidence_id": "",
                }
            )

    return validated_fact_flags, validated_tone_flags


def _build_fix_instructions(*flag_groups: list[dict]) -> list[dict]:
    instructions: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for flags in flag_groups:
        for item in flags:
            evidence_id = str(item.get("evidence_id", "")).strip()
            bullet_text = str(item.get("bullet_text", "")).strip()
            flag_reason = str(item.get("flag_reason", "")).strip()
            key = (evidence_id, bullet_text, flag_reason)
            if key in seen:
                continue
            seen.add(key)
            instructions.append(
                {
                    "evidence_id": evidence_id,
                    "bullet_text": bullet_text,
                    "instruction": flag_reason,
                }
            )
    return instructions


def run(
    assembled_resume: dict,
    candidate: dict,
    jd_analysis: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    ats_report = ats_report_to_dict(
        simulate_ats(
            assembled_resume,
            str(ctx.metadata.get("latex_source", "")),
            jd_analysis.get("ats_keywords", []),
            int(
                assembled_resume.get(
                    "maxPages",
                    ctx.section_order.get("max_pages", 1) or 1,
                )
            ),
        )
    )
    ctx.ats_report = ats_report
    forbidden_phrase_flags = _collect_forbidden_phrase_flags(assembled_resume, ctx)
    tense_flags = _collect_tense_flags(assembled_resume, ctx)
    inferred_rate, inferred_flags = _inferred_rate_and_flags(assembled_resume, ctx)

    if forbidden_phrase_flags or tense_flags or inferred_flags:
        result = {
            "pass": False,
            "ats_score": float(ats_report.get("total_score", 0.0)),
            "ats_report": ats_report,
            "fact_check_flags": [],
            "tone_flags": tense_flags,
            "forbidden_phrase_flags": forbidden_phrase_flags,
            "inferred_rate": inferred_rate,
            "fix_instructions": _build_fix_instructions(
                forbidden_phrase_flags,
                tense_flags,
                inferred_flags,
            ),
        }
        ctx.qa_report = result
        save_context(ctx, str(_context_path(ctx)))
        return result

    bullet_records = _build_bullet_records(assembled_resume, ctx)
    raw = llm_client.call_llm(
        system_prompt=_load_prompt(),
        user_content=json.dumps(
            {
                "jd_analysis": {
                    "role_level": jd_analysis.get("role_level", "unknown"),
                    "required_skills": jd_analysis.get("required_skills", []),
                    "must_have_themes": jd_analysis.get("must_have_themes", []),
                },
                "resume_bullets": bullet_records,
                "candidate_source_slices": _relevant_candidate_slices(candidate),
            },
            indent=2,
            sort_keys=True,
        ),
        temperature=0.3,
        agent_name="agent_08_qa_reviewer",
        run_id=str(ctx.metadata.get("run_id", "")),
    )
    fact_check_flags, tone_flags = _validate_llm_flags(raw)
    result = {
        "pass": not fact_check_flags and not tone_flags,
        "ats_score": float(ats_report.get("total_score", 0.0)),
        "ats_report": ats_report,
        "fact_check_flags": fact_check_flags,
        "tone_flags": tone_flags,
        "forbidden_phrase_flags": [],
        "inferred_rate": inferred_rate,
        "fix_instructions": _build_fix_instructions(fact_check_flags, tone_flags),
    }
    ctx.qa_report = result
    save_context(ctx, str(_context_path(ctx)))
    return result
