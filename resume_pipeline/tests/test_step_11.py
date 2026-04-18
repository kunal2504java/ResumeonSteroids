from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import jsonschema

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pipeline
from context_manager import load_context, save_context
from exceptions import LLMFailure


class MockLLMClient:
    def call_llm(self, **kwargs):
        return {}


def make_candidate() -> dict:
    return {
        "personal_info": {
            "name": "Kunal Singh",
            "email": "kunal@example.com",
            "phone": "+91-9999999999",
            "location": "Noida, India",
            "linkedin": "https://linkedin.com/in/kunal",
            "github": "https://github.com/kunal",
            "website": "https://kunal.dev",
        },
        "linkedin": {
            "experience": [
                {"title": "Backend Engineer", "duration": "Jan 2024 - Dec 2024"}
            ]
        },
    }


def make_jd() -> dict:
    return {
        "raw_text": "Backend Engineer\nPython\nDistributed systems\nAWS",
        "title": "Backend Engineer",
        "requirements": ["Python", "Distributed systems", "AWS"],
    }


def valid_assembled_resume() -> dict:
    return {
        "personalInfo": {
            "name": "Kunal Singh",
            "email": "kunal@example.com",
            "phone": "+91-9999999999",
            "location": "Noida, India",
            "linkedin": "https://linkedin.com/in/kunal",
            "github": "https://github.com/kunal",
            "website": "https://kunal.dev",
        },
        "summary": "Backend engineer with strong systems depth. Delivered scalable platforms with measurable latency gains. Brings production judgement to platform roles.",
        "education": [
            {
                "institution": "GL Bajaj Institute of Technology and Management",
                "degree": "B.Tech Computer Science",
                "field": "",
                "location": "",
                "startDate": "2026",
                "endDate": "2026",
                "gpa": "",
                "coursework": [],
            }
        ],
        "experience": [
            {
                "company": "Acme",
                "title": "Backend Engineer",
                "location": "",
                "startDate": "Jan 2024",
                "endDate": "Dec 2024",
                "bullets": [
                    "Built Python APIs by redesigning handlers, resulting in 35% lower latency."
                ],
            }
        ],
        "projects": [
            {
                "name": "Infra Dashboard",
                "techStack": ["Terraform"],
                "startDate": "Jan 2025",
                "endDate": "Mar 2025",
                "bullets": [
                    "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks."
                ],
            }
        ],
        "skills": {
            "languages": ["Python"],
            "frameworks": ["FastAPI"],
            "tools": ["Docker"],
            "databases": ["PostgreSQL"],
        },
        "achievements": [],
        "sectionOrder": [
            {"section": "Summary", "position": 1},
            {"section": "Experience", "position": 2},
            {"section": "Projects", "position": 3},
            {"section": "Skills", "position": 4},
            {"section": "Education", "position": 5},
        ],
        "maxPages": 1,
    }


class FakeAgent:
    def __init__(self, name: str, sequence: list[str], payload_factory, delay: float = 0.0, fail: Exception | None = None):
        self.name = name
        self.sequence = sequence
        self.payload_factory = payload_factory
        self.delay = delay
        self.fail = fail
        self.calls = 0

    def run(self, *args, **kwargs):
        self.calls += 1
        self.sequence.append(self.name)
        if self.delay:
            time.sleep(self.delay)
        if self.fail is not None:
            raise self.fail
        ctx = args[-1]
        result = self.payload_factory(ctx)
        return result


