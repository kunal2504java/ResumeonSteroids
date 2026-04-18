from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


RULE_WEIGHTS = {
    "P001": 25.0,
    "P002": 20.0,
    "P003": 15.0,
    "P004": 10.0,
    "P005": 5.0,
    "P006": 15.0,
    "H001": 8.0,
    "H002": 5.0,
    "H003": 10.0,
    "D001": 10.0,
    "D002": 5.0,
    "K001": 15.0,
    "K002": 5.0,
    "K003": 10.0,
    "C001": 10.0,
    "C002": 10.0,
    "C003": 15.0,
    "C004": 2.0,
}

STANDARD_HEADINGS = {
    "Work Experience": [
        "Experience",
        "Professional Experience",
        "Employment History",
        "Work History",
        "Career History",
    ],
    "Education": [
        "Education",
        "Academic Background",
        "Academic History",
        "Educational Background",
    ],
    "Skills": [
        "Skills",
        "Technical Skills",
        "Core Competencies",
        "Technologies",
        "Tech Stack",
    ],
    "Projects": [
        "Projects",
        "Personal Projects",
        "Side Projects",
        "Open Source",
        "Portfolio",
    ],
    "Summary": [
        "Summary",
        "Professional Summary",
        "Profile",
        "About",
        "Objective",
        "Career Objective",
    ],
    "Certifications": [
        "Certifications",
        "Certificates",
        "Licenses",
        "Professional Development",
    ],
}

FAILING_HEADINGS = {
    "What I've Built",
    "My Journey",
    "The Story So Far",
    "Things I Know",
    "Stuff I've Done",
    "About Me",
}

ATS_PLATFORM_RULES = {
    "Workday": {
        "critical_rules": ["P001", "P002", "H001", "K001"],
        "description": "Most common enterprise ATS. Strict on formatting.",
        "market_share": "~35%",
    },
    "Greenhouse": {
        "critical_rules": ["P003", "H001", "K001", "C003"],
        "description": "Common at tech startups and mid-size companies.",
        "market_share": "~15%",
    },
    "Lever": {
        "critical_rules": ["P001", "P003", "H003", "K001"],
        "description": "Popular at fast-growing tech companies.",
        "market_share": "~10%",
    },
    "iCIMS": {
        "critical_rules": ["P001", "P002", "P006", "H001"],
        "description": "Common at large enterprises and Fortune 500.",
        "market_share": "~12%",
    },
    "Taleo": {
        "critical_rules": ["P001", "P002", "P005", "P006"],
        "description": "Oracle's ATS. Very strict, common at large corps.",
        "market_share": "~10%",
    },
}

GRADE_BOUNDARIES = [("A", 90), ("B", 80), ("C", 70), ("D", 60)]
ACTION_VERBS = {
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
MONTH_PATTERN = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}"
DATE_PATTERNS = {
    "ats_safe": [MONTH_PATTERN, r"\d{2}/\d{4}", r"\d{4}"],
    "ats_risky": [r"\d{2}/\d{2}/\d{4}", r"\d{4}-\d{2}-\d{2}"],
    "ats_fail": [r"(Spring|Summer|Fall|Autumn|Winter)\s+\d{4}", r"(Q1|Q2|Q3|Q4)\s+\d{4}"],
}
EMAIL_PATTERN = re.compile(r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"^\+?[0-9()\-\s]{7,}$")
NUMBER_PATTERN = re.compile(r"\b\d+(?:\.\d+)?(?:%|x|k|m|ms|s|sec|secs|seconds|minutes|mins|hours|hrs|days|weeks|months|years)?\b", re.IGNORECASE)
LATEX_HEADING_PATTERN = re.compile(r"\\section\{([^}]+)\}")


def _data_dir() -> Path:
    return Path(__file__).resolve().parent / "data"


def _load_keywords() -> list[str]:
    transferable = json.loads((_data_dir() / "transferable_skills.json").read_text(encoding="utf-8"))
    stem_variants = json.loads((_data_dir() / "stem_variants.json").read_text(encoding="utf-8"))
    values: list[str] = []
    seen: set[str] = set()
    for canonical, data in transferable.items():
        for term in [canonical, *data.get("substitutes", [])]:
            lowered = term.lower()
            if lowered not in seen:
                seen.add(lowered)
                values.append(term)
    for canonical, variants in stem_variants.items():
        for term in [canonical, *variants]:
            lowered = term.lower()
            if lowered not in seen:
                seen.add(lowered)
                values.append(term)
    return values


KNOWN_KEYWORDS = _load_keywords()


@dataclass
class ATSRuleResult:
    rule_id: str
    rule_name: str
    category: str
    status: str
    score_impact: float
    message: str
    fix: str
    affected_section: str
    severity: str


@dataclass
class ATSReport:
    total_score: float
    grade: str
    rule_results: list[ATSRuleResult]
    critical_failures: list[ATSRuleResult]
    keyword_coverage: dict
    parser_compatibility: dict
    summary: str


