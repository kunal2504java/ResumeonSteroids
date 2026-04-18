from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from exceptions import LLMFailure

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover - covered indirectly via tests/mocking.
    Anthropic = None  # type: ignore[assignment]


DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
_client = None


def _get_client() -> Any:
    global _client

    if _client is None:
        if Anthropic is None:
            raise RuntimeError(
                "anthropic package is not installed. Install it before calling call_llm."
            )

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set.")

        _client = Anthropic(api_key=api_key)

    return _client


def _base_dir() -> Path:
    override = os.environ.get("RESUME_PIPELINE_BASE_DIR")
    if override:
        return Path(override).resolve()
    return Path(__file__).resolve().parent


def _logs_path(run_id: str) -> Path:
    run_segment = run_id or "default"
    log_dir = _base_dir() / "logs" / run_segment
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / "llm_calls.jsonl"


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def _extract_text(response: Any) -> str:
    chunks = []
    for block in getattr(response, "content", []):
        if getattr(block, "type", None) == "text":
            chunks.append(getattr(block, "text", ""))
    return "".join(chunks).strip()


def _usage_dict(response: Any) -> tuple[int, int]:
    usage = getattr(response, "usage", None)
    if usage is None:
        return 0, 0

    prompt_tokens = int(getattr(usage, "input_tokens", 0) or 0)
    completion_tokens = int(getattr(usage, "output_tokens", 0) or 0)
    return prompt_tokens, completion_tokens


def _append_log(
    *,
    agent_name: str,
    run_id: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    success: bool,
) -> None:
    entry = {
        "agent": agent_name,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "latency_ms": latency_ms,
        "success": success,
        "timestamp": _utc_timestamp(),
    }
    log_path = _logs_path(run_id)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry) + "\n")


def _create_message(
    *,
    system_prompt: str,
    user_content: str,
    temperature: float,
) -> Any:
    client = _get_client()
    return client.messages.create(
        model=DEFAULT_MODEL,
        system=system_prompt,
        temperature=temperature,
        max_tokens=4096,
        messages=[{"role": "user", "content": user_content}],
    )


def call_llm(
    system_prompt: str,
    user_content: str,
    temperature: float = 0.3,
    agent_name: str = "",
    run_id: str = "",
) -> dict:
    corrective_prompt_template = (
        "\n\nYour previous response was not valid JSON. Error: {err}.\n"
        "Please respond with ONLY valid JSON. No preamble, no explanation, no markdown fences."
    )

    current_user_content = user_content

    for attempt in (1, 2):
        started_at = time.perf_counter()
        response = _create_message(
            system_prompt=system_prompt,
            user_content=current_user_content,
            temperature=temperature,
        )
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        prompt_tokens, completion_tokens = _usage_dict(response)
        raw_text = _extract_text(response)

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError as err:
            _append_log(
                agent_name=agent_name,
                run_id=run_id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=latency_ms,
                success=False,
            )

            if attempt == 2:
                raise LLMFailure(agent_name=agent_name, attempt=attempt) from err

            current_user_content = (
                user_content + corrective_prompt_template.format(err=str(err))
            )
            continue

        if not isinstance(parsed, dict):
            _append_log(
                agent_name=agent_name,
                run_id=run_id,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=latency_ms,
                success=False,
            )
            if attempt == 2:
                raise LLMFailure(agent_name=agent_name, attempt=attempt)

            current_user_content = (
                user_content
                + corrective_prompt_template.format(
                    err=f"Expected top-level JSON object, got {type(parsed).__name__}"
                )
            )
            continue

        _append_log(
            agent_name=agent_name,
            run_id=run_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            success=True,
        )
        return parsed

    raise LLMFailure(agent_name=agent_name, attempt=2)
