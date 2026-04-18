from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TypedDict

from context_manager import save_context
from pipeline_context import PipelineContext


class GapAnalysis(TypedDict):
    hard_gaps: list[dict]
    soft_gaps: list[dict]
    covered_skills: list[str]
    coverage_summary: str
    match_score: float


TERM_ALIASES = {
    "cloud": {"aws", "gcp", "azure", "cloud"},
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
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "03_gap_analyser.md"
    return prompt_path.read_text(encoding="utf-8")


def _normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9+#.\s]", " ", value.lower()).strip()


def _tokenize(value: str) -> set[str]:
    normalized = _normalize_text(value)
    return {token for token in normalized.split() if token}


def _text_matches(term: str, evidence: dict) -> bool:
    searchable = " ".join(
        [
            str(evidence.get("title", "")),
            str(evidence.get("type", "")),
            str(evidence.get("source", "")),
            str(evidence.get("reason", "")),
        ]
    )
    normalized_searchable = _normalize_text(searchable)
    normalized_term = _normalize_text(term)

    if normalized_term and normalized_term in normalized_searchable:
        return True

    term_tokens = _tokenize(term)
    if not term_tokens:
        return False

    searchable_tokens = _tokenize(searchable)
    alias_tokens = TERM_ALIASES.get(normalized_term, set())
    if alias_tokens and alias_tokens.intersection(searchable_tokens):
        return True

    overlap = term_tokens.intersection(searchable_tokens)
    return len(overlap) == len(term_tokens)


def _compute_match_score(jd_analysis: dict, included_evidence: list[dict]) -> float:
    required_skills = jd_analysis.get("required_skills", [])
    must_have_themes = jd_analysis.get("must_have_themes", [])

    relevant_evidence = []
    for evidence in included_evidence:
        if any(
            isinstance(skill_entry, dict)
            and _text_matches(str(skill_entry.get("skill", "")), evidence)
            for skill_entry in required_skills
        ):
            relevant_evidence.append(evidence)

    total_required = len(required_skills)
    if total_required == 0:
        required_component = 0.0
    else:
        covered_required = sum(
            1
            for skill_entry in required_skills
            if isinstance(skill_entry, dict)
            and any(
                _text_matches(str(skill_entry.get("skill", "")), evidence)
                for evidence in included_evidence
            )
        )
        required_component = (covered_required / total_required) * 70

    themes_covered = sum(
        1
        for theme in must_have_themes
        if isinstance(theme, str)
        and any(_text_matches(theme, evidence) for evidence in relevant_evidence)
    )
    theme_component = (themes_covered / 3) * 30 if must_have_themes else 0.0

    return round(required_component + theme_component, 1)


def _validate_gap_output(raw: dict, valid_evidence_ids: set[str]) -> dict:
    required_keys = {"hard_gaps", "soft_gaps", "covered_skills", "coverage_summary"}
    missing = required_keys.difference(raw.keys())
    if missing:
        raise ValueError(f"Gap analysis missing keys: {sorted(missing)}")

    hard_gaps = raw["hard_gaps"]
    soft_gaps = raw["soft_gaps"]
    covered_skills = raw["covered_skills"]
    coverage_summary = raw["coverage_summary"]

    if not isinstance(hard_gaps, list):
        raise ValueError("hard_gaps must be a list")
    if not isinstance(soft_gaps, list):
        raise ValueError("soft_gaps must be a list")
    if not isinstance(covered_skills, list):
        raise ValueError("covered_skills must be a list")
    if not isinstance(coverage_summary, str):
        raise ValueError("coverage_summary must be a string")

    validated_hard = []
    for item in hard_gaps:
        if not isinstance(item, dict):
            raise ValueError("hard_gaps entries must be objects")
        skill = item.get("skill")
        suggestion = item.get("suggestion")
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError("hard_gaps.skill must be a non-empty string")
        if not isinstance(suggestion, str) or not suggestion.strip():
            raise ValueError("hard_gaps.suggestion must be a non-empty string")
        validated_hard.append({"skill": skill.strip(), "suggestion": suggestion.strip()})

    validated_soft = []
    for item in soft_gaps:
        if not isinstance(item, dict):
            raise ValueError("soft_gaps entries must be objects")
        skill = item.get("skill")
        reframe_hint = item.get("reframe_hint")
        evidence_id = item.get("evidence_id")
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError("soft_gaps.skill must be a non-empty string")
        if not isinstance(reframe_hint, str) or not reframe_hint.strip():
            raise ValueError("soft_gaps.reframe_hint must be a non-empty string")
        if not isinstance(evidence_id, str) or evidence_id not in valid_evidence_ids:
            raise ValueError("soft_gaps.evidence_id must reference a valid include=true evidence item")
        validated_soft.append(
            {
                "skill": skill.strip(),
                "reframe_hint": reframe_hint.strip(),
                "evidence_id": evidence_id,
            }
        )

    if not all(isinstance(item, str) for item in covered_skills):
        raise ValueError("covered_skills entries must be strings")

    return {
        "hard_gaps": validated_hard,
        "soft_gaps": validated_soft,
        "covered_skills": [item.strip() for item in covered_skills if isinstance(item, str)],
        "coverage_summary": coverage_summary.strip(),
    }


def run(
    jd_analysis: dict,
    scored_evidence: dict,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    include_true_items = [
        {
            "id": item["id"],
            "title": item["title"],
            "type": item["type"],
            "source": item["source"],
        }
        for item in scored_evidence.get("scored_evidence", [])
        if item.get("include") is True
    ]

    user_content = json.dumps(
        {
            "required_skills": jd_analysis.get("required_skills", []),
            "must_have_themes": jd_analysis.get("must_have_themes", []),
            "candidate_evidence": include_true_items,
        },
        indent=2,
        sort_keys=True,
    )

    valid_evidence_ids = {item["id"] for item in include_true_items}
    validated = _validate_gap_output(
        llm_client.call_llm(
            system_prompt=_load_prompt(),
            user_content=user_content,
            temperature=0.3,
            agent_name="agent_03_gap_analyser",
            run_id=str(ctx.metadata.get("run_id", "")),
        ),
        valid_evidence_ids=valid_evidence_ids,
    )

    match_score = _compute_match_score(jd_analysis, include_true_items)
    result = {**validated, "match_score": match_score}
    ctx.gap_analysis = result
    save_context(ctx, str(_context_path(ctx)))
    return result
