"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { ConnectionStatus } from "@/hooks/useConnectionFlow";
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
  const completed = connections.filter((c) => c.status === "done");
  const failed = connections.filter((c) => c.status === "error");

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
          <ResumePreview />
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
          className="px-8 py-3.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          Open my resume &rarr;
        </button>
      </motion.div>
    </div>
  );
}
