"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

export default function EducationEditor() {
  const education = useResumeStore((s) => s.resume?.education) || [];
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="ed-section-title">Education</h3>
        <button onClick={addEducation} className="ed-add">+ Add</button>
      </div>

      {education.map((edu, idx) => (
        <div key={edu.id} className="ed-entry">
          <div className="flex items-center justify-between">
            <span className="ed-index">#{idx + 1}</span>
            <button onClick={() => removeEducation(edu.id)} className="ed-remove">Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Institution" value={edu.institution} onChange={(v) => updateEducation(edu.id, "institution", v)} placeholder="Stanford University" />
            <Field label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} placeholder="Bachelor of Science" />
            <Field label="Field of Study" value={edu.field} onChange={(v) => updateEducation(edu.id, "field", v)} placeholder="Computer Science" />
            <Field label="Location" value={edu.location} onChange={(v) => updateEducation(edu.id, "location", v)} placeholder="Stanford, CA" />
            <Field label="Start" value={edu.startDate} onChange={(v) => updateEducation(edu.id, "startDate", v)} placeholder="Aug 2021" />
            <Field label="End" value={edu.endDate} onChange={(v) => updateEducation(edu.id, "endDate", v)} placeholder="May 2025" />
          </div>

          <Field label="GPA" value={edu.gpa} onChange={(v) => updateEducation(edu.id, "gpa", v)} placeholder="3.92/4.0" />

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Coursework (comma-separated)
            </label>
            <input
              type="text"
              value={edu.coursework.join(", ")}
              onChange={(e) => {
                const store = useResumeStore.getState();
                store.updateSection(
                  "education",
                  store.resume!.education.map((ed) =>
                    ed.id === edu.id
                      ? {
                          ...ed,
                          coursework: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        }
                      : ed
                  )
                );
              }}
              placeholder="Data Structures, Algorithms, Operating Systems"
              className="w-full text-sm"
            />
          </div>
        </div>
      ))}

      {education.length === 0 && (
        <button onClick={addEducation} className="ed-empty">+ Add your education</button>
      )}
    </div>
  );
}

function Field({
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
