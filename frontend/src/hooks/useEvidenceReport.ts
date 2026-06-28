"use client";

import { useCallback, useState } from "react";
import type { Resume } from "@resumeai/shared";
import type { EvidenceReport } from "@/types/evidence";

/**
 * On-demand GitHub-grounded substance evaluation. NOT auto-run — it re-fetches
 * GitHub (and calls Claude), so it fires only when the user asks via run().
 * The cached report is what the editor feeds into the "make better" flow.
 */
export function useEvidenceReport(resume: Resume | null, jobDescription: string) {
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!resume || loading) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/ai/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Evidence evaluation failed" }));
        throw new Error((e as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setReport((await res.json()) as EvidenceReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evidence evaluation failed");
    } finally {
      setLoading(false);
    }
  }, [resume, jobDescription, loading]);

  return { report, loading, error, run };
}
