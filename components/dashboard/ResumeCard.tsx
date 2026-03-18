"use client";

import { motion } from "framer-motion";
import { getTimeSince } from "@/lib/utils/resumeHelpers";
import type { Resume } from "@/types/resume";

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
      className="bg-[#161B27] border border-[#1E2535] group hover:border-[#6366f1]/30 transition-all cursor-pointer overflow-hidden"
      onClick={onEdit}
    >
      {/* Preview thumbnail */}
      <div className="relative bg-white h-44 overflow-hidden">
        <div className="transform scale-[0.18] origin-top-left w-[816px] h-[1056px] pointer-events-none">
          <div className="bg-white text-black px-12 py-8" style={{ fontFamily: "Georgia, serif", fontSize: "10.5pt" }}>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ fontVariant: "small-caps" }}>
                {resume.personalInfo.name || "Your Name"}
              </div>
              <div className="text-[8pt] text-gray-600 mt-0.5">
                {[resume.personalInfo.email, resume.personalInfo.phone].filter(Boolean).join(" | ")}
              </div>
            </div>
            {resume.experience.length > 0 && (
              <div className="mt-3 border-t border-black pt-1">
                <div className="font-bold text-[9pt] uppercase">Experience</div>
                {resume.experience.slice(0, 2).map((exp) => (
                  <div key={exp.id} className="mt-1">
                    <div className="font-bold text-[8pt]">{exp.company}</div>
                    <div className="text-[7pt] text-gray-600">{exp.title}</div>
                  </div>
                ))}
              </div>
            )}
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
