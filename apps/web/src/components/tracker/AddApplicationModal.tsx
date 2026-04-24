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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl border border-[#273244] bg-[#0D1117] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1E2535] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Add application</h2>
            <p className="mt-1 text-xs text-[#71717A]">Save the target role before outreach and nudges begin.</p>
          </div>
          <button onClick={onClose} className="text-sm text-[#A1A1AA] hover:text-white">
            Close
          </button>
        </div>
        <div className="grid gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium text-[#A1A1AA]">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
              />
            </label>
            <label className="text-xs font-medium text-[#A1A1AA]">
              Role title
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-medium text-[#A1A1AA]">
              JD URL
              <input
                value={jdUrl}
                onChange={(event) => setJdUrl(event.target.value)}
                className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
              />
            </label>
            <label className="text-xs font-medium text-[#A1A1AA]">
              Location
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
              />
            </label>
          </div>
          <label className="text-xs font-medium text-[#A1A1AA]">
            Job description
            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              rows={5}
              className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
            />
          </label>
          <label className="text-xs font-medium text-[#A1A1AA]">
            Resume bullets or notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full border border-[#273244] bg-[#101620] px-3 py-2 text-sm text-white outline-none focus:border-[#6366F1]"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#1E2535] px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#A1A1AA] hover:text-white">
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
            className="bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save application"}
          </button>
        </div>
      </div>
    </div>
  );
}

