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
      className="bg-[#161B27] border border-[#1E2535] p-5 group hover:border-[#6366f1]/30 transition-all cursor-pointer"
      onClick={onEdit}
    >
      {/* Preview thumbnail */}
      <div className="bg-white h-40 mb-4 flex items-center justify-center overflow-hidden">
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
      </div>

      {/* Info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            {resume.name || "Untitled Resume"}
          </h3>
          <p className="text-[11px] text-[#71717A] mt-0.5">
            {getTimeSince(resume.updatedAt)}
          </p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20">
          {resume.template}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="text-[10px] text-[#71717A] hover:text-white transition-colors cursor-pointer"
        >
          Duplicate
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}
