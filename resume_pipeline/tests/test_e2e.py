from __future__ import annotations

import json
import sys
from pathlib import Path

import jsonschema
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pipeline
from pipeline_context import PipelineContext


AGENT_RESPONSE_MAP = {
    "agent_01.json": "agent_01_jd_analyser",
    "agent_02.json": "agent_02_profile_scorer",
    "agent_03.json": "agent_03_gap_analyser",
    "agent_04.json": "agent_04_content_writer",
    "agent_05.json": "agent_05_ats_optimiser",
    "agent_06.json": "agent_06_section_ranker",
    "agent_07.json": "agent_07_assembler",
    "agent_08.json": "agent_08_qa_reviewer",
}
FORBIDDEN = [
    "responsible for",
    "helped with",
    "worked on",
    "assisted",
    "familiar with",
    "exposure to",
]


def _base_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def load_all_mock_responses() -> dict[str, dict]:
    response_dir = _base_dir() / "fixtures" / "mock_llm_responses"
    loaded: dict[str, dict] = {}
    for filename, agent_name in AGENT_RESPONSE_MAP.items():
        loaded[agent_name] = json.loads((response_dir / filename).read_text(encoding="utf-8"))
    return loaded


def _load_fixture(name: str) -> dict:
    return json.loads((_base_dir() / "fixtures" / name).read_text(encoding="utf-8"))


def _all_bullets(assembled_resume: dict) -> list[str]:
    bullets: list[str] = []
    for entry in assembled_resume.get("experience", []):
        bullets.extend(str(bullet).strip() for bullet in entry.get("bullets", []) if str(bullet).strip())
    for entry in assembled_resume.get("projects", []):
        bullets.extend(str(bullet).strip() for bullet in entry.get("bullets", []) if str(bullet).strip())
    bullets.extend(str(item).strip() for item in assembled_resume.get("achievements", []) if str(item).strip())
    return bullets


@pytest.fixture
def mock_llm(monkeypatch):
    responses = load_all_mock_responses()
    call_count: dict[str, int] = {}

    def fake_call_llm(system_prompt, user_content, temperature, agent_name, run_id):
        del system_prompt, user_content, temperature, run_id
        call_count[agent_name] = call_count.get(agent_name, 0) + 1
        return responses[agent_name]

    import llm_client

    monkeypatch.setattr(llm_client, "call_llm", fake_call_llm)
    return call_count


def _run_clean_pipeline(tmp_path: Path) -> PipelineContext:
    candidate = _load_fixture("sample_candidate.json")
    jd = _load_fixture("sample_jd.json")
    return pipeline.run_pipeline(candidate, jd, run_id="e2e-run")


def test_full_pipeline_clean_run(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)

    assert isinstance(ctx, PipelineContext)
    assert ctx.qa_report["pass"] is True


def test_output_schema_valid(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)
    schema = json.loads((_base_dir() / "latex_renderer" / "schema.json").read_text(encoding="utf-8"))

    jsonschema.validate(ctx.assembled_resume, schema)


def test_ats_score_above_threshold(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)

    assert ctx.qa_report["ats_score"] >= 60


def test_no_forbidden_phrases_in_output(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)
    bullets = _all_bullets(ctx.assembled_resume)

    assert bullets
    for bullet in bullets:
        lowered = bullet.lower()
        assert not any(phrase in lowered for phrase in FORBIDDEN)


def test_match_score_is_valid_range(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)

    assert 0 <= ctx.gap_analysis["match_score"] <= 100


def test_section_order_matches_ranker_output(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)
    assembled_sections = [item["section"] for item in ctx.assembled_resume["sectionOrder"]]
    ranked_sections = [
        item["section"]
        for item in ctx.section_order["section_order"]
        if item["section"] in assembled_sections
    ]

    assert assembled_sections == ranked_sections


def test_context_persisted_to_disk(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)
    context_path = tmp_path / "runs" / str(ctx.metadata["run_id"]) / "context.json"

    assert context_path.exists()
    assert isinstance(json.loads(context_path.read_text(encoding="utf-8")), dict)


def test_all_agent_timings_present(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)
    expected_agents = [
        "agent_01",
        "agent_02",
        "agent_03",
        "agent_04",
        "agent_05",
        "agent_06",
        "agent_07",
        "agent_08",
    ]

    for agent_name in expected_agents:
        assert agent_name in ctx.metadata["agent_timings"]


def test_retry_count_zero_on_clean_run(mock_llm, tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))

    ctx = _run_clean_pipeline(tmp_path)

    assert ctx.metadata["retry_count"] == 0
