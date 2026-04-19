import { useState, useCallback, useRef } from "react";
import { CONNECTION_STAGES, interpolateStageMessage, getImportedItems } from "@/lib/connectionStages";
import { getSourceMeta } from "@/lib/sourceMeta";

export interface ConnectionStatus {
  id: string;
  name: string;
  iconBg: string;
  iconColor: string;
  status: "pending" | "connecting" | "done" | "error";
  progress: number;
  currentMicroStage: string;
  summary: string;
  importedItems: string[];
}

export interface GlobalStageInfo {
  headline: string;
  subtitle: string;
}

export interface ExperienceEnrichmentResult {
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    location: string;
    bullets: Array<{
      text: string;
      ats_keywords_used: string[];
      action_verb: string;
      has_metric: boolean;
      metric_source: "linkedin" | "github" | "old_resume" | "inferred";
    }>;
    status: "complete" | "awaiting_user_input";
  }>;
  rolesNeedingInput: string[];
  questionsBlock: string;
}

const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    : "http://localhost:4000";

export function useConnectionFlow(
  selectedSources: string[],
  inputs: Record<string, string>,
  file: File | null
) {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [currentStage, setCurrentStage] = useState<GlobalStageInfo>({
    headline: "Analyzing your profiles...",
    subtitle:
      "Give us a moment. We\u2019re building a complete picture of your skills.",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const resultsRef = useRef<Record<string, unknown>>({});

  const updateConnection = useCallback(
    (id: string, patch: Partial<ConnectionStatus>) => {
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const totalProgress =
    connections.length > 0
      ? connections.reduce((sum, c) => sum + c.progress, 0) / connections.length
      : 0;

  const runAll = useCallback(async () => {
    const activeSources = selectedSources.filter((id) => id !== "blank");

    const initialConnections: ConnectionStatus[] = activeSources.map((id) => {
      const meta = getSourceMeta(id);
      return {
        id,
        name: meta.name,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
        status: "pending" as const,
        progress: 0,
        currentMicroStage: "Waiting...",
        summary: "",
        importedItems: [],
      };
    });

    setConnections(initialConnections);
    setIsRunning(true);
    setAllDone(false);
    resultsRef.current = {};

    const promises = activeSources.map((sourceId) =>
      runSource(
        sourceId,
        inputs,
        file,
        updateConnection,
        setCurrentStage,
        resultsRef
      )
    );

    await Promise.allSettled(promises);

    const hasExperienceSignals =
      Boolean(resultsRef.current.linkedin) ||
      Boolean(resultsRef.current.resume) ||
      Boolean(resultsRef.current.github);

    if (hasExperienceSignals) {
      setCurrentStage({
        headline: "Deepening your experience section...",
        subtitle:
          "We’re auditing LinkedIn, GitHub, and resume evidence together to write sharper bullets.",
      });

      try {
        const enrichment = await callExperienceEnrichmentApi(resultsRef.current);
        resultsRef.current.experience_enrichment = enrichment;
      } catch {
        // Non-blocking; imported data is still usable without the enhancement pass.
      }
    }

    setCurrentStage({
      headline: "All done. Building your resume now.",
      subtitle:
        "AI is writing your bullet points, summarizing your impact, and structuring everything perfectly.",
    });
    setAllDone(true);
    setIsRunning(false);

    return resultsRef.current;
  }, [selectedSources, inputs, file, updateConnection]);

  return {
    connections,
    currentStage,
    totalProgress,
    isRunning,
    allDone,
    results: resultsRef.current,
    runAll,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runSource(
  sourceId: string,
  inputs: Record<string, string>,
  file: File | null,
  update: (id: string, patch: Partial<ConnectionStatus>) => void,
  setGlobalStage: (stage: GlobalStageInfo) => void,
  resultsRef: React.MutableRefObject<Record<string, unknown>>
) {
  const stages = CONNECTION_STAGES[sourceId];
  if (!stages) return;

  update(sourceId, { status: "connecting" });

  try {
    let apiDone = false;
    let apiResult: unknown = null;
    let apiError: Error | null = null;

    // Start API call concurrently with stage animation
    const apiPromise = (async () => {
      try {
        apiResult = await callImportApi(sourceId, inputs, file);
        apiDone = true;
      } catch (err) {
        apiError = err as Error;
        apiDone = true;
      }
    })();

    // Animate through intermediate stages while API runs
    const intermediateStages = stages.slice(0, -1);
    for (const stage of intermediateStages) {
      if (apiDone) break;
      update(sourceId, {
        progress: stage.progress,
        currentMicroStage: stage.microStage,
      });
      setGlobalStage({
        headline: stage.headline,
        subtitle: stage.subtitle,
      });
      await delay(800 + Math.random() * 600);
    }

    // Wait for API if it hasn't finished
    if (!apiDone) {
      await apiPromise;
    }

    if (apiError) throw apiError;

    // Final stage with interpolated message
    const lastStage = stages[stages.length - 1];
    const summary = interpolateStageMessage(lastStage.subtitle, apiResult);
    const importedItems = getImportedItems(sourceId, apiResult);

    resultsRef.current[sourceId] = apiResult;

    update(sourceId, {
      status: "done",
      progress: 100,
      currentMicroStage: "Complete",
      summary,
      importedItems,
    });

    setGlobalStage({
      headline: lastStage.headline,
      subtitle: summary,
    });
  } catch (err) {
    update(sourceId, {
      status: "error",
      progress: 100,
      currentMicroStage: "Failed",
      summary: `Error: ${(err as Error).message}`,
      importedItems: [],
    });
  }
}

async function callImportApi(
  sourceId: string,
  inputs: Record<string, string>,
  file: File | null
): Promise<unknown> {
  switch (sourceId) {
    case "github": {
      const res = await fetch(`${API_URL}/api/ai/import/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputs.github }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "GitHub import failed"
        );
      }
      return res.json();
    }
    case "leetcode": {
      const res = await fetch(`${API_URL}/api/ai/import/leetcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputs.leetcode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "LeetCode import failed"
        );
      }
      return res.json();
    }
    case "codeforces": {
      const res = await fetch(`${API_URL}/api/ai/import/codeforces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: inputs.codeforces }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Codeforces import failed"
        );
      }
      return res.json();
    }
    case "resume": {
      if (!file) throw new Error("No file provided");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/ai/import/resume`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Resume import failed"
        );
      }
      return res.json();
    }
    case "linkedin": {
      const res = await fetch(`${API_URL}/api/ai/import/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: inputs.linkedin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "LinkedIn import failed"
        );
      }
      return res.json();
    }
    default:
      throw new Error(`Unknown source: ${sourceId}`);
  }
}

async function callExperienceEnrichmentApi(
  importedResults: Record<string, unknown>
): Promise<ExperienceEnrichmentResult> {
  const res = await fetch(`${API_URL}/api/ai/enrich-experience`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      linkedin: importedResults.linkedin ?? null,
      github: importedResults.github ?? null,
      resume: importedResults.resume ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Experience enrichment failed"
    );
  }

  return (await res.json()) as ExperienceEnrichmentResult;
}
