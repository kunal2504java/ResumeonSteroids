"use client";

import { motion } from "framer-motion";

interface NewResumeCardProps {
  onClick: () => void;
}

export default function NewResumeCard({ onClick }: NewResumeCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-[#161B27] border border-dashed border-[#1E2535] hover:border-[#6366f1]/40 flex flex-col items-center justify-center min-h-[320px] transition-all cursor-pointer group"
    >
      <div className="w-14 h-14 flex items-center justify-center bg-[#6366f1]/10 border border-[#6366f1]/20 mb-5 group-hover:bg-[#6366f1]/20 transition-colors">
        <svg
          className="w-6 h-6 text-[#6366f1]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
      <span className="text-sm font-medium text-[#71717A] group-hover:text-white transition-colors">
        New Resume
      </span>
    </motion.button>
  );
}
