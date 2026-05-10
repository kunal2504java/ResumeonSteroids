"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import BulletEditor from "./BulletEditor";

const cardClass =
  "space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-xs text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

export default function ExperienceEditor() {
  const experience = useResumeStore((s) => s.resume?.experience) || [];
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Experience
        </h3>
        <button
          onClick={addExperience}
          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          + Add
        </button>
      </div>

      {experience.map((exp, idx) => (
        <div
          key={exp.id}
          className={cardClass}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-500">
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
          className="w-full cursor-pointer rounded-2xl border border-dashed border-white/12 bg-white/[0.025] py-8 text-sm text-zinc-500 transition-colors hover:border-white/25 hover:text-white"
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
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
