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
      className="group border border-[#1E2535] bg-[#101620] p-4 transition hover:border-[#334155]"
      style={{ borderLeftColor: STATUS_COLORS[application.status], borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{application.company_name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#A1A1AA]">
            {application.role_title}
          </p>
        </div>
        {highPriorityNudge && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F97316]" />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-[#71717A]">
        <span>{application.location || "No location"}</span>
        <StatusBadge status={application.status} />
      </div>
      <p className="mt-2 text-[11px] text-[#71717A]">
        Updated {new Date(application.updated_at).toLocaleDateString()}
      </p>

      <div className="mt-4 flex items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
        <Link
          href={`/tracker/${application.id}`}
          className="flex-1 border border-[#273244] px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-[#172033]"
        >
          Detail
        </Link>
        <Link
          href={`/tracker/${application.id}/outreach`}
          className="flex-1 border border-[#273244] px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-[#172033]"
        >
          Outreach
        </Link>
      </div>

      <select
        value={application.status}
        onChange={(event) => onStatusChange(application.id, event.target.value as ApplicationStatus)}
        className="mt-3 w-full border border-[#273244] bg-[#0D1117] px-2 py-2 text-xs text-[#D4D4D8] outline-none"
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
