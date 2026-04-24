"use client";

import type { ApplicationStatus } from "@/types/tracker";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  saved: "border-[#4B5563] text-[#D1D5DB]",
  applied: "border-[#1D4ED8] text-[#93C5FD]",
  outreach_sent: "border-[#6D28D9] text-[#C4B5FD]",
  screen_scheduled: "border-[#B45309] text-[#FCD34D]",
  interviewing: "border-[#047857] text-[#86EFAC]",
  offer: "border-[#059669] text-[#A7F3D0]",
  rejected: "border-[#B91C1C] text-[#FCA5A5]",
  withdrawn: "border-[#475569] text-[#CBD5E1]",
  ghosted: "border-[#6B7280] text-[#D1D5DB]",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

