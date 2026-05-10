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
    <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-6 py-3.5 scrollbar-none">
      {sections.map((s) => (
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
            activeSection === s.key
              ? "border border-white/15 bg-white text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
              : "border border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
