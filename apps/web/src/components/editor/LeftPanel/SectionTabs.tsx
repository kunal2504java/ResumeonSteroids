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
    <div
      className="grid grid-flow-col auto-cols-max gap-1.5 overflow-x-auto px-4 py-3 scrollbar-none"
      style={{ borderBottom: "1.5px solid var(--hairline)", background: "var(--sheet)" }}
    >
      {sections.map((s) => (
        <button
          key={s.key}
          onClick={() => setActiveSection(s.key)}
          className={`ed-tab ${activeSection === s.key ? "is-active" : ""}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
