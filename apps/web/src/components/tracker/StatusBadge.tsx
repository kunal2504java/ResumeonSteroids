"use client";

import type { ApplicationStatus } from "@/types/tracker";

export const STATUS_INK: Record<ApplicationStatus, string> = {
  saved: "#6b6557",
  applied: "#2a4c86",
  outreach_sent: "#b07a12",
  screen_scheduled: "#b07a12",
  interviewing: "#1f7a3f",
  offer: "#1f7a3f",
  rejected: "#e23b17",
  withdrawn: "#6b6557",
  ghosted: "#6b6557",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = STATUS_INK[status];
  return (
    <span
      className="mono"
      style={{
        border: `1.5px solid ${c}`,
        color: c,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        whiteSpace: "nowrap",
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}
