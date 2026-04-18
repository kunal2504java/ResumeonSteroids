from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_02_profile_scorer import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-04-run"
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
            "timestamp": "2026-04-18T00:00:00Z",
            "retry_count": 0,
            "agent_timings": {},
            "context_path": str(context_path),
        },
    )


def sample_jd_analysis() -> dict:
    return {
        "must_have_themes": ["Backend APIs", "Cloud", "Reliability"],
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "medium"},
        ],
    }


def make_candidate_with_items(count: int, item_type: str = "project") -> dict:
    return {
        "github": {
            "projects": [
                {
                    "id": f"proj_{index}",
                    "name": f"Project {index}",
                    "description": f"Description {index}",
                }
                for index in range(count)
            ]
        }
        if item_type == "project"
        else {}
    }


def test_composite_recomputed_not_trusted_from_llm(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = {
        "github": {
            "projects": [
                {"id": "p1", "name": "Repo One", "description": "Small project"}
            ]
        }
    }
    client = MockLLMClient(
        {
            "scored_evidence": [
                {
                    "id": "p1",
                    "type": "project",
                    "source": "github",
                    "title": "Repo One",
                    "relevance": 2,
                    "impact": 2,
                    "recency": 2,
                    "composite": 9.9,
                }
            ]
        }
    )

    result = run(candidate, sample_jd_analysis(), client, ctx)

    assert result["scored_evidence"][0]["composite"] == 2.0


def test_max_15_included_items_enforced(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = {
        "github": {
            "projects": [
                {"id": f"p{index}", "name": f"Project {index}", "description": "desc"}
                for index in range(20)
            ]
        }
    }
    response_items = [
        {
            "id": f"p{index}",
            "type": "project",
            "source": "github",
            "title": f"Project {index}",
            "relevance": 9,
            "impact": 9,
            "recency": 9,
        }
        for index in range(20)
    ]
    client = MockLLMClient({"scored_evidence": response_items})

    result = run(candidate, sample_jd_analysis(), client, ctx)

    assert sum(1 for item in result["scored_evidence"] if item["include"]) == 15


def test_output_sorted_by_composite_descending(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = {
        "github": {
            "projects": [
                {"id": "a", "name": "A", "description": "a"},
                {"id": "b", "name": "B", "description": "b"},
                {"id": "c", "name": "C", "description": "c"},
            ]
        }
    }
    client = MockLLMClient(
        {
            "scored_evidence": [
                {"id": "a", "type": "project", "source": "github", "title": "A", "relevance": 4, "impact": 4, "recency": 4},
                {"id": "b", "type": "project", "source": "github", "title": "B", "relevance": 9, "impact": 8, "recency": 7},
                {"id": "c", "type": "project", "source": "github", "title": "C", "relevance": 6, "impact": 6, "recency": 6},
            ]
        }
    )

    result = run(candidate, sample_jd_analysis(), client, ctx)
    composites = [item["composite"] for item in result["scored_evidence"]]

    assert composites == sorted(composites, reverse=True)


def test_items_below_composite_3_marked_excluded(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = {
        "github": {
            "projects": [
                {"id": "low", "name": "Low Signal", "description": "low"},
            ]
        }
    }
    client = MockLLMClient(
        {
            "scored_evidence": [
                {
                    "id": "low",
                    "type": "project",
                    "source": "github",
                    "title": "Low Signal",
                    "relevance": 1,
                    "impact": 2,
                    "recency": 1,
                }
            ]
        }
    )

    result = run(candidate, sample_jd_analysis(), client, ctx)

    assert result["scored_evidence"][0]["composite"] == 1.3
    assert result["scored_evidence"][0]["include"] is False


def test_all_evidence_types_can_appear_in_output(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    candidate = {
        "github": {"projects": [{"id": "p1", "name": "Proj", "description": "x"}]},
        "linkedin": {
            "experience": [{"id": "e1", "title": "Engineer", "company": "Acme", "description": "built APIs"}],
            "education": [{"id": "ed1", "institution": "State U", "degree": "BTech"}],
            "certifications": [{"id": "c1", "title": "AWS Certified", "description": "cert"}],
        },
        "leetcode": {
            "contests": [{"id": "ct1", "title": "Weekly Contest 123", "description": "Top 10%"}]
        },
    }
    client = MockLLMClient(
        {
            "scored_evidence": [
                {"id": "p1", "type": "project", "source": "github", "title": "Proj", "relevance": 9, "impact": 8, "recency": 8},
                {"id": "e1", "type": "experience", "source": "linkedin", "title": "Engineer", "relevance": 8, "impact": 8, "recency": 7},
                {"id": "ct1", "type": "contest", "source": "leetcode", "title": "Weekly Contest 123", "relevance": 6, "impact": 6, "recency": 9},
                {"id": "c1", "type": "certification", "source": "linkedin", "title": "AWS Certified", "relevance": 5, "impact": 5, "recency": 7},
                {"id": "ed1", "type": "education", "source": "linkedin", "title": "State U", "relevance": 4, "impact": 4, "recency": 6},
            ]
        }
    )

    result = run(candidate, sample_jd_analysis(), client, ctx)
    types = {item["type"] for item in result["scored_evidence"]}

    assert types == {"project", "experience", "contest", "certification", "education"}


def test_empty_candidate_returns_empty_scored_list(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient({"scored_evidence": [{"id": "unused"}]})

    result = run({}, sample_jd_analysis(), client, ctx)

    assert result["scored_evidence"] == []
    assert client.calls == []
