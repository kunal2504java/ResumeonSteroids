"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import type { SectionKey } from "@resumeai/shared";

const sections: { key: SectionKey; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "achievements", label: "Achievements" },
];

export default function SectionTabs() {
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);

  return (
    <div className="grid grid-flow-col auto-cols-max gap-1.5 overflow-x-auto border-b border-white/10 bg-[#0f0f0f]/55 px-4 py-3 scrollbar-none">
      {sections.map((s) => (
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 ${
            activeSection === s.key
              ? "border-white/10 bg-zinc-800/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "border-transparent text-zinc-500 hover:border-white/10 hover:bg-zinc-900/40 hover:text-zinc-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
