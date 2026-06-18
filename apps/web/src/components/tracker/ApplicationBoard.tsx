"use client";

import type { Application, ApplicationStatus } from "@/types/tracker";
import { ApplicationCard } from "./ApplicationCard";
import { STATUS_INK } from "./StatusBadge";

const COLUMNS: Array<{ status: ApplicationStatus; label: string }> = [
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "outreach_sent", label: "Outreach" },
  { status: "screen_scheduled", label: "Screen" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
  { status: "ghosted", label: "Ghosted" },
];

interface Props {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationBoard({ applications, onStatusChange }: Props) {
  return (
    <div className="tk-board surf" style={{ overflowX: "auto", padding: 14 }}>
      <div className="grid min-w-[1180px] grid-cols-8 gap-3">
        {COLUMNS.map((column) => {
          const items = applications.filter((application) => application.status === column.status);
          return (
            <section key={column.status} className="tk-col">
              <header className="tk-col-head">
                <div className="flex items-center gap-2">
                  <span style={{ width: 9, height: 9, background: STATUS_INK[column.status], flex: "0 0 auto" }} />
                  <h2 className="mono" style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-soft)" }}>
                    {column.label}
                  </h2>
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{items.length}</span>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map((application) => (
                  <ApplicationCard key={application.id} application={application} onStatusChange={onStatusChange} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
