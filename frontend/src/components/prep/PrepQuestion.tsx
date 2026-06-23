"use client";

import type { PrepQuestion as PrepQuestionType } from "@/types/tracker";

export function PrepQuestion({ question }: { question: PrepQuestionType }) {
  return (
    <div className="border-l border-[#273244] py-2 pl-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">
          {question.source}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#71717A]">
          {question.category}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white">{question.question}</p>
    </div>
  );
}

