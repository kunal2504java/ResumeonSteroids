"use client";

import type { Application, ApplicationStatus } from "@/types/tracker";
import { ApplicationCard } from "./ApplicationCard";

const COLUMNS: Array<{ status: ApplicationStatus; label: string; color: string }> = [
  { status: "saved", label: "Saved", color: "#6B7280" },
  { status: "applied", label: "Applied", color: "#3B82F6" },
  { status: "outreach_sent", label: "Outreach", color: "#8B5CF6" },
  { status: "screen_scheduled", label: "Screen", color: "#F59E0B" },
  { status: "interviewing", label: "Interviewing", color: "#10B981" },
  { status: "offer", label: "Offer", color: "#059669" },
  { status: "rejected", label: "Rejected", color: "#EF4444" },
  { status: "ghosted", label: "Ghosted", color: "#9CA3AF" },
];

interface Props {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationBoard({ applications, onStatusChange }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/20 p-3 pb-4 backdrop-blur-md">
      <div className="grid min-w-[1180px] grid-cols-8 gap-2">
        {COLUMNS.map((column) => {
          const items = applications.filter((application) => application.status === column.status);
          return (
            <section
              key={column.status}
              className="min-h-[560px] rounded-xl border border-white/[0.06] bg-black/20 p-3"
            >
              <header className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {column.label}
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-zinc-600">{items.length}</span>
              </header>
              <div className="space-y-3">
                {items.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
