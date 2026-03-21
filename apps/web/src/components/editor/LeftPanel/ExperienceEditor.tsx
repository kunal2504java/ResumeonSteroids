"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import BulletEditor from "./BulletEditor";

export default function ExperienceEditor() {
  const experience = useResumeStore((s) => s.resume?.experience) || [];
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Experience
        </h3>
        <button
          onClick={addExperience}
          className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>

      {experience.map((exp, idx) => (
        <div
          key={exp.id}
          className="bg-zinc-800/50 border border-white/10 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] font-mono">
              #{idx + 1}
            </span>
            <button
              onClick={() => removeExperience(exp.id)}
              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EditorInput
              label="Company"
              value={exp.company}
              onChange={(v) => updateExperience(exp.id, "company", v)}
              placeholder="Google"
            />
            <EditorInput
              label="Title"
              value={exp.title}
              onChange={(v) => updateExperience(exp.id, "title", v)}
              placeholder="Software Engineer"
            />
            <EditorInput
              label="Location"
              value={exp.location}
              onChange={(v) => updateExperience(exp.id, "location", v)}
              placeholder="Mountain View, CA"
            />
            <div className="grid grid-cols-2 gap-2">
              <EditorInput
                label="Start"
                value={exp.startDate}
                onChange={(v) => updateExperience(exp.id, "startDate", v)}
                placeholder="Jun 2023"
              />
              <EditorInput
                label="End"
                value={exp.endDate}
                onChange={(v) => updateExperience(exp.id, "endDate", v)}
                placeholder="Present"
              />
            </div>
          </div>

          <BulletEditor
            bullets={exp.bullets}
            parentId={exp.id}
            parentType="experience"
          />
        </div>
      ))}

      {experience.length === 0 && (
        <button
          onClick={addExperience}
          className="w-full py-8 border border-dashed border-white/10 rounded-lg text-sm text-zinc-500 hover:text-white hover:border-[#6366f1]/40 transition-colors cursor-pointer"
        >
          + Add your first experience
        </button>
      )}
    </div>
  );
}

function EditorInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-zinc-300 mb-1 font-semibold uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors"
      />
    </div>
  );
}
