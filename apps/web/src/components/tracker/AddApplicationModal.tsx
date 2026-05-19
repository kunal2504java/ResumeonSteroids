"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (body: {
    company_name: string;
    role_title: string;
    jd_url?: string;
    jd_raw_text?: string;
    source?: string;
    location?: string;
    notes?: string;
  }) => void;
}

export function AddApplicationModal({ open, loading, onClose, onCreate }: Props) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [location, setLocation] = useState("");
  const [jdText, setJdText] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-md">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_34px_120px_rgba(0,0,0,0.78)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/30 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Add application</h2>
            <p className="mt-1 text-xs text-zinc-500">Save the target role before outreach and nudges begin.</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 hover:text-white">
            Close
          </button>
        </div>
        <div className="grid gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium text-zinc-400">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
            <label className="text-xs font-medium text-zinc-400">
              Role title
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium text-zinc-400">
              JD URL
              <input
                value={jdUrl}
                onChange={(event) => setJdUrl(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
            <label className="text-xs font-medium text-zinc-400">
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
          </div>
          <label className="text-xs font-medium text-zinc-400">
            Job description
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            Resume bullets or notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-white/10 bg-zinc-900/20 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-white">
            Cancel
          </button>
          <button
            disabled={loading || !company.trim() || !role.trim()}
            onClick={() =>
              onCreate({
                company_name: company.trim(),
                role_title: role.trim(),
                jd_url: jdUrl.trim(),
                jd_raw_text: jdText.trim(),
                location: location.trim(),
                notes: notes.trim(),
                source: "other",
              })
            }
            className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save application"}
          </button>
        </div>
      </div>
    </div>
  );
}
