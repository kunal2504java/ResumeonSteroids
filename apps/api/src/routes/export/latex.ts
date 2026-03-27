/**
 * /api/export/latex — Server-side LaTeX → PDF compilation
 *
 * Accepts the full resume JSON, fills the Jake's Resume LaTeX template,
 * compiles it with pdflatex (run twice for references), and streams
 * the resulting PDF back to the client.
 *
 * Requires pdflatex installed on the host (TeX Live).
 */

import { Hono } from "hono";
import { optionalAuthMiddleware } from "../../middleware/auth";
import { fillTemplate, type ResumeData } from "../../lib/fillTemplate";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  // Unique temp directory for this compilation
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
  const texFile = path.join(tmpDir, "resume.tex");
  const pdfFile = path.join(tmpDir, "resume.pdf");

  try {
    // 1. Parse the incoming resume data
    const body = (await c.req.json()) as ResumeData;
    if (!body.personalInfo) {
      return c.json({ error: "Invalid resume data: personalInfo required" }, 400);
    }

    // 2. Fill the LaTeX template with the resume data
    const texContent = fillTemplate(body);

    // 3. Write the filled .tex to a temp file
    fs.writeFileSync(texFile, texContent, "utf-8");

    // 4. Run pdflatex TWICE (two passes resolve cross-references)
    //    -interaction=nonstopmode prevents pdflatex from waiting for user input on errors
    const pdflatexArgs = [
      "-interaction=nonstopmode",
      `-output-directory=${tmpDir}`,
      texFile,
    ];

    try {
      // First pass
      await execFileAsync("pdflatex", pdflatexArgs, {
        timeout: 30000, // 30s timeout per pass
        cwd: tmpDir,
      });
      // Second pass (for cross-references, TOC, etc.)
      await execFileAsync("pdflatex", pdflatexArgs, {
        timeout: 30000,
        cwd: tmpDir,
      });
    } catch (compileError: unknown) {
      // pdflatex returns non-zero on warnings too, so check if PDF was still produced
      if (!fs.existsSync(pdfFile)) {
        // Read the .log file for diagnostics
        const logFile = path.join(tmpDir, "resume.log");
        const logContent = fs.existsSync(logFile)
          ? fs.readFileSync(logFile, "utf-8").slice(-2000) // last 2000 chars
          : "No log file found";
        console.error("[LaTeX Compilation Failed]", logContent);

        const errorMsg =
          compileError instanceof Error ? compileError.message : "Unknown error";
        return c.json(
          {
            error: "LaTeX compilation failed",
            details: errorMsg,
            log: logContent,
          },
          500
        );
      }
      // PDF exists despite non-zero exit — warnings only, proceed
    }

    // 5. Verify the PDF was produced
    if (!fs.existsSync(pdfFile)) {
      return c.json({ error: "PDF file was not generated" }, 500);
    }

    // 6. Read the PDF and stream it back
    const pdfBuffer = fs.readFileSync(pdfFile);

    // Build a clean filename from the user's name
    const safeName = (body.personalInfo.name || "resume")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_resume.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("[LaTeX Export Error]", error);
    const message = error instanceof Error ? error.message : "Export failed";
    return c.json({ error: message }, 500);
  } finally {
    // 7. Clean up all temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
});

export { route as latexExportRoute };
