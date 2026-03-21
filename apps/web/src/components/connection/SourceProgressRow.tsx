"use client";

import { motion } from "framer-motion";
import type { ConnectionStatus } from "@/hooks/useConnectionFlow";
import { SourceIcon } from "./SourceIcon";

export default function SourceProgressRow({
  connection,
}: {
  connection: ConnectionStatus;
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Source icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm ${connection.iconBg} ${connection.iconColor}`}
      >
        <SourceIcon source={connection.id} className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Source name + micro-stage */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-white">
            {connection.name}
          </span>
          <span
            className={`text-xs truncate ml-3 ${
              connection.status === "done"
                ? "text-emerald-400"
                : connection.status === "error"
                  ? "text-red-400"
                  : "text-zinc-500"
            }`}
          >
            {connection.status === "done" ? (
              <span className="flex items-center gap-1">
                <motion.svg
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
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
                </motion.svg>
                {connection.summary.slice(0, 60)}
              </span>
            ) : connection.status === "error" ? (
              "\u2717 Failed"
            ) : (
              connection.currentMicroStage
            )}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              connection.status === "done"
                ? "bg-emerald-400"
                : connection.status === "error"
                  ? "bg-red-400"
                  : "bg-indigo-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${connection.progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}
