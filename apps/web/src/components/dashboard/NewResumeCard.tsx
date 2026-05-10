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
      className="group flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] shadow-[0_28px_90px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-inner shadow-white/10 transition-colors group-hover:bg-white/10">
        <svg
          className="h-6 w-6 text-white"
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
      <span className="text-sm font-medium text-zinc-400 transition-colors group-hover:text-white">
        New Resume
      </span>
    </motion.button>
  );
}
