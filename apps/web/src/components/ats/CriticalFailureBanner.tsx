"use client";

import type { ATSRuleResult } from "@/types/ats";

interface Props {
  failures: ATSRuleResult[];
  onFix: (ruleId: string) => Promise<void>;
  loading: boolean;
}

export function CriticalFailureBanner({ failures, onFix, loading }: Props) {
  if (!failures.length) {
    return null;
  }

  const handleFixAll = async () => {
    for (const failure of failures) {
      await onFix(failure.rule_id);
    }
  };

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-red-100">
            {failures.length} critical issues found
          </div>
          <div className="mt-1 text-xs text-red-100/80">
            These issues prevent your resume from being parsed correctly.
          </div>
        </div>
        <button
          type="button"
          onClick={handleFixAll}
          disabled={loading}
          className="rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-50 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Fixing..." : "Auto-fix all"}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {failures.map((failure) => (
          <div
            key={failure.rule_id}
            className="rounded-xl border border-red-400/15 bg-black/10 px-3 py-2 text-xs text-red-50/90"
          >
            <span className="font-medium">{failure.rule_name}</span>
            <span className="ml-2 text-red-50/70">{failure.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
