from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from pipeline_context import PipelineContext


def save_context(ctx: PipelineContext, path: str) -> None:
    target_path = Path(path)
    target_path.parent.mkdir(parents=True, exist_ok=True)

    temp_path = target_path.with_suffix(f"{target_path.suffix}.tmp")
    payload = json.dumps(asdict(ctx), indent=2, sort_keys=True)
    temp_path.write_text(payload, encoding="utf-8")
    temp_path.replace(target_path)


def load_context(path: str) -> PipelineContext:
    target_path = Path(path)
    payload = json.loads(target_path.read_text(encoding="utf-8"))
    return PipelineContext(**payload)
