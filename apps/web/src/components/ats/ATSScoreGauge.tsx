"use client";

import { motion } from "framer-motion";
import type { ATSGrade } from "@/types/ats";

interface Props {
  score: number;
  grade: ATSGrade;
  loading?: boolean;
}

const GRADE_COLORS: Record<ATSGrade, string> = {
  A: "#ffffff",
  B: "#f4f4f5",
  C: "#d4d4d8",
  D: "#a1a1aa",
  F: "#71717a",
};

export function ATSScoreGauge({ score, grade, loading = false }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = GRADE_COLORS[grade];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 p-5 backdrop-blur-md">
        <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        <div className="mt-5 flex justify-center">
          <div className="h-28 w-28 animate-pulse rounded-full border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 p-5 backdrop-blur-md">
      <div className="pointer-events-none absolute left-1/2 top-[-7rem] h-44 w-44 -translate-x-1/2 rounded-full bg-white/[0.06] blur-[80px]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            ATS Score
          </div>
          <div className="text-[11px] text-zinc-500">Grade {grade}</div>
        </div>
        <div className="mt-5 flex items-center justify-center">
          <div className="relative h-28 w-28">
            <svg className="-rotate-90" width="112" height="112">
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
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
                className="text-4xl font-light tracking-[-0.08em] text-white"
              >
                {Math.round(score)}
              </motion.div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                score
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
          Parser compatibility, keyword placement, formatting, and content quality.
        </p>
      </div>
    </div>
  );
}
