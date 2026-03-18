"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/60 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-indigo transition-transform duration-200 group-hover:scale-110"
          >
            <path
              d="M10 1L12.39 7.26L19 8.27L14.5 12.14L15.82 18.54L10 15.27L4.18 18.54L5.5 12.14L1 8.27L7.61 7.26L10 1Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight text-white">
            ResumeAI
          </span>
        </a>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex text-xs px-4 py-2">
            Sign in
          </Button>
          <Button variant="primary" className="text-xs px-4 py-2">
            Get started free
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
