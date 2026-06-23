from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pipeline
from agents.agent_08_qa_reviewer import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict | None = None):
        self.response = response or {"fact_check_flags": [], "tone_flags": []}
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


class FakeAgent04:
    def __init__(self):
        self.calls: list[dict] = []

    def run(self, scored_evidence, jd_analysis, gap_analysis, llm_client, ctx, evidence_ids=None):
        self.calls.append({"evidence_ids": evidence_ids})
        return ctx.content


class FakeAgent05:
    def __init__(self):
        self.calls = 0

    def run(self, content, jd_analysis, llm_client, ctx):
        self.calls += 1
        return ctx.ats_optimised


class FakeAgent07:
    def __init__(self):
        self.calls = 0

    def run(self, ats_optimised, section_order, scored_evidence, content, llm_client, ctx):
        self.calls += 1
        return ctx.assembled_resume


class FakeAgent08:
    def __init__(self, responses: list[dict]):
        self.responses = responses
        self.calls = 0

    def run(self, assembled_resume, candidate, jd_analysis, llm_client, ctx):
        response = self.responses[min(self.calls, len(self.responses) - 1)]
        self.calls += 1
        ctx.qa_report = response
        return response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-10-run"
    context_path = tmp_path / "runs" / run_id / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate={
            "github": {"projects": [{"name": "resume-pipeline", "description": "agentic resume builder"}]},
            "linkedin": {"experience": [{"title": "Backend Engineer"}], "education": []},
        },
        jd={},
        jd_analysis={
            "role_level": "mid",
            "required_skills": [{"skill": "Python", "importance": "high"}],
            "must_have_themes": ["backend systems", "automation", "cloud"],
        },
        scored_evidence={},
        gap_analysis={},
        content={
            "summary": "Backend engineer with shipped systems. Improved platform reliability through automation. Brings production judgement to infra roles.",
            "sections": {
                "experience": [
                    {
                        "evidence_id": "exp_01",
                        "title": "Backend Engineer",
                        "org": "Acme",
                        "duration": "Jan 2024 - Dec 2024",
                        "bullets": [
                            {"text": "Built Python APIs by redesigning handlers, resulting in 35% lower latency.", "keywords_used": ["Python"], "inferred": False},
                            {"text": "Automated release pipelines by templatizing builds, resulting in 4 faster weekly deploys.", "keywords_used": ["CI/CD"], "inferred": False},
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
                            {"text": "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks.", "keywords_used": ["Terraform"], "inferred": False},
                        ],
                    }
                ],
                "competitive_programming": {"include": False, "bullets": []},
                "skills": {"grouped": {"Languages": ["Python"], "Tools": ["Docker"]}},
                "education": [],
            },
        },
        ats_optimised={
            "ats_score": 78.5,
            "revised_sections": {
                "experience": [
                    {
                        "evidence_id": "exp_01",
                        "title": "Backend Engineer",
                        "org": "Acme",
                        "duration": "Jan 2024 - Dec 2024",
                        "bullets": [
                            {"text": "Built Python APIs by redesigning handlers, resulting in 35% lower latency.", "keywords_used": ["Python"], "inferred": False},
                            {"text": "Automated release pipelines by templatizing builds, resulting in 4 faster weekly deploys.", "keywords_used": ["CI/CD"], "inferred": False},
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
                            {"text": "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks.", "keywords_used": ["Terraform"], "inferred": False},
                        ],
                    }
                ],
                "competitive_programming": {"include": False, "bullets": []},
                "skills": {"grouped": {"Languages": ["Python"], "Tools": ["Docker"]}},
                "education": [],
            },
        },
        section_order={},
        assembled_resume={
            "personalInfo": {
                "name": "Kunal Singh",
                "email": "kunal@example.com",
                "phone": "+91-9999999999",
                "location": "Noida, India",
                "linkedin": "https://linkedin.com/in/kunal",
                "github": "https://github.com/kunal",
                "website": "https://kunal.dev",
            },
            "summary": "Backend engineer with shipped systems. Improved platform reliability through automation. Brings production judgement to infra roles.",
            "education": [],
            "experience": [
                {
                    "company": "Acme",
                    "title": "Backend Engineer",
                    "location": "",
                    "startDate": "Jan 2024",
                    "endDate": "Dec 2024",
                    "bullets": [
                        "Built Python APIs by redesigning handlers, resulting in 35% lower latency.",
                        "Automated release pipelines by templatizing builds, resulting in 4 faster weekly deploys.",
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
                        "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks.",
                    ],
                }
            ],
            "skills": {"languages": ["Python"], "frameworks": [], "tools": ["Docker"], "databases": []},
            "achievements": [],
            "sectionOrder": [
                {"section": "Summary", "position": 1},
                {"section": "Experience", "position": 2},
                {"section": "Projects", "position": 3},
                {"section": "Skills", "position": 4},
            ],
            "maxPages": 1,
        },
        qa_report={},
        metadata={
            "run_id": run_id,
            "timestamp": "2026-04-19T00:00:00Z",
            "retry_count": 0,
            "agent_timings": {},
            "context_path": str(context_path),
        },
    )


