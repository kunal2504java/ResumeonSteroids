"use client";

import type { Nudge } from "@/types/tracker";

export function NudgeBanner({ nudge }: { nudge?: Nudge }) {
  if (!nudge) return null;

  return (
    <div className="border-l-4 border-[#F97316] bg-[#1F1308] px-5 py-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FDBA74]">
            {nudge.priority} priority
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white">{nudge.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#FED7AA]">{nudge.body}</p>
        </div>
        {nudge.action_label && (
          <span className="shrink-0 border border-[#FDBA74]/30 px-3 py-2 text-xs font-semibold text-[#FDBA74]">
            {nudge.action_label}
          </span>
        )}
      </div>
    </div>
  );
}

