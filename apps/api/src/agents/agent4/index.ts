/**
 * Agent 4: LaTeX Formatter → PDF
 *
 * Takes the rewritten resume content from Agent 2, converts it to the
 * LaTeX template format, fills the Jake Gutierrez template, compiles
 * with pdflatex, and returns the PDF buffer.
 *
 * Flow:
 *   NormalizedData → bridge to ResumeData → fillTemplate() → .tex file
 *   → pdflatex (2 passes) → PDF buffer
 */

import type { NormalizedData, Agent4Output } from "../pipeline.types";
import { fillTemplate, type ResumeData } from "../../lib/fillTemplate";
import { compileLatexToPdf } from "../../lib/pdflatex";

// ---------------------------------------------------------------------------
// Bridge: NormalizedData → ResumeData (fillTemplate's expected shape)
// ---------------------------------------------------------------------------

/**
 * Convert our pipeline's NormalizedData into the shape that fillTemplate expects.
 * The key differences:
 *   - personalInfo.website (we don't have it, default to "")
 *   - experience uses startDate/endDate instead of dates string
 *   - education uses startDate/endDate, field, coursework
 *   - projects.techStack is string[] not string
 *   - skills uses frameworks/tools instead of backend/frontend/devops/other
 */
function toResumeData(data: NormalizedData): ResumeData {
  return {
    personalInfo: {
      name: data.personal.name,
      email: data.personal.email,
      phone: data.personal.phone,
      location: data.personal.location,
      linkedin: data.personal.linkedin,
      github: data.personal.github,
      website: "",
    },
    experience: data.experience.map((exp) => {
      // Parse "Aug 2022 -- Present" into startDate/endDate
      const { start, end } = parseDateRange(exp.dates);
      return {
        company: exp.company,
        title: exp.title,
        location: exp.location,
        startDate: start,
        endDate: end,
        bullets: exp.bullets,
      };
    }),
    education: data.education.map((edu) => {
      const { start, end } = parseDateRange(edu.dates);
      // Try to split "B.S. in Computer Science" into degree + field
      const { degree, field } = parseDegree(edu.degree);
      return {
        institution: edu.institution,
        degree,
        field,
        location: edu.location,
        startDate: start,
        endDate: end,
        gpa: edu.gpa,
        coursework: [],
      };
    }),
    projects: data.projects.map((proj) => {
      // techStack is a comma-separated string in NormalizedData, split to array
      const techArr = proj.techStack
        ? proj.techStack.split(/,\s*/).filter(Boolean)
        : [];
      const { start, end } = parseDateRange(proj.date);
      return {
        name: proj.name,
        techStack: techArr,
        startDate: start,
        endDate: end,
        bullets: proj.bullets,
      };
    }),
    skills: {
      // Map our 6 categories → fillTemplate's 4 categories
      languages: data.skills.languages,
      frameworks: [...data.skills.frontend, ...data.skills.backend],
      tools: [...data.skills.devops, ...data.skills.other],
      databases: data.skills.databases,
    },
    // Add competitive programming as achievements if impressive
    achievements: buildAchievements(data),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a date range string like "Aug 2022 -- Present" into start/end parts.
 * Handles various formats from Claude output.
 */
function parseDateRange(dates: string): { start: string; end: string } {
  if (!dates) return { start: "", end: "" };

  // Try splitting on common separators
  const separators = [" -- ", " - ", " – ", " — ", "–", "—", "-"];
  for (const sep of separators) {
    if (dates.includes(sep)) {
      const parts = dates.split(sep).map((s) => s.trim());
      return { start: parts[0] || "", end: parts[1] || "" };
    }
  }

  // Single date — treat as the end date (common for education graduation)
  return { start: "", end: dates.trim() };
}

/**
 * Try to split "B.S. in Computer Science" into degree + field.
 */
function parseDegree(degreeStr: string): { degree: string; field: string } {
  if (!degreeStr) return { degree: "", field: "" };

  const patterns = [
    /^(.+?)\s+in\s+(.+)$/i,
    /^(.+?),\s+(.+)$/,
    /^(.+?)\s*[-–—]\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = degreeStr.match(pattern);
    if (match) {
      return { degree: match[1].trim(), field: match[2].trim() };
    }
  }

  return { degree: degreeStr, field: "" };
}

/**
 * Build achievement strings from competitive programming stats.
 * Only includes stats that are impressive enough per Agent 2's rules.
 */
function buildAchievements(data: NormalizedData): string[] {
  const achievements: string[] = [];
  const lc = data.competitive?.leetcode;
  const cf = data.competitive?.codeforces;

  if (lc && (lc.rating > 1600 || lc.solved > 200)) {
    const parts: string[] = [];
    if (lc.rating > 0) parts.push(`${lc.rating}+ rating`);
    if (lc.rank) parts.push(lc.rank);
    if (lc.solved > 0) parts.push(`${lc.solved}+ problems solved`);
    achievements.push(`LeetCode: ${parts.join(", ")}`);
  }

  if (cf && cf.rating > 1400) {
    const parts: string[] = [];
    if (cf.rating > 0) parts.push(`${cf.rating} rating`);
    if (cf.rank) parts.push(cf.rank);
    achievements.push(`Codeforces: ${parts.join(", ")}`);
  }

  return achievements;
}

// ---------------------------------------------------------------------------
// Agent 4 runner
// ---------------------------------------------------------------------------

/**
 * Run Agent 4: Convert rewritten resume data to LaTeX and compile to PDF.
 *
 * @param writtenContent - Optimized resume data from Agent 2
 * @returns Agent4Output - The PDF buffer and LaTeX source
 */
export async function runAgent4(
  writtenContent: NormalizedData
): Promise<Agent4Output> {
  console.log("[Agent 4] Starting LaTeX formatting and PDF compilation...");

  // Step 1: Bridge NormalizedData → ResumeData
  const resumeData = toResumeData(writtenContent);
  console.log("[Agent 4] Converted to template format");

  // Step 2: Fill the LaTeX template
  const texSource = fillTemplate(resumeData);
  console.log(`[Agent 4] LaTeX source generated (${texSource.length} chars)`);

  // Step 3: Compile to PDF
  console.log("[Agent 4] Compiling LaTeX → PDF (2 passes)...");
  const { pdfBuffer } = await compileLatexToPdf(texSource, "resume-pipeline-");
  console.log(`[Agent 4] PDF compiled (${pdfBuffer.byteLength} bytes)`);

  return {
    pdfBuffer,
    texSource,
  };
}
