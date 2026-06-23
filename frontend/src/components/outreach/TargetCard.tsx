"use client";

import type { OutreachTarget } from "@/types/tracker";
import { MutualConnectionBadge } from "./MutualConnectionBadge";

interface Props {
  target: OutreachTarget;
  selected: boolean;
  onSelect: () => void;
  onGenerate: () => void;
  loading: boolean;
}

export function TargetCard({ target, selected, onSelect, onGenerate, loading }: Props) {
  return (
    <article
      className={`border p-4 transition ${
        selected ? "border-[#6366F1] bg-[#111827]" : "border-[#1E2535] bg-[#101620] hover:border-[#334155]"
      }`}
    >
      <button onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{target.target_name || "Unknown contact"}</h3>
            <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{target.target_title || "No title"}</p>
          </div>
          {target.email_confidence && (
            <span className="border border-[#273244] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#A1A1AA]">
              {target.email_confidence}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <MutualConnectionBadge name={target.mutual_connection_name} />
          {target.target_email && (
            <span className="text-xs text-[#71717A]">{target.target_email}</span>
          )}
        </div>
      </button>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="mt-4 w-full bg-white px-3 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#E5E7EB] disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate drafts"}
      </button>
    </article>
  );
}

