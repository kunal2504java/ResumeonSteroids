"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { ConnectionStatus } from "@/hooks/useConnectionFlow";
import { useResumeStore } from "@/lib/store/resumeStore";
import { SourceIcon } from "./SourceIcon";

const ResumePreview = dynamic(
  () => import("@/components/editor/RightPanel/ResumePreview"),
  { ssr: false }
);

interface Phase4Props {
  connections: ConnectionStatus[];
  onConfirm: () => void;
  onBack: () => void;
}

export default function Phase4_Results({
  connections,
  onConfirm,
  onBack,
}: Phase4Props) {
  const resume = useResumeStore((s) => s.resume);
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo);
  const completed = connections.filter((c) => c.status === "done");
  const failed = connections.filter((c) => c.status === "error");
  const preferredNameSource = useMemo(() => {
    if (completed.some((conn) => conn.id === "resume")) return "uploaded resume";
    if (completed.some((conn) => conn.id === "linkedin")) return "LinkedIn";
    return "manual entry";
  }, [completed]);
  const [draftName, setDraftName] = useState("");
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);

  useEffect(() => {
    if (!isNameConfirmed) {
      setDraftName(resume?.personalInfo.name || "");
    }
  }, [resume?.personalInfo.name, isNameConfirmed]);

  function handleConfirmName() {
    const nextName = draftName.trim();
    if (!nextName) return;
    updatePersonalInfo("name", nextName);
    setIsNameConfirmed(true);
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Here&apos;s what we found.
        </h1>
        <p className="text-sm text-zinc-400">
          Review what gets added to your resume. You can edit anything later.
        </p>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: source summary cards */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {completed.map((conn) => (
            <div
              key={conn.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${conn.iconBg} ${conn.iconColor}`}
                  >
                    <SourceIcon source={conn.id} className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {conn.name}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Connected
                </span>
              </div>
              {conn.importedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {conn.importedItems.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/15"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Show failed sources */}
          {failed.map((conn) => (
            <div
              key={conn.id}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${conn.iconBg} ${conn.iconColor}`}
                  >
                    <SourceIcon source={conn.id} className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {conn.name}
                  </span>
                </div>
                <span className="text-xs text-red-400">Failed</span>
              </div>
              <p className="text-xs text-red-400/70 mt-2">{conn.summary}</p>
            </div>
          ))}
        </motion.div>

        {/* Right: compiled resume preview */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-zinc-900 overflow-hidden h-[580px]"
        >
          {isNameConfirmed ? (
            <ResumePreview />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-indigo-300/80">
                    Confirm Name
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Confirm the name before preview
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    The preview stays hidden until you confirm the display name.
                    Current source: {preferredNameSource}.
                  </p>
                </div>

                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Resume Name
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500/60 focus:outline-none"
                />

                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
                  GitHub usernames are no longer used as the resume name. This
                  field should come from LinkedIn or your uploaded resume, and
                  you can correct it here before the preview is rendered.
                </div>

                <button
                  onClick={handleConfirmName}
                  disabled={!draftName.trim()}
                  className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm name and show preview
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between items-center"
      >
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-sm text-zinc-400 border border-white/10 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
        >
          &larr; Connect more
        </button>
        <button
          onClick={onConfirm}
          disabled={!isNameConfirmed}
          className="px-8 py-3.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open my resume &rarr;
        </button>
      </motion.div>
    </div>
  );
}