RULE_CATALOG = {
    "P001": {
        "name": "Avoid Tables",
        "category": "parsing",
        "severity": "critical",
        "description": "Tables often garble resume parsing in legacy ATS systems.",
        "why_it_matters": "Many ATS parsers flatten table cells out of order, which destroys chronology and bullet structure.",
        "how_to_fix": "Remove all tables and use plain text lines with consistent spacing instead.",
    },
    "P002": {
        "name": "Single Column Layout",
        "category": "parsing",
        "severity": "critical",
        "description": "Multi-column layouts are commonly parsed in the wrong reading order.",
        "why_it_matters": "Legacy parsers read down one column and then jump unpredictably, causing skipped content.",
        "how_to_fix": "Use a single-column layout throughout the resume.",
    },
    "P003": {
        "name": "Contact Info In Body",
        "category": "parsing",
        "severity": "major",
        "description": "Critical contact info in headers or footers is often ignored.",
        "why_it_matters": "Some PDF parsers drop header and footer text entirely.",
        "how_to_fix": "Move your name, email, phone, and LinkedIn into the main body heading block.",
    },
    "P004": {
        "name": "No Images Or Graphics",
        "category": "parsing",
        "severity": "major",
        "description": "ATS parsers skip images and decorative graphics.",
        "why_it_matters": "Important content inside images becomes invisible to parsers.",
        "how_to_fix": "Remove all images and graphics from the resume.",
    },
    "P005": {
        "name": "Plain Section Headings",
        "category": "parsing",
        "severity": "minor",
        "description": "Decorative symbols in headings make section parsing less reliable.",
        "why_it_matters": "Parsers map common headings to resume fields and decorative characters break that mapping.",
        "how_to_fix": "Use plain text section headings with no decorative characters.",
    },
    "P006": {
        "name": "No Critical Text In Boxes",
        "category": "parsing",
        "severity": "critical",
        "description": "Boxed text is frequently ignored or flattened incorrectly.",
        "why_it_matters": "Text box environments are not treated as linear document content by many parsers.",
        "how_to_fix": "Keep job titles, bullets, and skills in normal flowing text, not boxes.",
    },
    "H001": {
        "name": "Standard Section Headings",
        "category": "formatting",
        "severity": "major",
        "description": "Common ATS parsers expect standard headings such as Experience, Education, Skills, and Projects.",
        "why_it_matters": "Non-standard headings reduce section classification accuracy.",
        "how_to_fix": "Rename headings to standard ATS-safe names.",
    },
    "H002": {
        "name": "ATS-Friendly Section Order",
        "category": "formatting",
        "severity": "minor",
        "description": "Experience should appear early for experienced candidates.",
        "why_it_matters": "Recruiter workflows and ATS previews prioritize the top of the resume.",
        "how_to_fix": "Move Summary and Experience ahead of lower-signal sections.",
    },
    "H003": {
        "name": "Parseable Contact Info",
        "category": "formatting",
        "severity": "critical",
        "description": "Contact fields must be present in recognizable formats.",
        "why_it_matters": "Missing or malformed contact data blocks recruiter follow-up and ATS profile creation.",
        "how_to_fix": "Provide a valid email, phone number, and LinkedIn URL in the heading block.",
    },
    "D001": {
        "name": "Consistent ATS-Safe Dates",
        "category": "formatting",
        "severity": "major",
        "description": "Date formats should be consistent and ATS-safe across the resume.",
        "why_it_matters": "Inconsistent dates reduce timeline extraction accuracy.",
        "how_to_fix": "Use Mon YYYY format consistently, such as Jan 2022 – Mar 2024.",
    },
    "D002": {
        "name": "Present Role Marked Correctly",
        "category": "formatting",
        "severity": "minor",
        "description": "Current roles should end with Present, not blank or Now.",
        "why_it_matters": "Standardized end-date labels improve current-role detection.",
        "how_to_fix": "Use Present as the end date for current roles.",
    },
    "K001": {
        "name": "Weighted Keyword Coverage",
        "category": "keywords",
        "severity": "major",
        "description": "Keywords in experience and summary sections matter more than keywords hidden in low-signal sections.",
        "why_it_matters": "ATS ranking weighs context, not just presence.",
        "how_to_fix": "Move important keywords into bullets that demonstrate actual work.",
    },
    "K002": {
        "name": "Avoid Keyword Stuffing",
        "category": "keywords",
        "severity": "major",
        "description": "Over-repeating the same keyword can trigger spam heuristics.",
        "why_it_matters": "Keyword stuffing lowers trust in the resume content.",
        "how_to_fix": "Reduce repetition and spread keywords naturally across relevant bullets.",
    },
    "K003": {
        "name": "Parseable Skills Section",
        "category": "keywords",
        "severity": "major",
        "description": "Skills should be flat text lists, not ratings or graphics.",
        "why_it_matters": "ATS parsers extract skills best from plain text comma-separated lists.",
        "how_to_fix": "Use comma-separated or line-by-line plain text skills.",
    },
    "C001": {
        "name": "Strong Bullet Starts",
        "category": "content",
        "severity": "minor",
        "description": "Bullets should begin with strong action verbs.",
        "why_it_matters": "Action-led bullets are easier to scan and correlate with recruiter expectations.",
        "how_to_fix": "Rewrite bullets to start with strong action verbs.",
    },
    "C002": {
        "name": "Quantified Impact",
        "category": "content",
        "severity": "major",
        "description": "Most bullets should include a measurable outcome.",
        "why_it_matters": "Metrics raise ranking confidence and recruiter trust.",
        "how_to_fix": "Add numbers, percentages, or time deltas to more bullets.",
    },
    "C003": {
        "name": "Target Resume Length",
        "category": "content",
        "severity": "major",
        "description": "Over-length resumes are harder to review and can be truncated in some ATS workflows.",
        "why_it_matters": "Resume readers and parsers both benefit from concise length.",
        "how_to_fix": "Trim low-signal bullets until the resume fits the target page budget.",
    },
    "C004": {
        "name": "Professional Email Domain",
        "category": "content",
        "severity": "minor",
        "description": "Certain legacy email domains can create a softer recruiter trust penalty.",
        "why_it_matters": "This is not an ATS parser failure, but it affects presentation quality.",
        "how_to_fix": "Use a Gmail or custom-domain email when possible.",
    },
}


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _normalize_keyword(value: str) -> str:
    cleaned = value.lower().strip()
    cleaned = re.sub(r"[-_/]+", " ", cleaned)
    cleaned = re.sub(r"[^\w\s+#]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _canonical_keywords(ats_keywords: list[Any]) -> list[str]:
    results: list[str] = []
    seen: set[str] = set()
    for keyword in ats_keywords:
        if isinstance(keyword, dict):
            candidate = str(keyword.get("original") or keyword.get("canonical") or "").strip()
        else:
            candidate = str(keyword).strip()
        normalized = _normalize_keyword(candidate)
        if normalized and normalized not in seen:
            seen.add(normalized)
            results.append(candidate)
    return results


def extract_keywords_from_text(text: str) -> list[str]:
    normalized_blob = f" {_normalize_keyword(text)} "
    results: list[str] = []
    seen: set[str] = set()
    for keyword in KNOWN_KEYWORDS:
        normalized = _normalize_keyword(keyword)
        if normalized and f" {normalized} " in normalized_blob and normalized not in seen:
            seen.add(normalized)
            results.append(keyword)
    return results


def _personal_info(assembled_resume: dict) -> dict:
    return assembled_resume.get("personalInfo") or assembled_resume.get("personal_info") or {}


def _section_order(assembled_resume: dict) -> list[str]:
    if isinstance(assembled_resume.get("sectionOrder"), list):
        return [str(item.get("section", "")) for item in assembled_resume["sectionOrder"] if isinstance(item, dict)]
    order = []
    if assembled_resume.get("summary"):
        order.append("Summary")
    if assembled_resume.get("experience"):
        order.append("Experience")
    if assembled_resume.get("education"):
        order.append("Education")
    if assembled_resume.get("projects"):
        order.append("Projects")
    if assembled_resume.get("skills"):
        order.append("Skills")
    if assembled_resume.get("achievements"):
        order.append("Achievements")
    return order


def _iter_bullets(assembled_resume: dict) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []
    for entry in assembled_resume.get("experience", []):
        if isinstance(entry, dict):
            for bullet in entry.get("bullets", []):
                text = _clean_text(str(bullet))
                if text:
                    results.append(("Experience", text))
    for entry in assembled_resume.get("projects", []):
        if isinstance(entry, dict):
            for bullet in entry.get("bullets", []):
                text = _clean_text(str(bullet))
                if text:
                    results.append(("Projects", text))
    for item in assembled_resume.get("achievements", []):
        text = _clean_text(str(item))
        if text:
            results.append(("Achievements", text))
    return results


def _summary_text(assembled_resume: dict) -> str:
    return _clean_text(str(assembled_resume.get("summary", "")))


def _skills_texts(assembled_resume: dict) -> list[str]:
    skills = assembled_resume.get("skills", {})
    values: list[str] = []
    if isinstance(skills, dict):
        for items in skills.values():
            if isinstance(items, list):
                values.extend(_clean_text(str(item)) for item in items if _clean_text(str(item)))
    return values


def _education_texts(assembled_resume: dict) -> list[str]:
    values: list[str] = []
    for entry in assembled_resume.get("education", []):
        if not isinstance(entry, dict):
            continue
        for key in ("institution", "degree", "field", "year"):
            value = _clean_text(str(entry.get(key, "")))
            if value:
                values.append(value)
    return values


def _experience_count(assembled_resume: dict) -> int:
    return len(assembled_resume.get("experience", []))


def _all_text_word_count(assembled_resume: dict) -> int:
    chunks = [_summary_text(assembled_resume)]
    chunks.extend(text for _, text in _iter_bullets(assembled_resume))
    chunks.extend(_skills_texts(assembled_resume))
    chunks.extend(_education_texts(assembled_resume))
    words = re.findall(r"\b\w[\w.+#/-]*\b", " ".join(chunks))
    return len(words)


def _heading_candidates(assembled_resume: dict) -> list[str]:
    headings = _section_order(assembled_resume)
    if headings:
        return headings
    return ["Summary", "Experience", "Education", "Projects", "Skills"]


def _page_estimate(assembled_resume: dict) -> float:
    page = 0.0
    if _summary_text(assembled_resume):
        page += 0.08
    section_names = _heading_candidates(assembled_resume)
    page += len(section_names) * 0.06
    page += len(_iter_bullets(assembled_resume)) * 0.04
    page += len(assembled_resume.get("education", [])) * 0.05
    skill_lines = max(1, len(_skills_texts(assembled_resume)) // 8) if _skills_texts(assembled_resume) else 0
    page += skill_lines * 0.03
    return max(1.0, round(page, 2))


def _status_from_penalty(penalty: float, warn_cutoff: float = 0.0) -> str:
    if penalty <= 0:
        return "pass"
    if warn_cutoff and penalty <= warn_cutoff:
        return "warn"
    return "fail"


def _build_rule(
    *,
    rule_id: str,
    status: str,
    message: str,
    fix: str,
    affected_section: str,
    severity: str | None = None,
    score_impact: float | None = None,
) -> ATSRuleResult:
    meta = RULE_CATALOG[rule_id]
    return ATSRuleResult(
        rule_id=rule_id,
        rule_name=meta["name"],
        category=meta["category"],
        status=status,
        score_impact=float(score_impact if score_impact is not None else RULE_WEIGHTS[rule_id]),
        message=message,
        fix=fix,
        affected_section=affected_section,
        severity=str(severity or meta["severity"]),
    )


def compute_keyword_coverage(assembled_resume: dict, ats_keywords: list[Any]) -> dict:
    keywords = _canonical_keywords(ats_keywords)
    summary_blob = _normalize_keyword(_summary_text(assembled_resume))
    experience_blob = _normalize_keyword(" ".join(text for section, text in _iter_bullets(assembled_resume) if section == "Experience"))
    project_blob = _normalize_keyword(" ".join(text for section, text in _iter_bullets(assembled_resume) if section == "Projects"))
    skills_blob = _normalize_keyword(" ".join(_skills_texts(assembled_resume)))
    education_blob = _normalize_keyword(" ".join(_education_texts(assembled_resume)))

    found_experience: list[str] = []
    found_summary: list[str] = []
    found_skills: list[str] = []
    missing: list[str] = []
    weighted_hits = 0.0
    for keyword in keywords:
        norm = _normalize_keyword(keyword)
        if norm and norm in experience_blob:
            found_experience.append(keyword)
            weighted_hits += 1.0
        elif norm and norm in project_blob:
            found_experience.append(keyword)
            weighted_hits += 1.0
        elif norm and norm in summary_blob:
            found_summary.append(keyword)
            weighted_hits += 0.9
        elif norm and norm in skills_blob:
            found_skills.append(keyword)
            weighted_hits += 0.7
        elif norm and norm in education_blob:
            weighted_hits += 0.3
        else:
            missing.append(keyword)

    max_score = len(keywords) if keywords else 1
    location_weighted_score = round(min(100.0, (weighted_hits / max_score) * 100), 1)
    return {
        "location_weighted_score": location_weighted_score,
        "keywords_in_experience": found_experience,
        "keywords_in_summary": found_summary,
        "keywords_in_skills": found_skills,
        "keywords_missing": missing,
    }


def rule_no_tables(latex_source: str) -> ATSRuleResult:
    tokens = ("\\begin{tabular}", "\\begin{table}", "\\begin{longtable}", "\\multicolumn")
    has_table = any(token in latex_source for token in tokens)
    return _build_rule(
        rule_id="P001",
        status="fail" if has_table else "pass",
        message="Resume uses tables that many ATS parsers flatten incorrectly." if has_table else "No tables detected.",
        fix="Remove all tables from your resume. Use plain text with consistent spacing instead.",
        affected_section="layout",
    )


def rule_no_columns(latex_source: str) -> ATSRuleResult:
    tokens = ("\\begin{multicols}", "minipage", "columnwidth", "twocolumn")
    has_columns = any(token in latex_source for token in tokens)
    return _build_rule(
        rule_id="P002",
        status="fail" if has_columns else "pass",
        message="Resume uses a multi-column layout that legacy ATS systems often misread." if has_columns else "Single-column layout detected.",
        fix="Use a single-column layout throughout.",
        affected_section="layout",
    )


def rule_no_headers_footers_with_critical_info(latex_source: str) -> ATSRuleResult:
    header_or_footer = any(token in latex_source for token in ("\\fancyhead", "\\fancyfoot", "\\lhead", "\\rhead"))
    contact_like = any(token in latex_source.lower() for token in ("@", "linkedin.com", "github.com", "+91", "+1", "phone"))
    fail = header_or_footer and contact_like
    return _build_rule(
        rule_id="P003",
        status="fail" if fail else "pass",
        message="Critical contact details appear in headers or footers." if fail else "Critical contact info is not isolated in headers or footers.",
        fix="Move your name, email, and phone to the body of the resume.",
        affected_section="header",
    )


def rule_no_images_graphics(latex_source: str) -> ATSRuleResult:
    has_graphics = any(token in latex_source for token in ("\\includegraphics", "\\begin{figure}", "\\begin{tikzpicture}"))
    return _build_rule(
        rule_id="P004",
        status="fail" if has_graphics else "pass",
        message="Images or graphics are present in the LaTeX source." if has_graphics else "No images or graphics detected.",
        fix="Remove all images and graphics — ATS parsers skip them entirely.",
        affected_section="layout",
    )


def rule_no_special_characters_in_section_headings(latex_source: str) -> ATSRuleResult:
    bad_headings = []
    for heading in LATEX_HEADING_PATTERN.findall(latex_source):
        if re.search(r"[^A-Za-z0-9\s]", heading):
            bad_headings.append(heading)
    penalty = min(float(len(bad_headings)) * 5.0, RULE_WEIGHTS["P005"])
    return _build_rule(
        rule_id="P005",
        status="fail" if bad_headings else "pass",
        score_impact=penalty if bad_headings else RULE_WEIGHTS["P005"],
        message=f"Decorative characters found in section headings: {', '.join(bad_headings)}." if bad_headings else "Section headings contain plain text only.",
        fix="Use plain text section headings with no decorative characters.",
        affected_section="headings",
    )


def rule_text_not_in_textbox(latex_source: str) -> ATSRuleResult:
    has_boxes = any(token in latex_source for token in ("\\fbox", "\\framebox", "tcolorbox", "mdframed"))
    return _build_rule(
        rule_id="P006",
        status="fail" if has_boxes else "pass",
        message="Critical content appears inside boxed text." if has_boxes else "No boxed text environments detected.",
        fix="Content inside text boxes is invisible to most ATS parsers.",
        affected_section="layout",
    )


def rule_standard_section_headings(assembled_resume: dict) -> ATSRuleResult:
    headings = _heading_candidates(assembled_resume)
    failing = []
    suggestions = []
    all_aliases = {
        alias.lower(): canonical for canonical, aliases in STANDARD_HEADINGS.items() for alias in aliases
    }
    for heading in headings:
        lowered = heading.lower()
        if heading in FAILING_HEADINGS or lowered not in all_aliases:
            failing.append(heading)
            suggestion = "Work Experience" if "experience" in lowered or "work" in lowered else "Summary"
            suggestions.append(f"{heading} → {suggestion}")
    penalty = min(len(failing) * RULE_WEIGHTS["H001"], 24.0)
    return _build_rule(
        rule_id="H001",
        status="fail" if failing else "pass",
        score_impact=float(penalty if failing else RULE_WEIGHTS["H001"]),
        message=f"Non-standard headings detected: {', '.join(failing)}." if failing else "All headings use ATS-safe names.",
        fix=f"Rename headings to standard ATS-safe names. Suggested replacements: {', '.join(suggestions)}" if suggestions else RULE_CATALOG["H001"]["how_to_fix"],
        affected_section="headings",
    )


def rule_section_order_ats_friendly(assembled_resume: dict) -> ATSRuleResult:
    order = _section_order(assembled_resume)
    experience_index = order.index("Experience") if "Experience" in order else -1
    skills_index = order.index("Skills") if "Skills" in order else -1
    education_index = order.index("Education") if "Education" in order else -1
    senior_like = _experience_count(assembled_resume) >= 2
    fail = senior_like and experience_index != -1 and (
        (skills_index != -1 and experience_index > skills_index)
        or (education_index != -1 and experience_index > education_index)
    )
    recommended = "Summary → Experience → Education → Skills" if senior_like else "Summary → Education → Experience → Skills"
    return _build_rule(
        rule_id="H002",
        status="fail" if fail else "pass",
        message="Experience is buried after lower-signal sections." if fail else "Section order is ATS-friendly.",
        fix=f"Recommended order: {recommended}.",
        affected_section="layout",
    )


def rule_contact_info_parseable(assembled_resume: dict) -> ATSRuleResult:
    personal = _personal_info(assembled_resume)
    missing = []
    email = _clean_text(str(personal.get("email", "")))
    phone = _clean_text(str(personal.get("phone", "")))
    linkedin = _clean_text(str(personal.get("linkedin", "")))
    if not email or not EMAIL_PATTERN.match(email):
        missing.append("email")
    if not phone or not PHONE_PATTERN.match(phone):
        missing.append("phone")
    if not linkedin or "linkedin.com" not in linkedin.lower():
        missing.append("LinkedIn")
    penalty = min(len(missing) * 10.0, 30.0)
    return _build_rule(
        rule_id="H003",
        status="fail" if missing else "pass",
        score_impact=float(penalty if missing else RULE_WEIGHTS["H003"]),
        message=f"Missing or malformed critical contact fields: {', '.join(missing)}." if missing else "Critical contact information is parseable.",
        fix="Provide a valid email, phone number, and LinkedIn URL.",
        affected_section="header",
    )


def _collect_duration_strings(assembled_resume: dict) -> list[tuple[str, str]]:
    durations: list[tuple[str, str]] = []
    for entry in assembled_resume.get("experience", []):
        if not isinstance(entry, dict):
            continue
        start = _clean_text(str(entry.get("startDate", "")))
        end = _clean_text(str(entry.get("endDate", "")))
        duration = _clean_text(str(entry.get("duration", "")))
        if duration:
            durations.append(("Experience", duration))
        else:
            if start:
                durations.append(("Experience", start))
            if end:
                durations.append(("Experience", end))
    for entry in assembled_resume.get("education", []):
        if not isinstance(entry, dict):
            continue
        start = _clean_text(str(entry.get("startDate", "")))
        end = _clean_text(str(entry.get("endDate", "")))
        year = _clean_text(str(entry.get("year", "")))
        if year:
            durations.append(("Education", year))
        else:
            if start:
                durations.append(("Education", start))
            if end:
                durations.append(("Education", end))
    return durations


def _classify_date_value(value: str) -> str:
    if any(re.fullmatch(pattern, value) for pattern in DATE_PATTERNS["ats_safe"]):
        return "safe"
    if any(re.fullmatch(pattern, value) for pattern in DATE_PATTERNS["ats_risky"]):
        return "risky"
    if any(re.fullmatch(pattern, value) for pattern in DATE_PATTERNS["ats_fail"]):
        return "fail"
    return "unknown"


def rule_date_format_consistent(assembled_resume: dict) -> ATSRuleResult:
    values = _collect_duration_strings(assembled_resume)
    risky = []
    failing = []
    safe_styles: set[str] = set()
    for section, value in values:
        parts = [part.strip() for part in re.split(r"\s*[–—-]\s*", value) if part.strip()]
        for part in parts:
            classification = _classify_date_value(part)
            if classification == "risky":
                risky.append(f"{section}: {part}")
            elif classification in {"fail", "unknown"} and part != "Present":
                failing.append(f"{section}: {part}")
            elif classification == "safe":
                if re.fullmatch(MONTH_PATTERN, part):
                    safe_styles.add("month")
                elif re.fullmatch(r"\d{2}/\d{4}", part):
                    safe_styles.add("slash")
                elif re.fullmatch(r"\d{4}", part):
                    safe_styles.add("year")
    inconsistent = len(safe_styles) > 1 and "month" in safe_styles and "slash" in safe_styles
    penalty = len(risky) * 5.0 + len(failing) * 10.0 + (5.0 if inconsistent else 0.0)
    status = "pass"
    if failing or inconsistent:
        status = "fail"
    elif risky:
        status = "warn"
    message_bits = []
    if failing:
        message_bits.append(f"ATS-failing dates: {', '.join(failing)}")
    if risky:
        message_bits.append(f"ATS-risky dates: {', '.join(risky)}")
    if inconsistent:
        message_bits.append("Date formats are inconsistent across sections.")
    message = " ".join(message_bits) if message_bits else "Dates use ATS-safe formats consistently."
    return _build_rule(
        rule_id="D001",
        status=status,
        score_impact=float(min(max(penalty, 0.0), 25.0) if penalty else RULE_WEIGHTS["D001"]),
        message=message,
        fix="Use 'Mon YYYY' format consistently (e.g. 'Jan 2022 – Mar 2024').",
        affected_section="dates",
    )


def rule_present_role_marked_correctly(assembled_resume: dict) -> ATSRuleResult:
    if not assembled_resume.get("experience"):
        return _build_rule(
            rule_id="D002",
            status="pass",
            message="No experience entries require a current-role check.",
            fix=RULE_CATALOG["D002"]["how_to_fix"],
            affected_section="Experience",
        )
    current = assembled_resume["experience"][0]
    end_date = _clean_text(str(current.get("endDate", "")))
    status = "pass"
    message = "Current role is marked with Present."
    if not end_date or end_date.lower() == "now":
        status = "fail"
        message = "Current role end date is blank or non-standard."
    return _build_rule(
        rule_id="D002",
        status=status,
        message=message,
        fix="Use 'Present' as the end date for your current role.",
        affected_section="Experience",
    )


def rule_keyword_location_score(assembled_resume: dict, ats_keywords: list[Any]) -> tuple[ATSRuleResult, dict]:
    coverage = compute_keyword_coverage(assembled_resume, ats_keywords)
    score = coverage["location_weighted_score"]
    missing = coverage["keywords_missing"]
    status = "pass"
    penalty = 0.0
    if score < 60:
        status = "fail"
        penalty = RULE_WEIGHTS["K001"]
    elif score < 75:
        status = "warn"
        penalty = RULE_WEIGHTS["K001"]
    message = (
        f"Location-weighted keyword score is {score}. Missing keywords: {', '.join(missing)}."
        if missing
        else f"Location-weighted keyword score is {score} with strong keyword placement."
    )
    return (
        _build_rule(
            rule_id="K001",
            status=status,
            score_impact=float(penalty if penalty else RULE_WEIGHTS["K001"]),
            message=message,
            fix="Move important keywords into Experience and Summary bullets where they describe real work.",
            affected_section="keywords",
        ),
        coverage,
    )


def rule_keyword_density(assembled_resume: dict, ats_keywords: list[Any]) -> ATSRuleResult:
    text = " ".join([_summary_text(assembled_resume), *(bullet for _, bullet in _iter_bullets(assembled_resume)), * _skills_texts(assembled_resume)])
    normalized = _normalize_keyword(text)
    word_count = max(1, len(normalized.split()))
    stuffed = []
    for keyword in _canonical_keywords(ats_keywords):
        normalized_keyword = _normalize_keyword(keyword)
        count = len(re.findall(rf"\b{re.escape(normalized_keyword)}\b", normalized))
        if count > 4:
            stuffed.append((keyword, count))
    keyword_word_count = sum(count for _, count in stuffed)
    density = (keyword_word_count / word_count) * 100
    status = "pass"
    penalty = 0.0
    if stuffed:
        status = "fail"
        penalty += min(len(stuffed) * 5.0, 15.0)
    elif density > 8.0:
        status = "warn"
        penalty += 5.0
    message = "No keyword stuffing detected."
    if stuffed:
        message = "; ".join(
            f"{keyword} appears {count} times" for keyword, count in stuffed
        )
    elif density > 8.0:
        message = f"Keyword density is {density:.1f}% which is above the recommended threshold."
    return _build_rule(
        rule_id="K002",
        status=status,
        score_impact=float(penalty if penalty else RULE_WEIGHTS["K002"]),
        message=message,
        fix="Reduce repetition of repeated keywords and keep keyword density below roughly 8%.",
        affected_section="keywords",
    )


def rule_skills_section_format(assembled_resume: dict, latex_source: str = "") -> ATSRuleResult:
    if any(token in latex_source for token in ("skillbar", "progressbar", "⭐", "rating")):
        return _build_rule(
            rule_id="K003",
            status="fail",
            message="Skills are represented with ratings or graphical indicators.",
            fix="Use plain text skills listed comma-separated or line-by-line.",
            affected_section="Skills",
        )
    return _build_rule(
        rule_id="K003",
        status="pass",
        message="Skills are represented as plain text lists.",
        fix="Use plain text skills listed comma-separated or line-by-line.",
        affected_section="Skills",
    )


def rule_bullet_action_verbs(assembled_resume: dict) -> ATSRuleResult:
    weak_bullets = []
    for section, bullet in _iter_bullets(assembled_resume):
        first_word = bullet.split()[0].lower() if bullet.split() else ""
        if first_word and first_word not in ACTION_VERBS:
            weak_bullets.append(f"{section}: {bullet}")
    penalty = min(len(weak_bullets) * 2.0, 10.0)
    status = "pass"
    if weak_bullets:
        status = "warn" if penalty < 8 else "fail"
    return _build_rule(
        rule_id="C001",
        status=status,
        score_impact=float(penalty if penalty else RULE_WEIGHTS["C001"]),
        message=f"{len(weak_bullets)} bullets start weakly." if weak_bullets else "All bullets start with strong action verbs.",
        fix="Rewrite weak bullets so they start with strong action verbs.",
        affected_section="Experience",
    )


def rule_quantification_rate(assembled_resume: dict) -> ATSRuleResult:
    bullets = [bullet for _, bullet in _iter_bullets(assembled_resume)]
    if not bullets:
        return _build_rule(
            rule_id="C002",
            status="pass",
            message="No bullets to evaluate for quantification.",
            fix=RULE_CATALOG["C002"]["how_to_fix"],
            affected_section="content",
        )
    quantified = [bullet for bullet in bullets if NUMBER_PATTERN.search(bullet)]
    rate = len(quantified) / len(bullets)
    if rate < 0.4:
        status = "fail"
        penalty = 10.0
    elif rate < 0.6:
        status = "warn"
        penalty = 5.0
    else:
        status = "pass"
        penalty = 0.0
    return _build_rule(
        rule_id="C002",
        status=status,
        score_impact=float(penalty if penalty else RULE_WEIGHTS["C002"]),
        message=f"{len(quantified)} of {len(bullets)} bullets are quantified ({rate:.0%}).",
        fix="Add numbers, percentages, or time deltas to more bullets.",
        affected_section="content",
    )


def rule_resume_length(assembled_resume: dict, max_pages: int) -> ATSRuleResult:
    estimated_pages = _page_estimate(assembled_resume)
    fail = estimated_pages > max_pages
    return _build_rule(
        rule_id="C003",
        status="fail" if fail else "pass",
        message=f"Resume is estimated at {estimated_pages:.1f} pages for a {max_pages}-page target." if fail else f"Resume is estimated at {estimated_pages:.1f} pages and fits the target.",
        fix=f"Your resume is estimated at {estimated_pages:.1f} pages. Reduce it to {max_pages} page(s).",
        affected_section="layout",
    )


def rule_email_domain(assembled_resume: dict) -> ATSRuleResult:
    personal = _personal_info(assembled_resume)
    email = _clean_text(str(personal.get("email", ""))).lower()
    risky = ("hotmail.com", "yahoo.com", "aol.com", "rediffmail.com")
    warn = any(email.endswith(domain) for domain in risky)
    return _build_rule(
        rule_id="C004",
        status="warn" if warn else "pass",
        message=f"Email domain {email.split('@')[-1]} is a softer recruiter trust signal." if warn else "Email domain looks professional.",
        fix="Consider using a gmail.com or custom domain email.",
        affected_section="header",
    )


def compute_ats_score(rule_results: list[ATSRuleResult]) -> float:
    score = 100.0
    for rule in rule_results:
        if rule.status == "fail":
            score -= rule.score_impact
        elif rule.status == "warn":
            score -= rule.score_impact * 0.5
    return max(0.0, round(score, 1))


def compute_grade(score: float) -> str:
    for grade, boundary in GRADE_BOUNDARIES:
        if score >= boundary:
            return grade
    return "F"


def simulate_platform(platform: str, rule_results: list[ATSRuleResult]) -> dict:
    config = ATS_PLATFORM_RULES[platform]
    rules_by_id = {rule.rule_id: rule for rule in rule_results}
    blocking = [
        rule_id
        for rule_id in config["critical_rules"]
        if rules_by_id.get(rule_id) is not None and rules_by_id[rule_id].status == "fail"
    ]
    critical_subset = [rules_by_id[rule_id] for rule_id in config["critical_rules"] if rule_id in rules_by_id]
    score = compute_ats_score(critical_subset)
    return {
        "compatible": len(blocking) == 0,
        "blocking_rules": blocking,
        "score": score,
        "description": config["description"],
        "market_share": config["market_share"],
    }


def _summary(rule_results: list[ATSRuleResult], total_score: float) -> str:
    critical = [rule for rule in rule_results if rule.severity == "critical" and rule.status == "fail"]
    warnings = [rule for rule in rule_results if rule.status == "warn"]
    if critical:
        return (
            f"ATS simulation found {len(critical)} critical parsing or contact issue(s). "
            f"Fix those first, then address the remaining {len(warnings)} warning(s) to improve ranking."
        )
    if warnings:
        return (
            f"Resume is generally ATS-safe with a score of {total_score}, but {len(warnings)} warning(s) still reduce ranking strength."
        )
    return f"Resume is ATS-ready with a score of {total_score} and no blocking parser issues."


def simulate_ats(
    assembled_resume: dict,
    latex_source: str,
    ats_keywords: list[Any],
    max_pages: int,
) -> ATSReport:
    rules: list[ATSRuleResult] = [
        rule_no_tables(latex_source),
        rule_no_columns(latex_source),
        rule_no_headers_footers_with_critical_info(latex_source),
        rule_no_images_graphics(latex_source),
        rule_no_special_characters_in_section_headings(latex_source),
        rule_text_not_in_textbox(latex_source),
        rule_standard_section_headings(assembled_resume),
        rule_section_order_ats_friendly(assembled_resume),
        rule_contact_info_parseable(assembled_resume),
        rule_date_format_consistent(assembled_resume),
        rule_present_role_marked_correctly(assembled_resume),
    ]
    keyword_rule, keyword_coverage = rule_keyword_location_score(assembled_resume, ats_keywords)
    rules.extend(
        [
            keyword_rule,
            rule_keyword_density(assembled_resume, ats_keywords),
            rule_skills_section_format(assembled_resume, latex_source),
            rule_bullet_action_verbs(assembled_resume),
            rule_quantification_rate(assembled_resume),
            rule_resume_length(assembled_resume, max_pages),
            rule_email_domain(assembled_resume),
        ]
    )
    total_score = compute_ats_score(rules)
    critical_failures = [rule for rule in rules if rule.severity == "critical" and rule.status == "fail"]
    parser_compatibility = {
        platform: simulate_platform(platform, rules) for platform in ATS_PLATFORM_RULES
    }
    return ATSReport(
        total_score=total_score,
        grade=compute_grade(total_score),
        rule_results=rules,
        critical_failures=critical_failures,
        keyword_coverage=keyword_coverage,
        parser_compatibility=parser_compatibility,
        summary=_summary(rules, total_score),
    )


def ats_report_to_dict(report: ATSReport) -> dict:
    return {
        "total_score": report.total_score,
        "grade": report.grade,
        "rule_results": [asdict(result) for result in report.rule_results],
        "critical_failures": [asdict(result) for result in report.critical_failures],
        "keyword_coverage": report.keyword_coverage,
        "parser_compatibility": report.parser_compatibility,
        "summary": report.summary,
    }


def rule_catalog() -> dict:
    return {
        "rules": [
            {
                "id": rule_id,
                "name": meta["name"],
                "category": meta["category"],
                "severity": meta["severity"],
                "description": meta["description"],
                "why_it_matters": meta["why_it_matters"],
                "how_to_fix": meta["how_to_fix"],
            }
            for rule_id, meta in RULE_CATALOG.items()
        ]
    }


def _normalize_month_year(value: str) -> str:
    value = value.strip()
    if not value:
        return value
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        year, month, _day = value.split("-")
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return f"{months[int(month) - 1]} {year}"
    if re.fullmatch(r"\d{4}-\d{2}", value):
        year, month = value.split("-")
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return f"{months[int(month) - 1]} {year}"
    if re.fullmatch(r"\d{2}/\d{4}", value):
        month, year = value.split("/")
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return f"{months[int(month) - 1]} {year}"
    return value.replace("Now", "Present")


def apply_rule_fix(rule_id: str, assembled_resume: dict, ats_keywords: list[Any]) -> tuple[dict, bool, str | None]:
    patched = json.loads(json.dumps(assembled_resume))

    if rule_id in {"P001", "P002", "P003", "P004", "P006", "K001", "K002", "K003"}:
        return patched, False, RULE_CATALOG[rule_id]["how_to_fix"]

    if rule_id == "D001":
        for section in ("experience", "education"):
            for entry in patched.get(section, []):
                if not isinstance(entry, dict):
                    continue
                for key in ("startDate", "endDate"):
                    if key in entry:
                        entry[key] = _normalize_month_year(str(entry.get(key, "")))
        return patched, True, None

    if rule_id == "D002":
        if patched.get("experience"):
            current = patched["experience"][0]
            if isinstance(current, dict) and not str(current.get("endDate", "")).strip():
                current["endDate"] = "Present"
        return patched, True, None

    if rule_id == "C001":
        for section in ("experience", "projects"):
            for entry in patched.get(section, []):
                if not isinstance(entry, dict):
                    continue
                bullets = []
                for bullet in entry.get("bullets", []):
                    text = _clean_text(str(bullet))
                    if text and text.split()[0].lower() not in ACTION_VERBS:
                        bullets.append(f"Delivered {text[0].lower() + text[1:]}" if len(text) > 1 else f"Delivered {text}")
                    else:
                        bullets.append(text)
                entry["bullets"] = bullets
        return patched, True, None

    if rule_id == "C003":
        while _page_estimate(patched) > float(patched.get("maxPages", 1)):
            trimmed = False
            for section in ("projects", "experience"):
                for entry in reversed(patched.get(section, [])):
                    if isinstance(entry, dict) and entry.get("bullets"):
                        entry["bullets"].pop()
                        trimmed = True
                        break
                if trimmed:
                    break
            if not trimmed:
                break
        return patched, True, None

    if rule_id == "H001":
        return patched, False, RULE_CATALOG[rule_id]["how_to_fix"]

    if rule_id == "C002":
        return patched, False, RULE_CATALOG[rule_id]["how_to_fix"]

    return patched, False, RULE_CATALOG.get(rule_id, {}).get("how_to_fix")
