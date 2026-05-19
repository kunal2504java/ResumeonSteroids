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
      <aside className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md">
        <h2 className="text-sm font-semibold text-white">Next actions</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          You are on top of everything. Check back after the next tracker update.
        </p>
      </aside>
    );
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-sm font-semibold text-white">Next actions</h2>
        <p className="mt-1 text-xs text-zinc-500">{nudges.length} active nudges</p>
      </div>
      <div className="divide-y divide-white/10">
        {nudges.map((nudge) => (
          <div key={nudge.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${priorityClass(nudge.priority)}`}>
                {nudge.priority}
              </span>
              <button
                onClick={() => onDismiss(nudge.id)}
                className="text-xs text-zinc-500 transition hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <h3 className="mt-3 text-sm font-medium text-white">{nudge.title}</h3>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{nudge.body}</p>
            {nudge.due_date && (
              <p className="mt-3 text-[11px] text-zinc-600">Due {new Date(nudge.due_date).toLocaleDateString()}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Link
                href={`/tracker/${nudge.application_id}`}
                className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-xs font-semibold text-black transition hover:brightness-95"
              >
                {nudge.action_label || "Open"}
              </Link>
              <button
                onClick={() => onComplete(nudge.id)}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
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
