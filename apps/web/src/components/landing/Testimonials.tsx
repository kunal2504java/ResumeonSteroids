"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "ResumeAI turned my messy GitHub profile into a resume that got me interviews at 3 FAANG companies. Unreal.",
    name: "Sarah Chen",
    title: "SWE @ Google",
    stars: 5,
  },
  {
    quote:
      "I was mass-applying and getting ghosted. After using ResumeAI to tailor my resume per job, my response rate went from 2% to 35%.",
    name: "Marcus Johnson",
    title: "Backend Engineer @ Stripe",
    stars: 5,
  },
  {
    quote:
      "The LeetCode integration is genius. It automatically highlighted my contest rating and solve count — interviewers noticed.",
    name: "Priya Patel",
    title: "SDE II @ Amazon",
    stars: 5,
  },
  {
    quote:
      "As a PM, I loved how it pulled my technical contributions from GitHub while also framing my leadership experience properly.",
    name: "David Kim",
    title: "Product Manager @ Meta",
    stars: 5,
  },
  {
    quote:
      "Went from a generic 2-page resume to a perfectly optimized single page. Got my first FAANG offer within a month.",
    name: "Alex Rivera",
    title: "Frontend Engineer @ Netflix",
    stars: 5,
  },
  {
    quote:
      "The ATS checker alone is worth it. I had no idea my resume was getting filtered out by formatting issues. Fixed in 2 minutes.",
    name: "Emma Larsson",
    title: "UX Designer @ Figma",
    stars: 4,
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

export default function Testimonials() {
  return (
    <section className="section-md bg-[#0A0A0F] relative border-t border-white/5">
      <div className="page-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="section-eyebrow">Testimonials</p>
          <h2 className="section-title">
            Loved by engineers everywhere
          </h2>
          <p className="section-sub">
            Thousands of developers have landed their dream jobs with ResumeAI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col h-full hover:bg-white/[0.04] transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(t.stars)].map((_, j) => (
                  <svg
                    key={j}
                    className="w-4 h-4 text-amber-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.572-.955L10 0l2.94 5.955 6.572.955-4.756 4.635 1.122 6.545z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-zinc-300 leading-relaxed mb-8 flex-1">
                "{t.quote}"
              </p>

              {/* Author — always at bottom, never clipped */}
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/60 to-cyan-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {getInitials(t.name)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
