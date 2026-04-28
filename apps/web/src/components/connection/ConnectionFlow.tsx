"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useResumeStore } from "@/lib/store/resumeStore";
import { useConnectionFlow } from "@/hooks/useConnectionFlow";
import Phase1_SourcePicker from "./Phase1_SourcePicker";
import Phase2_Inputs from "./Phase2_Inputs";
import Phase3_Analysis from "./Phase3_Analysis";
import Phase4_Results from "./Phase4_Results";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface ConnectionFlowProps {
  resumeId: string;
  onComplete: () => void;
}

export default function ConnectionFlow({
  resumeId,
  onComplete,
}: ConnectionFlowProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const mergeImportedData = useResumeStore((s) => s.mergeImportedData);
  const resume = useResumeStore((s) => s.resume);

  const {
    connections,
    currentStage,
    totalProgress,
    allDone,
    runAll,
    results,
  } = useConnectionFlow(selected, inputs, file);

  // Transition from Phase 3 to Phase 4 after completion
  useEffect(() => {
    if (allDone && phase === 3) {
      const timer = setTimeout(() => {
        // Merge imported data into store so JakeTemplate preview shows data
        mergeImportedData(results);
        setPhase(4);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allDone, phase, mergeImportedData, results]);

  const toggleSource = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleInputChange = useCallback((source: string, value: string) => {
    setInputs((prev) => ({ ...prev, [source]: value }));
  }, []);

  function handleContinueFromPhase1() {
    if (selected.length > 0) setPhase(2);
  }

  async function handleAnalyze() {
    setPhase(3);
    await runAll();
  }

  function handleConfirm() {
    // Save to localStorage
    if (resume) {
      const stored = localStorage.getItem("resumeai_resumes");
      const resumes = stored ? JSON.parse(stored) : [];
      const idx = resumes.findIndex(
        (r: { id: string }) => r.id === resumeId
      );
      if (idx >= 0) resumes[idx] = resume;
      else resumes.unshift(resume);
      localStorage.setItem("resumeai_resumes", JSON.stringify(resumes));
    }
    onComplete();
  }

  function handleBackToPhase1() {
    setPhase(1);
  }

  const phaseVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 sm:p-10">
        <ThemeToggle className="absolute right-6 top-6 z-20" />
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.div
              key="phase1"
              variants={phaseVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              <Phase1_SourcePicker
                selected={selected}
                onToggle={toggleSource}
                onContinue={handleContinueFromPhase1}
                onSkip={onComplete}
              />
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="phase2"
              variants={phaseVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              <Phase2_Inputs
                selected={selected}
                inputs={inputs}
                file={file}
                onInputChange={handleInputChange}
                onFileChange={setFile}
                onBack={handleBackToPhase1}
                onAnalyze={handleAnalyze}
              />
            </motion.div>
          )}

          {phase === 3 && (
            <motion.div
              key="phase3"
              variants={phaseVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              <Phase3_Analysis
                connections={connections}
                currentStage={currentStage}
                totalProgress={totalProgress}
                allDone={allDone}
              />
            </motion.div>
          )}

          {phase === 4 && (
            <motion.div
              key="phase4"
              variants={phaseVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full"
            >
              <Phase4_Results
                connections={connections}
                results={results}
                onConfirm={handleConfirm}
                onBack={handleBackToPhase1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
