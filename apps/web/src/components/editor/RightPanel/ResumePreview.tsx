"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store/resumeStore";
import JakeTemplate from "./JakeTemplate";

export default function ResumePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const resume = useResumeStore((s) => s.resume);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!resume) return;

    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus((prev) => (prev === "ready" ? "ready" : "loading"));
      setErrorMessage(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const res = await fetch(`${API_URL}/api/export/latex`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalInfo: resume.personalInfo,
            summary: resume.summary,
            experience: resume.experience,
            education: resume.education,
            projects: resume.projects,
            skills: resume.skills,
            achievements: resume.achievements,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Preview compilation failed" }));
          throw new Error(
            (err as { error?: string }).error ?? "Preview compilation failed"
          );
        }

        const blob = await res.blob();
        if (requestIdRef.current !== currentRequestId) return;

        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== currentRequestId) return;

        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Preview compilation failed"
        );
      }
    }, 700);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [resume]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!resume) {
    return (
      <div
        ref={containerRef}
        className="h-full flex items-center justify-center p-4 bg-zinc-900"
      >
        <div className="text-sm text-zinc-500">Loading preview...</div>
      </div>
    );
  }

  const showFallback = status === "error" || !pdfUrl;

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden bg-zinc-900">
      <div className="absolute inset-0 overflow-auto p-4">
        {pdfUrl && (
          <iframe
            key={pdfUrl}
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title="Compiled resume preview"
            className={`h-full w-full rounded-sm border border-white/10 bg-white shadow-2xl shadow-black/50 ${
              showFallback ? "hidden" : "block"
            }`}
          />
        )}

        {showFallback && (
          <div className="flex min-h-full items-start justify-center">
            <div className="shadow-2xl shadow-black/50">
              <JakeTemplate />
            </div>
          </div>
        )}
      </div>

      {status === "loading" && (
        <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-indigo-400/20 bg-[#161B27]/90 px-3 py-1.5 text-xs text-indigo-200 backdrop-blur-sm">
          Rendering LaTeX preview...
        </div>
      )}

      {status === "error" && (
        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-amber-500/20 bg-[#161B27]/95 p-3 text-xs text-amber-100 shadow-lg shadow-black/30">
          Showing HTML fallback because the real LaTeX preview failed.
          {errorMessage ? ` ${errorMessage}` : ""}
        </div>
      )}

      <div className="pointer-events-none fixed -left-[10000px] top-0">
        <JakeTemplate />
      </div>
    </div>
  );
}

export { JakeTemplate };
