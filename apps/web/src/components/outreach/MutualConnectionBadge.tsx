"use client";

export function MutualConnectionBadge({ name }: { name?: string | null }) {
  if (!name) return null;
  return (
    <span className="border border-[#14532D] bg-[#052E16] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86EFAC]">
      Mutual: {name}
    </span>
  );
}

