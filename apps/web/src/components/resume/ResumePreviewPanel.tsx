"use client";

import ResumePreview from "@/components/editor/RightPanel/ResumePreview";

interface Props {
  highlightedSection?: string;
}

export function ResumePreviewPanel({ highlightedSection }: Props) {
  return (
    <div className="h-full overflow-hidden rounded-[28px] border border-[#1E2535] bg-[#0B1120]">
      <ResumePreview highlightedSection={highlightedSection} />
    </div>
  );
}
