from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PipelineContext:
    # inputs
    candidate: dict
    jd: dict

    # agent outputs
    jd_analysis: dict
    scored_evidence: dict
    gap_analysis: dict
    content: dict
    ats_optimised: dict
    section_order: dict
    assembled_resume: dict
    qa_report: dict

    # run metadata
    metadata: dict
