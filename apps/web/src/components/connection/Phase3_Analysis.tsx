"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ConnectionStatus, GlobalStageInfo } from "@/hooks/useConnectionFlow";
import SourceProgressRow from "./SourceProgressRow";

interface Phase3Props {
  connections: ConnectionStatus[];
  currentStage: GlobalStageInfo;
  totalProgress: number;
  allDone: boolean;
}

export default function Phase3_Analysis({
  connections,
  currentStage,
  totalProgress,
  allDone,
}: Phase3Props) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Pulsing logo */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-8"
      >
        <svg
          className="w-7 h-7 text-indigo-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 1L12.39 7.26L19 8.27L14.5 12.14L15.82 18.54L10 15.27L4.18 18.54L5.5 12.14L1 8.27L7.61 7.26L10 1Z" />
        </svg>
      </motion.div>

      {/* Dynamic headline */}
      <div className="text-center mb-10 h-20">
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentStage.headline}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="text-xl sm:text-2xl font-bold text-white mb-2"
          >
            {currentStage.headline}
          </motion.h2>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStage.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-zinc-400 max-w-md mx-auto"
          >
            {currentStage.subtitle}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Per-source progress tracks */}
      <div className="w-full space-y-5 mb-10">
        {connections.map((conn) => (
          <SourceProgressRow key={conn.id} connection={conn} />
        ))}
      </div>

      {/* Global progress bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Overall progress</span>
          <span className="text-xs text-zinc-400 font-mono">
            {Math.round(totalProgress)}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              allDone ? "bg-emerald-400" : "bg-indigo-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}
