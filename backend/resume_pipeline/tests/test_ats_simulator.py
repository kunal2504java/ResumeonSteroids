from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ats_simulator import ATSRuleResult
from ats_simulator import compute_ats_score
from ats_simulator import compute_grade
from ats_simulator import rule_contact_info_parseable
from ats_simulator import rule_date_format_consistent
from ats_simulator import rule_keyword_density
from ats_simulator import rule_keyword_location_score
from ats_simulator import rule_no_columns
from ats_simulator import rule_no_headers_footers_with_critical_info
from ats_simulator import rule_no_tables
from ats_simulator import rule_skills_section_format
from ats_simulator import rule_standard_section_headings
from ats_simulator import simulate_ats
from ats_simulator import simulate_platform


def make_resume() -> dict:
    return {
        "personalInfo": {
            "name": "Kunal Singh",
            "email": "kunal@gmail.com",
            "phone": "+91 99999 99999",
            "location": "Noida, India",
            "linkedin": "https://linkedin.com/in/kunal-singh",
            "github": "https://github.com/kunal",
            "website": "https://kunal.dev",
        },
        "summary": (
            "Senior backend engineer building Python and Go services for AWS platforms "
            "with strong distributed systems and gRPC experience."
        ),
        "experience": [
            {
                "company": "Acme",
                "title": "Senior Backend Engineer",
                "location": "Remote",
                "startDate": "Jan 2022",
                "endDate": "Present",
                "bullets": [
                    "Built Python and Go services by redesigning APIs, resulting in 35% lower latency on AWS.",
                    "Scaled gRPC workers by re-architecting queues, resulting in 2x higher throughput for Redis-backed jobs.",
                ],
            }
        ],
        "projects": [
            {
                "name": "Realtime Platform",
                "techStack": ["Docker", "PostgreSQL"],
                "startDate": "Jan 2021",
                "endDate": "Dec 2021",
                "bullets": [
                    "Designed Docker deployment workflows by standardizing release steps, resulting in 50% faster rollouts.",
                ],
            }
        ],
        "education": [
            {
                "institution": "ABC University",
                "degree": "BSc",
                "field": "Computer Science",
                "year": "2022",
            }
        ],
        "skills": {
            "languages": ["Python", "Go"],
            "frameworks": ["FastAPI"],
            "tools": ["AWS", "Docker", "gRPC", "Redis"],
            "databases": ["PostgreSQL"],
        },
        "achievements": [],
        "sectionOrder": [
            {"section": "Summary", "position": 1},
            {"section": "Experience", "position": 2},
            {"section": "Education", "position": 3},
            {"section": "Skills", "position": 4},
            {"section": "Projects", "position": 5},
        ],
        "maxPages": 1,
    }


def test_table_detection_in_latex() -> None:
    result = rule_no_tables(r"\begin{tabular}{ll}A&B\end{tabular}")

    assert result.rule_id == "P001"
    assert result.status == "fail"


def test_multicolumn_detection_in_latex() -> None:
    result = rule_no_columns(r"\begin{multicols}{2}hello\end{multicols}")

    assert result.rule_id == "P002"
    assert result.status == "fail"


def test_header_footer_contact_info_flagged() -> None:
    latex_source = r"\fancyhead[L]{Kunal Singh | kunal@gmail.com | +91 99999 99999}"

    result = rule_no_headers_footers_with_critical_info(latex_source)

    assert result.rule_id == "P003"
    assert result.status == "fail"


def test_clean_resume_passes_all_parsing_rules() -> None:
    report = simulate_ats(
        make_resume(),
        r"\section{Experience}\section{Education}\section{Projects}\section{Skills}",
        ["Python", "AWS", "Docker", "gRPC", "Redis", "PostgreSQL"],
        1,
    )
    parsing_rules = [rule for rule in report.rule_results if rule.category == "parsing"]

    assert parsing_rules
    assert all(rule.status == "pass" for rule in parsing_rules)


def test_standard_heading_passes() -> None:
    result = rule_standard_section_headings(make_resume())

    assert result.rule_id == "H001"
    assert result.status == "pass"


