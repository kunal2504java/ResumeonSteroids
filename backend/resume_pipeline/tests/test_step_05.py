from __future__ import annotations

import json
import sys
from pathlib import Path

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


def make_context(tmp_path: Path, candidate: dict | None = None) -> PipelineContext:
    run_id = "step-05-run"
    context_path = tmp_path / "runs" / run_id / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate=candidate or {},
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
    candidate = {"linkedin": {"skills": ["Python", "AWS", "Docker"]}}
    ctx = make_context(tmp_path, candidate)
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
            "coverage_summary": "Most core backend and cloud signals are present.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert result["match_score"] == 86.9


def test_hard_gap_when_zero_evidence_for_skill(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Python"]}}
    ctx = make_context(tmp_path, candidate)
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
            "coverage_summary": "Infrastructure coverage is missing.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert any(item["skill"] == "Kubernetes" for item in result["hard_gaps"])


def test_soft_gap_when_weak_evidence_exists(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["REST"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [{"skill": "GraphQL", "importance": "high"}],
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
                    "skill": "GraphQL",
                    "reframe_hint": "Reframe the API project around schema design and flexible client data access.",
                    "evidence_id": "proj_1",
                }
            ],
            "coverage_summary": "There is adjacent architecture evidence, but it needs reframing.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert any(item["skill"] == "GraphQL" for item in result["soft_gaps"])


def test_reframe_hint_references_valid_evidence_id(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["REST"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [{"skill": "GraphQL", "importance": "high"}],
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
                    "skill": "GraphQL",
                    "reframe_hint": "Focus on query flexibility and schema-driven API design.",
                    "evidence_id": "valid_1",
                }
            ],
            "coverage_summary": "A reframe path exists.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)
    valid_ids = {item["id"] for item in scored_evidence["scored_evidence"] if item["include"] is True}

    assert all(item["evidence_id"] in valid_ids for item in result["soft_gaps"])


def test_match_score_100_when_all_skills_covered(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Python", "AWS"]}}
    ctx = make_context(tmp_path, candidate)
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
            "coverage_summary": "Everything required is covered.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert result["match_score"] == 100.0


def test_match_score_0_when_no_skills_covered(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Figma"]}}
    ctx = make_context(tmp_path, candidate)
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
            "hard_gaps": [
                {"skill": "Kubernetes", "suggestion": "Add deployment evidence."},
                {"skill": "Terraform", "suggestion": "Add infrastructure-as-code evidence."},
            ],
            "soft_gaps": [],
            "coverage_summary": "The selected evidence does not cover the infra requirements.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert result["match_score"] == 0.0


def test_only_include_true_items_passed_to_llm(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Python"]}}
    ctx = make_context(tmp_path, candidate)
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
            "coverage_summary": "Five signals were reviewed.",
        }
    )

    run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert client.calls == []


def test_hard_gap_not_raised_when_transferable_exists(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Docker Swarm"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["container orchestration", "cloud", "backend"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "proj_01", "title": "Docker Swarm rollout", "type": "project", "source": "github", "include": True}
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [
                {
                    "skill": "Kubernetes",
                    "reframe_hint": "Frame the rollout as production orchestration work adjacent to Kubernetes.",
                    "evidence_id": "proj_01",
                }
            ],
            "coverage_summary": "Strong adjacent orchestration experience exists.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert not any(item["skill"] == "Kubernetes" for item in result["hard_gaps"])
    assert any(item["skill"] == "Kubernetes" for item in result["soft_gaps"])


def test_soft_gap_strength_reflected_in_match_score(tmp_path: Path) -> None:
    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["container orchestration", "cloud", "backend"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "proj_01", "title": "Platform orchestration work", "type": "project", "source": "github", "include": True}
        ]
    }

    strong_candidate = {"linkedin": {"skills": ["Docker Swarm"]}}
    weak_candidate = {"linkedin": {"skills": ["Mesos"]}}

    strong_ctx = make_context(tmp_path / "strong", strong_candidate)
    weak_ctx = make_context(tmp_path / "weak", weak_candidate)

    strong_client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [{"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "proj_01"}],
            "coverage_summary": "Strong adjacent orchestration experience exists.",
        }
    )
    weak_client = MockLLMClient(
        {
            "hard_gaps": [{"skill": "Kubernetes", "suggestion": "Add Kubernetes delivery work."}],
            "soft_gaps": [],
            "coverage_summary": "Only weak adjacent orchestration experience exists.",
        }
    )

    strong_result = run(jd_analysis, scored_evidence, strong_candidate, strong_client, strong_ctx)
    weak_result = run(jd_analysis, scored_evidence, weak_candidate, weak_client, weak_ctx)

    assert strong_result["match_score"] > weak_result["match_score"]


def test_match_score_uses_weighted_formula_not_binary(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Docker Swarm", "GraphQL"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [
            {"skill": "Kubernetes", "importance": "high"},
            {"skill": "GraphQL", "importance": "low"},
        ],
        "must_have_themes": ["container orchestration", "backend", "apis"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "proj_01", "title": "Backend API platform", "type": "project", "source": "github", "include": True}
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [],
            "soft_gaps": [{"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "proj_01"}],
            "coverage_summary": "High-importance adjacent infrastructure overlap exists.",
        }
    )

    result = run(jd_analysis, scored_evidence, candidate, client, ctx)

    assert result["match_score"] > 35.0


def test_llm_receives_fewer_hard_gaps_after_transferable_matching(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Docker Swarm", "RabbitMQ", "Postgres"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [
            {"skill": "Kubernetes", "importance": "high"},
            {"skill": "Kafka", "importance": "high"},
            {"skill": "PostgreSQL", "importance": "high"},
            {"skill": "Terraform", "importance": "medium"},
        ],
        "must_have_themes": ["backend", "platform", "cloud"],
    }
    scored_evidence = {
        "scored_evidence": [
            {"id": "proj_01", "title": "Platform project", "type": "project", "source": "github", "include": True}
        ]
    }
    client = MockLLMClient(
        {
            "hard_gaps": [{"skill": "Terraform", "suggestion": "Add infrastructure-as-code ownership."}],
            "soft_gaps": [
                {"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "proj_01"},
                {"skill": "Kafka", "reframe_hint": "...", "evidence_id": "proj_01"},
            ],
            "coverage_summary": "Several skills are covered adjacently.",
        }
    )

    run(jd_analysis, scored_evidence, candidate, client, ctx)

    payload = json.loads(client.calls[0]["user_content"])
    assert len(payload["hard_gaps"]) < len(jd_analysis["required_skills"])
    assert payload["hard_gaps"] == ["Terraform"]


def test_only_include_true_items_passed_to_llm_when_llm_runs(tmp_path: Path) -> None:
    candidate = {"linkedin": {"skills": ["Docker Swarm"]}}
    ctx = make_context(tmp_path, candidate)
    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["container orchestration", "cloud", "backend"],
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
            "soft_gaps": [{"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "id_0"}],
            "coverage_summary": "Five signals were reviewed.",
        }
    )

    run(jd_analysis, scored_evidence, candidate, client, ctx)

    payload = json.loads(client.calls[0]["user_content"])
    assert len(payload["candidate_evidence"]) == 5
