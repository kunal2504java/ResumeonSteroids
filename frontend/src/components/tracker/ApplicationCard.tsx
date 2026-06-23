"use client";

import Link from "next/link";
import type { Application, ApplicationStatus } from "@/types/tracker";
import { StatusBadge, STATUS_INK } from "./StatusBadge";

interface Props {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationCard({ application, onStatusChange }: Props) {
  const highPriorityNudge = application.nudges?.some(
    (nudge) => !nudge.is_dismissed && nudge.priority === "high",
  );
  const accent = STATUS_INK[application.status];
  // deterministic tiny tilt so the column reads like pinned notes
  const tilt = ((application.id.charCodeAt(0) % 3) - 1) * 0.8;

  return (
    <article
      className="tk-card group"
      style={{ transform: `rotate(${tilt}deg)`, borderLeft: `3px solid ${accent}` }}
    >
      <span className="pin" style={{ top: -5, right: 12, background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", color: "var(--ink)" }} className="truncate">
            {application.company_name}
          </h3>
          <p className="mono line-clamp-2" style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
            {application.role_title}
          </p>
        </div>
        {highPriorityNudge && <span style={{ marginTop: 4, width: 8, height: 8, flex: "0 0 auto", background: "var(--pen)" }} />}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{application.location || "no location"}</span>
        <StatusBadge status={application.status} />
      </div>
      <p className="hand hand-ink" style={{ marginTop: 8, fontSize: 13 }}>
        updated {new Date(application.updated_at).toLocaleDateString()}
      </p>

      <div className="tk-card-actions mt-3 flex items-center gap-2">
        <Link href={`/tracker/${application.id}`} className="tk-mini">Detail</Link>
        <Link href={`/tracker/${application.id}/outreach`} className="tk-mini">Outreach</Link>
      </div>

      <select
        value={application.status}
        onChange={(event) => onStatusChange(application.id, event.target.value as ApplicationStatus)}
        className="tk-select mono"
      >
        {Object.keys(STATUS_INK).map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ")}
          </option>
        ))}
      </select>
    </article>
  );
}
