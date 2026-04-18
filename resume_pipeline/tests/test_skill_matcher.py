from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_03_gap_analyser import run
from pipeline_context import PipelineContext
from skill_matcher import SkillMatchResult, classify_gap, extract_candidate_skills, match_skill, normalise


def make_context(tmp_path: Path, candidate: dict) -> PipelineContext:
    context_path = tmp_path / "runs" / "skill_matcher" / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate=candidate,
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
            "run_id": "skill-matcher",
            "timestamp": "2026-04-19T00:00:00Z",
            "retry_count": 0,
            "agent_timings": {},
            "context_path": str(context_path),
        },
    )


def test_normalise_lowercases() -> None:
    assert normalise("PostgreSQL") == "postgresql"


def test_normalise_resolves_stem_variant() -> None:
    assert normalise("K8s") == "kubernetes"
    assert normalise("optimised") == "optimise"
    assert normalise("CI/CD") == "continuous integration"


def test_normalise_resolves_plural_variant_to_canonical() -> None:
    assert normalise("REST APIs") == "rest api"


def test_normalise_unknown_term_returns_lowercased() -> None:
    assert normalise("SomeMadeUpTool123") == "somemadeuptool123"


def test_exact_match_returns_strength_1() -> None:
    result = match_skill("Python", ["Go", "Python", "Rust"])
    assert result.match_type == "exact"
    assert result.match_strength == 1.0


def test_stem_match_k8s_kubernetes() -> None:
    result = match_skill("Kubernetes", ["Docker", "K8s", "Helm"])
    assert result.match_type == "stem"
    assert result.match_strength == 1.0
    assert result.candidate_skill == "K8s"


def test_stem_match_postgres_postgresql() -> None:
    result = match_skill("PostgreSQL", ["MySQL", "Postgres"])
    assert result.match_type == "stem"
    assert result.match_strength == 1.0


def test_transferable_match_swarm_for_kubernetes() -> None:
    result = match_skill("Kubernetes", ["Docker Swarm", "Python"])
    assert result.match_type == "transferable"
    assert result.match_strength == 0.85
    assert result.candidate_skill == "Docker Swarm"


def test_transferable_picks_highest_strength() -> None:
    result = match_skill("Kubernetes", ["Nomad", "Docker Swarm"])
    assert result.candidate_skill == "Docker Swarm"
    assert result.match_strength == 0.85


def test_no_match_returns_none_type() -> None:
    result = match_skill("Kubernetes", ["Python", "React", "PostgreSQL"])
    assert result.match_type == "none"
    assert result.match_strength == 0.0


def test_rabbitmq_as_kafka_substitute() -> None:
    result = match_skill("Kafka", ["RabbitMQ", "Python"])
    assert result.match_type == "transferable"
    assert result.match_strength == 0.7


def test_opensearch_as_elasticsearch_substitute() -> None:
    result = match_skill("Elasticsearch", ["OpenSearch"])
    assert result.match_type == "transferable"
    assert result.match_strength == 0.95


def test_reverse_lookup_works() -> None:
    result = match_skill("Kubernetes", ["Docker Swarm"])
    assert result.match_type == "transferable"


def test_case_insensitive_matching() -> None:
    result = match_skill("kubernetes", ["DOCKER SWARM"])
    assert result.match_type == "transferable"


def test_exact_match_is_covered() -> None:
    result = SkillMatchResult("Kubernetes", "Kubernetes", "exact", 1.0, "kubernetes")
    assert classify_gap(result) == "covered"


def test_strong_transferable_is_soft_gap_strong() -> None:
    result = SkillMatchResult("Kubernetes", "Docker Swarm", "transferable", 0.85, "kubernetes")
    assert classify_gap(result) == "soft_gap_strong"


def test_weak_transferable_is_soft_gap_weak() -> None:
    result = SkillMatchResult("Kubernetes", "Ansible", "transferable", 0.5, "kubernetes")
    assert classify_gap(result) == "soft_gap_weak"


def test_no_match_is_hard_gap() -> None:
    result = SkillMatchResult("Kubernetes", "", "none", 0.0, "kubernetes")
    assert classify_gap(result) == "hard_gap"


def test_threshold_boundary_0_75_is_soft_strong() -> None:
    result = SkillMatchResult("X", "Y", "transferable", 0.75, "x")
    assert classify_gap(result) == "soft_gap_strong"


