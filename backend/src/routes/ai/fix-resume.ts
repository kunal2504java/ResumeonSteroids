import { Hono } from "hono";
import type { Resume } from "@resumeai/shared";
import { anthropic } from "../../lib/anthropic";
import { optionalAuthMiddleware } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rateLimit";

const route = new Hono();

export interface FixResumeResponse {
  resume: Resume;
  changes: string[];
  assistant_message: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AtsRuleFinding {
  rule_name: string;
  category: string;
  status: "pass" | "warn" | "fail";
  message: string;
  fix: string;
  affected_section: string;
  severity: "critical" | "major" | "minor";
}

export interface AtsReportInput {
  total_score?: number;
  grade?: string;
  rule_results?: AtsRuleFinding[];
  keyword_coverage?: { keywords_missing?: string[] };
}

/** Render the ATS scan into a prompt block the model must act on. */
function formatAtsFindings(report?: AtsReportInput): string {
  if (!report) {
    return "No ATS scan was provided. Improve overall quality and ATS-friendliness.";
  }
  const issues = (report.rule_results ?? []).filter((r) => r.status !== "pass");
  const missing = report.keyword_coverage?.keywords_missing ?? [];
  const header = `Current ATS score: ${report.total_score ?? "?"}/100 (grade ${report.grade ?? "?"}).`;

  if (!issues.length && !missing.length) {
    return `${header} No specific issues were flagged. Sharpen impact and keep it one page.`;
  }

  // "parsing" rules are document/template problems the resume JSON cannot fix.
  const contentIssues = issues.filter((r) => r.category !== "parsing");
  const templateIssues = issues.filter((r) => r.category === "parsing");
  const lines: string[] = [header];

  if (contentIssues.length) {
    lines.push("\nFIX THESE by editing the resume content (top priority):");
    for (const r of contentIssues) {
      lines.push(`- [${r.severity}] ${r.rule_name} — ${r.affected_section}: ${r.message}  Fix: ${r.fix}`);
    }
  }
  if (missing.length) {
    lines.push(
      `\nMISSING KEYWORDS to weave in — ONLY where the candidate's real experience or projects already support them; never invent skills to cover a keyword: ${missing
        .slice(0, 25)
        .join(", ")}.`,
    );
  }
  if (templateIssues.length) {
    lines.push(
      "\nDOCUMENT/TEMPLATE issues — do NOT restructure the resume to fix these; instead name them in your assistant_message so the user fixes them in the template:",
    );
    for (const r of templateIssues) {
      lines.push(`- ${r.rule_name}: ${r.message}`);
    }
  }
  return lines.join("\n");
}

export interface EvidenceCategory {
  score: number;
  max: number;
  evidence: string;
}

export interface EvidenceInput {
  total_score?: number;
  grade?: string;
  scores?: {
    open_source?: EvidenceCategory;
    self_projects?: EvidenceCategory;
    production?: EvidenceCategory;
    technical_skills?: EvidenceCategory;
  };
  key_strengths?: string[];
  areas_for_improvement?: string[];
}

/**
 * Render the GitHub-grounded substance evaluation into a prompt block.
 * This is REAL, verifiable evidence — used to surface true work the resume
 * under-represents, never to fabricate.
 */
function formatEvidenceFindings(report?: EvidenceInput): string {
  if (!report || !report.scores) return "No substance evaluation was provided.";
  const s = report.scores;
  const lines: string[] = [
    `Overall substance: ${report.total_score ?? "?"}/100 (grade ${report.grade ?? "?"}). This is graded from the candidate's REAL GitHub/profile data — treat it as ground truth.`,
  ];
  const row = (label: string, c?: EvidenceCategory) =>
    c ? lines.push(`- ${label} ${c.score}/${c.max}: ${c.evidence}`) : 0;
  row("Open Source", s.open_source);
  row("Projects", s.self_projects);
  row("Production", s.production);
  row("Technical depth", s.technical_skills);
  if (report.areas_for_improvement?.length) {
    lines.push(`\nWhere the resume under-represents real work — surface these TRUTHFULLY (they are verifiable, not fabrication): ${report.areas_for_improvement.join("; ")}.`);
  }
  return lines.join("\n");
}

export function buildFixPrompt(
  resume: Resume,
  jobDescription?: string,
  instruction?: string,
  messages?: ChatMessage[],
  atsReport?: AtsReportInput,
  evidenceReport?: EvidenceInput,
): string {
  const userInstruction =
    instruction?.trim() ||
    "Fix everything important automatically: quality, ATS fit, duplicate content, shallow bullets, one-page prioritisation, and readability.";

  return `You are an expert resume editor, ATS specialist, and senior technical recruiter.

You are operating inside a resume editor chatbot. The user can ask for focused changes
or broad fixes. Apply the requested change directly to the resume JSON.

Return ONLY valid JSON. No markdown fences, no preamble.

Primary goals:
1. Resolve the specific ATS findings listed below — they come from an automated scan of THIS resume.
2. Make the resume fit a strong 1-page software engineering resume.
3. Prioritise Experience over Projects when content competes for space.
4. Remove duplicate projects or bullets when the same work appears from GitHub and an existing resume.
5. Rewrite shallow experience bullets into specific, technical, metric-driven bullets.
6. Improve ATS keyword placement in experience and project bullets naturally and truthfully.
7. Preserve factual truth. Do not invent employers, degrees, dates, links, skills, or unsupported seniority.

Bullet rules:
- Start every bullet with a strong past-tense action verb.
- Use concrete technologies, systems, or shipped outcomes.
- Prefer metrics already present in the resume. If a metric must be inferred, use a conservative plausible estimate.
- Keep bullets under 22 words.
- Avoid: responsible for, helped with, worked on, assisted, familiar with, exposure to, various, multiple, several, numerous.
- No first-person pronouns.

One-page prioritisation:
- Keep 2-3 bullets for the most relevant experience roles.
- Keep 1-2 strongest projects only if they do not duplicate experience.
- Keep skills concise and ATS-parseable.
- Keep achievements only if they are stronger than the weakest project bullet.

ATS evaluation to address (fix what is fixable by editing content; never fabricate to satisfy a check):
${formatAtsFindings(atsReport)}

Substance evaluation (GitHub-grounded — REAL, verifiable work). Where it shows strong real work the resume omits or undersells (real open-source contributions, real projects with stars), SURFACE and strengthen that work — it is true, not invented. De-emphasise weak/tutorial projects it flags. Never claim work the evidence does not support:
${formatEvidenceFindings(evidenceReport)}

Return this exact JSON shape:
{
  "resume": <the complete updated resume object, preserving the same schema and ids where possible>,
  "changes": ["short user-facing summary of what changed"],
  "assistant_message": "brief natural-language response explaining what you changed, which ATS issues you fixed, and anything the user must fix in the template"
}

Current user instruction:
${userInstruction}

Recent assistant conversation:
${messages?.length ? JSON.stringify(messages.slice(-8), null, 2) : "No previous messages."}

Job description, if provided:
${jobDescription?.trim() || "No job description provided."}

Resume JSON:
${JSON.stringify(resume, null, 2)}`;
}

export function parseJsonObject(text: string): FixResumeResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1]?.trim() ?? trimmed;
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI assistant returned no JSON object");
  }

  const parsed = JSON.parse(source.slice(first, last + 1)) as Partial<FixResumeResponse>;
  if (!parsed.resume || typeof parsed.resume !== "object") {
    throw new Error("AI assistant response missing resume");
  }

  return {
    resume: parsed.resume as Resume,
    changes: Array.isArray(parsed.changes)
      ? parsed.changes.map((item) => String(item)).filter(Boolean)
      : [],
    assistant_message:
      typeof parsed.assistant_message === "string"
        ? parsed.assistant_message
        : "I updated the resume with the requested changes.",
  };
}

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    if (userId) {
      const limiter = rateLimitMiddleware("tailor");
      let allowed = false;
      await limiter(c, async () => {
        allowed = true;
      });
      if (!allowed) {
        return c.res;
      }
    }

    const body = (await c.req.json()) as {
      resume?: Resume;
      jobDescription?: string;
      instruction?: string;
      messages?: ChatMessage[];
      atsReport?: AtsReportInput;
      evidenceReport?: EvidenceInput;
    };

    if (!body.resume) {
      return c.json({ error: "Resume data required" }, 400);
    }

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 7000,
      messages: [
        {
          role: "user",
          content: buildFixPrompt(
            body.resume,
            body.jobDescription,
            body.instruction,
            body.messages,
            body.atsReport,
            body.evidenceReport,
          ),
        },
      ],
    });

    const text =
      aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";
    const parsed = parseJsonObject(text);

    return c.json(parsed);
  } catch (error) {
    console.error("[AI Assistant Fix Error]", error);
    const message =
      error instanceof Error ? error.message : "AI assistant failed to fix resume";
    return c.json({ error: message }, 500);
  }
});

export { route as fixResumeRoute };
