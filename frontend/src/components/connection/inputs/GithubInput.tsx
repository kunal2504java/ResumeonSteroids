"use client";

import Image from "next/image";
import { useGithubValidation } from "@/hooks/useGithubValidation";
import { SourceIcon } from "../SourceIcon";

interface GithubInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function GithubInput({ value, onChange }: GithubInputProps) {
  const { isValidating, isValid, profile } = useGithubValidation(value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
          <SourceIcon source="github" className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">GitHub</h3>
          <p className="text-xs text-zinc-500">
            We&apos;ll read your public repos and contributions
          </p>
        </div>
      </div>

      {/* Input with prefix */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <span className="text-sm text-zinc-500">github.com/</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourusername"
          className="w-full bg-zinc-800 border border-white/10 rounded-xl pl-[104px] pr-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
        {/* Validation indicator */}
        {value.length > 2 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isValidating ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : isValid === true ? (
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : isValid === false ? (
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {/* Profile preview */}
      {isValid && profile && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <Image
            src={profile.avatar_url}
            alt={`${profile.name || profile.login} GitHub avatar`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-xs text-zinc-300">
            Found:{" "}
            <span className="text-white font-medium">
              {profile.name || profile.login}
            </span>{" "}
            &middot; {profile.public_repos} public repos
          </span>
        </div>
      )}
    </div>
  );
}
