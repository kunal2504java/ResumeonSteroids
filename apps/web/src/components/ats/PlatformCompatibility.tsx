"use client";

import type { PlatformResult } from "@/types/ats";

interface Props {
  compatibility: Record<string, PlatformResult>;
  ruleNames?: Record<string, string>;
}

export function PlatformCompatibility({ compatibility, ruleNames = {} }: Props) {
  return (
    <div className="rounded-3xl border border-[#1E2535] bg-[#111827] p-5">
      <div className="text-sm font-semibold text-white">Platform Compatibility</div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {Object.entries(compatibility).map(([platform, result]) => (
          <div
            key={platform}
            className={`rounded-2xl border p-4 ${
              result.compatible
                ? "border-green-400/25 bg-green-500/10"
                : "border-red-400/25 bg-red-500/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-sm font-semibold text-white">
                  {platform.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{platform}</div>
                  <div className="text-[11px] text-white/60">{result.market_share}</div>
                </div>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  result.compatible
                    ? "bg-green-500/15 text-green-100"
                    : "bg-red-500/15 text-red-50"
                }`}
              >
                {result.compatible ? "Compatible" : "Blocked"}
              </div>
            </div>
            <div className="mt-3 text-xs text-white/70">{result.description}</div>
            {!result.compatible && result.blocking_rules.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.blocking_rules.map((ruleId) => (
                  <span
                    key={ruleId}
                    className="rounded-full border border-red-300/20 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-100"
                  >
                    {ruleNames[ruleId] || ruleId}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
