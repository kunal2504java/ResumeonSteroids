"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const tiers = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for trying it out",
    features: [
      { text: "1 resume", included: true },
      { text: "GitHub import", included: true },
      { text: "Basic AI bullets", included: true },
      { text: "PDF export", included: true },
      { text: "Job tailoring", included: false },
      { text: "ATS checker", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    yearlyPrice: 8,
    description: "For serious job seekers",
    features: [
      { text: "Unlimited resumes", included: true },
      { text: "All integrations", included: true },
      { text: "Advanced AI bullets", included: true },
      { text: "PDF + LaTeX export", included: true },
      { text: "Job tailoring", included: true },
      { text: "ATS checker", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start Pro trial",
    highlighted: true,
  },
  {
    name: "Team",
    monthlyPrice: 29,
    yearlyPrice: 22,
    description: "For bootcamps & career teams",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Team dashboard", included: true },
      { text: "Bulk resume generation", included: true },
      { text: "Custom templates", included: true },
      { text: "Analytics & tracking", included: true },
      { text: "Admin controls", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-28 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted text-sm">
            Start free. Upgrade when you need more.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <span
            className={`text-sm ${
              !annual ? "text-white" : "text-muted"
            } transition-colors`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 bg-surface border border-border cursor-pointer p-0.5"
          >
            <motion.div
              className="w-5 h-5 bg-indigo"
              animate={{ x: annual ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span
            className={`text-sm ${
              annual ? "text-white" : "text-muted"
            } transition-colors`}
          >
            Annual{" "}
            <span className="text-xs text-indigo-light font-medium">
              Save 30%
            </span>
          </span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-surface p-8 transition-all duration-300 ${
                tier.highlighted
                  ? "border-2 border-indigo shadow-[0_0_60px_rgba(99,102,241,0.1)]"
                  : "border border-border"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo text-white text-[10px] font-semibold tracking-widest uppercase">
                  Most popular
                </div>
              )}

              <h3 className="text-lg font-bold text-white">{tier.name}</h3>
              <p className="text-xs text-muted mt-1 mb-5">
                {tier.description}
              </p>

              <div className="mb-6">
                <motion.span
                  key={annual ? "annual" : "monthly"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-extrabold text-white"
                >
                  $
                  {annual ? tier.yearlyPrice : tier.monthlyPrice}
                </motion.span>
                <span className="text-sm text-muted">/mo</span>
              </div>

              <Button
                variant={tier.highlighted ? "primary" : "ghost"}
                className="w-full text-sm mb-8"
              >
                {tier.cta}
              </Button>

              <div className="space-y-3">
                {tier.features.map((feature) => (
                  <div
                    key={feature.text}
                    className="flex items-center gap-3 text-sm"
                  >
                    {feature.included ? (
                      <svg
                        className="w-4 h-4 text-indigo shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-white/15 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 12H6"
                        />
                      </svg>
                    )}
                    <span
                      className={
                        feature.included ? "text-foreground" : "text-muted"
                      }
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
