"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const categories = [
  { key: "languages", label: "Languages", placeholder: "Python, TypeScript, Java, C++" },
  { key: "frameworks", label: "Frameworks", placeholder: "React, Next.js, Node.js, Django" },
  { key: "tools", label: "Platforms & Concepts", placeholder: "Docker, AWS, CI/CD, REST APIs, System Design" },
  { key: "databases", label: "Databases", placeholder: "PostgreSQL, MongoDB, Redis" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

export default function SkillsEditor() {
  const skills = useResumeStore((s) => s.resume?.skills);
  const updateSkills = useResumeStore((s) => s.updateSkills);
  const achievements = useResumeStore((s) => s.resume?.achievements) || [];
  const updateAchievements = useResumeStore((s) => s.updateAchievements);

  if (!skills) return null;

  return (
    <div className="space-y-5 px-6 py-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
        Technical Skills
      </h3>

      {categories.map((cat) => (
        <div key={cat.key}>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {cat.label}
          </label>
          <input
            type="text"
            value={(skills as unknown as Record<string, string[]>)[cat.key]?.join(", ") || ""}
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              updateSkills(cat.key, values);
            }}
            placeholder={cat.placeholder}
            className={inputClass}
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(skills as unknown as Record<string, string[]>)[cat.key]?.map(
              (skill, i) =>
                skill && (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-300"
                  >
                    {skill}
                  </span>
                )
            )}
          </div>
        </div>
      ))}

      {/* Achievements inline */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Achievements
        </h3>
        <div className="space-y-2">
          {achievements.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={a}
                onChange={(e) => {
                  const next = [...achievements];
                  next[i] = e.target.value;
                  updateAchievements(next);
                }}
                placeholder="Achievement..."
                className={`${inputClass} flex-1`}
              />
              <button
                onClick={() => {
                  updateAchievements(achievements.filter((_, j) => j !== i));
                }}
                className="text-xs text-red-400/50 hover:text-red-400 px-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => updateAchievements([...achievements, ""])}
            className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            + Add achievement
          </button>
        </div>
      </div>
    </div>
  );
}
