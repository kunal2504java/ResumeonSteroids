"use client";

interface NewResumeCardProps {
  onClick: () => void;
}

export default function NewResumeCard({ onClick }: NewResumeCardProps) {
  return (
    <button
      onClick={onClick}
      className="sheet-card dashed-sheet group aspect-[3/4] cursor-pointer flex-col items-center justify-center"
      style={{ display: "flex" }}
    >
      <div
        className="mb-4 grid place-items-center"
        style={{ width: 56, height: 56, border: "2px solid var(--ink)", color: "var(--ink)" }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>Start a new draft</span>
      <span className="hand" style={{ fontSize: 16, marginTop: 6 }}>blank page, fresh start ↑</span>
    </button>
  );
}
