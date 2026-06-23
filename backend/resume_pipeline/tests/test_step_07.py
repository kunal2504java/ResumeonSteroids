from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_05_ats_optimiser import run
from pipeline_context import PipelineContext


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-07-run"
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


def base_content() -> dict:
    return {
        "summary": "Built backend systems. Improved cloud services. Brought product execution.",
        "sections": {
            "experience": [
                {
                    "evidence_id": "exp_01",
                    "title": "Backend Engineer",
                    "org": "Acme",
                    "duration": "Jan 2024 – Mar 2025",
                    "bullets": [
                        {
                            "text": "Built Python APIs by redesigning services, resulting in 35% lower latency on AWS.",
                            "keywords_used": ["Python", "AWS"],
                            "inferred": False,
                        }
                    ],
                }
            ],
            "projects": [
                {
                    "evidence_id": "proj_01",
                    "title": "Realtime Event Platform",
                    "org": "Personal Project",
                    "duration": "Apr 2024 – Jun 2024",
                    "bullets": [
                        {
                            "text": "Designed distributed systems pipelines by introducing event queues, resulting in 40% faster processing with Docker.",
                            "keywords_used": ["distributed systems", "Docker"],
                            "inferred": False,
                        }
                    ],
                }
            ],
            "competitive_programming": {
                "include": False,
                "bullets": [],
            },
            "skills": {
                "grouped": {
                    "Languages": ["Python", "Go"],
                    "Frameworks": ["FastAPI", "React"],
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


def test_no_llm_call_when_hit_rate_above_70(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    jd_analysis = {
        "ats_keywords": ["Python", "AWS", "distributed systems", "Docker"]
    }
    client = MockLLMClient({"revised_sections": {}})

    result = run(content, jd_analysis, client, ctx)

    assert result["llm_triggered"] is False
    assert client.calls == []


def test_llm_triggered_when_hit_rate_below_70(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    jd_analysis = {
        "ats_keywords": [
            "Python",
            "AWS",
            "distributed systems",
            "Docker",
            "Terraform",
            "Kubernetes",
            "FastAPI",
            "React",
            "PostgreSQL",
            "CI/CD",
        ]
    }
    client = MockLLMClient({"revised_sections": content["sections"]})

    result = run(content, jd_analysis, client, ctx)

    assert result["llm_triggered"] is True
    assert len(client.calls) == 1


def test_keyword_hit_rate_computed_correctly(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    jd_analysis = {
        "ats_keywords": [
            "Python",
            "AWS",
            "distributed systems",
            "Docker",
            "FastAPI",
            "React",
            "event queues",
            "Terraform",
            "Kubernetes",
            "GraphQL",
        ]
    }
    client = MockLLMClient({"revised_sections": content["sections"]})

    result = run(content, jd_analysis, client, ctx)

    assert result["keyword_hit_rate"] == 70.0


def test_non_standard_heading_flagged(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["Work History"] = content["sections"].pop("experience")
    jd_analysis = {"ats_keywords": ["Python"]}
    client = MockLLMClient({"revised_sections": content["sections"]})

    result = run(content, jd_analysis, client, ctx)

    assert "Non-standard heading: 'Work History'" in result["formatting_flags"]


def test_date_format_flag_on_inconsistent_dates(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["projects"][0]["duration"] = "2022-2024"
    jd_analysis = {"ats_keywords": ["Python"]}
    client = MockLLMClient({"revised_sections": content["sections"]})

    result = run(content, jd_analysis, client, ctx)

    assert "Inconsistent date format in projects: '2022-2024'" in result["formatting_flags"]


def test_xyz_structure_preserved_after_rewrite(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    jd_analysis = {
        "ats_keywords": [
            "Python",
            "AWS",
            "Terraform",
            "Kubernetes",
            "PostgreSQL",
        ]
    }
    revised_sections = base_content()["sections"]
    revised_sections["projects"][0]["bullets"][0]["text"] = (
        "Engineered Kubernetes pipelines by automating Terraform workflows, resulting in 40% faster processing with PostgreSQL."
    )
    client = MockLLMClient({"revised_sections": revised_sections})

    result = run(content, jd_analysis, client, ctx)
    project_bullet = result["revised_sections"]["projects"][0]["bullets"][0]["text"]

    assert project_bullet.split()[0].lower() in {
        "accelerated",
        "architected",
        "automated",
        "built",
        "created",
        "delivered",
        "designed",
        "developed",
        "drove",
        "engineered",
        "enhanced",
        "expanded",
        "generated",
        "implemented",
        "improved",
        "increased",
        "launched",
        "led",
        "lowered",
        "migrated",
        "optimized",
        "orchestrated",
        "reduced",
        "refactored",
        "resolved",
        "scaled",
        "shipped",
        "simplified",
        "streamlined",
        "strengthened",
    }


def test_ats_score_equals_location_weighted_score(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    jd_analysis = {
        "ats_keywords": ["Python", "AWS", "Kubernetes", "Terraform"]
    }
    revised_sections = base_content()["sections"]
    revised_sections["projects"][0]["bullets"][0]["text"] = (
        "Engineered Kubernetes services by automating Terraform rollouts, resulting in 40% faster processing on AWS."
    )
    client = MockLLMClient({"revised_sections": revised_sections})

    result = run(content, jd_analysis, client, ctx)

    assert result["ats_score"] == result["location_weighted_score"]
