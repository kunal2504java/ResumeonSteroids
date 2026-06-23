from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, TypedDict

from context_manager import save_context
from pipeline_context import PipelineContext


class ScoredEvidence(TypedDict):
    id: str
    type: str
    source: str
    title: str
    relevance: float
    impact: float
    recency: float
    composite: float
    include: bool
    reason: str


VALID_TYPES = {"project", "experience", "contest", "certification", "education"}


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
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "02_profile_scorer.md"
    return prompt_path.read_text(encoding="utf-8")


def _make_brief_description(item: dict) -> str:
    candidates = [
        item.get("brief_description"),
        item.get("description"),
        item.get("summary"),
        item.get("headline"),
    ]
    bullets = item.get("bullets")
    if isinstance(bullets, list) and bullets:
        candidates.append(" ".join(str(part).strip() for part in bullets[:2] if str(part).strip()))

    for value in candidates:
        if isinstance(value, str) and value.strip():
            return value.strip()

    return item.get("title", "")


def _normalize_item(item: dict, *, item_type: str, source: str, fallback_prefix: str, index: int) -> dict:
    title = (
        item.get("title")
        or item.get("name")
        or item.get("company")
        or item.get("institution")
        or f"{item_type}_{index}"
    )
    item_id = item.get("id") or f"{fallback_prefix}_{index}"
    return {
        "id": str(item_id),
        "type": item_type,
        "source": source,
        "title": str(title),
        "brief_description": _make_brief_description(item),
    }


def _flatten_candidate_evidence(candidate: dict) -> List[dict]:
    evidence: List[dict] = []

    mapping = [
        ("github", "projects", "project"),
        ("linkedin", "experience", "experience"),
        ("linkedin", "education", "education"),
        ("linkedin", "certifications", "certification"),
        ("leetcode", "contests", "contest"),
        ("codeforces", "contests", "contest"),
        ("old_resume", "projects", "project"),
        ("old_resume", "experience", "experience"),
        ("old_resume", "education", "education"),
        ("old_resume", "certifications", "certification"),
        ("old_resume", "contests", "contest"),
    ]

    for source, key, item_type in mapping:
        source_data = candidate.get(source)
        if not isinstance(source_data, dict):
            continue
        items = source_data.get(key, [])
        if not isinstance(items, list):
            continue
        for index, item in enumerate(items, start=1):
            if isinstance(item, dict):
                evidence.append(
                    _normalize_item(
                        item,
                        item_type=item_type,
                        source=source,
                        fallback_prefix=f"{source}_{key}",
                        index=index,
                    )
                )

    for key, item_type in [
        ("projects", "project"),
        ("experience", "experience"),
        ("education", "education"),
        ("certifications", "certification"),
        ("contests", "contest"),
    ]:
        items = candidate.get(key, [])
        if not isinstance(items, list):
            continue
        for index, item in enumerate(items, start=1):
            if isinstance(item, dict):
                evidence.append(
                    _normalize_item(
                        item,
                        item_type=item_type,
                        source="candidate",
                        fallback_prefix=f"candidate_{key}",
                        index=index,
                    )
                )

    deduped: List[dict] = []
    seen_ids: set[str] = set()
    for item in evidence:
        if item["id"] in seen_ids:
            continue
        seen_ids.add(item["id"])
        deduped.append(item)
    return deduped


def _score_to_float(value: object, field_name: str) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError) as err:
        raise ValueError(f"{field_name} must be numeric") from err

    if score < 0 or score > 10:
        raise ValueError(f"{field_name} must be between 0 and 10")
    return score


def _validate_raw_scores(raw: dict) -> List[dict]:
    scored = raw.get("scored_evidence")
    if not isinstance(scored, list):
        raise ValueError("scored_evidence must be a list")

    validated: List[dict] = []
    for item in scored:
        if not isinstance(item, dict):
            raise ValueError("Each scored_evidence entry must be an object")

        item_type = item.get("type")
        if item_type not in VALID_TYPES:
            raise ValueError(f"type must be one of {sorted(VALID_TYPES)}")

        validated.append(
            {
                "id": str(item.get("id", "")),
                "type": str(item_type),
                "source": str(item.get("source", "")),
                "title": str(item.get("title", "")),
                "relevance": _score_to_float(item.get("relevance"), "relevance"),
                "impact": _score_to_float(item.get("impact"), "impact"),
                "recency": _score_to_float(item.get("recency"), "recency"),
            }
        )

    return validated


def _compute_composite(item: dict) -> float:
    return (item["relevance"] * 0.5) + (item["impact"] * 0.3) + (item["recency"] * 0.2)


def _build_reason(item: dict) -> str:
    strengths: List[str] = []

    if item["relevance"] >= 8:
        strengths.append("high JD relevance")
    elif item["relevance"] >= 5:
        strengths.append("moderate JD relevance")
    else:
        strengths.append("low JD relevance")

    if item["impact"] >= 8:
        strengths.append("strong impact")
    elif item["impact"] >= 5:
        strengths.append("solid impact")
    else:
        strengths.append("limited impact")

    if item["recency"] >= 8:
        strengths.append("recent signal")
    elif item["recency"] >= 5:
        strengths.append("somewhat recent")
    else:
        strengths.append("older signal")

    return ", ".join(strengths)


def _post_process(raw_scores: List[dict]) -> List[ScoredEvidence]:
    processed: List[ScoredEvidence] = []
    for item in raw_scores:
        composite = _compute_composite(item)
        processed.append(
            {
                "id": item["id"],
                "type": item["type"],
                "source": item["source"],
                "title": item["title"],
                "relevance": item["relevance"],
                "impact": item["impact"],
                "recency": item["recency"],
                "composite": composite,
                "include": False,
                "reason": _build_reason({**item, "composite": composite}),
            }
        )

    processed.sort(key=lambda item: item["composite"], reverse=True)

    included = 0
    for item in processed:
        if item["composite"] < 3.0:
            item["include"] = False
            continue
        if included < 15:
            item["include"] = True
            included += 1
        else:
            item["include"] = False

    return processed


def run(
    candidate: dict,
    jd_analysis: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    candidate_evidence = _flatten_candidate_evidence(candidate)
    if not candidate_evidence:
        result = {"scored_evidence": []}
        ctx.scored_evidence = result
        save_context(ctx, str(_context_path(ctx)))
        return result

    user_content = json.dumps(
        {
            "jd_must_have_themes": jd_analysis.get("must_have_themes", []),
            "jd_required_skills": jd_analysis.get("required_skills", []),
            "candidate_evidence": candidate_evidence,
        },
        indent=2,
        sort_keys=True,
    )

    raw_scores = _validate_raw_scores(
        llm_client.call_llm(
            system_prompt=_load_prompt(),
            user_content=user_content,
            temperature=0.3,
            agent_name="agent_02_profile_scorer",
            run_id=str(ctx.metadata.get("run_id", "")),
        )
    )

    processed = _post_process(raw_scores)
    result = {"scored_evidence": processed}
    ctx.scored_evidence = result
    save_context(ctx, str(_context_path(ctx)))
    return result