def agent_modules(sequence: list[str], *, delay_parallel: bool = False, fail_agent_03: bool = False) -> dict:
    def jd_analysis(_ctx):
        return {
            "role_level": "mid",
            "must_have_themes": ["backend systems", "cloud", "automation"],
            "required_skills": [{"skill": "Python", "importance": "high"}],
            "preferred_skills": [],
            "implicit_signals": {
                "team_size": "medium",
                "work_style": "infra",
                "tech_focus": "backend",
            },
            "ats_keywords": ["Python", "AWS"],
        }

    def scored(_ctx):
        return {
            "scored_evidence": [
                {
                    "id": "exp_01",
                    "type": "experience",
                    "source": "linkedin",
                    "title": "Backend Engineer",
                    "relevance": 9.0,
                    "impact": 8.0,
                    "recency": 9.0,
                    "composite": 8.7,
                    "include": True,
                    "reason": "high JD relevance, strong impact, recent signal",
                }
            ]
        }

    def gap(_ctx):
        return {
            "hard_gaps": [],
            "soft_gaps": [],
            "covered_skills": ["Python"],
            "coverage_summary": "Coverage is strong.",
            "match_score": 88.0,
        }

    def section_order(_ctx):
        return {
            "section_order": [
                {"section": "Summary", "position": 1},
                {"section": "Experience", "position": 2},
                {"section": "Projects", "position": 3},
                {"section": "Skills", "position": 4},
                {"section": "Education", "position": 5},
            ],
            "max_pages": 1,
            "competitive_programming_as_section": False,
            "llm_used": False,
            "rationale": "Rule-based ordering.",
        }

    def content(_ctx):
        return {
            "summary": "Backend engineer with strong systems depth. Delivered scalable platforms with measurable latency gains. Brings production judgement to platform roles.",
            "sections": {
                "experience": [
                    {
                        "evidence_id": "exp_01",
                        "title": "Backend Engineer",
                        "org": "Acme",
                        "duration": "Jan 2024 - Dec 2024",
                        "bullets": [
                            {
                                "text": "Built Python APIs by redesigning handlers, resulting in 35% lower latency.",
                                "keywords_used": ["Python"],
                                "inferred": False,
                            }
                        ],
                    }
                ],
                "projects": [
                    {
                        "evidence_id": "proj_01",
                        "title": "Infra Dashboard",
                        "org": "Personal",
                        "duration": "Jan 2025 - Mar 2025",
                        "bullets": [
                            {
                                "text": "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks.",
                                "keywords_used": ["Terraform"],
                                "inferred": False,
                            }
                        ],
                    }
                ],
                "competitive_programming": {"include": False, "bullets": []},
                "skills": {
                    "grouped": {
                        "Languages": ["Python"],
                        "Frameworks": ["FastAPI"],
                        "Databases": ["PostgreSQL"],
                        "Tools": ["Docker"],
                    }
                },
                "education": [
                    {
                        "degree": "B.Tech Computer Science",
                        "institution": "GL Bajaj Institute of Technology and Management",
                        "year": "2026",
                    }
                ],
            },
        }

    def ats(_ctx):
        return {
            "keyword_hit_rate": 80.0,
            "keywords_present": ["Python", "AWS"],
            "keywords_missing": [],
            "llm_triggered": False,
            "revised_sections": content(_ctx)["sections"],
            "formatting_flags": [],
            "ats_score": 80.0,
        }

    def assembled(_ctx):
        return valid_assembled_resume()

    def qa(_ctx):
        return {
            "pass": True,
            "ats_score": 80.0,
            "fact_check_flags": [],
            "tone_flags": [],
            "forbidden_phrase_flags": [],
            "inferred_rate": 0.0,
            "fix_instructions": [],
        }

    parallel_delay = 0.1 if delay_parallel else 0.0
    return {
        "agent_01": FakeAgent("agent_01", sequence, jd_analysis),
        "agent_02": FakeAgent("agent_02", sequence, scored),
        "agent_03": FakeAgent(
            "agent_03",
            sequence,
            gap,
            delay=parallel_delay,
            fail=LLMFailure("agent_03", 2) if fail_agent_03 else None,
        ),
        "agent_04": FakeAgent("agent_04", sequence, content),
        "agent_05": FakeAgent("agent_05", sequence, ats),
        "agent_06": FakeAgent("agent_06", sequence, section_order, delay=parallel_delay),
        "agent_07": FakeAgent("agent_07", sequence, assembled),
        "agent_08": FakeAgent("agent_08", sequence, qa),
    }


def test_agents_run_in_correct_order(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []
    ctx = pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="order-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence),
    )

    assert sequence[:2] == ["agent_01", "agent_02"]
    assert set(sequence[2:4]) == {"agent_03", "agent_06"}
    assert sequence[4:] == ["agent_04", "agent_05", "agent_07", "agent_08"]
    assert ctx.qa_report["pass"] is True


def test_03_and_06_run_in_parallel(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []
    started_at = time.perf_counter()

    pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="parallel-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence, delay_parallel=True),
    )

    elapsed = time.perf_counter() - started_at
    assert elapsed < 0.15


def test_context_saved_after_each_agent(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []
    save_events: list[int] = []
    real_save_context = pipeline.save_context

    def recording_save(ctx, path):
        real_save_context(ctx, path)
        save_events.append(Path(path).stat().st_mtime_ns)

    monkeypatch.setattr(pipeline, "save_context", recording_save)

    pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="save-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence),
    )

    assert len(save_events) >= 8
    assert len(set(save_events)) >= 8


def test_llm_failure_skips_agent_and_continues(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []

    ctx = pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="failure-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence, fail_agent_03=True),
    )

    assert "agent_04" in sequence
    assert "warnings" in ctx.qa_report
    assert any("agent_03 skipped due to LLMFailure" in item for item in ctx.qa_report["warnings"])


def test_full_pipeline_produces_valid_latex_input(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []
    ctx = pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="valid-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence),
    )

    schema_path = Path(__file__).resolve().parents[1] / "latex_renderer" / "schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    jsonschema.validate(ctx.assembled_resume, schema)


def test_pipeline_resumable_from_saved_context(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    first_sequence: list[str] = []
    second_sequence: list[str] = []
    run_id = "resume-run"

    pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id=run_id,
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(first_sequence),
    )

    context_path = tmp_path / "runs" / run_id / "context.json"
    ctx = load_context(str(context_path))
    ctx.ats_optimised = {}
    ctx.assembled_resume = {}
    ctx.qa_report = {}
    save_context(ctx, str(context_path))

    pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id=run_id,
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(second_sequence),
    )

    assert "agent_01" not in second_sequence
    assert "agent_02" not in second_sequence
    assert "agent_03" not in second_sequence
    assert "agent_04" not in second_sequence
    assert second_sequence == ["agent_05", "agent_07", "agent_08"]


def test_agent_timings_populated_in_metadata(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    sequence: list[str] = []
    ctx = pipeline.run_pipeline(
        make_candidate(),
        make_jd(),
        run_id="timings-run",
        llm_client_module=MockLLMClient(),
        agent_modules=agent_modules(sequence),
    )

    for agent_name in (
        "agent_01",
        "agent_02",
        "agent_03",
        "agent_04",
        "agent_05",
        "agent_06",
        "agent_07",
        "agent_08",
    ):
        assert agent_name in ctx.metadata["agent_timings"]
