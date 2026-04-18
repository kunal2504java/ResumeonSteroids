/**
 * Agent 1: Data Collector & Normalizer
 *
 * Orchestrates parallel data collection from all requested sources,
 * then passes ALL raw data to Claude in a single normalization call
 * to produce a clean, unified NormalizedData object for Agent 2.
 *
 * Flow:
 *   1. All collectors run in parallel via Promise.allSettled
 *   2. Individual source failures don't block the pipeline
 *   3. Resume uploads are parsed (PDF/DOCX → text) before bundling
 *   4. All raw data is bundled and sent to Claude in ONE call
 *   5. Claude merges, deduplicates, and normalizes everything
 */

import type { PipelineInput, Agent1Output, SourceType } from "../pipeline.types";
import { collectGitHub } from "./collectors/github";
import { collectLeetCode } from "./collectors/leetcode";
import { collectCodeforces } from "./collectors/codeforces";
import { collectLinkedIn } from "./collectors/linkedin";
import { collectResume } from "./collectors/resume";
import { normalizeAllSources } from "./normalizer";

// ---------------------------------------------------------------------------
// File text extraction (for resume uploads)
// ---------------------------------------------------------------------------

/**
 * Extract text from a base64-encoded file (PDF, DOCX, or plain text).
 */
async function extractTextFromFile(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text fallback
  return buffer.toString("utf-8");
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function runAgent1(input: PipelineInput): Promise<Agent1Output> {
  const { sources } = input;
  const status: Record<string, { ok: boolean; error?: string }> = {};

  console.log("[Agent 1] Starting data collection...");
  console.log(
    "[Agent 1] Sources requested:",
    Object.keys(sources).join(", ")
  );

  // ---- Build collector promises ----
  type CollectorResult =
    | { type: "github"; data: Awaited<ReturnType<typeof collectGitHub>> }
    | { type: "leetcode"; data: Awaited<ReturnType<typeof collectLeetCode>> }
    | {
        type: "codeforces";
        data: Awaited<ReturnType<typeof collectCodeforces>>;
      }
    | { type: "linkedin"; data: Awaited<ReturnType<typeof collectLinkedIn>> }
    | { type: "resume"; data: Awaited<ReturnType<typeof collectResume>> };

  const tasks: Promise<CollectorResult>[] = [];

  if (sources.github) {
    tasks.push(
      collectGitHub(sources.github.username).then((data) => ({
        type: "github" as const,
        data,
      }))
    );
  }
  if (sources.leetcode) {
    tasks.push(
      collectLeetCode(sources.leetcode.username).then((data) => ({
        type: "leetcode" as const,
        data,
      }))
    );
  }
  if (sources.codeforces) {
    tasks.push(
      collectCodeforces(sources.codeforces.handle).then((data) => ({
        type: "codeforces" as const,
        data,
      }))
    );
  }
  if (sources.linkedin) {
    tasks.push(
      collectLinkedIn(sources.linkedin.profileUrl).then((data) => ({
        type: "linkedin" as const,
        data,
      }))
    );
  }
  if (sources.resume) {
    tasks.push(
      collectResume(
        sources.resume.fileBase64,
        sources.resume.mimeType,
        sources.resume.fileName
      ).then((data) => ({ type: "resume" as const, data }))
    );
  }

  // ---- Run all collectors in parallel ----
  const results = await Promise.allSettled(tasks);

  // ---- Bundle raw data from all successful sources ----
  const rawSources: Record<string, unknown> = {};

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[Agent 1] Collector failed:", result.reason);
      continue;
    }

    const { type, data } = result.value;

    try {
      switch (type) {
        case "github":
          rawSources.github = data;
          status.github = { ok: true };
          console.log(
            `[Agent 1] GitHub: ${data.projects.length} repos collected`
          );
          break;

        case "leetcode":
          rawSources.leetcode = data;
          status.leetcode = { ok: true };
          console.log(
            `[Agent 1] LeetCode: ${data.totalSolved} problems solved`
          );
          break;

        case "codeforces":
          rawSources.codeforces = data;
          status.codeforces = { ok: true };
          console.log(
            `[Agent 1] Codeforces: ${data.maxRank} (${data.maxRating})`
          );
          break;

        case "linkedin":
          // Pass the raw Apify JSON directly — Claude will handle extraction
          rawSources.linkedin = data.raw;
          status.linkedin = { ok: true };
          console.log(
            `[Agent 1] LinkedIn: raw profile data collected (${Object.keys(data.raw).length} fields)`
          );
          break;

        case "resume": {
          // Extract text from PDF/DOCX before bundling
          console.log("[Agent 1] Extracting text from uploaded resume...");
          const text = await extractTextFromFile(
            data.fileBase64,
            data.mimeType,
            data.fileName
          );

          if (!text.trim()) {
            throw new Error("Could not extract text from uploaded file");
          }

          rawSources.resume = {
            source: "upload",
            text: text.slice(0, 10000),
            fileName: data.fileName,
          };
          status.resume = { ok: true };
          console.log("[Agent 1] Resume text extracted successfully");
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Collection failed";
      status[type] = { ok: false, error: msg };
      console.error(`[Agent 1] ${type} error:`, msg);
    }
  }

  // Mark missing sources as errors
  for (const [source] of Object.entries(sources)) {
    if (!status[source]) {
      status[source] = { ok: false, error: "Collection failed or timed out" };
    }
  }

  // ---- Check if we have any data to normalize ----
  if (Object.keys(rawSources).length === 0) {
    throw new Error("All data sources failed. Cannot proceed with normalization.");
  }

  // ---- Single Claude call to normalize everything ----
  console.log(
    `[Agent 1] Normalizing data from ${Object.keys(rawSources).length} sources...`
  );
  const data = await normalizeAllSources(rawSources);

  console.log("[Agent 1] Collection & normalization complete.");

  return {
    data,
    sourcesStatus: status as Record<
      SourceType,
      { ok: boolean; error?: string }
    >,
  };
}
