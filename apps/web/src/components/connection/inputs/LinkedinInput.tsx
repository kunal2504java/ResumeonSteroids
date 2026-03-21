"use client";

import { SourceIcon } from "../SourceIcon";

interface LinkedinInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function LinkedinInput({ value, onChange }: LinkedinInputProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
          <SourceIcon source="linkedin" className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">LinkedIn</h3>
          <p className="text-xs text-zinc-500">
            Paste your public profile URL &mdash; AI will extract your
            experience
          </p>
        </div>
      </div>

      {/* Input */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://linkedin.com/in/yourname"
        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
      />

      {/* Note */}
      <div className="flex items-start gap-2">
        <svg
          className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p className="text-xs text-zinc-500">
          Make sure your profile is set to public. We only read what&apos;s
          visible to anyone.
        </p>
      </div>
    </div>
  );
}
