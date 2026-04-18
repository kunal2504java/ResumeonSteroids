from __future__ import annotations

import json
import logging
import re
from copy import deepcopy
from pathlib import Path
from typing import Any

from context_manager import save_context
from pipeline_context import PipelineContext


LOGGER = logging.getLogger(__name__)

FORBIDDEN_PHRASES = {
    "responsible for",
    "helped with",
    "worked on",
    "assisted",
    "familiar with",
    "exposure to",
}

FIRST_PERSON_PATTERN = re.compile(r"\b(i|me|my|we|our)\b", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d+(?:\.\d+)?(?:%|x|k|m|ms|s|sec|secs|seconds|minutes|mins|hours|hrs|days|weeks|months|years)?\b", re.IGNORECASE)
SENTENCE_SPLIT_PATTERN = re.compile(r"[.!?]+")
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
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "04_content_writer.md"
    return prompt_path.read_text(encoding="utf-8")


def _iter_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        strings: list[str] = []
        for item in value.values():
            strings.extend(_iter_strings(item))
        return strings
    if isinstance(value, list):
        strings: list[str] = []
        for item in value:
            strings.extend(_iter_strings(item))
        return strings
    return []


def _source_has_metric(item: dict) -> bool:
    return any(NUMBER_PATTERN.search(text) for text in _iter_strings(item))


def _source_metric_map(scored_evidence: dict) -> dict[str, bool]:
    result: dict[str, bool] = {}
    for item in scored_evidence.get("scored_evidence", []):
        if isinstance(item, dict) and "id" in item:
            result[str(item["id"])] = _source_has_metric(item)
    return result


def _sentence_count(summary: str) -> int:
    parts = [part.strip() for part in SENTENCE_SPLIT_PATTERN.split(summary) if part.strip()]
    return len(parts)


def _validate_summary(summary: Any) -> str:
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("summary must be a non-empty string")
    cleaned = summary.strip()
    if _sentence_count(cleaned) != 3:
        raise ValueError("summary must contain exactly 3 sentences")
    return cleaned


def _validate_keywords_used(value: Any) -> list[str]:
    if not isinstance(value, list):
        raise ValueError("keywords_used must be a list")
    keywords = []
    for item in value:
        if not isinstance(item, str):
            raise ValueError("keywords_used entries must be strings")
        keywords.append(item.strip())
    return keywords


def _validate_bullet_shape(bullet: Any) -> dict:
    if not isinstance(bullet, dict):
        raise ValueError("bullet must be an object")

    text = bullet.get("text")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("bullet.text must be a non-empty string")

    inferred = bullet.get("inferred")
    if not isinstance(inferred, bool):
        raise ValueError("bullet.inferred must be a boolean")

    return {
        "text": text.strip(),
        "keywords_used": _validate_keywords_used(bullet.get("keywords_used", [])),
        "inferred": inferred,
    }


def _validate_entry(entry: Any, entry_type: str) -> dict:
    if not isinstance(entry, dict):
        raise ValueError(f"{entry_type} entry must be an object")

    evidence_id = entry.get("evidence_id", "")
    title = entry.get("title", "")
    org = entry.get("org", "")
    duration = entry.get("duration", "")
    bullets = entry.get("bullets", [])

    if not isinstance(evidence_id, str):
        raise ValueError(f"{entry_type}.evidence_id must be a string")
    if not isinstance(title, str):
        raise ValueError(f"{entry_type}.title must be a string")
    if not isinstance(org, str):
        raise ValueError(f"{entry_type}.org must be a string")
    if not isinstance(duration, str):
        raise ValueError(f"{entry_type}.duration must be a string")
    if not isinstance(bullets, list):
        raise ValueError(f"{entry_type}.bullets must be a list")

    return {
        "evidence_id": evidence_id,
        "title": title,
        "org": org,
        "duration": duration,
        "bullets": [_validate_bullet_shape(bullet) for bullet in bullets],
    }


def _validate_competitive_programming(section: Any) -> dict:
    if not isinstance(section, dict):
        raise ValueError("competitive_programming must be an object")
    include = section.get("include")
    bullets = section.get("bullets", [])
    if not isinstance(include, bool):
        raise ValueError("competitive_programming.include must be a boolean")
    if not isinstance(bullets, list):
        raise ValueError("competitive_programming.bullets must be a list")
    return {
        "include": include,
        "bullets": [_validate_bullet_shape(bullet) for bullet in bullets],
    }


def _validate_skills(section: Any) -> dict:
    if not isinstance(section, dict):
        raise ValueError("skills section must be an object")
    grouped = section.get("grouped")
    if not isinstance(grouped, dict):
        raise ValueError("skills.grouped must be an object")

    validated_grouped = {}
    for key, values in grouped.items():
        if not isinstance(key, str):
            raise ValueError("skills.grouped keys must be strings")
        if not isinstance(values, list) or not all(isinstance(item, str) for item in values):
            raise ValueError("skills.grouped values must be string lists")
        validated_grouped[key] = values
    return {"grouped": validated_grouped}


def _validate_education(section: Any) -> list[dict]:
    if not isinstance(section, list):
        raise ValueError("education must be a list")
    validated = []
    for item in section:
        if not isinstance(item, dict):
            raise ValueError("education entries must be objects")
        degree = item.get("degree", "")
        institution = item.get("institution", "")
        year = item.get("year", "")
        if not all(isinstance(value, str) for value in (degree, institution, year)):
            raise ValueError("education fields must be strings")
        validated.append(
            {"degree": degree, "institution": institution, "year": year}
        )
    return validated


def _validate_content(raw: dict) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("content writer response must be an object")

    summary = _validate_summary(raw.get("summary"))
    sections = raw.get("sections")
    if not isinstance(sections, dict):
        raise ValueError("sections must be an object")

    return {
        "summary": summary,
        "sections": {
            "experience": [
                _validate_entry(entry, "experience")
                for entry in sections.get("experience", [])
            ],
            "projects": [
                _validate_entry(entry, "project")
                for entry in sections.get("projects", [])
            ],
            "competitive_programming": _validate_competitive_programming(
                sections.get("competitive_programming", {"include": False, "bullets": []})
            ),
            "skills": _validate_skills(sections.get("skills", {"grouped": {}})),
            "education": _validate_education(sections.get("education", [])),
        },
    }


def _starts_with_past_tense_verb(text: str) -> bool:
    first_word = text.split()[0].lower() if text.split() else ""
    return first_word in PAST_TENSE_VERBS


def _sanitize_bullets(bullets: list[dict], evidence_id: str, source_has_metric: bool) -> list[dict]:
    sanitized: list[dict] = []
    for bullet in bullets:
        text = bullet["text"].strip()
        lowered = text.lower()

        if len(text.split()) > 20:
            LOGGER.warning("Removed overlong bullet for evidence_id=%s", evidence_id)
            continue

        if any(phrase in lowered for phrase in FORBIDDEN_PHRASES):
            LOGGER.warning("Removed forbidden-phrase bullet for evidence_id=%s", evidence_id)
            continue

        if FIRST_PERSON_PATTERN.search(text):
            raise ValueError(f"First-person pronoun found in bullet for evidence_id={evidence_id}")

        if not _starts_with_past_tense_verb(text):
            raise ValueError(f"Bullet must start with a past-tense action verb: {text}")

        sanitized.append(
            {
                "text": text,
                "keywords_used": bullet["keywords_used"],
                "inferred": True if not source_has_metric else bullet["inferred"],
            }
        )

    return sanitized


def _apply_post_processing(content: dict, scored_evidence: dict) -> dict:
    metric_map = _source_metric_map(scored_evidence)
    processed = {
        "summary": content["summary"],
        "sections": {
            "experience": [],
            "projects": [],
            "competitive_programming": {
                "include": content["sections"]["competitive_programming"]["include"],
                "bullets": [],
            },
            "skills": content["sections"]["skills"],
            "education": content["sections"]["education"],
        },
    }

    for section_name in ("experience", "projects"):
        for entry in content["sections"][section_name]:
            source_has_metric = metric_map.get(entry["evidence_id"], False)
            processed_entry = {
                **entry,
                "bullets": _sanitize_bullets(
                    entry["bullets"],
                    evidence_id=entry["evidence_id"],
                    source_has_metric=source_has_metric,
                ),
            }
            processed["sections"][section_name].append(processed_entry)

    processed["sections"]["competitive_programming"]["bullets"] = _sanitize_bullets(
        content["sections"]["competitive_programming"]["bullets"],
        evidence_id="competitive_programming",
        source_has_metric=any(metric_map.values()),
    )

    return processed


def _build_user_content(scored_evidence: dict, jd_analysis: dict, gap_analysis: dict) -> str:
    included_evidence = [
        item
        for item in scored_evidence.get("scored_evidence", [])
        if isinstance(item, dict) and item.get("include") is True
    ]
    payload = {
        "jd": {
            "role_level": jd_analysis.get("role_level", "unknown"),
            "must_have_themes": jd_analysis.get("must_have_themes", []),
            "required_skills": jd_analysis.get("required_skills", []),
            "ats_keywords": jd_analysis.get("ats_keywords", []),
        },
        "gap_analysis": {
            "hard_gaps": gap_analysis.get("hard_gaps", []),
            "soft_gaps": gap_analysis.get("soft_gaps", []),
            "coverage_summary": gap_analysis.get("coverage_summary", ""),
            "match_score": gap_analysis.get("match_score", 0),
        },
        "evidence": included_evidence,
    }
    return json.dumps(payload, indent=2, sort_keys=True)


def _filter_scored_evidence(scored_evidence: dict, evidence_ids: list[str] | None) -> dict:
    if not evidence_ids:
        return scored_evidence

    allowed_ids = set(evidence_ids)
    return {
        "scored_evidence": [
            item
            for item in scored_evidence.get("scored_evidence", [])
            if isinstance(item, dict) and str(item.get("id", "")) in allowed_ids
        ]
    }


def _merge_targeted_content(
    existing_content: dict,
    partial_content: dict,
    evidence_ids: list[str] | None,
) -> dict:
    if not evidence_ids or not existing_content:
        return partial_content

    allowed_ids = set(evidence_ids)
    merged = deepcopy(existing_content)

    for section_name in ("experience", "projects"):
        replacement_map = {
            entry["evidence_id"]: entry
            for entry in partial_content.get("sections", {}).get(section_name, [])
            if isinstance(entry, dict) and str(entry.get("evidence_id", "")) in allowed_ids
        }
        merged_entries = []
        for entry in merged.get("sections", {}).get(section_name, []):
            evidence_id = str(entry.get("evidence_id", ""))
            if evidence_id in replacement_map:
                merged_entries.append(replacement_map[evidence_id])
            else:
                merged_entries.append(entry)
        merged["sections"][section_name] = merged_entries

    if "competitive_programming" in allowed_ids:
        merged["sections"]["competitive_programming"] = partial_content["sections"]["competitive_programming"]

    return merged


def run(
    scored_evidence: dict,
    jd_analysis: dict,
    gap_analysis: dict,
    llm_client,
    ctx: PipelineContext,
    evidence_ids: list[str] | None = None,
) -> dict:
    filtered_scored_evidence = _filter_scored_evidence(scored_evidence, evidence_ids)
    raw = llm_client.call_llm(
        system_prompt=_load_prompt(),
        user_content=_build_user_content(filtered_scored_evidence, jd_analysis, gap_analysis),
        temperature=0.7,
        agent_name="agent_04_content_writer",
        run_id=str(ctx.metadata.get("run_id", "")),
    )

    validated = _validate_content(raw)
    processed = _apply_post_processing(validated, filtered_scored_evidence)
    processed = _merge_targeted_content(ctx.content, processed, evidence_ids)
    ctx.content = processed
    save_context(ctx, str(_context_path(ctx)))
    return processed
