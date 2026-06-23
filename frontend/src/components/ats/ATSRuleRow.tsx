"use client";

import type { ATSRuleResult } from "@/types/ats";

const STATUS_INK: Record<ATSRuleResult["status"], string> = {
  pass: "#1f7a3f",
  warn: "#b07a12",
  fail: "#e23b17",
};

const STATUS_MARK: Record<ATSRuleResult["status"], string> = {
  pass: "✓",
  warn: "!",
  fail: "✕",
};

export function ATSRuleRow({ rule, onClick }: { rule: ATSRuleResult; onClick: () => void }) {
  const ink = STATUS_INK[rule.status];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-4 py-3 text-left"
      style={{ border: "1.5px solid var(--hairline)", borderLeft: `3px solid ${ink}`, background: "var(--sheet)" }}
    >
      <span className="mono" style={{ marginTop: 1, fontWeight: 700, color: ink, width: 14, flex: "0 0 auto" }}>
        {STATUS_MARK[rule.status]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{rule.rule_name}</span>
          <span className="mono" style={{ border: "1.5px solid var(--hairline)", padding: "1px 6px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-soft)" }}>
            {rule.affected_section}
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>{rule.message}</div>
      </div>
      <div className="mono" style={{ border: `1.5px solid ${ink}`, color: ink, padding: "2px 8px", fontSize: 12, fontWeight: 600, flex: "0 0 auto" }}>
        -{rule.score_impact}
      </div>
    </button>
  );
}
