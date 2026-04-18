"use client";

import { useEffect, useState } from "react";
import type { ATSRuleInfo, ATSRuleResult } from "@/types/ats";

interface Props {
  rule: ATSRuleResult | null;
  onClose: () => void;
  onFix: (ruleId: string) => Promise<void>;
  loading: boolean;
}

export function ATSRuleDrawer({ rule, onClose, onFix, loading }: Props) {
  const [ruleInfo, setRuleInfo] = useState<Record<string, ATSRuleInfo>>({});

  useEffect(() => {
    if (!rule) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/ats/rules");
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { rules: ATSRuleInfo[] };
        if (!active) {
          return;
        }
        setRuleInfo(
          data.rules.reduce<Record<string, ATSRuleInfo>>((acc, item) => {
            acc[item.id] = item;
            return acc;
          }, {}),
        );
      } catch {
        // Non-blocking; drawer can fall back to runtime rule data.
      }
    })();

    return () => {
      active = false;
    };
  }, [rule]);

  const info = rule ? ruleInfo[rule.rule_id] : null;

  return (
    <div
      className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-full max-w-md transition-transform duration-300 ${
        rule ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="pointer-events-auto h-full border-l border-[#1E2535] bg-[#0B1120]/98 shadow-[-24px_0_64px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#1E2535] px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-white">
              {rule?.rule_name || "ATS Rule"}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/45">
              {rule?.rule_id}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>

        {rule && (
          <div className="flex h-[calc(100%-77px)] flex-col">
            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rule.status === "pass"
                      ? "bg-green-500/15 text-green-100"
                      : rule.status === "warn"
                        ? "bg-amber-500/15 text-amber-100"
                        : "bg-red-500/15 text-red-50"
                  }`}
                >
                  {rule.status.toUpperCase()}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                  -{rule.score_impact} pts
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                  {rule.affected_section}
                </span>
              </div>

              <section>
                <div className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
                  Why this matters
                </div>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {info?.why_it_matters || info?.description || rule.message}
                </p>
              </section>

              <section>
                <div className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
                  What to fix
                </div>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {rule.fix || info?.how_to_fix || "Review the affected section and update it."}
                </p>
              </section>
            </div>

            {(rule.status === "fail" || rule.status === "warn") && (
              <div className="border-t border-[#1E2535] px-5 py-4">
                <button
                  type="button"
                  onClick={() => onFix(rule.rule_id)}
                  disabled={loading}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#0B1120] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Applying fix..." : "Apply fix"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
