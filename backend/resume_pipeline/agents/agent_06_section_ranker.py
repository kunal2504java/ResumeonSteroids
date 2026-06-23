from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from context_manager import save_context
from pipeline_context import PipelineContext


VALID_SECTIONS = {
    "Summary",
    "Education",
    "Competitive Programming",
    "Projects",
    "Experience",
    "Skills",
    "Certifications",
}
MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
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
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "06_section_ranker.md"
    return prompt_path.read_text(encoding="utf-8")


def _normalize_dash(value: str) -> str:
    return (
        value.replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("â€“", "-")
        .replace("â€”", "-")
    )


def _parse_month_year(value: str) -> tuple[int, int] | None:
    cleaned = value.strip()
    if not cleaned:
        return None
    if cleaned.lower() == "present":
        now = datetime.now()
        return now.year, now.month

    parts = cleaned.split()
    if len(parts) != 2:
        return None

    month = MONTHS.get(parts[0][:3].lower())
    if month is None:
        return None

    try:
        year = int(parts[1])
    except ValueError:
        return None

    return year, month


def _months_for_duration(duration: str) -> int:
    cleaned = _normalize_dash(str(duration or "")).strip()
    if not cleaned:
        return 0

    parts = [part.strip() for part in cleaned.split("-")]
    if len(parts) != 2:
        return 0

    start = _parse_month_year(parts[0])
    end = _parse_month_year(parts[1])
    if start is None or end is None:
        return 0

    start_year, start_month = start
    end_year, end_month = end
    total = ((end_year - start_year) * 12) + (end_month - start_month) + 1
    return max(total, 0)


def compute_max_pages(candidate: dict) -> int:
    experience = candidate.get("linkedin", {}).get("experience", [])
    total_months = 0

    for item in experience:
        if isinstance(item, dict):
            total_months += _months_for_duration(str(item.get("duration", "")))

    total_years = total_months / 12
    return 1 if total_years < 3 else 2


def should_include_cp_section(candidate: dict, jd_analysis: dict) -> bool:
    cf_rating = candidate.get("codeforces", {}).get("rating", 0)
    lc_hard = candidate.get("leetcode", {}).get("solved", {}).get("hard", 0)
    work_style = jd_analysis.get("implicit_signals", {}).get("work_style", "unknown")

    strong_cp = cf_rating > 1400 or lc_hard > 50
    engineering_role = work_style not in ["research", "product", "design"]

    return strong_cp and engineering_role


def _determine_rule_based_order(candidate: dict, jd_analysis: dict) -> tuple[list[str] | None, str | None]:
    role_level = jd_analysis.get("role_level", "unknown")
    work_style = jd_analysis.get("implicit_signals", {}).get("work_style", "unknown")
    cf_rating = candidate.get("codeforces", {}).get("rating", 0)
    exp_items = len(candidate.get("linkedin", {}).get("experience", []))

    if role_level == "junior" or cf_rating > 1800:
        return (
            [
                "Summary",
                "Education",
                "Competitive Programming",
                "Projects",
                "Experience",
                "Skills",
                "Certifications",
            ],
            "Education and competitive programming are prioritised because the profile is junior-level or has standout contest strength.",
        )

    if role_level in ["senior", "staff"] and exp_items >= 2:
        return (
            [
                "Summary",
                "Experience",
                "Projects",
                "Skills",
                "Education",
                "Certifications",
            ],
            "Experience is prioritised because the role targets a senior profile with enough prior work history to lead the resume.",
        )

    if work_style == "research":
        return (
            [
                "Summary",
                "Projects",
                "Experience",
                "Education",
                "Skills",
                "Certifications",
            ],
            "Projects are prioritised because the job description signals a research-oriented role.",
        )

    return None, None


def _build_section_positions(order: list[str]) -> list[dict[str, Any]]:
    return [{"section": section, "position": index + 1} for index, section in enumerate(order)]


def _validate_fallback_response(raw: Any) -> tuple[list[str], str]:
    if not isinstance(raw, dict):
        raise ValueError("Section ranker fallback response must be an object")

    order = raw.get("order", raw.get("section_order"))
    rationale = raw.get("rationale", "")

    if not isinstance(order, list) or not order:
        raise ValueError("Section ranker fallback must include a non-empty order list")
    if not isinstance(rationale, str) or not rationale.strip():
        raise ValueError("Section ranker fallback must include a rationale string")

    normalized_order: list[str] = []
    seen: set[str] = set()
    for section in order:
        if not isinstance(section, str):
            raise ValueError("Section names must be strings")
        cleaned = section.strip()
        if cleaned not in VALID_SECTIONS:
            raise ValueError(f"Invalid section in fallback order: {cleaned}")
        if cleaned not in seen:
            normalized_order.append(cleaned)
            seen.add(cleaned)

    return normalized_order, rationale.strip()


def _call_llm_for_section_order(
    candidate: dict,
    jd_analysis: dict,
    scored_evidence: dict,
    llm_client,
    run_id: str,
) -> tuple[list[str], str]:
    include_true_count = sum(
        1
        for item in scored_evidence.get("scored_evidence", [])
        if isinstance(item, dict) and item.get("include") is True
    )
    user_content = json.dumps(
        {
            "role_level": jd_analysis.get("role_level", "unknown"),
            "work_style": jd_analysis.get("implicit_signals", {}).get("work_style", "unknown"),
            "must_have_themes": jd_analysis.get("must_have_themes", []),
            "required_skills": jd_analysis.get("required_skills", []),
            "cf_rating": candidate.get("codeforces", {}).get("rating", 0),
            "leetcode_hard": candidate.get("leetcode", {}).get("solved", {}).get("hard", 0),
            "experience_count": len(candidate.get("linkedin", {}).get("experience", [])),
            "included_evidence_count": include_true_count,
        },
        indent=2,
        sort_keys=True,
    )
    response = llm_client.call_llm(
        system_prompt=_load_prompt(),
        user_content=user_content,
        temperature=0.3,
        agent_name="agent_06_section_ranker",
        run_id=run_id,
    )
    return _validate_fallback_response(response)


def determine_section_order(candidate: dict, jd_analysis: dict, scored_evidence: dict) -> list[dict[str, Any]] | None:
    order, _ = _determine_rule_based_order(candidate, jd_analysis)
    if order is None:
        return None
    return _build_section_positions(order)


def run(
    candidate: dict,
    jd_analysis: dict,
    scored_evidence: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    rule_order, rationale = _determine_rule_based_order(candidate, jd_analysis)
    llm_used = False

    if rule_order is None or rationale is None:
        rule_order, rationale = _call_llm_for_section_order(
            candidate,
            jd_analysis,
            scored_evidence,
            llm_client,
            str(ctx.metadata.get("run_id", "")),
        )
        llm_used = True

    result = {
        "section_order": _build_section_positions(rule_order),
        "max_pages": compute_max_pages(candidate),
        "competitive_programming_as_section": should_include_cp_section(candidate, jd_analysis),
        "llm_used": llm_used,
        "rationale": rationale,
    }
    ctx.section_order = result
    save_context(ctx, str(_context_path(ctx)))
    return result
