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
    <div className="h-full overflow-hidden rounded-[28px] border border-[#1E2535] bg-[#0B1120]">
      <ResumePreview
        highlightedSection={highlightedSection}
        resumeOverride={resume}
        maxPages={maxPages}
      />
    </div>
  );
}
