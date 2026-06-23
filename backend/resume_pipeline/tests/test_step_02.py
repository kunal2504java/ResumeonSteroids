from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import llm_client
from exceptions import LLMFailure


class MockUsage:
    def __init__(self, input_tokens: int = 10, output_tokens: int = 5):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


class MockBlock:
    def __init__(self, text: str):
        self.type = "text"
        self.text = text


class MockResponse:
    def __init__(self, text: str, usage: MockUsage | None = None):
        self.content = [MockBlock(text)]
        self.usage = usage or MockUsage()


class MockMessagesAPI:
    def __init__(self, responses: list[MockResponse]):
        self.responses = responses
        self.calls: list[dict] = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return self.responses.pop(0)


class MockClient:
    def __init__(self, responses: list[MockResponse]):
        self.messages = MockMessagesAPI(responses)


@pytest.fixture(autouse=True)
def reset_client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    monkeypatch.setenv("RESUME_PIPELINE_BASE_DIR", str(tmp_path))
    llm_client._client = None
    yield
    llm_client._client = None


def read_log_lines(base_dir: Path, run_id: str) -> list[dict]:
    log_path = base_dir / "logs" / run_id / "llm_calls.jsonl"
    return [
        json.loads(line)
        for line in log_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def test_valid_json_response_parsed_correctly(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MockClient([MockResponse('{"role": "senior"}')])
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    result = llm_client.call_llm("system", "user", agent_name="agent_a", run_id="run-1")

    assert result == {"role": "senior"}


def test_malformed_json_triggers_retry_with_corrective_prompt(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = MockClient(
        [
            MockResponse("here is your json: {bad}"),
            MockResponse('{"role": "senior"}'),
        ]
    )
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    result = llm_client.call_llm("system", "original user prompt", agent_name="agent_b", run_id="run-2")

    assert result == {"role": "senior"}
    assert len(client.messages.calls) == 2
    assert "Your previous response was not valid JSON." in client.messages.calls[1]["messages"][0]["content"]
    assert "Expecting value" in client.messages.calls[1]["messages"][0]["content"]


def test_two_failures_raise_LLMFailure(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MockClient([MockResponse("bad"), MockResponse("still bad")])
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    with pytest.raises(LLMFailure) as exc:
        llm_client.call_llm("system", "user", agent_name="agent_c", run_id="run-3")

    assert exc.value.agent_name == "agent_c"
    assert exc.value.attempt == 2


def test_call_logged_to_jsonl_after_success(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    client = MockClient([MockResponse('{"role": "senior"}', MockUsage(312, 148))])
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    llm_client.call_llm("system", "user", agent_name="agent_d", run_id="run-4")

    lines = read_log_lines(tmp_path, "run-4")
    assert len(lines) == 1
    assert lines[0]["agent"] == "agent_d"
    assert lines[0]["prompt_tokens"] == 312
    assert lines[0]["completion_tokens"] == 148
    assert lines[0]["success"] is True


def test_call_logged_on_failure_too(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    client = MockClient([MockResponse("bad"), MockResponse("still bad")])
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    with pytest.raises(LLMFailure):
        llm_client.call_llm("system", "user", agent_name="agent_e", run_id="run-5")

    lines = read_log_lines(tmp_path, "run-5")
    assert len(lines) == 2
    assert all(line["success"] is False for line in lines)


def test_temperature_passed_to_api(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MockClient([MockResponse('{"role": "senior"}')])
    monkeypatch.setattr(llm_client, "_get_client", lambda: client)

    llm_client.call_llm(
        "system",
        "user",
        temperature=0.7,
        agent_name="agent_f",
        run_id="run-6",
    )

    assert client.messages.calls[0]["temperature"] == 0.7
