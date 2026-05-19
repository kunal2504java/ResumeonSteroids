"use client";

import Link from "next/link";
import type { Application, ApplicationStatus } from "@/types/tracker";
import { StatusBadge } from "./StatusBadge";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "#6B7280",
  applied: "#3B82F6",
  outreach_sent: "#8B5CF6",
  screen_scheduled: "#F59E0B",
  interviewing: "#10B981",
  offer: "#059669",
  rejected: "#EF4444",
  withdrawn: "#64748B",
  ghosted: "#9CA3AF",
};

interface Props {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationCard({ application, onStatusChange }: Props) {
  const highPriorityNudge = application.nudges?.some(
    (nudge) => !nudge.is_dismissed && nudge.priority === "high",
  );

  return (
    <article
      className="group rounded-xl border border-white/10 bg-zinc-900/40 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition hover:border-white/20 hover:bg-zinc-900/60"
      style={{ boxShadow: `inset 2px 0 0 ${STATUS_COLORS[application.status]}, 0 18px 60px rgba(0,0,0,0.22)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{application.company_name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
            {application.role_title}
          </p>
        </div>
        {highPriorityNudge && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F97316]" />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-zinc-600">
        <span>{application.location || "No location"}</span>
        <StatusBadge status={application.status} />
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        Updated {new Date(application.updated_at).toLocaleDateString()}
      </p>

      <div className="mt-4 flex items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <Link
          href={`/tracker/${application.id}`}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Detail
        </Link>
        <Link
          href={`/tracker/${application.id}/outreach`}
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Outreach
        </Link>
      </div>

      <select
        value={application.status}
        onChange={(event) => onStatusChange(application.id, event.target.value as ApplicationStatus)}
        className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-zinc-300 outline-none transition focus:border-white/20"
      >
        {Object.keys(STATUS_COLORS).map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ")}
          </option>
        ))}
      </select>
    </article>
  );
}
