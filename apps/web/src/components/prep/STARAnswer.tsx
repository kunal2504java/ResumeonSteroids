"use client";

import type { StarAnswer as StarAnswerType } from "@/types/tracker";

export function STARAnswer({ answer }: { answer: StarAnswerType }) {
  return (
    <article className="border border-[#1E2535] bg-[#101620] p-5">
      <h3 className="text-sm font-semibold leading-6 text-white">{answer.question}</h3>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-[#A1A1AA]">
        <p><span className="text-white">Situation:</span> {answer.situation}</p>
        <p><span className="text-white">Task:</span> {answer.task}</p>
        <p><span className="text-white">Action:</span> {answer.action}</p>
        <p><span className="text-white">Result:</span> {answer.result}</p>
      </div>
    </article>
  );
}

