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
        <h1 style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 800, fontSize: "clamp(26px,3.6vw,36px)", letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 8 }}>
          {title}
        </h1>
        <p className="hand hand-ink" style={{ fontSize: 16 }}>
          drop in your details — we read the rest
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
        <button onClick={onBack} className="btn-mini">&larr; Back</button>
        <button
          onClick={onAnalyze}
          disabled={!canProceed}
          className="btn btn-pen"
          style={{ flex: 1, justifyContent: "center", ...(canProceed ? {} : { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" }) }}
        >
          Analyze my profiles <span aria-hidden="true">→</span>
        </button>
      </motion.div>
    </div>
  );
}
