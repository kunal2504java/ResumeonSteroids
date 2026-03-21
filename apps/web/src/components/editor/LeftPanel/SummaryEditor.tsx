"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.summary) || "";
  const updateSummary = useResumeStore((s) => s.updateSummary);

  return (
    <div className="px-6 py-6">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-4">
        Professional Summary
      </h3>
      <textarea
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        placeholder="Brief professional summary (optional — Jake's template doesn't typically include this, but you can add one)..."
        rows={4}
        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors resize-none"
      />
      <p className="text-[10px] text-zinc-500 mt-2">
        Keep it under 3 sentences. Focus on your unique value proposition.
      </p>
    </div>
  );
}
