"use client";

import { useCodeforcesValidation } from "@/hooks/useCodeforcesValidation";
import { SourceIcon } from "../SourceIcon";

const RANK_COLORS: Record<string, string> = {
  newbie: "text-zinc-400",
  pupil: "text-green-400",
  specialist: "text-cyan-400",
  expert: "text-blue-400",
  "candidate master": "text-violet-400",
  master: "text-orange-400",
  "international master": "text-orange-300",
  grandmaster: "text-red-400",
  "international grandmaster": "text-red-300",
  "legendary grandmaster": "text-red-500",
};

interface CodeforcesInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeforcesInput({
  value,
  onChange,
}: CodeforcesInputProps) {
  const { isValidating, isValid, profile } = useCodeforcesValidation(value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">
          <SourceIcon source="codeforces" className="w-5 h-5 text-sm" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Codeforces</h3>
          <p className="text-xs text-zinc-500">
            Rating, rank title, contest history
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <span className="text-sm text-zinc-500">codeforces.com/</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourhandle"
          className="w-full bg-zinc-800 border border-white/10 rounded-xl pl-[128px] pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        {value.length > 1 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isValidating ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : isValid === true ? (
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : isValid === false ? (
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {/* Rating preview */}
      {isValid && profile && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
          {[
            {
              label: "Rating",
              value: String(profile.rating),
              color: RANK_COLORS[profile.rank] ?? "text-zinc-400",
            },
            {
              label: "Max Rating",
              value: String(profile.maxRating),
              color: RANK_COLORS[profile.maxRank] ?? "text-zinc-400",
            },
            {
              label: "Rank",
              value: profile.rank,
              color: RANK_COLORS[profile.rank] ?? "text-zinc-400",
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-sm font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
