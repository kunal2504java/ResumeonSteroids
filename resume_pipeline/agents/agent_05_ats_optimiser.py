from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from context_manager import save_context
from pipeline_context import PipelineContext


VALID_SECTION_HEADINGS = {
    "Experience",
    "Education",
    "Skills",
    "Projects",
    "Summary",
    "Competitive Programming",
    "Certifications",
}
DATE_PATTERN = re.compile(r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$")
PAST_TENSE_VERBS = {
    "accelerated",
    "architected",
    "automated",
    "built",
    "created",
    "delivered",
    "designed",
    "developed",
    "drove",
    "engineered",
    "enhanced",
    "expanded",
    "generated",
    "implemented",
    "improved",
    "increased",
    "launched",
    "led",
    "lowered",
    "migrated",
    "optimized",
    "orchestrated",
    "reduced",
    "refactored",
    "resolved",
    "scaled",
    "shipped",
    "simplified",
    "streamlined",
    "strengthened",
}
SECTION_HEADING_MAP = {
    "experience": "Experience",
    "education": "Education",
    "skills": "Skills",
    "projects": "Projects",
    "summary": "Summary",
    "competitive_programming": "Competitive Programming",
    "certifications": "Certifications",
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
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "05_ats_optimiser.md"
    return prompt_path.read_text(encoding="utf-8")


def _iter_bullet_texts(sections: dict) -> list[str]:
    bullets: list[str] = []

    for entry in sections.get("experience", []):
        if isinstance(entry, dict):
            for bullet in entry.get("bullets", []):
                if isinstance(bullet, dict) and isinstance(bullet.get("text"), str):
                    bullets.append(bullet["text"])

    for entry in sections.get("projects", []):
        if isinstance(entry, dict):
            for bullet in entry.get("bullets", []):
                if isinstance(bullet, dict) and isinstance(bullet.get("text"), str):
                    bullets.append(bullet["text"])

    competitive = sections.get("competitive_programming", {})
    if isinstance(competitive, dict):
        for bullet in competitive.get("bullets", []):
            if isinstance(bullet, dict) and isinstance(bullet.get("text"), str):
                bullets.append(bullet["text"])

    return bullets


def _iter_keyword_scan_texts(sections: dict) -> list[str]:
    texts = _iter_bullet_texts(sections)

    skills = sections.get("skills", {})
    if isinstance(skills, dict):
        grouped = skills.get("grouped", {})
        if isinstance(grouped, dict):
            for values in grouped.values():
                if isinstance(values, list):
                    texts.extend(str(value) for value in values)

    return texts


def scan_keywords(sections: dict, ats_keywords: list) -> dict:
    bullet_blob = " ".join(_iter_keyword_scan_texts(sections)).lower()
    normalized_keywords = [str(keyword).strip() for keyword in ats_keywords if str(keyword).strip()]

    if not normalized_keywords:
        return {
            "hits": 0,
            "misses": 0,
            "hit_rate": 100.0,
            "keywords_present": [],
            "keywords_missing": [],
        }

    keywords_present = [
        keyword for keyword in normalized_keywords if keyword.lower() in bullet_blob
    ]
    keywords_missing = [
        keyword for keyword in normalized_keywords if keyword.lower() not in bullet_blob
    ]
    hits = len(keywords_present)
    misses = len(keywords_missing)
    hit_rate = round((hits / len(normalized_keywords)) * 100, 1)

    return {
        "hits": hits,
        "misses": misses,
        "hit_rate": hit_rate,
        "keywords_present": keywords_present,
        "keywords_missing": keywords_missing,
    }


def _is_valid_date_part(value: str) -> bool:
    value = value.strip()
    return value == "Present" or bool(DATE_PATTERN.match(value))


def _is_valid_duration(value: str) -> bool:
    cleaned = value.strip()
    if not cleaned:
        return True

    if "–" in cleaned:
        parts = [part.strip() for part in cleaned.split("–")]
    elif "—" in cleaned:
        parts = [part.strip() for part in cleaned.split("—")]
    elif " - " in cleaned:
        parts = [part.strip() for part in cleaned.split(" - ")]
    else:
        parts = [cleaned]

    if len(parts) == 1:
        return _is_valid_date_part(parts[0])
    if len(parts) == 2:
        return _is_valid_date_part(parts[0]) and _is_valid_date_part(parts[1])
    return False


def check_formatting(sections: dict) -> list[str]:
    flags: list[str] = []

    for key in sections.keys():
        heading = SECTION_HEADING_MAP.get(key, str(key))
        if heading not in VALID_SECTION_HEADINGS:
            flags.append(f"Non-standard heading: '{heading}'")

    for section_name in ("experience", "projects"):
        for entry in sections.get(section_name, []):
            if isinstance(entry, dict):
                duration = entry.get("duration", "")
                if isinstance(duration, str) and not _is_valid_duration(duration):
                    flags.append(
                        f"Inconsistent date format in {section_name}: '{duration}'"
                    )

    for entry in sections.get("education", []):
        if isinstance(entry, dict):
            year = entry.get("year", "")
            if isinstance(year, str) and year and not re.fullmatch(r"\d{4}", year):
                flags.append(f"Inconsistent date format in education: '{year}'")

    return flags


def _validate_bullet_texts(sections: dict) -> None:
    for bullet in _iter_bullet_texts(sections):
        words = bullet.split()
        if not words:
            raise ValueError("Encountered empty bullet text after ATS optimisation")
        if words[0].lower() not in PAST_TENSE_VERBS:
            raise ValueError(f"XYZ structure not preserved: {bullet}")


def _validate_revised_sections(value: Any) -> dict:
    if not isinstance(value, dict):
        raise ValueError("ATS optimiser revised sections must be an object")
    return value


def _run_llm_rewrite(
    *,
    sections: dict,
    ats_keywords: list[str],
    keywords_missing: list[str],
    llm_client,
    run_id: str,
) -> dict:
    user_content = json.dumps(
        {
            "ats_keywords": ats_keywords,
            "keywords_missing": keywords_missing,
            "sections": sections,
        },
        indent=2,
        sort_keys=True,
    )
    raw = llm_client.call_llm(
        system_prompt=_load_prompt(),
        user_content=user_content,
        temperature=0.3,
        agent_name="agent_05_ats_optimiser",
        run_id=run_id,
    )
    revised_sections = raw.get("revised_sections", raw)
    validated = _validate_revised_sections(revised_sections)
    _validate_bullet_texts(validated)
    return validated


def run(
    content: dict,
    jd_analysis: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    original_sections = content.get("sections", {})
    ats_keywords = [str(keyword) for keyword in jd_analysis.get("ats_keywords", [])]

    initial_scan = scan_keywords(original_sections, ats_keywords)

    llm_triggered = initial_scan["hit_rate"] < 70.0
    if llm_triggered:
        revised_sections = _run_llm_rewrite(
            sections=original_sections,
            ats_keywords=ats_keywords,
            keywords_missing=initial_scan["keywords_missing"],
            llm_client=llm_client,
            run_id=str(ctx.metadata.get("run_id", "")),
        )
    else:
        revised_sections = original_sections

    final_scan = scan_keywords(revised_sections, ats_keywords)
    formatting_flags = check_formatting(revised_sections)

    result = {
        "keyword_hit_rate": final_scan["hit_rate"],
        "keywords_present": final_scan["keywords_present"],
        "keywords_missing": final_scan["keywords_missing"],
        "llm_triggered": llm_triggered,
        "revised_sections": revised_sections,
        "formatting_flags": formatting_flags,
        "ats_score": final_scan["hit_rate"],
    }
    ctx.ats_optimised = result
    save_context(ctx, str(_context_path(ctx)))
    return result
