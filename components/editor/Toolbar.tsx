"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

interface ToolbarProps {
  onDownloadPDF: () => void;
  onCopyLaTeX: () => void;
  onTailor: () => void;
  onCommandPalette: () => void;
}

export default function Toolbar({
  onDownloadPDF,
  onCopyLaTeX,
  onTailor,
  onCommandPalette,
}: ToolbarProps) {
  const isDirty = useResumeStore((s) => s.isDirty);
  const isSaving = useResumeStore((s) => s.isSaving);
  const save = useResumeStore((s) => s.save);
  const resumeName = useResumeStore((s) => s.resume?.name) || "Untitled";

  return (
    <header className="h-12 bg-[#161B27] border-b border-[#1E2535] flex items-center justify-between px-4 shrink-0">
      {/* Left: name + status */}
      <div className="flex items-center gap-3">
        <a
          href="/dashboard"
          className="text-[#71717A] hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="text-sm font-medium text-white">{resumeName}</span>
        {isDirty && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Unsaved
          </span>
        )}
        {isSaving && (
          <span className="text-[10px] text-[#71717A]">Saving...</span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#71717A] hover:text-white bg-[#0D1117] border border-[#1E2535] hover:border-[#6366f1]/30 transition-colors cursor-pointer"
        >
          <kbd className="text-[10px]">⌘K</kbd>
        </button>

        <button
          onClick={onTailor}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20 hover:bg-[#6366f1]/20 transition-colors cursor-pointer"
        >
          🎯 Tailor to Job
        </button>

        <button
          onClick={onCopyLaTeX}
          className="px-3 py-1.5 text-[11px] text-[#71717A] hover:text-white border border-[#1E2535] hover:border-[#6366f1]/30 transition-colors cursor-pointer"
        >
          Copy LaTeX
        </button>

        <button
          onClick={onDownloadPDF}
          className="px-3 py-1.5 text-[11px] text-white bg-[#6366f1] hover:bg-[#818cf8] transition-colors cursor-pointer"
        >
          Download PDF
        </button>

        <button
          onClick={() => save()}
          disabled={!isDirty || isSaving}
          className="px-3 py-1.5 text-[11px] text-[#71717A] hover:text-white border border-[#1E2535] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Save
        </button>
      </div>
    </header>
  );
}
