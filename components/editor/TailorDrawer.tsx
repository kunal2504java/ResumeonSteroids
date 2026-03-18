"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";
import type { TailorResponse } from "@/types/api";

interface TailorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TailorDrawer({ isOpen, onClose }: TailorDrawerProps) {
  const resume = useResumeStore((s) => s.resume);
  const addToast = useResumeStore((s) => s.addToast);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);

  async function analyze() {
    if (!jd.trim() || !resume) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resume.id,
          jobDescription: jd,
          resume,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
    } catch {
      addToast("Tailoring failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#161B27] border-l border-[#1E2535] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2535]">
              <h2 className="text-sm font-semibold text-white">
                Tailor to Job Description
              </h2>
              <button
                onClick={onClose}
                className="text-[#71717A] hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#71717A] mb-2">
                  Paste the job description
                </label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="We are looking for a senior software engineer..."
                  rows={8}
                  className="w-full bg-[#0D1117] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono resize-none"
                />
              </div>

              <button
                onClick={analyze}
                disabled={loading || !jd.trim()}
                className="w-full py-2.5 bg-[#6366f1] text-white text-sm font-medium hover:bg-[#818cf8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {loading ? "Analyzing..." : "Analyze Match"}
              </button>

              {/* Results */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  {/* Score gauges */}
                  <div className="grid grid-cols-2 gap-4">
                    <ScoreGauge label="Match Score" value={result.overallMatch} />
                    <ScoreGauge label="ATS Score" value={result.atsScore} />
                  </div>

                  {/* Missing keywords */}
                  {result.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-2">
                        Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {result.suggestedChanges.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-3">
                        Suggested Changes
                      </h4>
                      <div className="space-y-3">
                        {result.suggestedChanges.map((change, i) => (
                          <div
                            key={i}
                            className="bg-[#0D1117] border border-[#1E2535] p-3 space-y-2"
                          >
                            <span className="text-[10px] text-[#6366f1] font-mono uppercase">
                              {change.section}
                            </span>
                            <div className="text-xs text-[#71717A] line-through">
                              {change.original}
                            </div>
                            <div className="text-xs text-white">
                              {change.suggested}
                            </div>
                            <p className="text-[10px] text-[#71717A] italic">
                              {change.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ScoreGauge({ label, value }: { label: string; value: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 80
      ? "#22c55e"
      : value >= 60
        ? "#eab308"
        : "#ef4444";

  return (
    <div className="flex flex-col items-center p-4 bg-[#0D1117] border border-[#1E2535]">
      <svg width="88" height="88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="#1E2535"
          strokeWidth="6"
        />
        <motion.circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="text-xl font-bold text-white -mt-14 mb-6">
        {value}%
      </span>
      <span className="text-[10px] text-[#71717A]">{label}</span>
    </div>
  );
}
