from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any

import jsonschema

from context_manager import save_context
from exceptions import AssemblyError
from pipeline_context import PipelineContext


PAGE_ESTIMATE = {
    "summary": 0.08,
    "section_header": 0.06,
    "bullet": 0.04,
    "education_entry": 0.05,
    "skills_line": 0.03,
}
SECTION_KEY_MAP = {
    "Summary": "summary",
    "Education": "education",
    "Competitive Programming": "competitive_programming",
    "Projects": "projects",
    "Experience": "experience",
    "Skills": "skills",
    "Certifications": "certifications",
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


def _schema_path() -> Path:
    return Path(__file__).resolve().parents[1] / "latex_renderer" / "schema.json"


def _load_schema() -> dict:
    return json.loads(_schema_path().read_text(encoding="utf-8"))


def _normalize_dash(value: str) -> str:
    return (
        value.replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("â€“", "-")
        .replace("â€”", "-")
    )


def _parse_date_range(duration: str) -> tuple[str, str]:
    cleaned = _normalize_dash(str(duration or "")).strip()
    if not cleaned:
        return "", ""

    parts = [part.strip() for part in cleaned.split("-")]
    if len(parts) != 2:
        return cleaned, ""
    return parts[0], parts[1]


def _parse_month_year(value: str) -> tuple[int, int] | None:
    cleaned = value.strip()
    if not cleaned:
        return None
    if cleaned.lower() == "present":
        now = datetime.now()
        return now.year, now.month

    pieces = cleaned.split()
    if len(pieces) != 2:
        return None

    month = MONTHS.get(pieces[0][:3].lower())
    if month is None:
        return None

    try:
        year = int(pieces[1])
    except ValueError:
        return None

    return year, month


def _composite_map(scored_evidence: dict) -> dict[str, float]:
    result: dict[str, float] = {}
    for item in scored_evidence.get("scored_evidence", []):
        if isinstance(item, dict) and "id" in item:
            try:
                result[str(item["id"])] = float(item.get("composite", 0.0))
            except (TypeError, ValueError):
                result[str(item["id"])] = 0.0
    return result


def _extract_personal_info(candidate: dict) -> dict:
    personal = candidate.get("personal_info", {})
    linkedin = candidate.get("linkedin", {})
    github = candidate.get("github", {})

    return {
        "name": str(
            personal.get("name")
            or linkedin.get("name")
            or candidate.get("name", "")
        ),
        "email": str(
            personal.get("email")
            or linkedin.get("email")
            or candidate.get("email", "")
        ),
        "phone": str(
            personal.get("phone")
            or linkedin.get("phone")
            or candidate.get("phone", "")
        ),
        "location": str(
            personal.get("location")
            or linkedin.get("location")
            or candidate.get("location", "")
        ),
        "linkedin": str(
            personal.get("linkedin")
            or linkedin.get("profile_url")
            or candidate.get("linkedin_url", "")
        ),
        "github": str(
            personal.get("github")
            or github.get("profile_url")
            or candidate.get("github_url", "")
        ),
        "website": str(
            personal.get("website")
            or candidate.get("website", "")
        ),
    }


def _dedupe_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        cleaned = str(value).strip()
        if cleaned and cleaned not in seen:
            deduped.append(cleaned)
            seen.add(cleaned)
    return deduped


def _build_skills(skills_section: dict, cp_line: str = "") -> dict:
    grouped = skills_section.get("grouped", {}) if isinstance(skills_section, dict) else {}
    skills = {
        "languages": [],
        "frameworks": [],
        "tools": [],
        "databases": [],
    }

    for group_name, values in grouped.items():
        if not isinstance(values, list):
            continue

        normalized = str(group_name).strip().lower()
        if "language" in normalized:
            target = "languages"
        elif "framework" in normalized or "library" in normalized:
            target = "frameworks"
        elif "database" in normalized or "sql" in normalized:
            target = "databases"
        else:
            target = "tools"

        skills[target].extend(str(value).strip() for value in values if str(value).strip())

    if cp_line:
        skills["tools"].append(cp_line)

    return {
        key: _dedupe_preserve_order(value)
        for key, value in skills.items()
    }


def _build_cp_skills_line(cp_section: dict, candidate: dict) -> str:
    codeforces = candidate.get("codeforces", {})
    leetcode = candidate.get("leetcode", {})
    cf_rating = codeforces.get("rating", 0)
    cf_rank = str(codeforces.get("rank", "")).strip()
    solved = leetcode.get("solved", {})
    lc_total = solved.get("total")
    if lc_total in (None, ""):
        lc_total = sum(
            int(solved.get(key, 0) or 0)
            for key in ("easy", "medium", "hard")
        )

    parts: list[str] = []
    if cf_rating:
        cf_label = f"Codeforces: {cf_rating}"
        if cf_rank:
            cf_label = f"Codeforces: {cf_rank.title()} ({cf_rating})"
        parts.append(cf_label)
    if lc_total:
        parts.append(f"LeetCode: {int(lc_total)} problems solved")

    if parts:
        return ", ".join(parts)

    bullets = []
    if isinstance(cp_section, dict):
        for bullet in cp_section.get("bullets", []):
            if isinstance(bullet, dict):
                text = str(bullet.get("text", "")).strip()
                if text:
                    bullets.append(text)
    return " | ".join(bullets)


def _build_experience(entries: list[dict], composite_by_id: dict[str, float]) -> list[dict]:
    sorted_entries = sorted(
        [entry for entry in entries if isinstance(entry, dict)],
        key=lambda entry: composite_by_id.get(str(entry.get("evidence_id", "")), 0.0),
        reverse=True,
    )
    result = []
    for entry in sorted_entries:
        start_date, end_date = _parse_date_range(str(entry.get("duration", "")))
        bullets = [
            str(bullet.get("text", "")).strip()
            for bullet in entry.get("bullets", [])
            if isinstance(bullet, dict) and str(bullet.get("text", "")).strip()
        ]
        if not bullets:
            continue
        result.append(
            {
                "evidence_id": str(entry.get("evidence_id", "")),
                "company": str(entry.get("org", "")),
                "title": str(entry.get("title", "")),
                "location": "",
                "startDate": start_date,
                "endDate": end_date,
                "bullets": bullets,
            }
        )
    return result


def _build_projects(entries: list[dict], composite_by_id: dict[str, float]) -> list[dict]:
    sorted_entries = sorted(
        [entry for entry in entries if isinstance(entry, dict)],
        key=lambda entry: composite_by_id.get(str(entry.get("evidence_id", "")), 0.0),
        reverse=True,
    )
    result = []
    for entry in sorted_entries:
        start_date, end_date = _parse_date_range(str(entry.get("duration", "")))
        bullets = []
        tech_stack: list[str] = []
        for bullet in entry.get("bullets", []):
            if not isinstance(bullet, dict):
                continue
            text = str(bullet.get("text", "")).strip()
            if text:
                bullets.append(text)
            tech_stack.extend(
                str(keyword).strip()
                for keyword in bullet.get("keywords_used", [])
                if str(keyword).strip()
            )
        if not bullets:
            continue
        result.append(
            {
                "evidence_id": str(entry.get("evidence_id", "")),
                "name": str(entry.get("title", "")),
                "techStack": _dedupe_preserve_order(tech_stack),
                "startDate": start_date,
                "endDate": end_date,
                "bullets": bullets,
            }
        )
    return result


def _build_education(entries: list[dict]) -> list[dict]:
    result = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        year = str(entry.get("year", "")).strip()
        result.append(
            {
                "institution": str(entry.get("institution", "")),
                "degree": str(entry.get("degree", "")),
                "field": "",
                "location": "",
                "startDate": year,
                "endDate": year,
                "gpa": "",
                "coursework": [],
            }
        )
    return result


def _build_achievements(cp_section: dict) -> list[str]:
    if not isinstance(cp_section, dict):
        return []
    return [
        str(bullet.get("text", "")).strip()
        for bullet in cp_section.get("bullets", [])
        if isinstance(bullet, dict) and str(bullet.get("text", "")).strip()
    ]


def _build_order_map(section_order: dict) -> list[dict]:
    raw = section_order.get("section_order", [])
    valid = []
    for item in raw:
        if isinstance(item, dict) and "section" in item and "position" in item:
            valid.append(
                {
                    "section": str(item["section"]),
                    "position": int(item["position"]),
                }
            )
    return sorted(valid, key=lambda item: item["position"])


def _estimate_pages(assembled: dict) -> float:
    total = 0.0

    if assembled.get("summary", "").strip():
        total += PAGE_ESTIMATE["summary"]

    if assembled.get("education"):
        total += PAGE_ESTIMATE["section_header"]
        total += len(assembled["education"]) * PAGE_ESTIMATE["education_entry"]

    if assembled.get("experience"):
        total += PAGE_ESTIMATE["section_header"]
        total += sum(
            len(entry.get("bullets", []))
            for entry in assembled["experience"]
            if isinstance(entry, dict)
        ) * PAGE_ESTIMATE["bullet"]

    if assembled.get("projects"):
        total += PAGE_ESTIMATE["section_header"]
        total += sum(
            len(entry.get("bullets", []))
            for entry in assembled["projects"]
            if isinstance(entry, dict)
        ) * PAGE_ESTIMATE["bullet"]

    if assembled.get("achievements"):
        total += PAGE_ESTIMATE["section_header"]
        total += len(assembled["achievements"]) * PAGE_ESTIMATE["bullet"]

    skills = assembled.get("skills", {})
    skill_lines = sum(
        1
        for values in skills.values()
        if isinstance(values, list) and values
    )
    if skill_lines:
        total += PAGE_ESTIMATE["section_header"]
        total += skill_lines * PAGE_ESTIMATE["skills_line"]

    return round(total, 3)


def _drop_empty_entries(assembled: dict) -> None:
    assembled["experience"] = [
        entry for entry in assembled.get("experience", []) if entry.get("bullets")
    ]
    assembled["projects"] = [
        entry for entry in assembled.get("projects", []) if entry.get("bullets")
    ]
    assembled["achievements"] = [
        item for item in assembled.get("achievements", []) if str(item).strip()
    ]


def _trim_to_page_budget(assembled: dict, max_pages: int, composite_by_id: dict[str, float]) -> None:
    while _estimate_pages(assembled) > max_pages:
        removable: list[tuple[float, int, str, int, int]] = []

        for section_priority, section_name in enumerate(("projects", "experience", "achievements")):
            if section_name in ("experience", "projects"):
                for entry_index, entry in enumerate(assembled.get(section_name, [])):
                    evidence_id = str(entry.get("evidence_id", ""))
                    composite = composite_by_id.get(evidence_id, 0.0)
                    for bullet_index, _bullet in enumerate(entry.get("bullets", [])):
                        removable.append(
                            (composite, -section_priority, section_name, entry_index, bullet_index)
                        )
            else:
                for bullet_index, _bullet in enumerate(assembled.get("achievements", [])):
                    removable.append((0.0, -section_priority, section_name, 0, bullet_index))

        if not removable:
            break

        _, _, section_name, entry_index, bullet_index = sorted(removable, key=lambda item: (item[0], item[1]))[0]
        if section_name in ("experience", "projects"):
            del assembled[section_name][entry_index]["bullets"][bullet_index]
        else:
            del assembled["achievements"][bullet_index]

        _drop_empty_entries(assembled)


def _deduplicate_bullets(assembled: dict, ordered_sections: list[dict]) -> None:
    seen: set[str] = set()

    for item in ordered_sections:
        section_name = item["section"]
        if section_name == "Experience":
            for entry in assembled.get("experience", []):
                deduped = []
                for bullet in entry.get("bullets", []):
                    if bullet not in seen:
                        deduped.append(bullet)
                        seen.add(bullet)
                entry["bullets"] = deduped
        elif section_name == "Projects":
            for entry in assembled.get("projects", []):
                deduped = []
                for bullet in entry.get("bullets", []):
                    if bullet not in seen:
                        deduped.append(bullet)
                        seen.add(bullet)
                entry["bullets"] = deduped
        elif section_name == "Competitive Programming":
            deduped = []
            for bullet in assembled.get("achievements", []):
                if bullet not in seen:
                    deduped.append(bullet)
                    seen.add(bullet)
            assembled["achievements"] = deduped

    _drop_empty_entries(assembled)


def _has_content(assembled: dict, section_name: str) -> bool:
    key = SECTION_KEY_MAP.get(section_name, "")
    if key == "summary":
        return bool(assembled.get("summary", "").strip())
    if key == "education":
        return bool(assembled.get("education"))
    if key == "experience":
        return bool(assembled.get("experience"))
    if key == "projects":
        return bool(assembled.get("projects"))
    if key == "skills":
        skills = assembled.get("skills", {})
        return any(isinstance(values, list) and values for values in skills.values())
    if key == "competitive_programming":
        return bool(assembled.get("achievements"))
    return False


def _finalize_section_order(assembled: dict, ordered_sections: list[dict]) -> list[dict]:
    kept_sections = [
        item["section"]
        for item in ordered_sections
        if _has_content(assembled, item["section"])
    ]
    return [
        {"section": section, "position": index + 1}
        for index, section in enumerate(kept_sections)
    ]


def _strip_internal_fields(assembled: dict) -> None:
    for section_name in ("experience", "projects"):
        for entry in assembled.get(section_name, []):
            if isinstance(entry, dict):
                entry.pop("evidence_id", None)


def _validate_schema(assembled_resume: dict) -> None:
    try:
        jsonschema.validate(assembled_resume, _load_schema())
    except jsonschema.ValidationError as exc:
        raise AssemblyError(f"assembled resume failed schema validation: {exc.message}") from exc


def run(
    ats_optimised: dict,
    section_order: dict,
    scored_evidence: dict,
    content: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    del llm_client

    source_sections = ats_optimised.get("revised_sections") or content.get("sections", {})
    ordered_sections = _build_order_map(section_order)
    ordered_section_names = {item["section"] for item in ordered_sections}
    composite_by_id = _composite_map(scored_evidence)

    sections = deepcopy(source_sections)
    if "Competitive Programming" not in ordered_section_names:
        sections.pop("competitive_programming", None)
    if "Experience" not in ordered_section_names:
        sections["experience"] = []
    if "Projects" not in ordered_section_names:
        sections["projects"] = []
    if "Education" not in ordered_section_names:
        sections["education"] = []
    if "Skills" not in ordered_section_names:
        sections["skills"] = {"grouped": {}}

    cp_line = ""
    if not section_order.get("competitive_programming_as_section", False):
        cp_line = _build_cp_skills_line(sections.get("competitive_programming", {}), ctx.candidate)
        sections.pop("competitive_programming", None)

    assembled = {
        "personalInfo": _extract_personal_info(ctx.candidate),
        "summary": content.get("summary", "") if "Summary" in ordered_section_names else "",
        "education": _build_education(sections.get("education", [])),
        "experience": _build_experience(sections.get("experience", []), composite_by_id),
        "projects": _build_projects(sections.get("projects", []), composite_by_id),
        "skills": _build_skills(sections.get("skills", {}), cp_line=cp_line),
        "achievements": (
            _build_achievements(sections.get("competitive_programming", {}))
            if section_order.get("competitive_programming_as_section", False)
            and "Competitive Programming" in ordered_section_names
            else []
        ),
        "sectionOrder": [],
        "maxPages": int(section_order.get("max_pages", 1)),
    }

    _drop_empty_entries(assembled)
    _trim_to_page_budget(assembled, assembled["maxPages"], composite_by_id)
    _deduplicate_bullets(assembled, ordered_sections)
    assembled["sectionOrder"] = _finalize_section_order(assembled, ordered_sections)
    _strip_internal_fields(assembled)
    _validate_schema(assembled)

    ctx.assembled_resume = assembled
    save_context(ctx, str(_context_path(ctx)))
    return assembled
