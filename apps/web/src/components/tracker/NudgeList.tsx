"use client";

import Link from "next/link";
import type { Nudge } from "@/types/tracker";

function priorityInk(priority: Nudge["priority"]) {
  if (priority === "high") return "#e23b17";
  if (priority === "medium") return "#b07a12";
  return "#6b6557";
}

export function NudgeList({ nudges, onDismiss, onComplete }: {
  nudges: Nudge[];
  onDismiss: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  if (nudges.length === 0) {
    return (
      <aside className="surf" data-frame>
        <span className="surf-label">next actions</span>
        <p className="hand" style={{ fontSize: 18 }}>you&apos;re on top of everything ✓</p>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Check back after the next tracker update.
        </p>
      </aside>
    );
  }

  return (
    <aside className="surf" data-frame style={{ padding: 0 }}>
      <div style={{ padding: "20px 22px", borderBottom: "1.5px dashed var(--ink-soft)" }}>
        <span className="surf-label" style={{ marginBottom: 4 }}>next actions</span>
        <p className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{nudges.length} on the list</p>
      </div>
      <div>
        {nudges.map((nudge, i) => (
          <div key={nudge.id} style={{ padding: "18px 22px", borderTop: i === 0 ? "none" : "1.5px solid var(--hairline)" }}>
            <div className="flex items-start justify-between gap-3">
              <span className="mono" style={{ border: `1.5px solid ${priorityInk(nudge.priority)}`, color: priorityInk(nudge.priority), padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                {nudge.priority}
              </span>
              <button onClick={() => onDismiss(nudge.id)} className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
            <h3 style={{ marginTop: 12, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{nudge.title}</h3>
            <p style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>{nudge.body}</p>
            {nudge.due_date && (
              <p className="hand hand-blue" style={{ marginTop: 8, fontSize: 14 }}>due {new Date(nudge.due_date).toLocaleDateString()}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Link href={`/tracker/${nudge.application_id}`} className="btn btn-pen btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                {nudge.action_label || "Open"}
              </Link>
              <button onClick={() => onComplete(nudge.id)} className="tk-mini" style={{ cursor: "pointer" }}>
                Done
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
