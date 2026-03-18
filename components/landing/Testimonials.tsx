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

export default function Testimonials() {
  return (
    <section className="relative py-28 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Loved by engineers everywhere
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.3)" }}
              className="bg-surface border border-border p-6 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className={`w-3.5 h-3.5 ${
                      j < t.stars ? "text-indigo" : "text-white/10"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-5">
                &quot;{t.quote}&quot;
              </p>

              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-muted">{t.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
