"use client";

import Link from "next/link";
import type { Nudge } from "@/types/tracker";

interface Props {
  nudges: Nudge[];
  onDismiss: (id: string) => void;
  onComplete: (id: string) => void;
}

function priorityClass(priority: Nudge["priority"]) {
  if (priority === "high") return "border-[#F97316] text-[#FDBA74]";
  if (priority === "medium") return "border-[#EAB308] text-[#FDE68A]";
  return "border-[#334155] text-[#A1A1AA]";
}

export function NudgeList({ nudges, onDismiss, onComplete }: Props) {
  if (nudges.length === 0) {
    return (
      <aside className="border border-[#1E2535] bg-[#101620] p-5">
        <h2 className="text-sm font-semibold text-white">Next actions</h2>
        <p className="mt-3 text-sm leading-6 text-[#71717A]">
          You are on top of everything. Check back after the next tracker update.
        </p>
      </aside>
    );
  }

  return (
    <aside className="border border-[#1E2535] bg-[#101620]">
      <div className="border-b border-[#1E2535] p-5">
        <h2 className="text-sm font-semibold text-white">Next actions</h2>
        <p className="mt-1 text-xs text-[#71717A]">{nudges.length} active nudges</p>
      </div>
      <div className="divide-y divide-[#1E2535]">
        {nudges.map((nudge) => (
          <div key={nudge.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${priorityClass(nudge.priority)}`}>
                {nudge.priority}
              </span>
              <button
                onClick={() => onDismiss(nudge.id)}
                className="text-xs text-[#71717A] transition hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <h3 className="mt-3 text-sm font-medium text-white">{nudge.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">{nudge.body}</p>
            {nudge.due_date && (
              <p className="mt-3 text-[11px] text-[#71717A]">Due {new Date(nudge.due_date).toLocaleDateString()}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Link
                href={`/tracker/${nudge.application_id}`}
                className="flex-1 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0D1117] transition hover:bg-[#E5E7EB]"
              >
                {nudge.action_label || "Open"}
              </Link>
              <button
                onClick={() => onComplete(nudge.id)}
                className="border border-[#273244] px-3 py-2 text-xs text-white transition hover:bg-[#172033]"
              >
                Done
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

