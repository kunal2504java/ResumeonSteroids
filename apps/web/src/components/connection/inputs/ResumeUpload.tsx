"use client";

import { useState, useRef } from "react";
import { SourceIcon } from "../SourceIcon";

interface ResumeUploadProps {
  file: File | null;
  onFileChange: (f: File | null) => void;
}

export default function ResumeUpload({ file, onFileChange }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && isValidFile(dropped)) {
      onFileChange(dropped);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && isValidFile(selected)) {
      onFileChange(selected);
    }
  }

  function isValidFile(f: File) {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    return validTypes.includes(f.type) || /\.(pdf|docx?)$/i.test(f.name);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <SourceIcon source="upload" className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Upload Resume</h3>
          <p className="text-xs text-zinc-500">
            PDF or DOCX &mdash; AI extracts everything
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          rounded-2xl border-2 border-dashed p-8
          flex flex-col items-center justify-center gap-3
          transition-all cursor-pointer text-center
          ${
            dragging
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-white/10 bg-white/[0.02] hover:border-white/20"
          }
        `}
      >
        <svg
          className="w-8 h-8 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <div>
          <p className="text-sm text-zinc-300">Drop your resume here</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            PDF or DOCX &middot; Max 10MB
          </p>
        </div>
        <span className="text-xs text-indigo-400 underline underline-offset-2">
          or browse files
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File info */}
      {file && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <svg
            className="w-5 h-5 text-emerald-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="text-xs text-zinc-300 truncate flex-1">
            {file.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileChange(null);
            }}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
