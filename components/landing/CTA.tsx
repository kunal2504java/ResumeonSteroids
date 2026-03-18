"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

function FloatingDot({ delay, x, y }: { delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-indigo/40 rounded-full"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const dots = [
  { delay: 0, x: "10%", y: "20%" },
  { delay: 0.5, x: "25%", y: "70%" },
  { delay: 1, x: "40%", y: "30%" },
  { delay: 1.5, x: "60%", y: "80%" },
  { delay: 0.3, x: "75%", y: "15%" },
  { delay: 0.8, x: "85%", y: "60%" },
  { delay: 1.2, x: "15%", y: "50%" },
  { delay: 0.6, x: "90%", y: "40%" },
  { delay: 1.8, x: "50%", y: "10%" },
  { delay: 0.9, x: "70%", y: "45%" },
];

export default function CTA() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-surface p-16 text-center"
          style={{
            border: "2px solid transparent",
            backgroundClip: "padding-box",
            backgroundImage:
              "linear-gradient(#111118, #111118), linear-gradient(135deg, #6366f1, #22d3ee, #6366f1)",
            backgroundOrigin: "padding-box, border-box",
          }}
        >
          {/* Floating particles */}
          {dots.map((dot, i) => (
            <FloatingDot key={i} {...dot} />
          ))}

          <div className="relative z-10">
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              Build your resume in 60 seconds.
            </h2>
            <p className="text-muted text-sm max-w-md mx-auto mb-8">
              Join thousands of engineers who landed their dream jobs with
              ResumeAI.
            </p>
            <Button variant="primary" className="text-sm px-10 py-4">
              Get started free
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
