"use client";

import { motion, type Variants } from "framer-motion";
import Button from "@/components/ui/Button";

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const resumeLines = [
  { label: "Jake Ryan", bold: true, size: "text-base" },
  { label: "jake@resume.ai  |  github.com/jakeryan  |  (555) 012-3456", bold: false, size: "text-[10px]" },
  { label: "", bold: false, size: "" },
  { label: "Education", bold: true, size: "text-xs" },
  { label: "Stanford University — B.S. Computer Science", bold: false, size: "text-[10px]" },
  { label: "GPA: 3.92 / 4.0  •  Expected May 2025", bold: false, size: "text-[10px]" },
  { label: "", bold: false, size: "" },
  { label: "Experience", bold: true, size: "text-xs" },
  { label: "Software Engineer Intern — Google", bold: false, size: "text-[10px]" },
  { label: "• Built real-time data pipeline processing 2M events/day using Apache Kafka", bold: false, size: "text-[10px]" },
  { label: "• Reduced API latency by 40% through query optimization and caching layer", bold: false, size: "text-[10px]" },
  { label: "• Collaborated with 5 engineers to ship features used by 100K+ users", bold: false, size: "text-[10px]" },
  { label: "", bold: false, size: "" },
  { label: "Projects", bold: true, size: "text-xs" },
  { label: "CodeTracker — GitHub, LeetCode analytics dashboard", bold: false, size: "text-[10px]" },
  { label: "• Full-stack Next.js app with real-time GitHub contribution graphs", bold: false, size: "text-[10px]" },
  { label: "• Integrated LeetCode API to display problem-solving statistics", bold: false, size: "text-[10px]" },
  { label: "", bold: false, size: "" },
  { label: "Skills", bold: true, size: "text-xs" },
  { label: "Python, TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS, Git", bold: false, size: "text-[10px]" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden dot-grid noise-overlay">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center gap-16"
        >
          {/* Left content */}
          <div className="flex-1 max-w-2xl">
            {/* Announcement pill */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-indigo-light border border-indigo/30 bg-indigo/5 tracking-wide">
                <span className="animate-pulse">&#10022;</span>
                Now with GitHub + LeetCode sync
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl sm:text-6xl lg:text-[80px] font-extrabold leading-[0.95] tracking-tight text-white mb-6"
            >
              Your resume,
              <br />
              written by{" "}
              <span className="bg-gradient-to-r from-indigo via-indigo-light to-cyan bg-clip-text text-transparent">
                AI
              </span>
              .
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted max-w-lg leading-relaxed mb-8"
            >
              Connect your GitHub, LeetCode, or Codeforces. Upload your old
              resume. Our AI reads everything and builds a job-winning resume in
              seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-8">
              <Button variant="primary" className="text-sm px-7 py-3.5">
                Build my resume free
                <span aria-hidden="true">&rarr;</span>
              </Button>
              <Button variant="ghost" className="text-sm px-7 py-3.5">
                See how it works
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-background bg-gradient-to-br from-indigo/60 to-cyan/40"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted">
                Joined by{" "}
                <span className="text-white font-semibold">12,400+</span>{" "}
                engineers from Google, Meta, Amazon
              </p>
            </motion.div>
          </div>

          {/* Right: Resume mockup */}
          <motion.div
            variants={fadeUp}
            className="flex-1 max-w-md w-full relative"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-8 bg-gradient-to-br from-indigo/20 via-transparent to-cyan/10 blur-[60px] pointer-events-none" />

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="relative"
            >
              <div className="bg-[#0D0D14] border border-white/10 p-6 shadow-2xl">
                {/* Editor chrome */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-[10px] text-muted">
                    resume_final.pdf
                  </span>
                </div>

                {/* Resume content */}
                <div className="space-y-0.5 font-mono">
                  {resumeLines.map((line, i) =>
                    line.label === "" ? (
                      <div key={i} className="h-2" />
                    ) : (
                      <p
                        key={i}
                        className={`${line.size} ${
                          line.bold
                            ? "font-bold text-white"
                            : "text-zinc-400"
                        } leading-snug`}
                      >
                        {line.label}
                      </p>
                    )
                  )}
                </div>

                {/* AI cursor indicator */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo animate-pulse" />
                  <span className="text-[10px] text-indigo-light">
                    AI writing...
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
