"use client";

import type { KeywordCoverage as KeywordCoverageType } from "@/types/ats";

interface Props {
  coverage: KeywordCoverageType;
  onFix: (ruleId: string) => Promise<void>;
  loading: boolean;
}

function KeywordColumn({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
      <div className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">{title}</div>
      <div className="mt-3 flex min-h-12 flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-green-400/20 bg-green-500/10 px-2 py-1 text-[11px] text-green-100"
            >
              {value}
            </span>
          ))
        ) : (
          <span className="text-xs text-white/40">No matched keywords</span>
        )}
      </div>
    </div>
  );
}

export function KeywordCoverage({ coverage, onFix, loading }: Props) {
  return (
    <div className="rounded-3xl border border-[#1E2535] bg-[#111827] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Keyword Coverage</div>
          <div className="mt-1 text-xs text-white/55">
            Weighted score prioritises Experience over low-signal sections.
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFix("K001")}
          disabled={loading}
          className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Add missing keywords"}
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-white/60">
          <span>Location-weighted score</span>
          <span>{Math.round(coverage.location_weighted_score)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-300 transition-[width] duration-500"
            style={{ width: `${coverage.location_weighted_score}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <KeywordColumn title="Experience" values={coverage.keywords_in_experience} />
        <KeywordColumn title="Summary" values={coverage.keywords_in_summary} />
        <KeywordColumn title="Skills" values={coverage.keywords_in_skills} />
      </div>

      <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-500/10 p-3">
        <div className="text-xs uppercase tracking-[0.24em] text-red-100/80">Missing</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {coverage.keywords_missing.length ? (
            coverage.keywords_missing.map((value) => (
              <span
                key={value}
                className="rounded-full border border-red-300/20 bg-black/20 px-2 py-1 text-[11px] text-red-50"
              >
                {value}
              </span>
            ))
          ) : (
            <span className="text-xs text-red-50/80">No missing keywords.</span>
          )}
        </div>
      </div>
    </div>
  );
}
