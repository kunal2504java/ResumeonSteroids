"use client";

import { motion } from "framer-motion";
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
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-6 flex justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <div className="pointer-events-none absolute left-1/2 top-[-6rem] h-48 w-48 -translate-x-1/2 rounded-full bg-white/10 blur-[80px]" />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">ATS Score</div>
        <div className="mt-6 flex justify-center">
          <div className="relative h-36 w-36">
            <svg className="-rotate-90" width="144" height="144">
              <defs>
                <linearGradient id="ats-score-gradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor={color} />
                  <stop offset="100%" stopColor={color} stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="10"
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="url(#ats-score-gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl font-semibold tracking-tight text-white"
              >
                {Math.round(score)}
              </motion.div>
              <div
                className="mt-1 rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium"
                style={{ color, backgroundColor: `${color}22` }}
              >
                Grade {grade}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
          Parser compatibility, keyword placement, formatting, and content quality.
        </p>
      </div>
    </div>
  );
}
