"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
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
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/55 px-4 text-white backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <a
          href="/dashboard"
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="max-w-48 truncate text-sm font-medium tracking-tight text-white">
          {resumeName}
        </span>
        {isDirty && (
          <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Unsaved
          </span>
        )}
        {isSaving && <span className="text-[10px] text-zinc-500">Saving...</span>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCommandPalette}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-400 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
        >
          <kbd className="text-[10px]">⌘K</kbd>
        </button>

        <button
          onClick={onTailor}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:bg-zinc-200"
        >
          Tailor to Job
        </button>

        <button
          onClick={onCopyLaTeX}
          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-zinc-400 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
        >
          Copy LaTeX
        </button>

        <button
          onClick={onDownloadPDF}
          className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:bg-zinc-200"
        >
          Download PDF
        </button>

        <button
          onClick={() => save()}
          disabled={!isDirty || isSaving}
          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-zinc-400 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Save
        </button>
        <ThemeToggle className="h-8 w-8" />
      </div>
    </header>
  );
}
