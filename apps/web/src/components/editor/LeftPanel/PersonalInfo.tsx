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

export default function PersonalInfo() {
  const personalInfo = useResumeStore((s) => s.resume?.personalInfo);
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo);

  if (!personalInfo) return null;

  return (
    <div className="px-6 py-6 space-y-4">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-4">
        Personal Information
      </h3>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs text-zinc-300 mb-1.5 font-semibold uppercase tracking-wide">
            {f.label}
          </label>
          <input
            type="text"
            value={(personalInfo as unknown as Record<string, string>)[f.key] || ""}
            onChange={(e) => updatePersonalInfo(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#6366f1]/50 transition-colors"
          />
        </div>
      ))}
    </div>
  );
}
