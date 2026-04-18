from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


EXPECTED_FILES = [
    "agent_01.json",
    "agent_02.json",
    "agent_03.json",
    "agent_04.json",
    "agent_05.json",
    "agent_06.json",
    "agent_07.json",
    "agent_08.json",
]


def test_mock_llm_response_fixtures_exist_and_are_valid_json() -> None:
    base_dir = Path(__file__).resolve().parents[1] / "fixtures" / "mock_llm_responses"

    for filename in EXPECTED_FILES:
        path = base_dir / filename
        assert path.exists()
        assert isinstance(json.loads(path.read_text(encoding="utf-8")), dict)


def test_realistic_sample_fixtures_exist() -> None:
    fixture_dir = Path(__file__).resolve().parents[1] / "fixtures"
    candidate = json.loads((fixture_dir / "sample_candidate.json").read_text(encoding="utf-8"))
    jd = json.loads((fixture_dir / "sample_jd.json").read_text(encoding="utf-8"))

    assert len(candidate["github"]["projects"]) == 3
    assert candidate["leetcode"]["rating"] == 1650
    assert candidate["codeforces"]["rating"] == 1523
    assert len(candidate["linkedin"]["experience"]) == 3
    assert len(candidate["old_resume"]["projects"]) == 2
    assert jd["role"] == "Senior Backend Engineer"
    assert len(jd["required_skills"]) == 8
    assert len(jd["preferred_skills"]) == 3
