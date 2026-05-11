"use client";

import type { Resume } from "@resumeai/shared";
import ResumePreview from "@/components/editor/RightPanel/ResumePreview";

interface Props {
  highlightedSection?: string;
  resume?: Resume | null;
  maxPages?: 1 | 2;
}

export function ResumePreviewPanel({
  highlightedSection,
  resume,
  maxPages,
}: Props) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 shadow-[0_0_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5 backdrop-blur-md">
      <ResumePreview
        highlightedSection={highlightedSection}
        resumeOverride={resume}
        maxPages={maxPages}
      />
    </div>
  );
}
