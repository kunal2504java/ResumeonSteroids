"use client";

import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

export default function GlowCard({
  children,
  className = "",
  hoverGlow = true,
}: GlowCardProps) {
  return (
    <motion.div
      className={`relative bg-surface border border-border p-6 transition-all duration-300 ${
        hoverGlow
          ? "hover:border-indigo/40 hover:shadow-[0_8px_40px_rgb(var(--accent-rgb)_/_0.14)]"
          : ""
      } ${className}`}
      whileHover={hoverGlow ? { y: -4 } : undefined}
    >
      {children}
    </motion.div>
  );
}
