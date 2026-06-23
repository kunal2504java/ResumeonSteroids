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

const fieldStyle: React.CSSProperties = {
  marginTop: 8,
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1.5px solid var(--hairline)",
  background: "var(--sheet)",
  color: "var(--ink)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-spline-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-soft)",
};

export function AddApplicationModal({ open, loading, onClose, onCreate }: Props) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [location, setLocation] = useState("");
  const [jdText, setJdText] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(33,30,24,0.5)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden"
        style={{ background: "var(--sheet)", border: "1.5px solid var(--ink)", boxShadow: "6px 8px 0 rgba(33,30,24,0.18), 16px 26px 44px rgba(33,30,24,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1.5px solid var(--hairline)", background: "var(--paper-2)" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--ink)" }}>Add an application</h2>
            <p className="hand hand-ink" style={{ fontSize: 14, marginTop: 2 }}>pin the target before outreach &amp; nudges begin</p>
          </div>
          <button onClick={onClose} className="btn-mini">Close</button>
        </div>

        <div className="grid gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label style={labelStyle}>
              Company
              <input value={company} onChange={(e) => setCompany(e.target.value)} style={fieldStyle} />
            </label>
            <label style={labelStyle}>
              Role title
              <input value={role} onChange={(e) => setRole(e.target.value)} style={fieldStyle} />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label style={labelStyle}>
              JD URL
              <input value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} style={fieldStyle} />
            </label>
            <label style={labelStyle}>
              Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} style={fieldStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            Job description
            <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} rows={5} style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            Resume bullets or notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={fieldStyle} />
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1.5px solid var(--hairline)", background: "var(--paper-2)" }}>
          <button onClick={onClose} className="btn-mini">Cancel</button>
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
            className="btn btn-pen btn-sm"
            style={loading || !company.trim() || !role.trim() ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            {loading ? "Saving…" : "Save application"}
          </button>
        </div>
      </div>
    </div>
  );
}
