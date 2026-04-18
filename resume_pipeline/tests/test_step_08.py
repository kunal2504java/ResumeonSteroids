from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_06_section_ranker import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-08-run"
    context_path = tmp_path / "runs" / run_id / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate={},
        jd={},
        jd_analysis={},
        scored_evidence={},
        gap_analysis={},
        content={},
        ats_optimised={},
        section_order={},
        assembled_resume={},
        qa_report={},
        metadata={
            "run_id": run_id,
            "timestamp": "2026-04-19T00:00:00Z",
            "retry_count": 0,
            "agent_timings": {},
            "context_path": str(context_path),
        },
    )


def make_candidate(*, cf_rating: int = 0, lc_hard: int = 0, experience: list[dict] | None = None) -> dict:
    return {
        "linkedin": {
            "experience": experience or [],
        },
        "codeforces": {"rating": cf_rating},
        "leetcode": {"solved": {"hard": lc_hard}},
    }


def make_jd(*, role_level: str, work_style: str) -> dict:
    return {
        "role_level": role_level,
        "implicit_signals": {"work_style": work_style},
        "must_have_themes": [],
        "required_skills": [],
    }


def test_junior_gets_education_first(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate()
    jd_analysis = make_jd(role_level="junior", work_style="infra")
    client = MockLLMClient({"order": ["Summary"], "rationale": "fallback"})

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["section_order"][1]["section"] == "Education"


def test_senior_with_experience_gets_experience_first(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(
        experience=[
            {"duration": "Jan 2021 - Jan 2022"},
            {"duration": "Feb 2022 - Feb 2023"},
            {"duration": "Mar 2023 - Mar 2024"},
        ]
    )
    jd_analysis = make_jd(role_level="senior", work_style="infra")
    client = MockLLMClient({"order": ["Summary"], "rationale": "fallback"})

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["section_order"][1]["section"] == "Experience"


def test_high_cf_rating_triggers_cp_section(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(cf_rating=1900)
    jd_analysis = make_jd(role_level="mid", work_style="infra")
    client = MockLLMClient({"order": ["Summary"], "rationale": "fallback"})

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["competitive_programming_as_section"] is True


def test_low_cp_stats_merges_into_skills(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(cf_rating=800, lc_hard=5)
    jd_analysis = make_jd(role_level="mid", work_style="infra")
    client = MockLLMClient(
        {
            "order": ["Summary", "Experience", "Projects", "Skills", "Education"],
            "rationale": "Fallback ordering for a balanced profile.",
        }
    )

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["competitive_programming_as_section"] is False


def test_page_budget_1_for_under_3_years(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(
        experience=[
            {"duration": "Jan 2022 - Dec 2022"},
            {"duration": "Jan 2023 - Dec 2023"},
        ]
    )
    jd_analysis = make_jd(role_level="mid", work_style="infra")
    client = MockLLMClient(
        {
            "order": ["Summary", "Experience", "Projects", "Skills", "Education"],
            "rationale": "Fallback ordering for a balanced profile.",
        }
    )

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["max_pages"] == 1


def test_page_budget_2_for_over_3_years(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(
        experience=[
            {"duration": "Jan 2020 - Dec 2021"},
            {"duration": "Jan 2022 - Dec 2023"},
        ]
    )
    jd_analysis = make_jd(role_level="mid", work_style="infra")
    client = MockLLMClient(
        {
            "order": ["Summary", "Experience", "Projects", "Skills", "Education"],
            "rationale": "Fallback ordering for a balanced profile.",
        }
    )

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["max_pages"] == 2


def test_llm_not_called_when_rules_are_unambiguous(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = make_candidate(
        experience=[
            {"duration": "Jan 2021 - Jan 2022"},
            {"duration": "Feb 2022 - Feb 2023"},
            {"duration": "Mar 2023 - Mar 2024"},
        ]
    )
    jd_analysis = make_jd(role_level="senior", work_style="infra")
    client = MockLLMClient({"order": ["Summary"], "rationale": "fallback"})

    result = run(candidate, jd_analysis, {"scored_evidence": []}, client, ctx)

    assert result["llm_used"] is False
    assert client.calls == []
