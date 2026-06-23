from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.agent_04_content_writer import run
from pipeline_context import PipelineContext


PAST_TENSE_VERBS = [
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
]

FORBIDDEN_PATTERN = re.compile(
    r"(responsible for|helped with|worked on|assisted|familiar with|exposure to)",
    re.IGNORECASE,
)
FIRST_PERSON_PATTERN = re.compile(r"\b(I|me|my|we|our)\b", re.IGNORECASE)


class MockLLMClient:
    def __init__(self, response: dict):
        self.response = response
        self.calls: list[dict] = []

    def call_llm(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def make_context(tmp_path: Path) -> PipelineContext:
    run_id = "step-06-run"
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


def base_scored_evidence() -> dict:
    return {
        "scored_evidence": [
            {
                "id": "exp_01",
                "type": "experience",
                "source": "linkedin",
                "title": "Backend Engineer at Acme",
                "include": True,
                "reason": "high JD relevance",
                "description": "Scaled backend services with Python and AWS over 12 months.",
            },
            {
                "id": "proj_01",
                "type": "project",
                "source": "github",
                "title": "Realtime Event Platform",
                "include": True,
                "reason": "solid impact",
                "description": "Built platform services for distributed systems without explicit metrics",
            },
        ]
    }


def base_jd_analysis() -> dict:
    return {
        "role_level": "mid",
        "must_have_themes": ["backend systems", "cloud delivery", "distributed systems"],
        "required_skills": [
            {"skill": "Python", "importance": "high"},
            {"skill": "AWS", "importance": "high"},
            {"skill": "distributed systems", "importance": "medium"},
        ],
        "ats_keywords": ["Python", "AWS", "distributed systems", "FastAPI", "Docker"],
    }


def base_gap_analysis() -> dict:
    return {
        "hard_gaps": [],
        "soft_gaps": [
            {
                "skill": "distributed systems",
                "reframe_hint": "Emphasize throughput, event-driven architecture, and distributed systems trade-offs.",
                "evidence_id": "proj_01",
            }
        ],
        "covered_skills": ["Python", "AWS"],
        "coverage_summary": "Core backend and cloud requirements are covered.",
        "match_score": 84.0,
    }


def valid_content_response() -> dict:
    return {
        "summary": (
            "Built 3 years of backend and cloud experience across Python systems. "
            "Delivered 2 production platforms and reduced latency by 35%. "
            "Bring pragmatic distributed systems execution to this target role."
        ),
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
                "include": True,
                "bullets": [
                    {
                        "text": "Improved contest rankings by practicing algorithms daily, resulting in 120 positions gained across 8 rounds.",
                        "keywords_used": ["algorithms"],
                        "inferred": True,
                    }
                ],
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


def all_bullets(content: dict) -> list[dict]:
    bullets = []
    for entry in content["sections"]["experience"]:
        bullets.extend(entry["bullets"])
    for entry in content["sections"]["projects"]:
        bullets.extend(entry["bullets"])
    bullets.extend(content["sections"]["competitive_programming"]["bullets"])
    return bullets


def test_all_bullets_start_with_past_tense_verb(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)

    for bullet in all_bullets(result):
        assert bullet["text"].split()[0].lower() in PAST_TENSE_VERBS


def test_no_bullet_exceeds_20_words(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)

    for bullet in all_bullets(result):
        assert len(bullet["text"].split()) <= 20


def test_forbidden_phrases_absent_from_all_bullets(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)

    for bullet in all_bullets(result):
        assert FORBIDDEN_PATTERN.search(bullet["text"]) is None


def test_inferred_flag_set_when_metric_not_in_source(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)
    project_entry = result["sections"]["projects"][0]

    assert project_entry["bullets"][0]["inferred"] is True


def test_ats_keywords_present_in_at_least_one_bullet(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)
    combined_text = " ".join(bullet["text"] for bullet in all_bullets(result)).lower()
    jd_keywords = [keyword.lower() for keyword in base_jd_analysis()["ats_keywords"]]

    matched = [keyword for keyword in jd_keywords if keyword in combined_text]
    assert len(matched) >= 3


def test_summary_is_exactly_3_sentences(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)
    parts = [part.strip() for part in result["summary"].split(". ") if part.strip()]

    assert len(parts) == 3


def test_no_first_person_pronouns_in_any_bullet(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)

    for bullet in all_bullets(result):
        assert FIRST_PERSON_PATTERN.search(bullet["text"]) is None


def test_reframe_hint_applied_to_soft_gap_bullets(tmp_path: Path) -> None:
    ctx = make_context(tmp_path)
    client = MockLLMClient(valid_content_response())

    result = run(base_scored_evidence(), base_jd_analysis(), base_gap_analysis(), client, ctx)
    project_entry = next(entry for entry in result["sections"]["projects"] if entry["evidence_id"] == "proj_01")
    project_text = " ".join(bullet["text"].lower() for bullet in project_entry["bullets"])

    assert "distributed systems" in project_text
