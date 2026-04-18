from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


def _data_dir() -> Path:
    return Path(__file__).resolve().parent / "data"


def _clean_term(value: str) -> str:
    cleaned = value.lower().strip()
    cleaned = cleaned.replace("&", " and ")
    cleaned = re.sub(r"[-_/]+", " ", cleaned)
    cleaned = re.sub(r"[^\w\s+#]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


_TRANSFERABLE = json.loads((_data_dir() / "transferable_skills.json").read_text(encoding="utf-8"))
_STEM_VARIANTS = json.loads((_data_dir() / "stem_variants.json").read_text(encoding="utf-8"))

_STEM_REVERSE: dict[str, str] = {}
for canonical, variants in _STEM_VARIANTS.items():
    canonical_clean = _clean_term(canonical)
    _STEM_REVERSE.setdefault(canonical_clean, canonical_clean)
    for variant in variants:
        _STEM_REVERSE.setdefault(_clean_term(variant), canonical_clean)

_TRANSFERABLE_BY_NORMALISED_CANONICAL: dict[str, dict] = {}
_SUBSTITUTE_REVERSE: dict[str, tuple[str, float]] = {}
for canonical, data in _TRANSFERABLE.items():
    canonical_norm = _STEM_REVERSE.get(_clean_term(canonical), _clean_term(canonical))
    _TRANSFERABLE_BY_NORMALISED_CANONICAL[canonical_norm] = data
    for substitute, strength in zip(data["substitutes"], data["match_strength"]):
        _SUBSTITUTE_REVERSE[_STEM_REVERSE.get(_clean_term(substitute), _clean_term(substitute))] = (
            canonical,
            float(strength),
        )

_SCAN_TERMS: list[str] = []
_scan_seen: set[str] = set()
for canonical, data in _TRANSFERABLE.items():
    for term in [canonical, *data.get("substitutes", [])]:
        key = term.lower()
        if key not in _scan_seen:
            _scan_seen.add(key)
            _SCAN_TERMS.append(term)
for canonical, variants in _STEM_VARIANTS.items():
    for term in [canonical, *variants]:
        key = term.lower()
        if key not in _scan_seen:
            _scan_seen.add(key)
            _SCAN_TERMS.append(term)


@dataclass
class SkillMatchResult:
    required_skill: str
    candidate_skill: str
    match_type: str
    match_strength: float
    canonical_form: str


def normalise(skill: str) -> str:
    cleaned = _clean_term(skill)
    return _STEM_REVERSE.get(cleaned, cleaned)


def match_skill(required_skill: str, candidate_skills: list[str]) -> SkillMatchResult:
    req_clean = _clean_term(required_skill)
    req_norm = normalise(required_skill)
    candidate_entries = [
        {
            "original": str(skill),
            "clean": _clean_term(str(skill)),
            "norm": normalise(str(skill)),
        }
        for skill in candidate_skills
        if str(skill).strip()
    ]

    for candidate in candidate_entries:
        if candidate["clean"] == req_clean:
            return SkillMatchResult(
                required_skill=required_skill,
                candidate_skill=candidate["original"],
                match_type="exact",
                match_strength=1.0,
                canonical_form=req_norm,
            )

    for candidate in candidate_entries:
        if candidate["norm"] == req_norm:
            return SkillMatchResult(
                required_skill=required_skill,
                candidate_skill=candidate["original"],
                match_type="stem",
                match_strength=1.0,
                canonical_form=req_norm,
            )

    best_strength = 0.0
    best_original = ""
    transferable_entry = _TRANSFERABLE_BY_NORMALISED_CANONICAL.get(req_norm)
    if transferable_entry:
        for substitute, strength in zip(
            transferable_entry.get("substitutes", []),
            transferable_entry.get("match_strength", []),
        ):
            substitute_norm = normalise(str(substitute))
            for candidate in candidate_entries:
                if candidate["norm"] == substitute_norm and float(strength) > best_strength:
                    best_strength = float(strength)
                    best_original = candidate["original"]

    for candidate in candidate_entries:
        reverse_match = _SUBSTITUTE_REVERSE.get(candidate["norm"])
        if reverse_match is None:
            continue
        canonical, strength = reverse_match
        if normalise(canonical) == req_norm and strength > best_strength:
            best_strength = float(strength)
            best_original = candidate["original"]

    if best_strength > 0:
        return SkillMatchResult(
            required_skill=required_skill,
            candidate_skill=best_original,
            match_type="transferable",
            match_strength=best_strength,
            canonical_form=req_norm,
        )

    return SkillMatchResult(
        required_skill=required_skill,
        candidate_skill="",
        match_type="none",
        match_strength=0.0,
        canonical_form=req_norm,
    )


def classify_gap(match_result: SkillMatchResult) -> str:
    strength = match_result.match_strength
    if strength >= 1.0:
        return "covered"
    if strength >= 0.75:
        return "soft_gap_strong"
    if strength >= 0.50:
        return "soft_gap_weak"
    return "hard_gap"


def _iter_strings(value: object) -> list[str]:
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


def _append_unique(target: list[str], seen: set[str], value: object) -> None:
    if not isinstance(value, str):
        return
    cleaned = value.strip()
    if not cleaned:
        return
    lowered = cleaned.lower()
    if lowered in seen:
        return
    seen.add(lowered)
    target.append(cleaned)


def _contains_term(blob: str, term: str) -> bool:
    cleaned_term = _clean_term(term)
    if not cleaned_term:
        return False
    return f" {cleaned_term} " in blob


def extract_candidate_skills(candidate: dict) -> list[str]:
    skills: list[str] = []
    seen: set[str] = set()

    linkedin_skills = candidate.get("linkedin", {}).get("skills", [])
    if isinstance(linkedin_skills, list):
        for skill in linkedin_skills:
            _append_unique(skills, seen, skill)
    elif isinstance(linkedin_skills, dict):
        for values in linkedin_skills.values():
            if isinstance(values, list):
                for skill in values:
                    _append_unique(skills, seen, skill)

    github_languages = candidate.get("github", {}).get("languages", {})
    if isinstance(github_languages, dict):
        for language in github_languages.keys():
            _append_unique(skills, seen, language)
    elif isinstance(github_languages, list):
        for language in github_languages:
            _append_unique(skills, seen, language)

    for project_key in ("top_projects", "projects"):
        for repo in candidate.get("github", {}).get(project_key, []):
            if not isinstance(repo, dict):
                continue
            for topic in repo.get("topics", []):
                _append_unique(skills, seen, topic)
            for tech_key in ("tech_stack", "techStack", "languages"):
                tech_values = repo.get(tech_key, [])
                if isinstance(tech_values, list):
                    for skill in tech_values:
                        _append_unique(skills, seen, skill)

    old_resume_skills = candidate.get("old_resume", {}).get("sections", {}).get("skills", [])
    if isinstance(old_resume_skills, list):
        for skill in old_resume_skills:
            _append_unique(skills, seen, skill)

    cleaned_blob = f" {_clean_term(' '.join(_iter_strings(candidate)))} "
    for term in _SCAN_TERMS:
        if _contains_term(cleaned_blob, term):
            _append_unique(skills, seen, term)

    return skills
