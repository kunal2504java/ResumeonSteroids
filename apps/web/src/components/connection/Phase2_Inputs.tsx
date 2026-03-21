"use client";

import { motion } from "framer-motion";
import GithubInput from "./inputs/GithubInput";
import LeetcodeInput from "./inputs/LeetcodeInput";
import CodeforcesInput from "./inputs/CodeforcesInput";
import LinkedinInput from "./inputs/LinkedinInput";
import ResumeUpload from "./inputs/ResumeUpload";

interface Phase2Props {
  selected: string[];
  inputs: Record<string, string>;
  file: File | null;
  onInputChange: (source: string, value: string) => void;
  onFileChange: (f: File | null) => void;
  onBack: () => void;
  onAnalyze: () => void;
}

const INPUT_COMPONENTS: Record<
  string,
  React.ComponentType<{ value: string; onChange: (v: string) => void }>
> = {
  github: GithubInput,
  leetcode: LeetcodeInput,
  codeforces: CodeforcesInput,
  linkedin: LinkedinInput,
};

export default function Phase2_Inputs({
  selected,
  inputs,
  file,
  onInputChange,
  onFileChange,
  onBack,
  onAnalyze,
}: Phase2Props) {
  const activeSources = selected.filter((id) => id !== "blank");

  const title =
    activeSources.length === 1
      ? `Connect your ${activeSources[0].charAt(0).toUpperCase() + activeSources[0].slice(1)}`
      : activeSources.length === 2
        ? "Connect your profiles"
        : "Almost there \u2014 connect your profiles";

  const canProceed = activeSources.every((sourceId) => {
    if (sourceId === "linkedin") return true; // optional
    if (sourceId === "resume") return !!file;
    return !!inputs[sourceId]?.trim();
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {title}
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your details for each source.
        </p>
      </motion.div>

      {/* Input cards */}
      <div className="space-y-4 mb-8">
        {activeSources.map((sourceId, i) => (
          <motion.div
            key={sourceId}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {sourceId === "resume" ? (
              <ResumeUpload file={file} onFileChange={onFileChange} />
            ) : INPUT_COMPONENTS[sourceId] ? (
              (() => {
                const Component = INPUT_COMPONENTS[sourceId];
                return (
                  <Component
                    value={inputs[sourceId] ?? ""}
                    onChange={(v) => onInputChange(sourceId, v)}
                  />
                );
              })()
            ) : null}
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-sm text-zinc-400 border border-white/10 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
        <button
          onClick={onAnalyze}
          disabled={!canProceed}
          className={`
            flex-1 py-3 rounded-xl text-sm font-semibold transition-all
            ${
              canProceed
                ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
                : "bg-white/5 text-zinc-600 cursor-not-allowed"
            }
          `}
        >
          Analyze my profiles &rarr;
        </button>
      </motion.div>
    </div>
  );
}
