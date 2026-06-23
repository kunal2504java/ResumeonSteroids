"use client";

import InkGauge from "@/components/ink/InkGauge";
import type { ATSGrade } from "@/types/ats";

interface Props {
  score: number;
  grade: ATSGrade;
  loading?: boolean;
}

const GRADE_INK: Record<ATSGrade, string> = {
  A: "#1f7a3f",
  B: "#1f7a3f",
  C: "#b07a12",
  D: "#e23b17",
  F: "#e23b17",
};

export function ATSScoreGauge({ score, grade, loading = false }: Props) {
  if (loading) {
    return (
      <div className="ink-card">
        <div style={{ height: 12, width: 80, background: "var(--paper-2)" }} />
        <div style={{ margin: "20px auto 0", height: 112, width: 112, background: "var(--paper-2)" }} />
      </div>
    );
  }

  const color = GRADE_INK[grade];

  return (
    <div className="ink-card" data-frame>
      <div className="flex items-center justify-between">
        <span className="surf-label" style={{ marginBottom: 0 }}>ATS score</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>grade {grade}</span>
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 128, height: 128 }}>
          <InkGauge value={score} size={128} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1, color }}>
              {Math.round(score)}
            </div>
            <div className="mono" style={{ marginTop: 2, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--ink-soft)" }}>
              of 100
            </div>
          </div>
        </div>
      </div>
      <p style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
        Parser compatibility, keyword placement, formatting, and content quality.
      </p>
    </div>
  );
}
