"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Resume } from "@resumeai/shared";
import { useResumeStore } from "@/lib/store/resumeStore";
import { prepareResumeForOutput } from "@/lib/resume/output";
import { ScrollArea } from "@/components/ui/scroll-area";
import JakeTemplate from "./JakeTemplate";

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PREVIEW_PADDING = 32;

interface ResumePreviewProps {
  highlightedSection?: string;
  resumeOverride?: Resume | null;
  maxPages?: 1 | 2;
}

export default function ResumePreview({
  highlightedSection,
  resumeOverride,
  maxPages = 1,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const storeResume = useResumeStore((s) => s.resume);
  const resume = useMemo(() => {
    const source = resumeOverride ?? storeResume;
    return source ? prepareResumeForOutput(source, { maxPages }) : null;
  }, [maxPages, resumeOverride, storeResume]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      const rect = node.getBoundingClientRect();
      const availableWidth = Math.max(320, rect.width - PREVIEW_PADDING);
      const scale = Math.min(1, availableWidth / PAGE_WIDTH);
      setPreviewScale(Number(scale.toFixed(3)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
        className="flex h-full items-center justify-center bg-[#0f0f0f] p-4"
      >
        <div className="text-sm text-zinc-500">Loading preview...</div>
      </div>
    );
  }

  const forceHtmlPreview = Boolean(highlightedSection);
  const shouldShowPdfPreview = Boolean(pdfUrl && status === "ready" && !forceHtmlPreview);
  return (
    <div ref={containerRef} className="relative h-full overflow-hidden bg-[#0f0f0f]">
      {shouldShowPdfPreview ? (
        <div className="absolute inset-0 bg-[#0f0f0f] p-3">
          <iframe
            title="Compiled LaTeX resume preview"
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width`}
            className="h-full w-full border-0 bg-[#0f0f0f] shadow-[0_0_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
          />
        </div>
      ) : (
        <ScrollArea className="absolute inset-0">
          <div className="flex min-h-full items-start justify-center p-4">
            <div
              className="relative shrink-0"
              style={{
                width: PAGE_WIDTH * previewScale,
                height: PAGE_HEIGHT * previewScale,
              }}
            >
              <div
                className="origin-top-left shadow-[0_0_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
                style={{
                  width: PAGE_WIDTH,
                  height: PAGE_HEIGHT,
                  transform: `scale(${previewScale})`,
                }}
              >
                <JakeTemplate
                  highlightedSection={highlightedSection}
                  resumeOverride={resume}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      )}

      {status === "loading" && (
        <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-white/10 bg-black/75 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-xl">
          Rendering LaTeX preview...
        </div>
      )}

      {status === "error" && (
        <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100 shadow-lg shadow-black/30 backdrop-blur-xl">
          Showing HTML fallback because the real LaTeX preview failed.
          {errorMessage ? ` ${errorMessage}` : ""}
        </div>
      )}

      {forceHtmlPreview && status !== "error" && (
        <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/75 p-3 text-xs text-zinc-200 shadow-lg shadow-black/30 backdrop-blur-xl">
          HTML preview enabled to highlight the affected ATS section.
        </div>
      )}

      <div className="pointer-events-none fixed -left-[10000px] top-0">
        <JakeTemplate
          highlightedSection={highlightedSection}
          resumeOverride={resume}
        />
      </div>
    </div>
  );
}

export { JakeTemplate };
