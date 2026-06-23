from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_01_jd_analyser import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-03-run"
    context_path = tmp_path / "runs" / run_id / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate={"name": "Test Candidate"},
        jd={"raw_text": "placeholder"},
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


def valid_response() -> dict:
    return {
        "role_level": "senior",
        "must_have_themes": ["Backend APIs", "Cloud deployment", "Reliability"],
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "medium"},
        ],
        "preferred_skills": [{"skill": "React", "importance": "low"}],
        "implicit_signals": {
            "team_size": "medium",
            "work_style": "fullstack",
            "tech_focus": "platform engineering",
        },
        "ats_keywords": ["Python", "React", "AWS", "REST APIs"],
    }


def test_output_matches_schema_exactly(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_response())

    result = run("Need Python, AWS, and React experience", client, ctx)

    assert set(result.keys()) == {
        "role_level",
        "must_have_themes",
        "required_skills",
        "preferred_skills",
        "implicit_signals",
        "ats_keywords",
    }
    assert isinstance(result["role_level"], str)
    assert isinstance(result["must_have_themes"], list)
    assert isinstance(result["required_skills"], list)
    assert isinstance(result["preferred_skills"], list)
    assert isinstance(result["implicit_signals"], dict)
    assert isinstance(result["ats_keywords"], list)
    assert all("canonical" in skill for skill in result["required_skills"])
    assert all("canonical" in skill for skill in result["preferred_skills"])
    assert all(
        isinstance(keyword, dict) and {"original", "canonical"} <= set(keyword.keys())
        for keyword in result["ats_keywords"]
    )


def test_role_level_is_valid_enum_value(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_response())

    result = run("Senior backend engineer role", client, ctx)

    assert result["role_level"] in {"junior", "mid", "senior", "staff", "unknown"}


def test_must_have_themes_is_exactly_3_items(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    bad_response = valid_response()
    bad_response["must_have_themes"] = ["One", "Two"]
    client = MockLLMClient(bad_response)

    with pytest.raises(ValueError, match="must_have_themes must contain exactly 3 items"):
        run("Backend role", client, ctx)


def test_importance_values_are_valid_enum(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_response())

    result = run("Python AWS React", client, ctx)

    all_skills = result["required_skills"] + result["preferred_skills"]
    assert all(skill["importance"] in {"high", "medium", "low"} for skill in all_skills)
    assert all(isinstance(skill["canonical"], str) and skill["canonical"] for skill in all_skills)


def test_no_skills_invented_not_in_jd(tmp_path: Path) -> None:
    jd = "Python React AWS Docker Kubernetes"
    ctx = make_context(tmp_path)
    response = {
        "role_level": "mid",
        "must_have_themes": ["Python services", "Frontend integration", "Cloud delivery"],
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "high"},
            {"skill": "Docker", "importance": "medium"},
        ],
        "preferred_skills": [
            {"skill": "React", "importance": "medium"},
            {"skill": "Kubernetes", "importance": "low"},
        ],
        "implicit_signals": {
            "team_size": "small",
            "work_style": "fullstack",
            "tech_focus": "cloud applications",
        },
        "ats_keywords": ["Python", "React", "AWS", "Docker", "Kubernetes"],
    }
    client = MockLLMClient(response)

    result = run(jd, client, ctx)
    jd_lower = jd.lower()
    all_skills = result["required_skills"] + result["preferred_skills"]

    assert all(skill["skill"].lower() in jd_lower for skill in all_skills)


def test_ats_keywords_non_empty_for_technical_jd(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_response())

    result = run("Need Python, React, and AWS experience", client, ctx)

    assert result["ats_keywords"]
    assert any(keyword["canonical"] == "python" for keyword in result["ats_keywords"])
    assert any(keyword["canonical"] == "aws" for keyword in result["ats_keywords"])


def test_runs_with_empty_jd_returns_unknown_role_level(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_response())

    result = run("", client, ctx)

    assert result["role_level"] == "unknown"
    assert client.calls == []
    saved = json.loads(Path(ctx.metadata["context_path"]).read_text(encoding="utf-8"))
    assert saved["jd_analysis"]["role_level"] == "unknown"
