"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import BulletEditor from "./BulletEditor";

export default function ExperienceEditor() {
  const experience = useResumeStore((s) => s.resume?.experience) || [];
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="ed-section-title">Experience</h3>
        <button onClick={addExperience} className="ed-add">+ Add</button>
      </div>

      {experience.map((exp, idx) => (
        <div key={exp.id} className="ed-entry">
          <div className="flex items-center justify-between">
            <span className="ed-index">#{idx + 1}</span>
            <button onClick={() => removeExperience(exp.id)} className="ed-remove">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <EditorInput label="Company" value={exp.company} onChange={(v) => updateExperience(exp.id, "company", v)} placeholder="Google" />
            <EditorInput label="Title" value={exp.title} onChange={(v) => updateExperience(exp.id, "title", v)} placeholder="Software Engineer" />
            <EditorInput label="Location" value={exp.location} onChange={(v) => updateExperience(exp.id, "location", v)} placeholder="Mountain View, CA" />
            <div className="grid grid-cols-2 gap-3">
              <EditorInput label="Start" value={exp.startDate} onChange={(v) => updateExperience(exp.id, "startDate", v)} placeholder="Jun 2023" />
              <EditorInput label="End" value={exp.endDate} onChange={(v) => updateExperience(exp.id, "endDate", v)} placeholder="Present" />
            </div>
          </div>

          <BulletEditor bullets={exp.bullets} parentId={exp.id} parentType="experience" />
        </div>
      ))}

      {experience.length === 0 && (
        <button onClick={addExperience} className="ed-empty">+ Add your first experience</button>
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
        className="w-full text-sm"
      />
    </div>
  );
}
