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
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-4">
        Personal Information
      </h3>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-[11px] text-[#71717A] mb-1 font-medium">
            {f.label}
          </label>
          <input
            type="text"
            value={(personalInfo as unknown as Record<string, string>)[f.key] || ""}
            onChange={(e) => updatePersonalInfo(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-[#0D1117] border border-[#1E2535] px-3 py-2 text-sm text-white placeholder:text-[#71717A]/50 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
          />
        </div>
      ))}
    </div>
  );
}
