"use client";

import { motion } from "framer-motion";
import { getTimeSince } from "@/lib/utils/resumeHelpers";
import type { Resume } from "@resumeai/shared";

interface ResumeCardProps {
  resume: Resume;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ResumeCard({
  resume,
  onEdit,
  onDuplicate,
  onDelete,
}: ResumeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.065]"
      onClick={onEdit}
    >
      {/* Preview thumbnail — renders at 816px then scales to fit */}
      <div className="relative bg-white flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="w-[816px] h-[1056px] pointer-events-none origin-top-left"
            style={{ transform: "scale(0.25)" }}
          >
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
                <div
                  className="font-bold tracking-wide"
                  style={{ fontSize: "24pt", fontVariant: "small-caps", lineHeight: "1.05" }}
                >
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
                  <div
                    className="border-b border-black pb-0.5 mb-1.5"
                    style={{ fontSize: "12pt", fontVariant: "small-caps", lineHeight: "1.05" }}
                  >
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
                  <div
                    className="border-b border-black pb-0.5 mb-1.5"
                    style={{ fontSize: "12pt", fontVariant: "small-caps", lineHeight: "1.05" }}
                  >
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
        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Card footer */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="mb-0.5 text-sm font-medium tracking-tight text-white">
              {resume.name || "Untitled Resume"}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Edited {getTimeSince(resume.updatedAt)}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur">
            {resume.template}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-white/10 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="cursor-pointer text-[11px] font-medium text-white transition-colors hover:text-zinc-300"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="cursor-pointer text-[11px] text-zinc-500 transition-colors hover:text-white"
          >
            Duplicate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}
