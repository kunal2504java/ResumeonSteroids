"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";
import { createClient } from "@/lib/supabase/client";
import type { TailorResponse } from "@resumeai/shared";

interface TailorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
}

type SuggestedChange = TailorResponse["suggestedChanges"][number];

const textareaClass =
  "w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

function normaliseText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function replaceSuggestionText(
  current: string,
  original: string,
  suggested: string,
) {
  const trimmedOriginal = original.trim();
  const trimmedSuggested = suggested.trim();

  if (!trimmedOriginal || !trimmedSuggested) {
    return { changed: false, value: current };
  }

  if (current.trim() === trimmedOriginal) {
    return { changed: true, value: trimmedSuggested };
  }

  if (current.includes(trimmedOriginal)) {
    return {
      changed: true,
      value: current.replace(trimmedOriginal, trimmedSuggested),
    };
  }

  if (normaliseText(current) === normaliseText(trimmedOriginal)) {
    return { changed: true, value: trimmedSuggested };
  }

  return { changed: false, value: current };
}

export default function TailorDrawer({
  isOpen,
  onClose,
  jobDescription,
  onJobDescriptionChange,
}: TailorDrawerProps) {
  const resume = useResumeStore((s) => s.resume);
  const addToast = useResumeStore((s) => s.addToast);
  const updateSummary = useResumeStore((s) => s.updateSummary);
  const updateSection = useResumeStore((s) => s.updateSection);
  const updateAchievements = useResumeStore((s) => s.updateAchievements);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [appliedChanges, setAppliedChanges] = useState<Set<string>>(new Set());

  function changeKey(change: SuggestedChange, index: number) {
    return `${index}:${change.section}:${change.original}:${change.suggested}`;
  }

  async function analyze() {
    if (!jobDescription.trim() || !resume) return;
    setLoading(true);
    setResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const hasSupabaseConfig =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      let accessToken = "";

      if (hasSupabaseConfig) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        accessToken = session?.access_token ?? "";
      }

      const res = await fetch(`${API_URL}/api/ai/tailor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          resumeId: resume.id,
          jobDescription,
          resume,
        }),
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ error: "Tailoring failed" }));
        throw new Error(
          typeof error?.error === "string" ? error.error : "Tailoring failed"
        );
      }
      const data = await res.json();
      setResult(data);
      setAppliedChanges(new Set());
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Tailoring failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function applySuggestedChange(change: SuggestedChange, index: number) {
    const currentResume = useResumeStore.getState().resume;
    if (!currentResume) {
      addToast("No resume loaded", "error");
      return false;
    }

    const section = change.section.trim().toLowerCase();
    const trySummary = section.includes("summary");
    const tryExperience = section.includes("experience");
    const tryProjects = section.includes("project");
    const tryAchievements = section.includes("achievement");

    const applyToSummary = () => {
      const replacement = replaceSuggestionText(
        currentResume.summary,
        change.original,
        change.suggested,
      );
      if (!replacement.changed) return false;
      updateSummary(replacement.value);
      return true;
    };

    const applyToExperience = () => {
      let changed = false;
      const next = currentResume.experience.map((entry) => {
        if (changed) return entry;
        const bullets = entry.bullets.map((bullet) => {
          if (changed) return bullet;
          const replacement = replaceSuggestionText(
            bullet,
            change.original,
            change.suggested,
          );
          if (replacement.changed) {
            changed = true;
            return replacement.value;
          }
          return bullet;
        });
        return bullets === entry.bullets ? entry : { ...entry, bullets };
      });
      if (!changed) return false;
      updateSection("experience", next);
      return true;
    };

    const applyToProjects = () => {
      let changed = false;
      const next = currentResume.projects.map((entry) => {
        if (changed) return entry;
        const bullets = entry.bullets.map((bullet) => {
          if (changed) return bullet;
          const replacement = replaceSuggestionText(
            bullet,
            change.original,
            change.suggested,
          );
          if (replacement.changed) {
            changed = true;
            return replacement.value;
          }
          return bullet;
        });
        return bullets === entry.bullets ? entry : { ...entry, bullets };
      });
      if (!changed) return false;
      updateSection("projects", next);
      return true;
    };

    const applyToAchievements = () => {
      let changed = false;
      const next = currentResume.achievements.map((achievement) => {
        if (changed) return achievement;
        const replacement = replaceSuggestionText(
          achievement,
          change.original,
          change.suggested,
        );
        if (replacement.changed) {
          changed = true;
          return replacement.value;
        }
        return achievement;
      });
      if (!changed) return false;
      updateAchievements(next);
      return true;
    };

    const sectionAttempts = [
      ...(trySummary ? [applyToSummary] : []),
      ...(tryExperience ? [applyToExperience] : []),
      ...(tryProjects ? [applyToProjects] : []),
      ...(tryAchievements ? [applyToAchievements] : []),
    ];
    const fallbackAttempts = [
      applyToSummary,
      applyToExperience,
      applyToProjects,
      applyToAchievements,
    ];

    const applied =
      sectionAttempts.some((attempt) => attempt()) ||
      fallbackAttempts.some((attempt) => attempt());

    if (!applied) {
      addToast("Could not find the original text in the resume", "error");
      return false;
    }

    setAppliedChanges((previous) => {
      const next = new Set(previous);
      next.add(changeKey(change, index));
      return next;
    });
    addToast("Suggestion applied to resume", "success");
    return true;
  }

  function applyAllSuggestedChanges() {
    if (!result?.suggestedChanges.length) return;

    let appliedCount = 0;
    result.suggestedChanges.forEach((change, index) => {
      if (appliedChanges.has(changeKey(change, index))) return;
      if (applySuggestedChange(change, index)) {
        appliedCount += 1;
      }
    });

    if (appliedCount > 0) {
      addToast(`Applied ${appliedCount} suggested change${appliedCount === 1 ? "" : "s"}`, "success");
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-black/85 shadow-[-28px_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Tailor to Job Description
                </h2>
                <p className="mt-1 text-xs text-zinc-500">Match scoring, keywords, and ATS checks.</p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Job description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => onJobDescriptionChange(e.target.value)}
                  placeholder="We are looking for a senior software engineer..."
                  rows={8}
                  className={textareaClass}
                />
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  Paste the full JD. We extract role signals and run ATS parser rules against the resume preview.
                </p>
              </div>

              <button
                onClick={analyze}
                disabled={loading || !jobDescription.trim()}
                className="w-full cursor-pointer rounded-full bg-white py-2.5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Analyzing..." : "Analyze Match"}
              </button>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <ScoreGauge label="Match Score" value={result.overallMatch} />
                    <ScoreGauge label="ATS Score" value={result.atsScore} />
                  </div>

                  {result.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-200"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.suggestedChanges.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                          Suggested Changes
                        </h4>
                        <button
                          type="button"
                          onClick={applyAllSuggestedChanges}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
                        >
                          Apply all
                        </button>
                      </div>
                      <div className="space-y-3">
                        {result.suggestedChanges.map((change, i) => {
                          const key = changeKey(change, i);
                          const isApplied = appliedChanges.has(key);

                          return (
                            <div
                              key={key}
                              className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                                  {change.section}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => applySuggestedChange(change, i)}
                                  disabled={isApplied}
                                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isApplied ? "Applied" : "Apply"}
                                </button>
                              </div>
                              <div className="text-xs text-zinc-500 line-through">
                                {change.original}
                              </div>
                              <div className="text-xs text-white">
                                {change.suggested}
                              </div>
                              <p className="text-[10px] italic text-zinc-500">
                                {change.reason}
                              </p>
                            </div>
                          );
                        })}
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
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
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
      <span className="-mt-14 mb-6 text-xl font-semibold text-white">
        {value}%
      </span>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}
