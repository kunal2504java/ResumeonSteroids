"use client";

import { useState } from "react";
import type { OutreachDraft } from "@/types/tracker";

interface Props {
  draft: OutreachDraft;
  loading: boolean;
  onSave: (draftId: string, body: { subject_line?: string | null; body: string }) => void;
  onMarkSent: (draftId: string) => void;
}

export function DraftComposer({ draft, loading, onSave, onMarkSent }: Props) {
  const [subject, setSubject] = useState(draft.subject_line ?? "");
  const [body, setBody] = useState(draft.body);
  const isDm = draft.draft_type === "linkedin_dm";

  return (
    <section className="flex h-full flex-col border border-[#1E2535] bg-[#101620]">
      <header className="border-b border-[#1E2535] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71717A]">
              {draft.draft_type.replace("_", " ")}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">Draft composer</h2>
          </div>
          {draft.is_sent && <span className="text-xs text-[#86EFAC]">Sent</span>}
        </div>
      </header>
      <div className="flex-1 space-y-4 p-5">
        {draft.draft_type !== "linkedin_dm" && (
          <label className="block text-xs font-medium text-[#A1A1AA]">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              onBlur={() => onSave(draft.id, { subject_line: subject, body })}
              className="mt-2 w-full border border-[#273244] bg-[#0D1117] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
            />
          </label>
        )}
        <label className="block text-xs font-medium text-[#A1A1AA]">
          Body
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onBlur={() => onSave(draft.id, { subject_line: subject, body })}
            rows={14}
            className="mt-2 w-full resize-none border border-[#273244] bg-[#0D1117] px-3 py-3 font-mono text-sm leading-6 text-white outline-none focus:border-[#6366F1]"
          />
        </label>
        <p className={`text-xs ${isDm && body.length > 500 ? "text-[#FCA5A5]" : "text-[#71717A]"}`}>
          {body.length} characters
        </p>
      </div>
      <footer className="flex flex-wrap justify-between gap-3 border-t border-[#1E2535] p-5">
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(body)}
            className="border border-[#273244] px-3 py-2 text-xs text-white transition hover:bg-[#172033]"
          >
            Copy
          </button>
          {draft.subject_line && (
            <a
              href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="border border-[#273244] px-3 py-2 text-xs text-white transition hover:bg-[#172033]"
            >
              Open in mail
            </a>
          )}
        </div>
        <button
          disabled={loading || draft.is_sent}
          onClick={() => onMarkSent(draft.id)}
          className="bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#818CF8] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Mark as sent"}
        </button>
      </footer>
    </section>
  );
}