def test_forbidden_phrase_flagged_correctly(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    ctx.assembled_resume["experience"][0]["bullets"][0] = "Responsible for Python APIs and uptime improvements."
    ctx.ats_optimised["revised_sections"]["experience"][0]["bullets"][0]["text"] = ctx.assembled_resume["experience"][0]["bullets"][0]
    client = MockLLMClient()

    result = run(ctx.assembled_resume, ctx.candidate, ctx.jd_analysis, client, ctx)

    assert result["pass"] is False
    assert len(result["forbidden_phrase_flags"]) == 1


def test_non_past_tense_verb_flagged(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    ctx.assembled_resume["experience"][0]["bullets"][0] = "Build Python APIs by redesigning handlers, resulting in 35% lower latency."
    ctx.ats_optimised["revised_sections"]["experience"][0]["bullets"][0]["text"] = ctx.assembled_resume["experience"][0]["bullets"][0]
    client = MockLLMClient()

    result = run(ctx.assembled_resume, ctx.candidate, ctx.jd_analysis, client, ctx)

    assert result["pass"] is False
    assert len(result["tone_flags"]) == 1


def test_high_inferred_rate_flagged(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    inferred_bullets = []
    assembled_bullets = []
    for index in range(10):
        text = f"Built service shard {index} by refactoring handlers, resulting in {index + 1}% lower latency."
        inferred = index < 6
        inferred_bullets.append({"text": text, "keywords_used": [], "inferred": inferred})
        assembled_bullets.append(text)
    ctx.ats_optimised["revised_sections"]["experience"][0]["bullets"] = inferred_bullets
    ctx.assembled_resume["experience"][0]["bullets"] = assembled_bullets
    ctx.ats_optimised["revised_sections"]["projects"] = []
    ctx.assembled_resume["projects"] = []
    client = MockLLMClient()

    result = run(ctx.assembled_resume, ctx.candidate, ctx.jd_analysis, client, ctx)

    assert result["pass"] is False
    assert result["inferred_rate"] == 0.6


def test_llm_not_called_if_part_a_fails(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    ctx.assembled_resume["experience"][0]["bullets"][0] = "Responsible for Python APIs and uptime improvements."
    ctx.ats_optimised["revised_sections"]["experience"][0]["bullets"][0]["text"] = ctx.assembled_resume["experience"][0]["bullets"][0]
    client = MockLLMClient()

    run(ctx.assembled_resume, ctx.candidate, ctx.jd_analysis, client, ctx)

    assert client.calls == []


def test_retry_triggered_on_qa_fail(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    agent_04 = FakeAgent04()
    agent_05 = FakeAgent05()
    agent_07 = FakeAgent07()
    agent_08 = FakeAgent08(
        [
            {"pass": False, "fix_instructions": [{"evidence_id": "exp_01"}]},
            {"pass": True, "fix_instructions": []},
        ]
    )

    result = pipeline.run_qa_retry_loop(
        ctx,
        MockLLMClient(),
        agent_04_module=agent_04,
        agent_05_module=agent_05,
        agent_07_module=agent_07,
        agent_08_module=agent_08,
    )

    assert result["pass"] is True
    assert len(agent_04.calls) == 1


def test_retry_capped_at_1(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    agent_04 = FakeAgent04()
    agent_05 = FakeAgent05()
    agent_07 = FakeAgent07()
    agent_08 = FakeAgent08(
        [
            {"pass": False, "fix_instructions": [{"evidence_id": "exp_01"}]},
            {"pass": False, "fix_instructions": [{"evidence_id": "exp_01"}]},
        ]
    )

    result = pipeline.run_qa_retry_loop(
        ctx,
        MockLLMClient(),
        agent_04_module=agent_04,
        agent_05_module=agent_05,
        agent_07_module=agent_07,
        agent_08_module=agent_08,
    )

    assert result["pass"] is False
    assert ctx.metadata["retry_count"] == 1
    assert len(agent_04.calls) == 1


def test_retry_only_reruns_flagged_bullets_not_all(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    agent_04 = FakeAgent04()
    agent_05 = FakeAgent05()
    agent_07 = FakeAgent07()
    agent_08 = FakeAgent08(
        [
            {
                "pass": False,
                "fix_instructions": [
                    {"evidence_id": "exp_01"},
                    {"evidence_id": "proj_01"},
                ],
            },
            {"pass": True, "fix_instructions": []},
        ]
    )

    pipeline.run_qa_retry_loop(
        ctx,
        MockLLMClient(),
        agent_04_module=agent_04,
        agent_05_module=agent_05,
        agent_07_module=agent_07,
        agent_08_module=agent_08,
    )

    assert agent_04.calls[0]["evidence_ids"] == ["exp_01", "proj_01"]


def test_pass_true_when_all_checks_clean(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient({"fact_check_flags": [], "tone_flags": []})

    result = run(ctx.assembled_resume, ctx.candidate, ctx.jd_analysis, client, ctx)

    assert result["pass"] is True
    assert result["ats_score"] == result["ats_report"]["total_score"]
    assert ctx.ats_report == result["ats_report"]
