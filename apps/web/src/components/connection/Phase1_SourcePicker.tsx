"use client";

import { motion } from "framer-motion";
import { SOURCES } from "@/lib/sourceMeta";
import { SourceIcon } from "./SourceIcon";

interface Phase1Props {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Phase1_SourcePicker({
  selected,
  onToggle,
  onContinue,
  onSkip,
}: Phase1Props) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 mb-5">
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0l1.43 3.63L11 4.14 8.5 6.57l.69 3.68L6 8.36 2.81 10.25l.69-3.68L1 4.14l3.57-.51z" />
          </svg>
          Takes less than 60 seconds
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Let&apos;s build your resume.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
          Connect the profiles you want to import from. The more you connect,
          the better your resume.
        </p>
      </motion.div>

      {/* Source grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8"
      >
        {SOURCES.map((source) => {
          const isSelected = selected.includes(source.id);
          const isBlank = source.id === "blank";

          return (
            <motion.button
              key={source.id}
              variants={cardVariants}
              onClick={() => {
                if (isBlank) {
                  onSkip();
                } else {
                  onToggle(source.id);
                }
              }}
              className={`
                relative rounded-2xl border p-6 text-left
                flex flex-col gap-4 transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }
              `}
            >
              {/* Checkmark when selected */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${source.iconBg} ${source.iconColor}`}
              >
                <SourceIcon source={source.id} className="w-5 h-5" />
              </div>

              {/* Text */}
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {source.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {source.description}
                </p>
              </div>

              {/* Import tags */}
              {source.imports.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {source.imports.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-zinc-400 border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* "Skip" text for blank */}
              {isBlank && (
                <span className="text-xs text-zinc-500">Skip &rarr;</span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center"
      >
        <button
          onClick={onContinue}
          disabled={selected.length === 0}
          className={`
            px-8 py-3.5 rounded-xl text-sm font-semibold transition-all
            ${
              selected.length > 0
                ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
                : "bg-white/5 text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          Continue with {selected.length > 0 ? selected.length : ""} source
          {selected.length !== 1 ? "s" : ""} &rarr;
        </button>
      </motion.div>
    </div>
  );
}
