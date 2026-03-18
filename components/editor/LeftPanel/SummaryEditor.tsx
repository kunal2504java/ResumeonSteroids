"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.summary) || "";
  const updateSummary = useResumeStore((s) => s.updateSummary);

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-3">
        Professional Summary
      </h3>
      <textarea
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        placeholder="Brief professional summary (optional — Jake's template doesn't typically include this, but you can add one)..."
        rows={4}
        className="w-full bg-[#0D1117] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono resize-none"
      />
      <p className="text-[10px] text-[#71717A] mt-2">
        Keep it under 3 sentences. Focus on your unique value proposition.
      </p>
    </div>
  );
}
