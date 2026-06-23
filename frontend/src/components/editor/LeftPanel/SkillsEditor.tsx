"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const categories = [
  { key: "languages", label: "Languages", placeholder: "Python, TypeScript, Java, C++" },
  { key: "frameworks", label: "Frameworks", placeholder: "React, Next.js, Node.js, Django" },
  { key: "tools", label: "Platforms & Concepts", placeholder: "Docker, AWS, CI/CD, REST APIs, System Design" },
  { key: "databases", label: "Databases", placeholder: "PostgreSQL, MongoDB, Redis" },
];

const labelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500";

export default function SkillsEditor() {
  const skills = useResumeStore((s) => s.resume?.skills);
  const updateSkills = useResumeStore((s) => s.updateSkills);
  const achievements = useResumeStore((s) => s.resume?.achievements) || [];
  const updateAchievements = useResumeStore((s) => s.updateAchievements);

  if (!skills) return null;

  return (
    <div className="space-y-5 px-6 py-6">
      <h3 className="ed-section-title">Technical Skills</h3>

      {categories.map((cat) => (
        <div key={cat.key}>
          <label className={labelClass}>{cat.label}</label>
          <input
            type="text"
            value={(skills as unknown as Record<string, string[]>)[cat.key]?.join(", ") || ""}
            onChange={(e) => {
              const values = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              updateSkills(cat.key, values);
            }}
            placeholder={cat.placeholder}
            className="w-full text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(skills as unknown as Record<string, string[]>)[cat.key]?.map(
              (skill, i) => skill && <span key={i} className="ed-tag">{skill}</span>,
            )}
          </div>
        </div>
      ))}

      {/* Achievements inline */}
      <div style={{ borderTop: "1.5px solid var(--hairline)", paddingTop: 18 }}>
        <h3 className="ed-section-title mb-3">Achievements</h3>
        <div className="space-y-2">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={a}
                onChange={(e) => {
                  const next = [...achievements];
                  next[i] = e.target.value;
                  updateAchievements(next);
                }}
                placeholder="Achievement…"
                className="w-full flex-1 text-sm"
              />
              <button onClick={() => updateAchievements(achievements.filter((_, j) => j !== i))} className="ed-remove">
                ×
              </button>
            </div>
          ))}
          <button onClick={() => updateAchievements([...achievements, ""])} className="ed-add">
            + Add achievement
          </button>
        </div>
      </div>
    </div>
  );
}
