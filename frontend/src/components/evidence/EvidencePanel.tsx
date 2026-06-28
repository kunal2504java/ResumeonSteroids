"use client";

import type { EvidenceReport, EvidenceCategoryScore } from "@/types/evidence";

const GRADE_INK: Record<string, string> = {
  A: "#1f7a3f",
  B: "#1f7a3f",
  C: "#b07a12",
  D: "#e23b17",
  F: "#e23b17",
};

const CATEGORY_LABELS: Array<[keyof EvidenceReport["scores"], string]> = [
  ["open_source", "Open source"],
  ["self_projects", "Projects"],
  ["production", "Production"],
  ["technical_skills", "Technical depth"],
];

function Bar({ label, c }: { label: string; c: EvidenceCategoryScore }) {
  const pct = c.max ? Math.round((c.score / c.max) * 100) : 0;
  const ink = pct >= 70 ? "#1f7a3f" : pct >= 40 ? "#b07a12" : "#e23b17";
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.score}/{c.max}</span>
      </div>
      <div style={{ height: 6, background: "var(--paper-2)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: ink }} />
      </div>
      <p style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)" }}>{c.evidence}</p>
    </div>
  );
}

export function EvidencePanel({
  report,
  loading,
  error,
  onRun,
}: {
  report: EvidenceReport | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}) {
  return (
    <div className="surf" style={{ height: "100%", overflow: "hidden", padding: 0 }}>
      <div className="h-full overflow-y-auto p-4 sm:p-5">
        <span className="surf-label">your real work · substance</span>

        {loading && <p className="hand" style={{ fontSize: 18 }}>reading your GitHub & scoring the real work…</p>}

        {!loading && error && (
          <div className="p-4 text-sm" style={{ border: "1.5px solid var(--pen)", background: "rgba(226,59,23,0.08)", color: "var(--pen-deep)" }}>
            {error}
            <button onClick={onRun} className="btn btn-pen btn-sm" style={{ marginTop: 12 }}>Try again</button>
          </div>
        )}

        {!loading && !error && !report && (
          <div className="p-6 text-sm" style={{ border: "2px dashed var(--ink-soft)", background: "var(--paper-2)", color: "var(--ink-soft)" }}>
            <p style={{ fontSize: 15, color: "var(--ink)", fontWeight: 700, marginBottom: 6 }}>Score the work, not the keywords.</p>
            <p style={{ lineHeight: 1.55 }}>
              Reads your real GitHub (and competitive-programming) to judge open-source contribution,
              project complexity, and depth — then <b>&ldquo;make better&rdquo; uses it</b> to surface your strongest real work.
            </p>
            <button onClick={onRun} className="btn btn-pen btn-sm" style={{ marginTop: 16 }}>
              Evaluate my real work <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between" style={{ borderBottom: "1.5px dashed var(--hairline)", paddingBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 40, lineHeight: 1, color: GRADE_INK[report.grade] }}>
                  {Math.round(report.total_score)}
                </div>
                <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-soft)", marginTop: 4 }}>
                  of 100 · grade {report.grade}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                <span className="mono" style={{ fontSize: 10.5, color: report.grounding.github ? "#1f7a3f" : "var(--ink-soft)" }}>
                  {report.grounding.github ? "✓ GitHub grounded" : "GitHub not read"}
                </span>
                {report.grounding.leetcode && <span className="mono" style={{ fontSize: 10.5, color: "#1f7a3f" }}>✓ LeetCode</span>}
                {report.grounding.codeforces && <span className="mono" style={{ fontSize: 10.5, color: "#1f7a3f" }}>✓ Codeforces</span>}
              </div>
            </div>

            <div>
              {CATEGORY_LABELS.map(([key, label]) => (
                <Bar key={key} label={label} c={report.scores[key]} />
              ))}
            </div>

            {report.areas_for_improvement.length > 0 && (
              <div>
                <span className="surf-label" style={{ marginBottom: 8 }}>surface this in your resume</span>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {report.areas_for_improvement.map((a, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5, color: "var(--ink)" }}>
                      <span style={{ color: "var(--pen)", flex: "0 0 auto" }}>→</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.grounding.notes.length > 0 && (
              <p className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {report.grounding.notes.join(" ")}
              </p>
            )}

            <button onClick={onRun} className="btn-mini">Re-evaluate</button>
          </div>
        )}
      </div>
    </div>
  );
}
