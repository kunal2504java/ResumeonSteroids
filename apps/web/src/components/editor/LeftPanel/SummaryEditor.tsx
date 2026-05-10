"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const textareaClass =
  "w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

export default function SummaryEditor() {
  const summary = useResumeStore((s) => s.resume?.summary) || "";
  const updateSummary = useResumeStore((s) => s.updateSummary);

  return (
    <div className="px-6 py-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
        Professional Summary
      </h3>
      <textarea
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        placeholder="Brief professional summary (optional — Jake's template doesn't typically include this, but you can add one)..."
        rows={4}
        className={textareaClass}
      />
      <p className="mt-2 text-[10px] text-zinc-500">
        Keep it under 3 sentences. Focus on your unique value proposition.
      </p>
    </div>
  );
}
