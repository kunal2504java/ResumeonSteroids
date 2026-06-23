"use client";

import { useResumeStore } from "@/lib/store/resumeStore";

const fields = [
  { key: "name", label: "Full Name", placeholder: "Jake Ryan" },
  { key: "email", label: "Email", placeholder: "jake@email.com" },
  { key: "phone", label: "Phone", placeholder: "(555) 012-3456" },
  { key: "location", label: "Location", placeholder: "San Francisco, CA" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/jakeryan" },
  { key: "github", label: "GitHub", placeholder: "github.com/jakeryan" },
  { key: "website", label: "Website", placeholder: "jakeryan.dev" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";

export default function PersonalInfo() {
  const personalInfo = useResumeStore((s) => s.resume?.personalInfo);
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo);

  if (!personalInfo) return null;

  return (
    <div className="space-y-4 px-6 py-6">
      <h3 className="ed-section-title mb-4">Personal Information</h3>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {f.label}
          </label>
          <input
            type="text"
            value={(personalInfo as unknown as Record<string, string>)[f.key] || ""}
            onChange={(e) => updatePersonalInfo(f.key, e.target.value)}
            placeholder={f.placeholder}
            className={inputClass}
          />
        </div>
      ))}
    </div>
  );
}
