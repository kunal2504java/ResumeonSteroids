"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

interface ToolbarProps {
  onDownloadPDF: () => void;
  onCopyLaTeX: () => void;
  onTailor: () => void;
  onAIAssistant: () => void;
  onCommandPalette: () => void;
}

export default function Toolbar({
  onDownloadPDF,
  onCopyLaTeX,
  onTailor,
  onAIAssistant,
  onCommandPalette,
}: ToolbarProps) {
  const isDirty = useResumeStore((s) => s.isDirty);
  const isSaving = useResumeStore((s) => s.isSaving);
  const save = useResumeStore((s) => s.save);
  const resumeName = useResumeStore((s) => s.resume?.name) || "Untitled";

  return (
    <header
      className="relative z-20 flex h-14 shrink-0 items-center justify-between px-4"
      style={{ borderBottom: "1.5px solid var(--ink)", background: "var(--paper)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <a href="/dashboard" className="btn-tool" aria-label="Back to dashboard" style={{ color: "var(--ink)" }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="max-w-48 truncate" style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", color: "var(--ink)" }}>
          {resumeName}
        </span>
        {isDirty && (
          <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid var(--marigold)", color: "#8a6410", padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            <span style={{ width: 6, height: 6, background: "var(--marigold)" }} />
            Unsaved
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onCommandPalette} className="btn-tool" aria-label="Command palette">
          <kbd style={{ fontSize: 11 }}>⌘K</kbd>
        </button>
        <button onClick={onTailor} className="btn-tool">Tailor</button>
        <button onClick={onAIAssistant} className="btn-tool">AI assistant</button>
        <button onClick={onCopyLaTeX} className="btn-tool">Copy LaTeX</button>
        <button onClick={() => save()} disabled={!isDirty || isSaving} className="btn-tool">
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button onClick={onDownloadPDF} className="btn btn-pen btn-sm">Download PDF</button>
      </div>
    </header>
  );
}
