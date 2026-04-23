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
    <section className="section-lg relative overflow-hidden bg-[#0A0A0F]">
      <div className="page-wrap relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] py-[148px] md:py-[212px] px-8 md:px-16 text-center shadow-2xl"
        >
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Floating particles */}
          {dots.map((dot, i) => (
            <FloatingDot key={i} {...dot} />
          ))}

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Build your resume in 60 seconds.
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              Join thousands of engineers who landed their dream jobs with
              ResumeAI.
            </p>
            <Button
              variant="primary"
              href="/dashboard"
              className="mt-6 rounded-full px-12 py-4 text-base"
            >
              Get started free
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
