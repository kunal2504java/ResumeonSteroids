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

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Phase1_SourcePicker({ selected, onToggle, onContinue, onSkip }: Phase1Props) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <style>{`
        .conn-card { position: relative; background: var(--sheet); padding: 20px; text-align: left;
          display: flex; flex-direction: column; gap: 12px; cursor: pointer;
          border: 1.5px solid var(--hairline); box-shadow: 3px 4px 0 rgba(33,30,24,.08);
          transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
        .conn-card:hover { transform: translate(-1px,-2px); box-shadow: 5px 7px 0 rgba(33,30,24,.12); }
        .conn-card.sel { border: 2px solid var(--pen); box-shadow: 4px 5px 0 var(--ink); background: linear-gradient(var(--sheet), rgba(242,168,29,.08)); }
        .conn-check { position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; background: var(--pen);
          display: grid; place-items: center; }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-9">
        <span className="eyebrow" style={{ display: "inline-block", marginBottom: 16 }}>takes less than 60 seconds</span>
        <h1 style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 800, fontSize: "clamp(30px,4.5vw,44px)", letterSpacing: "-0.03em", lineHeight: 1, color: "var(--ink)" }}>
          Let&apos;s build your resume.
        </h1>
        <p style={{ maxWidth: 460, margin: "16px auto 0", fontSize: 16, lineHeight: 1.55, color: "#3a362d" }}>
          Connect where your work already lives. The more you connect, the less you type.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        {SOURCES.map((source) => {
          const isSelected = selected.includes(source.id);
          const isBlank = source.id === "blank";
          return (
            <motion.button
              key={source.id}
              variants={cardVariants}
              onClick={() => (isBlank ? onSkip() : onToggle(source.id))}
              className={`conn-card ${isSelected ? "sel" : ""}`}
            >
              {isSelected && (
                <span className="conn-check">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}
              <div className={`w-10 h-10 flex items-center justify-center ${source.iconBg} ${source.iconColor}`}>
                <SourceIcon source={source.id} className="w-5 h-5" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>{source.name}</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.5 }}>{source.description}</p>
              </div>
              {source.imports.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {source.imports.map((tag) => (
                    <span key={tag} className="ed-tag">{tag}</span>
                  ))}
                </div>
              )}
              {isBlank && <span className="hand" style={{ fontSize: 15 }}>skip — start blank →</span>}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col items-center gap-3">
        <button onClick={onContinue} disabled={selected.length === 0} className="btn btn-pen" style={selected.length === 0 ? { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" } : undefined}>
          Continue with {selected.length > 0 ? selected.length : ""} source{selected.length !== 1 ? "s" : ""} <span aria-hidden="true">→</span>
        </button>
        {selected.length === 0 && <span className="hand hand-ink" style={{ fontSize: 15 }}>pick at least one to start ↑</span>}
      </motion.div>
    </div>
  );
}
