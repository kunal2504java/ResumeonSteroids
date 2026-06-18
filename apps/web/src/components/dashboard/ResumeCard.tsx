"use client";

import { getTimeSince } from "@/lib/utils/resumeHelpers";
import type { Resume } from "@resumeai/shared";

interface ResumeCardProps {
  resume: Resume;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  tilt?: number;
}

export default function ResumeCard({
  resume,
  onEdit,
  onDuplicate,
  onDelete,
  tilt = 0,
}: ResumeCardProps) {
  return (
    <div
      className="sheet-card group aspect-[3/4] cursor-pointer"
      style={{ transform: `rotate(${tilt}deg)` }}
      onClick={onEdit}
    >
      {/* pin + manila tab */}
      <span className="pin" style={{ top: -5, left: 18, zIndex: 3 }} />
      <span className="tab" style={{ position: "absolute", top: -13, right: 14, zIndex: 3 }}>
        {resume.template}
      </span>

      {/* Preview thumbnail — an actual paper resume, scaled to fit */}
      <div className="relative flex-1 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="absolute inset-0">
          <div className="w-[816px] h-[1056px] pointer-events-none origin-top-left" style={{ transform: "scale(0.25)" }}>
            <div
              className="bg-white text-black px-[48px] py-[48px]"
              style={{
                fontFamily:
                  '"Latin Modern Roman", "CMU Serif", "Computer Modern Serif", "STIX Two Text", "Times New Roman", serif',
                fontSize: "10.5pt",
                lineHeight: "1.15",
              }}
            >
              <div className="text-center mb-1">
                <div className="font-bold tracking-wide" style={{ fontSize: "24pt", fontVariant: "small-caps", lineHeight: "1.05" }}>
                  {resume.personalInfo.name || "Your Name"}
                </div>
                {resume.personalInfo.location && (
                  <div className="text-[9.5pt] mt-[1px]">{resume.personalInfo.location}</div>
                )}
                <div className="text-[9pt] mt-[1px]">
                  {[resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.linkedin?.replace(/https?:\/\/(www\.)?/, "")].filter(Boolean).join(" | ")}
                </div>
              </div>
              {resume.experience.length > 0 && (
                <div className="mb-2">
                  <div className="border-b border-black pb-0.5 mb-1.5" style={{ fontSize: "12pt", fontVariant: "small-caps", lineHeight: "1.05" }}>
                    Experience
                  </div>
                  {resume.experience.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="mb-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold">{exp.company}</span>
                        <span className="text-[9.5pt]">{exp.startDate}{exp.endDate ? ` -- ${exp.endDate}` : ""}</span>
                      </div>
                      <div className="italic text-[9.5pt]">{exp.title}</div>
                    </div>
                  ))}
                </div>
              )}
              {resume.education.length > 0 && (
                <div className="mb-2">
                  <div className="border-b border-black pb-0.5 mb-1.5" style={{ fontSize: "12pt", fontVariant: "small-caps", lineHeight: "1.05" }}>
                    Education
                  </div>
                  {resume.education.slice(0, 1).map((edu) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold">{edu.institution}</span>
                        <span className="text-[9.5pt]">{edu.location}</span>
                      </div>
                      <div className="italic text-[9.5pt]">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12" style={{ background: "linear-gradient(to top, var(--sheet), transparent)" }} />
      </div>

      {/* footer */}
      <div style={{ padding: "14px 16px", borderTop: "1.5px solid var(--hairline)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              {resume.name || "Untitled Resume"}
            </h3>
            <p className="hand hand-ink" style={{ fontSize: 14, marginTop: 2 }}>
              edited {getTimeSince(resume.updatedAt)}
            </p>
          </div>
        </div>

        <div
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}
        >
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
            Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", cursor: "pointer" }}>
            Duplicate
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="mono" style={{ fontSize: 12, color: "var(--pen)", cursor: "pointer", marginLeft: "auto" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
