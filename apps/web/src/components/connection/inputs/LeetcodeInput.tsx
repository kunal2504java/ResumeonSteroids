"use client";

import { useLeetcodeValidation } from "@/hooks/useLeetcodeValidation";
import { SourceIcon } from "../SourceIcon";

interface LeetcodeInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function LeetcodeInput({ value, onChange }: LeetcodeInputProps) {
  const { isValid } = useLeetcodeValidation(value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm">
          <SourceIcon source="leetcode" className="w-5 h-5 text-sm" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">LeetCode</h3>
          <p className="text-xs text-zinc-500">
            Problems solved, contest rating, badges
          </p>
        </div>
      </div>

      {/* Input with prefix */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <span className="text-sm text-zinc-500">leetcode.com/u/</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourusername"
          className="w-full bg-zinc-800 border border-white/10 rounded-xl pl-[136px] pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        {value.length > 0 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isValid ? (
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
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
