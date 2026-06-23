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
import { compileLatexToPdf } from "../../lib/pdflatex";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    // 1. Parse the incoming resume data
    const body = (await c.req.json()) as ResumeData;
    if (!body.personalInfo) {
      return c.json({ error: "Invalid resume data: personalInfo required" }, 400);
    }

    // 2. Fill the LaTeX template with the resume data
    const texContent = fillTemplate(body);

    // 3. Compile LaTeX to PDF
    const { pdfBuffer } = await compileLatexToPdf(texContent, "resume-");

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
  }
});

export { route as latexExportRoute };
