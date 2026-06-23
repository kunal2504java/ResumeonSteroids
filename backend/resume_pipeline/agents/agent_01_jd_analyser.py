from __future__ import annotations

from pathlib import Path
from typing import Dict, List, TypedDict

from context_manager import save_context
from pipeline_context import PipelineContext
from skill_matcher import normalise


VALID_ROLE_LEVELS = {"junior", "mid", "senior", "staff", "unknown"}
VALID_IMPORTANCE_LEVELS = {"high", "medium", "low"}


class JDAnalysis(TypedDict):
    role_level: str
    must_have_themes: List[str]
    required_skills: List[Dict[str, str]]
    preferred_skills: List[Dict[str, str]]
    implicit_signals: Dict[str, str]
    ats_keywords: List[Dict[str, str]]


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


def _prompt_path() -> Path:
    return Path(__file__).resolve().parents[1] / "prompts" / "01_jd_analyser.md"


def _load_prompt() -> str:
    return _prompt_path().read_text(encoding="utf-8")


def _empty_analysis() -> JDAnalysis:
    return {
        "role_level": "unknown",
        "must_have_themes": ["unknown", "unknown", "unknown"],
        "required_skills": [],
        "preferred_skills": [],
        "implicit_signals": {
            "team_size": "unknown",
            "work_style": "unknown",
            "tech_focus": "unknown",
        },
        "ats_keywords": [],
    }


def _validate_skill_list(name: str, value: object) -> List[Dict[str, str]]:
    if not isinstance(value, list):
        raise ValueError(f"{name} must be a list")

    validated: List[Dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            raise ValueError(f"{name} entries must be objects")

        skill = item.get("skill")
        importance = item.get("importance")

        if not isinstance(skill, str) or not skill.strip():
            raise ValueError(f"{name} entries must include a non-empty skill")
        if importance not in VALID_IMPORTANCE_LEVELS:
            raise ValueError(
                f"{name} importance must be one of {sorted(VALID_IMPORTANCE_LEVELS)}"
            )

        skill_value = skill.strip()
        validated.append(
            {
                "skill": skill_value,
                "importance": str(importance),
                "canonical": normalise(skill_value),
            }
        )

    return validated


def _validate_analysis(raw: dict) -> JDAnalysis:
    required_keys = {
        "role_level",
        "must_have_themes",
        "required_skills",
        "preferred_skills",
        "implicit_signals",
        "ats_keywords",
    }
    missing = required_keys.difference(raw.keys())
    if missing:
        raise ValueError(f"JD analysis missing keys: {sorted(missing)}")

    role_level = raw["role_level"]
    if role_level not in VALID_ROLE_LEVELS:
        raise ValueError(f"role_level must be one of {sorted(VALID_ROLE_LEVELS)}")

    must_have_themes = raw["must_have_themes"]
    if not isinstance(must_have_themes, list):
        raise ValueError("must_have_themes must be a list")
    if len(must_have_themes) != 3:
        raise ValueError("must_have_themes must contain exactly 3 items")
    if not all(isinstance(item, str) and item.strip() for item in must_have_themes):
        raise ValueError("must_have_themes must contain exactly 3 non-empty strings")

    implicit_signals = raw["implicit_signals"]
    if not isinstance(implicit_signals, dict):
        raise ValueError("implicit_signals must be an object")

    ats_keywords = raw["ats_keywords"]
    if not isinstance(ats_keywords, list):
        raise ValueError("ats_keywords must be a list")
    if not all(isinstance(item, str) for item in ats_keywords):
        raise ValueError("ats_keywords entries must be strings")

    return {
        "role_level": str(role_level),
        "must_have_themes": [item.strip() for item in must_have_themes],
        "required_skills": _validate_skill_list("required_skills", raw["required_skills"]),
        "preferred_skills": _validate_skill_list(
            "preferred_skills", raw["preferred_skills"]
        ),
        "implicit_signals": {
            str(key): str(value) for key, value in implicit_signals.items()
        },
        "ats_keywords": [
            {"original": item.strip(), "canonical": normalise(item.strip())}
            for item in ats_keywords
            if isinstance(item, str) and item.strip()
        ],
    }


def run(
    jd_raw_text: str,
    llm_client,
    ctx: PipelineContext,
) -> dict:
    if not jd_raw_text.strip():
        analysis = _empty_analysis()
    else:
        analysis = _validate_analysis(
            llm_client.call_llm(
                system_prompt=_load_prompt(),
                user_content=jd_raw_text,
                temperature=0.3,
                agent_name="agent_01_jd_analyser",
                run_id=str(ctx.metadata.get("run_id", "")),
            )
        )

    ctx.jd_analysis = analysis
    save_context(ctx, str(_context_path(ctx)))
    return analysis
