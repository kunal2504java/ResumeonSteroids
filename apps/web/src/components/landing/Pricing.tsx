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
    <section id="pricing" className="section-lg bg-background relative border-t border-white/5">
      <div className="page-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="section-eyebrow">Pricing</p>
          <h2 className="section-title">
            Simple, transparent pricing
          </h2>
          <p className="section-sub">
            Start free. Upgrade when you need more power.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center items-center gap-4 mb-20 mt-16"
        >
          <span className={`text-sm ${!annual ? "text-white" : "text-zinc-500"} transition-colors`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              annual ? "bg-indigo-500" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                annual ? "translate-x-6" : ""
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-white" : "text-zinc-500"} transition-colors`}>
            Annual <span className="text-xs text-emerald-400 ml-1">Save 30%</span>
          </span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-white/[0.02] border rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                tier.highlighted
                  ? "border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
                  : "border-white/5"
              }`}
            >
              {/* Badge positioned absolutely above the border */}
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg">
                    Most popular
                  </span>
                </div>
              )}

              <div className="flex flex-col flex-1">
                {/* Header */}
                <div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    {tier.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mt-6">
                  <motion.span
                    key={annual ? "annual" : "monthly"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold text-white"
                  >
                    ${annual ? tier.yearlyPrice : tier.monthlyPrice}
                  </motion.span>
                  <span className="text-zinc-500">/mo</span>
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <Button
                    variant={tier.highlighted ? "primary" : "ghost"}
                    href={tier.name === "Team" ? "#pricing" : "/dashboard"}
                    className="w-full text-sm"
                  >
                    {tier.cta}
                  </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 my-8" />

                {/* Feature list */}
                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div
                      key={feature.text}
                      className="flex gap-3 text-sm"
                    >
                      {feature.included ? (
                        <svg
                          className="w-5 h-5 text-indigo-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white/10 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20 12H4"
                          />
                        </svg>
                      )}
                      <span
                        className={
                          feature.included ? "text-zinc-300" : "text-zinc-600"
                        }
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
