"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Connect your profiles",
    description:
      "Link your GitHub, LeetCode, or Codeforces accounts. We pull your repos, contributions, and problem-solving stats automatically.",
    icons: (
      <div className="flex gap-3 mt-4">
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
      <div className="mt-4 font-mono text-xs text-muted space-y-1.5">
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
      <div className="mt-4 flex gap-2">
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
    <section id="how-it-works" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">
            From zero to hired in 3 steps
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.4)" }}
              className="relative bg-surface border border-border p-8 overflow-hidden transition-all duration-300 group hover:shadow-[0_8px_40px_rgba(99,102,241,0.08)]"
            >
              {/* Big faded number */}
              <span className="absolute top-4 right-4 text-[120px] font-extrabold leading-none text-white/[0.03] select-none pointer-events-none">
                {step.number}
              </span>

              <div className="relative z-10">
                <span className="text-xs font-semibold text-indigo tracking-widest uppercase">
                  Step {step.number}
                </span>
                <h3 className="text-xl font-bold text-white mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {step.description}
                </p>
                {step.icons}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
