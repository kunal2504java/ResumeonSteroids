"use client";

import type { ATSRuleResult } from "@/types/ats";

interface Props {
  rule: ATSRuleResult;
  onClick: () => void;
}

const STATUS_STYLES = {
  pass: "border-green-200/30 bg-green-500/10 text-green-200",
  warn: "border-amber-200/30 bg-amber-500/10 text-amber-100",
  fail: "border-red-200/30 bg-red-500/10 text-red-100",
};

export function ATSRuleRow({ rule, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.03] ${STATUS_STYLES[rule.status]}`}
    >
      <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{rule.rule_name}</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
            {rule.affected_section}
          </span>
        </div>
        <div className="mt-1 text-xs text-white/70">{rule.message}</div>
      </div>
      <div className="rounded-full border border-current/20 bg-black/20 px-2.5 py-1 text-xs font-medium">
        -{rule.score_impact}
      </div>
    </button>
  );
}
