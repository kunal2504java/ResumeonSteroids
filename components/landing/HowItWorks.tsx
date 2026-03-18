"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Connect your profiles",
    description:
      "Link your GitHub, LeetCode, or Codeforces accounts. We pull your repos, contributions, and problem-solving stats automatically.",
    icons: (
      <div className="flex gap-3 mt-5">
        {["GitHub", "LeetCode", "CF"].map((label) => (
          <span
            key={label}
            className="px-3 py-1 text-[10px] font-medium tracking-wide bg-indigo/10 text-indigo-light border border-indigo/20"
          >
            {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: "02",
    title: "AI reads everything",
    description:
      "Our model analyzes your code contributions, competitive programming stats, and old resume to understand your skills and achievements.",
    icons: (
      <div className="mt-5 font-mono text-xs text-muted space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-indigo animate-pulse" />
          <span>Analyzing 847 commits...</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-cyan animate-pulse" />
          <span>Writing bullet points...</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-indigo-light animate-pulse" />
          <span>Optimizing for ATS...</span>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    title: "Download & apply",
    description:
      "Get a polished, ATS-optimized resume in PDF or LaTeX. Tailored for each job description. Ready to send in seconds.",
    icons: (
      <div className="mt-5 flex gap-3">
        {["PDF", "LaTeX", "DOCX"].map((fmt) => (
          <span
            key={fmt}
            className="px-3 py-1 text-[10px] font-medium tracking-wide bg-white/5 text-foreground border border-border"
          >
            {fmt}
          </span>
        ))}
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-md bg-background relative border-t border-white/5">
      <div className="page-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title">
            From zero to hired in 3 steps
          </h2>
          <p className="section-sub">
            Import your profiles, let AI craft your resume, and start applying — all in under a minute.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:bg-white/[0.04] transition-colors"
            >
              {/* Big faded number */}
              <span className="absolute -top-10 -right-4 text-[140px] font-black text-white/[0.02] select-none pointer-events-none group-hover:text-indigo-500/[0.05] transition-colors">
                0{i + 1}
              </span>

              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                  {step.description}
                </p>
                {/* Step-specific visual */}
                <div className="mt-auto relative z-10 pt-6 border-t border-white/5">
                  {step.icons}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
