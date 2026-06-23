/**
 * POST /api/build-resume — Master Orchestrator
 *
 * The single endpoint that runs the full multi-agent pipeline:
 *
 *   Step 1: Collect raw data from all sources in parallel
 *   Step 2: Normalize all raw data via Claude (Agent 1)
 *   Step 3: Rewrite content for maximum impact (Agent 2)
 *   Step 4: Score and provide ATS feedback (Agent 3)
 *   Step 5: Format as LaTeX and compile to PDF (Agent 4)
 *
 * Returns: { score, resumeData, pdf (base64) }
 */

import { Hono } from "hono";
import { optionalAuthMiddleware } from "../middleware/auth";
import type { PipelineInput } from "../agents/pipeline.types";
import { runAgent1 } from "../agents/agent1";
import { runAgent2 } from "../agents/agent2";
import { runAgent3 } from "../agents/agent3";
import { runAgent4 } from "../agents/agent4";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  const startTime = Date.now();

  try {
    const body = await c.req.json();

    // ---- Validate input ----
    const sources = body.sources;
    if (!sources || typeof sources !== "object") {
      return c.json({ error: "Missing 'sources' in request body" }, 400);
    }

    const hasAnySources =
      sources.github ||
      sources.leetcode ||
      sources.codeforces ||
      sources.linkedin ||
      sources.resume;

    if (!hasAnySources) {
      return c.json(
        { error: "At least one data source is required (github, leetcode, codeforces, linkedin, or resume)" },
        400
      );
    }

    const jobDescription: string | undefined = body.jobDescription || undefined;

    // ---- Build pipeline input ----
    const input: PipelineInput = {
      sources: {
        github: sources.github
          ? { username: sources.github }
          : undefined,
        leetcode: sources.leetcode
          ? { username: sources.leetcode }
          : undefined,
        codeforces: sources.codeforces
          ? { handle: sources.codeforces }
          : undefined,
        linkedin: sources.linkedin
          ? { profileUrl: sources.linkedin }
          : undefined,
        resume: sources.resume
          ? {
              fileBase64: sources.resume.fileBase64,
              mimeType: sources.resume.mimeType,
              fileName: sources.resume.fileName,
            }
          : undefined,
      },
      jobDescription,
    };

    console.log("=".repeat(60));
    console.log("[Pipeline] Starting full resume build...");
    console.log("[Pipeline] Sources:", Object.keys(input.sources).filter((k) => input.sources[k as keyof typeof input.sources]).join(", "));
    if (jobDescription) console.log("[Pipeline] Job description provided for ATS tailoring");

    // ---- Step 1 + 2: Collect & Normalize (Agent 1) ----
    console.log("\n[Pipeline] Step 1+2: Collecting and normalizing data...");
    const agent1Result = await runAgent1(input);
    const normalized = agent1Result.data;
    console.log("[Pipeline] Agent 1 complete. Sources status:", JSON.stringify(agent1Result.sourcesStatus));

    // ---- Step 3: Write Content (Agent 2) ----
    console.log("\n[Pipeline] Step 3: Writing optimized resume content...");
    const agent2Result = await runAgent2(normalized, jobDescription);
    const written = agent2Result.data;

    // ---- Step 4: Score (Agent 3) + Step 5: PDF (Agent 4) — run in parallel ----
    console.log("\n[Pipeline] Step 4+5: Scoring and generating PDF (parallel)...");
    const [score, agent4Result] = await Promise.all([
      runAgent3(written, jobDescription),
      runAgent4(written),
    ]);

    // ---- Build response ----
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n" + "=".repeat(60));
    console.log(`[Pipeline] Complete in ${elapsed}s`);
    console.log(`[Pipeline] Score: ${score.overallScore}/100 | Ready: ${score.readyToApply ? "YES" : "NO"}`);
    console.log("=".repeat(60));

    return c.json({
      score,
      resumeData: written,
      pdf: agent4Result.pdfBuffer.toString("base64"),
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Pipeline] Failed after ${elapsed}s:`, error);
    const message =
      error instanceof Error ? error.message : "Resume build failed";
    return c.json({ error: message }, 500);
  }
});

export { route as buildResumeRoute };
