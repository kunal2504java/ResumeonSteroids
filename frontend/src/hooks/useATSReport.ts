"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { Resume } from "@resumeai/shared";
import { useResumeStore } from "@/lib/store/resumeStore";
import type { ATSFixResponse, ATSReport, ATSSimulationResponse } from "@/types/ats";

export function useATSReport(
  runId: string | null,
  resume: Resume | null,
  jobDescription: string,
  maxPages?: 1 | 2,
) {
  const setResume = useResumeStore((state) => state.setResume);
  const deferredResume = useDeferredValue(resume);
  const deferredJobDescription = useDeferredValue(jobDescription.trim());
  const [report, setReport] = useState<ATSReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId || !deferredResume || !deferredJobDescription) {
      setReport(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ats/simulate", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            run_id: runId,
            assembled_resume: deferredResume,
            job_description: deferredJobDescription,
            max_pages: maxPages,
          }),
        });
        const data = (await res.json()) as ATSSimulationResponse | { error?: string };
        if (!res.ok) {
          throw new Error(data && "error" in data ? data.error : "ATS simulation failed");
        }
        setError(null);
        startTransition(() => {
          setReport(data as ATSSimulationResponse);
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load ATS report");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [runId, deferredResume, deferredJobDescription, maxPages]);

  const triggerFix = async (ruleId: string) => {
    if (!runId) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ats/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId, rule_id: ruleId }),
      });
      const data = (await res.json()) as ATSFixResponse | { error?: string };
      if (!res.ok) {
        throw new Error(data && "error" in data ? data.error : "ATS fix failed");
      }

      if ("manual_instruction" in data && !data.auto_fixed) {
        setError(data.manual_instruction || "This rule needs a manual fix.");
        return;
      }

      const fixResult = data as ATSFixResponse;
      if (fixResult.assembled_resume) {
        setResume(fixResult.assembled_resume);
      }
      if (fixResult.report) {
        setError(null);
        startTransition(() => {
          setReport(fixResult.report || null);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply ATS fix");
    } finally {
      setLoading(false);
    }
  };

  return { report, loading, error, triggerFix };
}
