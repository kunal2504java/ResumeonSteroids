"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.summary) || "";
  const updateSummary = useResumeStore((s) => s.updateSummary);

  return (
    <div className="px-6 py-6">
      <h3 className="ed-section-title mb-4">Professional Summary</h3>
      <textarea
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        placeholder="Brief professional summary (optional — Jake's template doesn't typically include this, but you can add one)..."
        rows={4}
        className="w-full resize-none px-3 py-2.5 text-sm outline-none"
      />
      <p className="hand hand-ink mt-2" style={{ fontSize: 14 }}>
        keep it under 3 sentences — lead with your value
      </p>
    </div>
  );
}
