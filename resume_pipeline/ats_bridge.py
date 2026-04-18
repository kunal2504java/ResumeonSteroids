from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from ats_simulator import apply_rule_fix
from ats_simulator import ats_report_to_dict
from ats_simulator import extract_keywords_from_text
from ats_simulator import rule_catalog
from ats_simulator import simulate_ats


def _load_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("Bridge payload must be a JSON object")
    return payload


def _resolved_keywords(payload: dict[str, Any]) -> list[Any]:
    ats_keywords = payload.get("ats_keywords")
    if isinstance(ats_keywords, list) and ats_keywords:
        return ats_keywords

    job_description = str(payload.get("job_description", "")).strip()
    if job_description:
        return extract_keywords_from_text(job_description)
    return []


def _simulate(payload: dict[str, Any]) -> dict[str, Any]:
    assembled_resume = payload.get("assembled_resume", {})
    latex_source = str(payload.get("latex_source", ""))
    max_pages = int(payload.get("max_pages", 1) or 1)
    ats_keywords = _resolved_keywords(payload)
    report = simulate_ats(assembled_resume, latex_source, ats_keywords, max_pages)
    return {
        "report": ats_report_to_dict(report),
        "ats_keywords": ats_keywords,
    }


def _fix(payload: dict[str, Any]) -> dict[str, Any]:
    rule_id = str(payload.get("rule_id", "")).strip()
    if not rule_id:
        raise ValueError("rule_id is required")

    assembled_resume = payload.get("assembled_resume", {})
    latex_source = str(payload.get("latex_source", ""))
    max_pages = int(payload.get("max_pages", 1) or 1)
    ats_keywords = _resolved_keywords(payload)

    patched_resume, auto_fixed, manual_instruction = apply_rule_fix(
        rule_id,
        assembled_resume,
        ats_keywords,
    )
    if not auto_fixed:
        return {
            "auto_fixed": False,
            "manual_instruction": manual_instruction,
        }

    patched_resume["maxPages"] = max_pages
    report = simulate_ats(patched_resume, latex_source, ats_keywords, max_pages)
    return {
        "auto_fixed": True,
        "manual_instruction": None,
        "assembled_resume": patched_resume,
        "report": ats_report_to_dict(report),
        "ats_keywords": ats_keywords,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="ATS simulator bridge")
    parser.add_argument("command", choices=["simulate", "rules", "fix"])
    args = parser.parse_args()

    if args.command == "rules":
        json.dump(rule_catalog(), sys.stdout)
        return 0

    payload = _load_payload()
    if args.command == "simulate":
        json.dump(_simulate(payload), sys.stdout)
        return 0
    if args.command == "fix":
        json.dump(_fix(payload), sys.stdout)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
