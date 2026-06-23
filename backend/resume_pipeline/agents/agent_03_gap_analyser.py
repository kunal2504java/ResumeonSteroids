from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TypedDict

from context_manager import save_context
from pipeline_context import PipelineContext
from skill_matcher import classify_gap, extract_candidate_skills, match_skill


IMPORTANCE_WEIGHTS = {"high": 1.0, "medium": 0.6, "low": 0.3}
TERM_ALIASES = {
    "cloud": {"aws", "gcp", "azure", "cloud"},
}


class GapAnalysis(TypedDict):
    hard_gaps: list[dict]
    soft_gaps: list[dict]
    covered_skills: list[dict]
    skill_match_details: list[dict]
    coverage_summary: str
    match_score: float


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


def _compute_themes_score(jd_analysis: dict, included_evidence: list[dict]) -> float:
    must_have_themes = jd_analysis.get("must_have_themes", [])
    if not must_have_themes:
        return 0.0

    themes_covered = sum(
        1
        for theme in must_have_themes
        if isinstance(theme, str)
        and any(_text_matches(theme, evidence) for evidence in included_evidence)
    )
    return (themes_covered / 3) * 30


def _importance_weight(skill_entry: dict) -> float:
    importance = str(skill_entry.get("importance", "low")).lower()
    return IMPORTANCE_WEIGHTS.get(importance, 0.3)


def _validate_llm_gap_output(raw: dict, valid_evidence_ids: set[str]) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("gap analysis response must be an object")

    hard_gaps = raw.get("hard_gaps", [])
    soft_gaps = raw.get("soft_gaps", [])
    coverage_summary = raw.get("coverage_summary", "")

    if not isinstance(hard_gaps, list):
        raise ValueError("hard_gaps must be a list")
    if not isinstance(soft_gaps, list):
        raise ValueError("soft_gaps must be a list")
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

    return {
        "hard_gaps": validated_hard,
        "soft_gaps": validated_soft,
        "coverage_summary": coverage_summary.strip(),
    }


def _build_soft_gap_fallback(skill: str, candidate_skill: str, evidence_id: str) -> dict:
    return {
        "skill": skill,
        "reframe_hint": f"Position {candidate_skill} experience as adjacent evidence for {skill} and emphasize the overlapping production use cases.",
        "evidence_id": evidence_id,
    }


def _build_hard_gap_fallback(skill: str) -> dict:
    return {
        "skill": skill,
        "suggestion": f"Add a project or experience entry that demonstrates {skill} in a production-relevant use case.",
    }


def _default_coverage_summary(match_results: list[dict]) -> str:
    if not match_results:
        return ""

    covered_count = sum(1 for item in match_results if item["classification"] == "covered")
    soft_count = sum(
        1
        for item in match_results
        if item["classification"] in {"soft_gap_strong", "soft_gap_weak"}
    )
    hard_count = sum(1 for item in match_results if item["classification"] == "hard_gap")
    return (
        f"The candidate fully covers {covered_count} required skills, has adjacent evidence for {soft_count}, "
        f"and still shows {hard_count} hard gaps."
    )


