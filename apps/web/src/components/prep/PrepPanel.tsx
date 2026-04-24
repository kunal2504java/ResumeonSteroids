"use client";

import type { InterviewPrep } from "@/types/tracker";
import { PrepQuestion } from "./PrepQuestion";
import { STARAnswer } from "./STARAnswer";

export function PrepPanel({ prep }: { prep: InterviewPrep }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.42fr_1fr]">
      <section className="border border-[#1E2535] bg-[#101620] p-5">
        <h2 className="text-sm font-semibold text-white">Likely questions</h2>
        <p className="mt-1 text-xs text-[#71717A]">
          Company patterns and resume-specific probes combined.
        </p>
        <div className="mt-5 space-y-4">
          {prep.questions.map((question, index) => (
            <PrepQuestion key={`${question.question}-${index}`} question={question} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-sm font-semibold text-white">STAR answer outlines</h2>
        <div className="space-y-4">
          {prep.star_answers.map((answer, index) => (
            <STARAnswer key={`${answer.question}-${index}`} answer={answer} />
          ))}
        </div>
      </section>
    </div>
  );
}

