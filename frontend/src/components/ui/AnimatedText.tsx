"use client";

import { motion } from "framer-motion";

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedText({
  children,
  className = "",
  delay = 0,
}: AnimatedTextProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