def run(
    jd_analysis: dict,
    scored_evidence: dict,
    candidate,
    llm_client=None,
    ctx: PipelineContext | None = None,
) -> dict:
    if ctx is None:
        ctx = llm_client
        llm_client = candidate
        candidate = getattr(ctx, "candidate", {})

    required_skills = jd_analysis.get("required_skills", [])
    included_evidence = [
        item
        for item in scored_evidence.get("scored_evidence", [])
        if isinstance(item, dict) and item.get("include") is True
    ]
    include_true_items = [
        {
            "id": str(item.get("id", "")),
            "title": str(item.get("title", "")),
            "type": str(item.get("type", "")),
            "source": str(item.get("source", "")),
        }
        for item in included_evidence
    ]
    valid_evidence_ids = {item["id"] for item in include_true_items if item["id"]}
    candidate_skills = extract_candidate_skills(candidate)

    match_results: list[dict] = []
    for skill_entry in required_skills:
        if not isinstance(skill_entry, dict):
            continue
        skill_name = str(skill_entry.get("skill", "")).strip()
        if not skill_name:
            continue
        result = match_skill(skill_name, candidate_skills)
        classification = classify_gap(result)
        match_results.append(
            {
                "skill": skill_name,
                "importance": str(skill_entry.get("importance", "low")).lower(),
                "match_result": result,
                "classification": classification,
            }
        )

    covered = [item for item in match_results if item["classification"] == "covered"]
    soft_strong = [item for item in match_results if item["classification"] == "soft_gap_strong"]
    soft_weak = [item for item in match_results if item["classification"] == "soft_gap_weak"]
    hard = [item for item in match_results if item["classification"] == "hard_gap"]

    llm_output = {"hard_gaps": [], "soft_gaps": [], "coverage_summary": ""}
    if (hard or soft_strong or soft_weak) and llm_client is not None:
        raw_output = llm_client.call_llm(
            system_prompt=_load_prompt(),
            user_content=json.dumps(
                {
                    "hard_gaps": [item["skill"] for item in hard],
                    "soft_gaps": [
                        {
                            "skill": item["skill"],
                            "candidate_has": item["match_result"].candidate_skill,
                            "match_strength": item["match_result"].match_strength,
                        }
                        for item in (soft_strong + soft_weak)
                    ],
                    "candidate_evidence": include_true_items,
                },
                indent=2,
                sort_keys=True,
            ),
            temperature=0.3,
            agent_name="agent_03_gap_analyser",
            run_id=str(ctx.metadata.get("run_id", "")),
        )
        llm_output = _validate_llm_gap_output(raw_output, valid_evidence_ids)

    llm_hard_by_skill = {item["skill"]: item for item in llm_output.get("hard_gaps", [])}
    llm_soft_by_skill = {item["skill"]: item for item in llm_output.get("soft_gaps", [])}
    fallback_evidence_id = next(iter(sorted(valid_evidence_ids)), "")

    hard_gaps = [
        llm_hard_by_skill.get(item["skill"], _build_hard_gap_fallback(item["skill"]))
        for item in hard
    ]

    soft_gaps = []
    for item in soft_strong + soft_weak:
        llm_soft = llm_soft_by_skill.get(item["skill"])
        if llm_soft is not None:
            soft_gaps.append(llm_soft)
        elif fallback_evidence_id:
            soft_gaps.append(
                _build_soft_gap_fallback(
                    item["skill"],
                    item["match_result"].candidate_skill or item["skill"],
                    fallback_evidence_id,
                )
            )

    max_possible = sum(_importance_weight(item) for item in match_results)
    weighted_score = sum(
        item["match_result"].match_strength * _importance_weight(item) for item in match_results
    )
    skill_score = (weighted_score / max_possible) * 70 if max_possible else 0.0
    themes_score = _compute_themes_score(jd_analysis, included_evidence)
    match_score = round(min(100.0, skill_score + themes_score), 1)

    result = {
        "match_score": match_score,
        "hard_gaps": hard_gaps,
        "soft_gaps": soft_gaps,
        "covered_skills": [
            {
                "skill": item["skill"],
                "matched_via": item["match_result"].match_type,
                "candidate_skill": item["match_result"].candidate_skill,
                "strength": item["match_result"].match_strength,
            }
            for item in covered + soft_strong
        ],
        "skill_match_details": [
            {
                "required": item["skill"],
                "candidate_has": item["match_result"].candidate_skill,
                "match_type": item["match_result"].match_type,
                "strength": item["match_result"].match_strength,
                "classification": item["classification"],
            }
            for item in match_results
        ],
        "coverage_summary": llm_output.get("coverage_summary") or _default_coverage_summary(match_results),
    }
    ctx.gap_analysis = result
    ctx.skill_match_details = result["skill_match_details"]
    save_context(ctx, str(_context_path(ctx)))
    return result
