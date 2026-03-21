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
      className="bg-[#161B27] border border-[#1E2535] group hover:border-[#6366f1]/30 transition-all cursor-pointer overflow-hidden rounded-lg aspect-[3/4] flex flex-col"
      onClick={onEdit}
    >
      {/* Preview thumbnail — renders at 816px then scales to fit */}
      <div className="relative bg-white flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="w-[816px] h-[1056px] pointer-events-none origin-top-left"
            style={{ transform: "scale(0.25)" }}
          >
            <div className="bg-white text-black px-[48px] py-[36px]" style={{ fontFamily: '"CMU Serif", Georgia, "Times New Roman", serif', fontSize: "10.5pt", lineHeight: "1.25" }}>
              <div className="text-center mb-1">
                <div className="font-bold tracking-wide" style={{ fontSize: "22pt", fontVariant: "small-caps" }}>
                  {resume.personalInfo.name || "Your Name"}
                </div>
                <div className="text-[9pt] mt-0.5">
                  {[resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.linkedin?.replace(/https?:\/\/(www\.)?/, "")].filter(Boolean).join(" | ")}
                </div>
              </div>
              {resume.experience.length > 0 && (
                <div className="mb-2">
                  <div className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={{ fontSize: "11pt", fontVariant: "small-caps" }}>Experience</div>
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
                  <div className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={{ fontSize: "11pt", fontVariant: "small-caps" }}>Education</div>
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
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#161B27] to-transparent" />
      </div>

      {/* Card footer */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-0.5">
              {resume.name || "Untitled Resume"}
            </h3>
            <p className="text-[11px] text-[#71717A]">
              Edited {getTimeSince(resume.updatedAt)}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20 shrink-0">
            {resume.template}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-[#1E2535]">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-[11px] text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-[11px] text-[#71717A] hover:text-white transition-colors cursor-pointer"
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
