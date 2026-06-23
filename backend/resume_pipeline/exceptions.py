from __future__ import annotations


class LLMFailure(Exception):
    def __init__(self, agent_name: str, attempt: int):
        self.agent_name = agent_name
        self.attempt = attempt
        super().__init__(
            f"LLM call failed for agent '{agent_name}' after attempt {attempt}"
        )


class AssemblyError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
