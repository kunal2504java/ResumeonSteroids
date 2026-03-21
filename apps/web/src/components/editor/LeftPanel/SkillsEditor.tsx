"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const categories = [
  { key: "languages", label: "Languages", placeholder: "Python, TypeScript, Java, C++" },
  { key: "frameworks", label: "Frameworks", placeholder: "React, Next.js, Node.js, Django" },
  { key: "tools", label: "Developer Tools", placeholder: "Git, Docker, AWS, VS Code" },
  { key: "databases", label: "Databases", placeholder: "PostgreSQL, MongoDB, Redis" },
];

export default function SkillsEditor() {
  const skills = useResumeStore((s) => s.resume?.skills);
  const updateSkills = useResumeStore((s) => s.updateSkills);
  const achievements = useResumeStore((s) => s.resume?.achievements) || [];
  const updateAchievements = useResumeStore((s) => s.updateAchievements);

  if (!skills) return null;

  return (
    <div className="px-6 py-6 space-y-5">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
        Technical Skills
      </h3>

      {categories.map((cat) => (
        <div key={cat.key}>
          <label className="block text-[10px] text-zinc-300 mb-1 font-semibold uppercase tracking-wide">
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
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(skills as unknown as Record<string, string[]>)[cat.key]?.map(
              (skill, i) =>
                skill && (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20 rounded"
                  >
                    {skill}
                  </span>
                )
            )}
          </div>
        </div>
      ))}

      {/* Achievements inline */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-3">
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
                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors"
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
            className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
          >
            + Add achievement
          </button>
        </div>
      </div>
    </div>
  );
}
