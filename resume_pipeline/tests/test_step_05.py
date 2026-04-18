from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_03_gap_analyser import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-05-run"
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


def test_match_score_formula_correct(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "high"},
            {"skill": "Docker", "importance": "medium"},
            {"skill": "Kubernetes", "importance": "medium"},
        ],
        "must_have_themes": ["backend", "cloud", "frontend"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "1", "title": "Python backend APIs", "type": "experience", "source": "linkedin", "include": True},
            {"id": "2", "title": "AWS Docker platform", "type": "project", "source": "github", "include": True},
            {"id": "3", "title": "React frontend dashboard", "type": "project", "source": "github", "include": True},
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [{"skill": "Kubernetes", "suggestion": "Add a Kubernetes deployment example."}],
            "soft_gaps": [],
            "covered_skills": ["Python", "AWS", "Docker"],
            "coverage_summary": "Most core backend and cloud signals are present.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)

    assert result["match_score"] == 72.5


def test_hard_gap_when_zero_evidence_for_skill(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["infra", "scale", "platform"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "1", "title": "Python API service", "type": "experience", "source": "linkedin", "include": True},
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [{"skill": "Kubernetes", "suggestion": "Add infra deployment work."}],
            "soft_gaps": [],
            "covered_skills": [],
            "coverage_summary": "Infrastructure coverage is missing.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)

    assert any(item["skill"] == "Kubernetes" for item in result["hard_gaps"])


def test_soft_gap_when_weak_evidence_exists(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [{"skill": "system design", "importance": "high"}],
        "must_have_themes": ["design", "architecture", "scalability"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "proj_1", "title": "Distributed systems course project", "type": "project", "source": "github", "include": True},
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [
                {
                    "skill": "system design",
                    "reframe_hint": "Emphasize architecture trade-offs and component boundaries.",
                    "evidence_id": "proj_1",
                }
            ],
            "covered_skills": [],
            "coverage_summary": "There is adjacent architecture evidence, but it needs reframing.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)

    assert any(item["skill"] == "system design" for item in result["soft_gaps"])


def test_reframe_hint_references_valid_evidence_id(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [{"skill": "system design", "importance": "high"}],
        "must_have_themes": ["design", "architecture", "platform"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "valid_1", "title": "Platform redesign", "type": "experience", "source": "linkedin", "include": True},
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [
                {
                    "skill": "system design",
                    "reframe_hint": "Focus on system boundaries and scaling constraints.",
                    "evidence_id": "valid_1",
                }
            ],
            "covered_skills": [],
            "coverage_summary": "A reframe path exists.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)
    valid_ids = {item["id"] for item in scored_evidence["scored_evidence"] if item["include"] is True}

    assert all(item["evidence_id"] in valid_ids for item in result["soft_gaps"])


def test_match_score_100_when_all_skills_covered(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "high"},
        ],
        "must_have_themes": ["backend", "cloud", "apis"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "1", "title": "Python backend APIs on AWS", "type": "experience", "source": "linkedin", "include": True}
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [],
            "covered_skills": ["Python", "AWS"],
            "coverage_summary": "Everything required is covered.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)

    assert result["match_score"] == 100.0


def test_match_score_0_when_no_skills_covered(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [
            {"skill": "Kubernetes", "importance": "high"},
            {"skill": "Terraform", "importance": "medium"},
        ],
        "must_have_themes": ["infra", "scale", "platform"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "1", "title": "UX redesign portfolio", "type": "project", "source": "github", "include": True}
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [{"skill": "Kubernetes", "suggestion": "Add deployment evidence."}],
            "soft_gaps": [],
            "covered_skills": [],
            "coverage_summary": "The selected evidence does not cover the infra requirements.",
        }
    )

    result = run(jd_analysis, scored_evidence, client, ctx)

    assert result["match_score"] == 0.0


def test_only_include_true_items_passed_to_llm(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    jd_analysis = {
        "required_skills": [{"skill": "Python", "importance": "high"}],
        "must_have_themes": ["backend", "apis", "cloud"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": f"id_{index}", "title": f"Item {index}", "type": "project", "source": "github", "include": index < 5}
            for index in range(10)
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [],
            "covered_skills": ["Python"],
            "coverage_summary": "Five signals were reviewed.",
        }
    )

    run(jd_analysis, scored_evidence, client, ctx)

    passed_payload = json.loads(client.calls[0]["user_content"])
    assert len(passed_payload["candidate_evidence"]) == 5