def test_creative_heading_fails_with_suggestion() -> None:
    resume = make_resume()
    resume["sectionOrder"] = [
        {"section": "Summary", "position": 1},
        {"section": "What I've Built", "position": 2},
        {"section": "Education", "position": 3},
    ]

    result = rule_standard_section_headings(resume)

    assert result.status == "fail"
    assert "What I've Built" in result.message


def test_missing_contact_email_flagged() -> None:
    resume = make_resume()
    resume["personalInfo"]["email"] = ""

    result = rule_contact_info_parseable(resume)

    assert result.rule_id == "H003"
    assert result.status == "fail"


def test_mon_yyyy_format_passes() -> None:
    result = rule_date_format_consistent(make_resume())

    assert result.rule_id == "D001"
    assert result.status == "pass"


def test_seasonal_date_fails() -> None:
    resume = make_resume()
    resume["experience"][0]["startDate"] = "Spring 2022"

    result = rule_date_format_consistent(resume)

    assert result.status == "fail"


def test_keyword_in_experience_scores_higher_than_skills_only() -> None:
    experience_resume = make_resume()
    skills_only_resume = make_resume()
    skills_only_resume["experience"][0]["bullets"] = [
        "Built backend services by redesigning APIs, resulting in 35% lower latency."
    ]

    _, experience_coverage = rule_keyword_location_score(experience_resume, ["Python"])
    _, skills_only_coverage = rule_keyword_location_score(skills_only_resume, ["Python"])

    assert experience_coverage["location_weighted_score"] > skills_only_coverage["location_weighted_score"]


def test_keyword_stuffing_flagged_above_4_occurrences() -> None:
    resume = make_resume()
    resume["summary"] = "Python Python Python Python Python"

    result = rule_keyword_density(resume, ["Python"])

    assert result.rule_id == "K002"
    assert result.status == "fail"


def test_skills_table_format_flagged() -> None:
    result = rule_skills_section_format(make_resume(), r"\newcommand{\skillbar}[1]{#1}")

    assert result.rule_id == "K003"
    assert result.status == "fail"


def test_perfect_resume_scores_100() -> None:
    rules = [
        ATSRuleResult("P001", "Tables", "parsing", "pass", 25.0, "", "", "layout", "critical"),
        ATSRuleResult("H001", "Headings", "formatting", "pass", 8.0, "", "", "content", "major"),
        ATSRuleResult("K001", "Keywords", "keywords", "pass", 15.0, "", "", "keywords", "major"),
    ]

    assert compute_ats_score(rules) == 100.0


def test_table_fail_reduces_score_by_25() -> None:
    rules = [
        ATSRuleResult("P001", "Tables", "parsing", "fail", 25.0, "", "", "layout", "critical")
    ]

    assert compute_ats_score(rules) == 75.0


def test_warn_reduces_score_by_half_impact() -> None:
    rules = [
        ATSRuleResult("C004", "Email", "content", "warn", 2.0, "", "", "header", "minor")
    ]

    assert compute_ats_score(rules) == 99.0


def test_grade_boundaries_correct() -> None:
    assert compute_grade(91) == "A"
    assert compute_grade(84) == "B"
    assert compute_grade(72) == "C"
    assert compute_grade(63) == "D"
    assert compute_grade(59) == "F"


def test_workday_incompatible_with_table() -> None:
    report = simulate_ats(
        make_resume(),
        r"\begin{tabular}{ll}A&B\end{tabular}",
        ["Python", "AWS"],
        1,
    )

    result = simulate_platform("Workday", report.rule_results)

    assert result["compatible"] is False
    assert "P001" in result["blocking_rules"]


def test_clean_resume_compatible_with_all_platforms() -> None:
    report = simulate_ats(
        make_resume(),
        r"\section{Experience}\section{Education}\section{Projects}\section{Skills}",
        ["Python", "AWS", "Docker", "gRPC", "Redis", "PostgreSQL"],
        1,
    )

    for platform in report.parser_compatibility.values():
        assert platform["compatible"] is True
