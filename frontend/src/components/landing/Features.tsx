"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    title: "AI bullet writer",
    description:
      "Automatically generates impactful, quantified bullet points from your raw experience. No more staring at a blank page.",
    preview: (
      <div className="font-mono text-[11px] leading-relaxed space-y-3">
        <div className="text-indigo-400/80 mb-4">
          {"// Analyzing your GitHub + experience..."}
        </div>
        {[
          'Architected real-time data pipeline handling 2M+ events/day, reducing processing latency by 65%',
          'Led migration from monolith to microservices, improving deployment frequency from weekly to 15x/day',
          'Built ML-powered recommendation engine serving 50K daily active users with 94% relevance score',
          'Reduced infrastructure costs by $40K/year through automated scaling and resource optimization',
          'Mentored 4 junior engineers, conducting 200+ code reviews that reduced bug rate by 38%',
        ].map((bullet, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex gap-3 text-zinc-300"
          >
            <span className="text-zinc-600 select-none">•</span>
            <span>{bullet}</span>
          </motion.div>
        ))}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <div className="w-1.5 h-3 bg-indigo-500 animate-pulse" />
          <span className="text-indigo-400">Generating more suggestions...</span>
        </div>
      </div>
    ),
  },
  {
    title: "GitHub project importer",
    description:
      "Pulls your top repositories, languages, and contribution data. Turns code into resume-ready project descriptions.",
    preview: (
      <div className="space-y-3 text-xs">
        <div className="text-muted mb-4 font-mono">Imported from GitHub:</div>
        {[
          { repo: "data-pipeline", lang: "Python", stars: 142 },
          { repo: "next-dashboard", lang: "TypeScript", stars: 89 },
          { repo: "ml-classifier", lang: "Python", stars: 67 },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center justify-between p-3 bg-white/[0.02] border border-[#1E2535]"
          >
            <div className="flex items-center gap-3">
              <span className="text-indigo font-mono">/</span>
              <span className="text-white font-medium">{item.repo}</span>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <span>{item.lang}</span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                </svg>
                {item.stars}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "LeetCode stats sync",
    description:
      "Syncs your LeetCode profile to showcase problem-solving ability. Highlights contest ratings and solve counts.",
    preview: (
      <div className="text-xs">
        <div className="text-muted mb-4 font-mono">LeetCode Profile:</div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Solved", value: "847", color: "text-indigo-light" },
            { label: "Contest Rating", value: "1,923", color: "text-cyan" },
            { label: "Top %", value: "4.2%", color: "text-indigo" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 bg-white/[0.02] border border-[#1E2535] text-center">
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 items-end h-12">
          {[40, 65, 55, 80, 70, 90, 75, 85, 95, 60, 88, 72].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-1 bg-gradient-to-t from-indigo to-cyan/50 rounded-[1px]"
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Job description tailor",
    description:
      "Paste any job description — AI rewrites your resume to match keywords, tone, and requirements for maximum relevance.",
    preview: (
      <div className="text-xs space-y-4">
        <div className="p-4 bg-white/[0.02] border border-[#1E2535]">
          <div className="text-muted font-mono mb-2">Job Description:</div>
          <p className="text-foreground leading-relaxed">
            &quot;Looking for a <span className="text-indigo-light font-medium">senior backend engineer</span> with
            experience in <span className="text-cyan font-medium">distributed systems</span> and{" "}
            <span className="text-indigo font-medium">cloud infrastructure</span>...&quot;
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <svg className="w-4 h-4 text-indigo animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M6.34 6.34L3.51 3.51" />
          </svg>
          <span>Tailoring resume to match...</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["distributed systems", "cloud infrastructure", "backend", "scalability"].map((kw) => (
            <span key={kw} className="px-2.5 py-1 bg-indigo/10 text-indigo-light border border-indigo/20 text-[10px]">
              {kw}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "ATS score checker",
    description:
      "Instant ATS compatibility score. See exactly what's missing and fix it before you apply.",
    preview: (
      <div className="text-xs">
        <div className="flex items-center justify-between mb-5">
          <span className="text-muted font-mono">ATS Score</span>
          <span className="text-3xl font-bold text-indigo-light">94%</span>
        </div>
        <div className="space-y-3">
          {[
            { label: "Keyword match", score: 96, color: "bg-indigo" },
            { label: "Formatting", score: 100, color: "bg-cyan" },
            { label: "Section structure", score: 92, color: "bg-indigo-light" },
            { label: "Readability", score: 88, color: "bg-indigo" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-muted mb-1.5">
                <span>{item.label}</span>
                <span className="text-foreground">{item.score}%</span>
              </div>
              <div className="h-1.5 bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Features() {
  const [active, setActive] = useState(0);

  return (
    <section id="features" className="section-lg border-t border-white/5 bg-[#0A0A0F]">
      <div className="page-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="section-eyebrow">Features</p>
          <h2 className="section-title">
            Everything you need to land interviews
          </h2>
          <p className="section-sub">
            From AI-powered bullet writing to ATS optimization — every tool a job seeker needs, in one place.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start mt-16">
          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-2"
          >
            {features.map((feature, i) => (
              <button
                key={feature.title}
                onClick={() => setActive(i)}
                className={`text-left px-5 py-4 rounded-xl transition-all duration-200 cursor-pointer ${
                  active === i
                    ? "bg-indigo-500/10 border border-indigo-500/25 text-white"
                    : "border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                }`}
              >
                <h3 className="text-base font-semibold mb-1 flex items-center">
                  <span className={`mr-3 ${active === i ? "text-indigo-400" : "text-zinc-600"}`}>
                    0{i + 1}
                  </span>
                  {feature.title}
                </h3>
                {active === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-indigo-200/70 leading-relaxed pl-8 mt-2"
                  >
                    {feature.description}
                  </motion.p>
                )}
              </button>
            ))}
          </motion.div>

          {/* Preview panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0D0D14] rounded-2xl border border-white/10 overflow-hidden shadow-2xl sticky top-32"
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="ml-2 text-[10px] text-zinc-500 font-mono tracking-wider">
                {features[active].title}
              </span>
            </div>

            {/* Content — FIXED height, content fills it */}
            <div className="p-8 h-[340px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  {features[active].preview}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
