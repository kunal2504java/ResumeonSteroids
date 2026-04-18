"use client";

import type { ATSGrade } from "@/types/ats";

interface Props {
  score: number;
  grade: ATSGrade;
  loading?: boolean;
}

const GRADE_COLORS: Record<ATSGrade, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

export function ATSScoreGauge({ score, grade, loading = false }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = GRADE_COLORS[grade];

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#1E2535] bg-[#111827] p-6">
        <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-5 flex items-center justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#1E2535] bg-[radial-gradient(circle_at_top,#1e293b_0%,#111827_62%)] p-6 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.8)]">
      <div className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">ATS Score</div>
      <div className="mt-5 flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 600ms ease, stroke 300ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-semibold text-white">{Math.round(score)}</div>
            <div
              className="mt-1 rounded-full px-3 py-1 text-xs font-medium"
              style={{ color, backgroundColor: `${color}22` }}
            >
              Grade {grade}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
