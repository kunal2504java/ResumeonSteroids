"use client";

import { motion } from "framer-motion";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  href,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-indigo text-white hover:bg-indigo-light shadow-[0_0_24px_rgba(99,102,241,0.25)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)]",
    ghost:
      "bg-transparent text-foreground border border-border hover:border-white/25 hover:text-white",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      className={classes}
      onClick={onClick}
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </Component>
  );
}
