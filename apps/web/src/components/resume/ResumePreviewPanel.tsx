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
    <div className="h-full overflow-hidden rounded-[28px] border border-white/10 bg-black/45 shadow-[0_30px_120px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <ResumePreview
        highlightedSection={highlightedSection}
        resumeOverride={resume}
        maxPages={maxPages}
      />
    </div>
  );
}
