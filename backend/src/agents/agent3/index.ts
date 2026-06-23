/**
 * Agent 3: ATS Scorer & Feedback
 *
 * Takes the rewritten resume content from Agent 2 and scores it
 * across multiple dimensions: ATS compatibility, impact strength,
 * writing clarity, and overall quality.
 *
 * Provides actionable feedback with specific issues and fixes,
 * keyword analysis (if job description provided), and a
 * readyToApply boolean verdict.
 */

import type { NormalizedData, Agent3Output, ScoringIssue } from "../pipeline.types";
import { anthropic } from "../../lib/anthropic";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SCORER_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) expert and senior recruiter.
Score resumes and give actionable feedback.

Return JSON only:
{
  "overallScore": 0-100,
  "atsScore": 0-100,
  "impactScore": 0-100,
  "clarityScore": 0-100,
  "issues": [
    { "severity": "high|medium|low", "section": "", "message": "", "fix": "" }
  ],
  "strengths": [""],
  "keywordsMatched": [],
  "keywordsMissing": [],
  "readyToApply": true/false
}

Scoring criteria:

ATS Score (0-100):
- Proper section headings that ATS can parse
- Keywords matching the job description (if provided)
- Clean formatting without special characters that break parsers
- Standard date formats and consistent structure

Impact Score (0-100):
- Bullets follow Action Verb → Task → Quantified Result
- Metrics are specific and impressive
- Achievements are highlighted over responsibilities
- Project descriptions show technical depth

Clarity Score (0-100):
- Concise writing (no filler words)
- Professional tone
- Consistent tense (past for previous, present for current)
- No jargon overload

Overall Score:
- Weighted average: ATS 30%, Impact 40%, Clarity 30%

Issue severity guide:
- high: Will likely get the resume rejected (missing keywords, weak bullets, formatting issues)
- medium: Hurts competitiveness (vague metrics, missing quantification)
- low: Nice-to-have improvements (word choice, ordering)

If no job description is provided, skip keywordsMatched and keywordsMissing (return empty arrays) and focus ATS scoring on general best practices.

Return ONLY valid JSON, no explanation, no markdown backticks.`;

// ---------------------------------------------------------------------------
// Agent 3 runner
// ---------------------------------------------------------------------------

/**
 * Run Agent 3: Score the resume and provide actionable feedback.
 *
 * @param writtenContent - Optimized resume data from Agent 2
 * @param jobDescription - Optional job description for keyword analysis
 * @returns Agent3Output - Scores, issues, strengths, and keyword analysis
 */
export async function runAgent3(
  writtenContent: NormalizedData,
  jobDescription?: string
): Promise<Agent3Output> {
  console.log("[Agent 3] Starting ATS scoring and feedback...");

  const userMessage = jobDescription
    ? `Score this resume:\n${JSON.stringify(writtenContent, null, 2)}\n\nJob Description:\n${jobDescription}`
    : `Score this resume:\n${JSON.stringify(writtenContent, null, 2)}`;

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SCORER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = res.content[0].type === "text" ? res.content[0].text : "";

  let parsed: Agent3Output;
  try {
    parsed = JSON.parse(content) as Agent3Output;
  } catch {
    console.error(
      "[Agent 3] Failed to parse Claude response:",
      content.slice(0, 500)
    );
    throw new Error("Agent 3: Claude returned invalid JSON during scoring");
  }

  // Ensure all fields have safe defaults and correct types
  const output: Agent3Output = {
    overallScore: clampScore(parsed.overallScore),
    atsScore: clampScore(parsed.atsScore),
    impactScore: clampScore(parsed.impactScore),
    clarityScore: clampScore(parsed.clarityScore),
    issues: (parsed.issues || []).map(
      (issue): ScoringIssue => ({
        severity: validateSeverity(issue.severity),
        section: issue.section || "",
        message: issue.message || "",
        fix: issue.fix || "",
      })
    ),
    strengths: parsed.strengths || [],
    keywordsMatched: parsed.keywordsMatched || [],
    keywordsMissing: parsed.keywordsMissing || [],
    readyToApply: Boolean(parsed.readyToApply),
  };

  // Sort issues by severity: high → medium → low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  output.issues.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Log summary
  const highIssues = output.issues.filter((i) => i.severity === "high").length;
  const medIssues = output.issues.filter((i) => i.severity === "medium").length;
  const lowIssues = output.issues.filter((i) => i.severity === "low").length;

  console.log("[Agent 3] Scoring complete:");
  console.log(`  Overall: ${output.overallScore}/100`);
  console.log(
    `  ATS: ${output.atsScore} | Impact: ${output.impactScore} | Clarity: ${output.clarityScore}`
  );
  console.log(
    `  Issues: ${highIssues} high, ${medIssues} medium, ${lowIssues} low`
  );
  console.log(`  Strengths: ${output.strengths.length}`);
  if (jobDescription) {
    console.log(
      `  Keywords matched: ${output.keywordsMatched.length}, missing: ${output.keywordsMissing.length}`
    );
  }
  console.log(`  Ready to apply: ${output.readyToApply ? "YES" : "NO"}`);

  return output;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampScore(value: unknown): number {
  const num = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function validateSeverity(value: unknown): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}
