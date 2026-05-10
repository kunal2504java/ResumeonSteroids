"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const cardClass =
  "space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-xs text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

export default function EducationEditor() {
  const education = useResumeStore((s) => s.resume?.education) || [];
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Education
        </h3>
        <button
          onClick={addEducation}
          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          + Add
        </button>
      </div>

      {education.map((edu, idx) => (
        <div
          key={edu.id}
          className={cardClass}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-500">
              #{idx + 1}
            </span>
            <button
              onClick={() => removeEducation(edu.id)}
              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Institution"
              value={edu.institution}
              onChange={(v) => updateEducation(edu.id, "institution", v)}
              placeholder="Stanford University"
            />
            <Field
              label="Degree"
              value={edu.degree}
              onChange={(v) => updateEducation(edu.id, "degree", v)}
              placeholder="Bachelor of Science"
            />
            <Field
              label="Field of Study"
              value={edu.field}
              onChange={(v) => updateEducation(edu.id, "field", v)}
              placeholder="Computer Science"
            />
            <Field
              label="Location"
              value={edu.location}
              onChange={(v) => updateEducation(edu.id, "location", v)}
              placeholder="Stanford, CA"
            />
            <Field
              label="Start"
              value={edu.startDate}
              onChange={(v) => updateEducation(edu.id, "startDate", v)}
              placeholder="Aug 2021"
            />
            <Field
              label="End"
              value={edu.endDate}
              onChange={(v) => updateEducation(edu.id, "endDate", v)}
              placeholder="May 2025"
            />
          </div>

          <Field
            label="GPA"
            value={edu.gpa}
            onChange={(v) => updateEducation(edu.id, "gpa", v)}
            placeholder="3.92/4.0"
          />

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
                          coursework: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }
                      : ed
                  )
                );
              }}
              placeholder="Data Structures, Algorithms, Operating Systems"
              className={inputClass}
            />
          </div>
        </div>
      ))}

      {education.length === 0 && (
        <button
          onClick={addEducation}
          className="w-full cursor-pointer rounded-2xl border border-dashed border-white/12 bg-white/[0.025] py-8 text-sm text-zinc-500 transition-colors hover:border-white/25 hover:text-white"
        >
          + Add your education
        </button>
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
        className={inputClass}
      />
    </div>
  );
}
