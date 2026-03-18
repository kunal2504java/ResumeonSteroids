"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import type { SectionKey } from "@/types/resume";

const sections: { key: SectionKey; label: string; icon: string }[] = [
  { key: "personal", label: "Personal", icon: "👤" },
  { key: "summary", label: "Summary", icon: "📝" },
  { key: "experience", label: "Experience", icon: "💼" },
  { key: "education", label: "Education", icon: "🎓" },
  { key: "projects", label: "Projects", icon: "🚀" },
  { key: "skills", label: "Skills", icon: "⚡" },
  { key: "achievements", label: "Achievements", icon: "🏆" },
];

export default function SectionTabs() {
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);

  return (
    <div className="flex gap-1 px-4 py-3 border-b border-[#1E2535] overflow-x-auto scrollbar-none">
      {sections.map((s) => (
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
            activeSection === s.key
              ? "bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30"
              : "text-[#71717A] hover:text-[#E4E4E7] hover:bg-white/5 border border-transparent"
          }`}
        >
          <span className="mr-1.5">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
