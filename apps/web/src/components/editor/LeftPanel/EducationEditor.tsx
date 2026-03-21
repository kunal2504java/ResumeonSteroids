"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

export default function EducationEditor() {
  const education = useResumeStore((s) => s.resume?.education) || [];
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Education
        </h3>
        <button
          onClick={addEducation}
          className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>

      {education.map((edu, idx) => (
        <div
          key={edu.id}
          className="bg-zinc-800/50 border border-white/10 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] font-mono">
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
            <label className="block text-[10px] text-zinc-300 mb-1 font-semibold uppercase tracking-wide">
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
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors"
            />
          </div>
        </div>
      ))}

      {education.length === 0 && (
        <button
          onClick={addEducation}
          className="w-full py-8 border border-dashed border-white/10 rounded-lg text-sm text-[#71717A] hover:text-white hover:border-[#6366f1]/40 transition-colors cursor-pointer"
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
