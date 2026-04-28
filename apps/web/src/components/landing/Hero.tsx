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
    <section className="section-lg relative overflow-hidden bg-background">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="page-wrap relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
        >
          {/* Left content */}
          <div className="flex-1 max-w-2xl flex flex-col justify-center">
            {/* Announcement pill */}
            <motion.div variants={fadeUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 rounded-full tracking-wide">
                <span className="animate-pulse">&#10022;</span>
                Now with GitHub + LeetCode sync
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl sm:text-6xl lg:text-[80px] font-extrabold leading-[1] tracking-tight text-white mb-6"
            >
              Your resume,
              <br />
              written by{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                AI
              </span>
              .
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="text-lg text-zinc-400 max-w-lg leading-relaxed mb-10"
            >
              Connect your GitHub, LeetCode, or Codeforces. Upload your old
              resume. Our AI reads everything and builds a job-winning resume in
              seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-10">
              <Button
                variant="primary"
                href="/dashboard"
                className="text-sm px-8 py-4 font-semibold"
              >
                Build my resume free
                <span aria-hidden="true" className="ml-2">&rarr;</span>
              </Button>
              <Button
                variant="ghost"
                href="#how-it-works"
                className="text-sm px-8 py-4 font-semibold text-zinc-300 hover:text-white"
              >
                See how it works
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 mt-4">
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-indigo-500/60 to-cyan-500/40 shadow-sm"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <p className="text-sm text-zinc-400">
                Joined by <span className="text-white font-semibold">12,400+</span> engineers<br/>from Google, Meta, Amazon
              </p>
            </motion.div>
          </div>

          {/* Right: Resume mockup */}
          <motion.div
            variants={fadeUp}
            className="flex-1 w-full max-w-[500px] relative"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-8 bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-500/10 blur-[60px] pointer-events-none rounded-full" />

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0D0D14] shadow-2xl"
            >
              {/* Editor chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">
                  resume_final.pdf
                </span>
              </div>

              {/* Resume content - white paper simulation */}
              <div className="p-8 bg-[#FAFAFA] m-4 rounded shadow-sm min-h-[400px]">
                <div className="text-center border-b border-zinc-200 pb-4 mb-4">
                  <h3 className="text-2xl font-bold text-zinc-900 font-serif">Jake Ryan</h3>
                  <p className="text-[11px] text-zinc-600 mt-1 font-sans">
                    jake@resume.ai | github.com/jakeryan | (555) 012-3456
                  </p>
                </div>

                <div className="space-y-1.5 font-sans">
                  {resumeLines.map((line, index) =>
                    line.label ? (
                      <div
                        key={`${line.label}-${index}`}
                        className={`${line.size} ${
                          line.bold
                            ? "font-bold text-zinc-900 uppercase tracking-wider"
                            : "text-zinc-700"
                        }`}
                      >
                        {line.label}
                      </div>
                    ) : (
                      <div key={`spacer-${index}`} className="h-2" />
                    )
                  )}
                </div>

                {/* AI cursor indicator */}
                <div className="mt-8 flex items-center gap-2 bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-full w-max mx-auto shadow-sm border border-indigo-500/20">
                  <div className="w-1.5 h-3 bg-indigo-600 animate-pulse rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
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