def test_threshold_boundary_0_74_is_soft_weak() -> None:
    result = SkillMatchResult("X", "Y", "transferable", 0.74, "x")
    assert classify_gap(result) == "soft_gap_weak"


def test_extracts_linkedin_skills() -> None:
    candidate = {"linkedin": {"skills": ["Python", "Go"]}, "github": {}, "old_resume": {}}
    skills = extract_candidate_skills(candidate)
    assert "Python" in skills
    assert "Go" in skills


def test_extracts_github_languages() -> None:
    candidate = {"linkedin": {}, "github": {"languages": {"Rust": 5000}, "top_projects": []}, "old_resume": {}}
    skills = extract_candidate_skills(candidate)
    assert "Rust" in skills


def test_deduplicates_across_sources() -> None:
    candidate = {
        "linkedin": {"skills": ["Python"]},
        "github": {"languages": {"Python": 10000}, "top_projects": []},
        "old_resume": {},
    }
    skills = extract_candidate_skills(candidate)
    assert skills.count("Python") == 1


def test_empty_candidate_returns_empty_list() -> None:
    assert extract_candidate_skills({}) == []


def test_extract_candidate_skills_scans_textual_sources() -> None:
    candidate = {
        "linkedin": {},
        "github": {},
        "old_resume": {
            "raw_text": "Built a low-latency service with Docker Swarm and PostgreSQL."
        },
    }
    skills = extract_candidate_skills(candidate)
    assert "Docker Swarm" in skills
    assert "PostgreSQL" in skills


def test_docker_swarm_not_classified_as_hard_gap_for_kubernetes_jd(tmp_path: Path) -> None:
    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["container orchestration", "cloud infra", "backend"],
        "ats_keywords": [{"original": "Kubernetes", "canonical": "kubernetes"}],
    }
    scored_evidence = {
        "scored_evidence": [
            {
                "id": "proj_01",
                "title": "Deployed app on Docker Swarm",
                "include": True,
                "composite": 7.5,
                "type": "project",
                "source": "github",
            }
        ]
    }
    candidate = {"linkedin": {"skills": ["Docker Swarm", "Python"]}, "github": {}, "old_resume": {}}

    mock_llm = MagicMock()
    mock_llm.call_llm.return_value = {
        "hard_gaps": [],
        "soft_gaps": [{"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "proj_01"}],
        "coverage_summary": "Strong container background.",
    }

    ctx = make_context(tmp_path, candidate)

    result = run(jd_analysis, scored_evidence, candidate, mock_llm, ctx)

    hard_gap_skills = [gap["skill"] for gap in result["hard_gaps"]]
    assert "Kubernetes" not in hard_gap_skills


def test_match_score_higher_with_transferable_than_without(tmp_path: Path, monkeypatch) -> None:
    import skill_matcher

    jd_analysis = {
        "required_skills": [{"skill": "Kubernetes", "importance": "high"}],
        "must_have_themes": ["container orchestration", "cloud infra", "backend"],
        "ats_keywords": [{"original": "Kubernetes", "canonical": "kubernetes"}],
    }
    scored_evidence = {
        "scored_evidence": [
            {
                "id": "proj_01",
                "title": "Deployed app on Docker Swarm",
                "include": True,
                "composite": 7.5,
                "type": "project",
                "source": "github",
            }
        ]
    }
    candidate = {"linkedin": {"skills": ["Docker Swarm"]}}

    ctx = make_context(tmp_path, candidate)

    mock_llm = MagicMock()
    mock_llm.call_llm.return_value = {
        "hard_gaps": [],
        "soft_gaps": [{"skill": "Kubernetes", "reframe_hint": "...", "evidence_id": "proj_01"}],
        "coverage_summary": "Transferable orchestration experience exists.",
    }

    transferable_result = run(jd_analysis, scored_evidence, candidate, mock_llm, ctx)

    monkeypatch.setitem(skill_matcher._TRANSFERABLE_BY_NORMALISED_CANONICAL, "kubernetes", {"substitutes": [], "match_strength": []})
    monkeypatch.setattr(skill_matcher, "_SUBSTITUTE_REVERSE", {})
    no_transfer_result = run(jd_analysis, scored_evidence, candidate, mock_llm, ctx)

    assert transferable_result["match_score"] > no_transfer_result["match_score"]
