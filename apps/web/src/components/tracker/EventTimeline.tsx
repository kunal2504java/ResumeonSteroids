"use client";

import type { ApplicationEvent } from "@/types/tracker";

const EVENT_LABELS: Record<string, string> = {
  applied: "Application submitted",
  email_sent: "Email sent",
  dm_sent: "LinkedIn DM sent",
  referral_sent: "Referral request sent",
  replied: "Reply received",
  screen_scheduled: "Screen scheduled",
  interview_scheduled: "Interview scheduled",
  offer_received: "Offer received",
  rejected: "Rejected",
  status_changed: "Status changed",
  note_added: "Note added",
};

export function EventTimeline({ events }: { events: ApplicationEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-[#71717A]">No events logged yet.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="grid grid-cols-[92px_1fr] gap-4">
          <time className="text-xs text-[#71717A]">
            {new Date(event.created_at).toLocaleDateString()}
          </time>
          <div className="border-l border-[#273244] pl-4">
            <p className="text-sm font-medium text-white">
              {EVENT_LABELS[event.event_type] ?? event.event_type.replace("_", " ")}
            </p>
            {Object.keys(event.event_data ?? {}).length > 0 && (
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#A1A1AA]">
                {JSON.stringify(event.event_data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

