from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents import agent_07_assembler
from exceptions import AssemblyError
from pipeline_context import PipelineContext


class MockLLMClient:
    def call_llm(self, **kwargs):
        raise AssertionError("Assembler must not call the LLM")


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-09-run"
    context_path = tmp_path / "runs" / run_id / "context.json"
    context_path.parent.mkdir(parents=True, exist_ok=True)
    return PipelineContext(
        candidate={
            "personal_info": {
                "name": "Kunal Singh",
                "email": "kunal@example.com",
                "phone": "+91-9876543210",
                "location": "Noida, India",
                "linkedin": "https://linkedin.com/in/kunal",
                "github": "https://github.com/kunal",
                "website": "https://kunal.dev",
            },
            "codeforces": {"rating": 1847, "rank": "Expert"},
            "leetcode": {"solved": {"easy": 120, "medium": 150, "hard": 42}},
        },
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


def bullet(text: str, keywords: list[str] | None = None) -> dict:
    return {
        "text": text,
        "keywords_used": keywords or [],
        "inferred": False,
    }


def base_content() -> dict:
    return {
        "summary": "Backend engineer with strong systems depth. Delivered scalable platforms with measurable latency gains. Brings production judgement to platform roles.",
        "sections": {
            "experience": [
                {
                    "evidence_id": "exp_high",
                    "title": "Platform Engineer",
                    "org": "Acme",
                    "duration": "Jan 2023 - Dec 2023",
                    "bullets": [
                        bullet("Built resilient APIs by redesigning cache flows, resulting in 35% lower latency."),
                        bullet("Scaled deployment workflows by automating releases, resulting in 4 faster weekly launches."),
                    ],
                }
            ],
            "projects": [
                {
                    "evidence_id": "proj_low",
                    "title": "Infra Dashboard",
                    "org": "Personal",
                    "duration": "Jan 2024 - Mar 2024",
                    "bullets": [
                        bullet("Built resilient APIs by redesigning cache flows, resulting in 35% lower latency.", ["Python"]),
                        bullet("Created Terraform modules by standardizing environments, resulting in 2 reusable stacks.", ["Terraform"]),
                    ],
                }
            ],
            "competitive_programming": {
                "include": True,
                "bullets": [
                    bullet("Achieved top contest placements by solving algorithmic sets, resulting in 1847 Codeforces rating.")
                ],
            },
            "skills": {
                "grouped": {
                    "Languages": ["Python", "Go"],
                    "Frameworks": ["FastAPI", "React"],
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


def base_ats() -> dict:
    return {"revised_sections": base_content()["sections"]}


def base_scored_evidence() -> dict:
    return {
        "scored_evidence": [
            {"id": "exp_high", "composite": 9.0, "include": True},
            {"id": "proj_low", "composite": 1.0, "include": True},
        ]
    }


def base_section_order(*, max_pages: int = 2, cp_section: bool = True) -> dict:
    return {
        "section_order": [
            {"section": "Summary", "position": 1},
            {"section": "Experience", "position": 2},
            {"section": "Projects", "position": 3},
            {"section": "Skills", "position": 4},
            {"section": "Education", "position": 5},
            {"section": "Competitive Programming", "position": 6},
        ],
        "max_pages": max_pages,
        "competitive_programming_as_section": cp_section,
        "llm_used": False,
        "rationale": "Rule-based ordering.",
    }


def test_sections_ordered_by_section_ranker_output(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)

    result = agent_07_assembler.run(
        base_ats(),
        base_section_order(),
        base_scored_evidence(),
        base_content(),
        MockLLMClient(),
        ctx,
    )

    assert [item["section"] for item in result["sectionOrder"]] == [
        "Summary",
        "Experience",
        "Projects",
        "Skills",
        "Education",
        "Competitive Programming",
    ]


def test_page_trim_removes_lowest_composite_first(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["experience"][0]["bullets"] = [
        bullet(f"Built service shard {index} by refactoring workloads, resulting in {index + 1}% lower latency.")
        for index in range(12)
    ]
    content["sections"]["projects"][0]["bullets"] = [
        bullet(f"Created Terraform module {index} by templatizing infra, resulting in {index + 1} reusable stacks.", ["Terraform"])
        for index in range(6)
    ]
    content["sections"]["competitive_programming"] = {"include": False, "bullets": []}
    content["sections"]["skills"] = {"grouped": {}}

    result = agent_07_assembler.run(
        {"revised_sections": content["sections"]},
        base_section_order(max_pages=1),
        base_scored_evidence(),
        content,
        MockLLMClient(),
        ctx,
    )

    assert len(result["experience"][0]["bullets"]) == 12
    assert len(result["projects"][0]["bullets"]) == 5


def test_summary_never_trimmed(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["experience"][0]["bullets"] = [
        bullet(f"Built service shard {index} by refactoring workloads, resulting in {index + 1}% lower latency.")
        for index in range(12)
    ]
    content["sections"]["projects"][0]["bullets"] = [
        bullet(f"Created Terraform module {index} by templatizing infra, resulting in {index + 1} reusable stacks.", ["Terraform"])
        for index in range(6)
    ]

    result = agent_07_assembler.run(
        {"revised_sections": content["sections"]},
        base_section_order(max_pages=1),
        base_scored_evidence(),
        content,
        MockLLMClient(),
        ctx,
    )

    assert result["summary"] == content["summary"]


def test_education_never_trimmed(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["experience"][0]["bullets"] = [
        bullet(f"Built service shard {index} by refactoring workloads, resulting in {index + 1}% lower latency.")
        for index in range(12)
    ]
    content["sections"]["projects"][0]["bullets"] = [
        bullet(f"Created Terraform module {index} by templatizing infra, resulting in {index + 1} reusable stacks.", ["Terraform"])
        for index in range(6)
    ]

    result = agent_07_assembler.run(
        {"revised_sections": content["sections"]},
        base_section_order(max_pages=1),
        base_scored_evidence(),
        content,
        MockLLMClient(),
        ctx,
    )

    assert result["education"] == [
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
    ]


def test_empty_section_dropped_not_kept(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    content = base_content()
    content["sections"]["projects"][0]["bullets"] = []

    result = agent_07_assembler.run(
        {"revised_sections": content["sections"]},
        base_section_order(),
        base_scored_evidence(),
        content,
        MockLLMClient(),
        ctx,
    )

    assert result["projects"] == []
    assert "Projects" not in [item["section"] for item in result["sectionOrder"]]


def test_duplicate_bullet_removed_from_lower_priority_section(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)

    result = agent_07_assembler.run(
        base_ats(),
        base_section_order(),
        base_scored_evidence(),
        base_content(),
        MockLLMClient(),
        ctx,
    )

    assert result["experience"][0]["bullets"] == [
        "Built resilient APIs by redesigning cache flows, resulting in 35% lower latency.",
        "Scaled deployment workflows by automating releases, resulting in 4 faster weekly launches.",
    ]
    assert result["projects"][0]["bullets"] == [
        "Created Terraform modules by standardizing environments, resulting in 2 reusable stacks."
    ]


def test_output_validates_against_latex_renderer_schema(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)

    result = agent_07_assembler.run(
        base_ats(),
        base_section_order(cp_section=False),
        base_scored_evidence(),
        base_content(),
        MockLLMClient(),
        ctx,
    )

    schema = json.loads(
        (Path(__file__).resolve().parents[1] / "latex_renderer" / "schema.json").read_text(encoding="utf-8")
    )

    import jsonschema

    jsonschema.validate(result, schema)
    assert any("Codeforces:" in item for item in result["skills"]["tools"])


def test_assembly_error_raised_on_schema_mismatch(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    ctx = make_context(tmp_path)

    monkeypatch.setattr(
        agent_07_assembler,
        "_load_schema",
        lambda: {
            "type": "object",
            "required": ["impossible_field"],
            "properties": {},
            "additionalProperties": False,
        },
    )

    with pytest.raises(AssemblyError):
        agent_07_assembler.run(
            base_ats(),
            base_section_order(),
            base_scored_evidence(),
            base_content(),
            MockLLMClient(),
            ctx,
        )
