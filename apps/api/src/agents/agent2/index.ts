/**
 * Agent 2: Resume Content Writer
 *
 * THE KEY AGENT. Takes normalized data from Agent 1 and rewrites
 * every piece of content for maximum impact using Claude.
 *
 * This is where we beat ResumeWorded. The system prompt enforces:
 *   - Action Verb → Task → Quantified Result bullet format
 *   - Strong verbs (Architected, Engineered, Spearheaded, etc.)
 *   - Quantified metrics (inferred with [~] prefix if not available)
 *   - GitHub projects converted to achievement-oriented bullets
 *   - Competitive stats only if impressive (LC >1600, CF >1400)
 *   - 1-page target with recent content prioritized
 *   - Natural ATS keyword integration if job description provided
 */

import type { NormalizedData, Agent2Output } from "../pipeline.types";
import { anthropic } from "../../lib/anthropic";

// ---------------------------------------------------------------------------
// The system prompt — this is EVERYTHING
// ---------------------------------------------------------------------------

const WRITER_SYSTEM_PROMPT = `You are a world-class resume writer with 15+ years of experience at top recruiting firms. You have helped candidates get into FAANG, top startups, and Fortune 500 companies.

YOUR WRITING RULES (non-negotiable):

1. BULLET POINTS must follow: Action Verb → Task → Quantified Result
   BAD:  "Worked on backend APIs"
   GOOD: "Engineered 12 RESTful microservices handling 50K daily requests, reducing average response time by 40%"

2. ALWAYS quantify with metrics. If no metric exists, infer a reasonable one based on context (company size, project type). Mark inferred metrics with a [~] prefix so user can verify.

3. USE strong action verbs: Architected, Engineered, Spearheaded, Optimized, Automated, Reduced, Increased, Launched, Scaled, Delivered — never use "Worked on", "Helped with", "Responsible for"

4. GITHUB PROJECTS: Extract the most impressive repos by stars + complexity. Convert README descriptions into achievement-oriented bullets.

5. LEETCODE/CODEFORCES: Add to skills or a "Achievements" line only if rating > 1600 (LC) or > 1400 (CF). Format as:
   "LeetCode: 1800+ rating (top 5%), 400+ problems solved"

6. TECH STACK: Only list technologies actually used in projects/experience. Never pad with technologies the user hasn't demonstrated.

7. LENGTH: Aim for exactly 1 page. Prioritize recent (last 2 years) content. Cut weakest bullets if over 1 page. Each experience entry should have 2-4 bullets. Each project should have 2-3 bullets.

8. ATS OPTIMIZATION: Naturally include keywords from the job description if provided. Never keyword-stuff — integrate naturally into bullets.

Return ONLY a JSON object matching the EXACT same schema as the input (same field names, same structure) but with rewritten, optimized content. No explanation, no markdown backticks.`;

// ---------------------------------------------------------------------------
// Agent 2 runner
// ---------------------------------------------------------------------------

/**
 * Run Agent 2: Rewrite and optimize resume content for maximum impact.
 *
 * @param normalizedData - Clean data from Agent 1
 * @param jobDescription - Optional job description for ATS tailoring
 * @returns Agent2Output - Same schema, professionally rewritten content
 */
export async function runAgent2(
  normalizedData: NormalizedData,
  jobDescription?: string
): Promise<Agent2Output> {
  console.log("[Agent 2] Starting resume content writing...");

  const userMessage = jobDescription
    ? `Rewrite and optimize this resume data for maximum impact.\n\nTarget Job Description:\n${jobDescription}\n\nResume Data:\n${JSON.stringify(normalizedData, null, 2)}`
    : `Rewrite and optimize this resume data for maximum impact.\n\nResume Data:\n${JSON.stringify(normalizedData, null, 2)}`;

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: WRITER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const content = res.content[0].type === "text" ? res.content[0].text : "";

  let rewritten: NormalizedData;
  try {
    rewritten = JSON.parse(content) as NormalizedData;
  } catch {
    console.error(
      "[Agent 2] Failed to parse Claude response:",
      content.slice(0, 500)
    );
    throw new Error("Agent 2: Claude returned invalid JSON during content writing");
  }

  // Ensure all required fields have safe defaults
  const data: NormalizedData = {
    personal: {
      name: rewritten.personal?.name || normalizedData.personal.name || "",
      email: rewritten.personal?.email || normalizedData.personal.email || "",
      phone: rewritten.personal?.phone || normalizedData.personal.phone || "",
      location:
        rewritten.personal?.location ||
        normalizedData.personal.location ||
        "",
      linkedin:
        rewritten.personal?.linkedin ||
        normalizedData.personal.linkedin ||
        "",
      github:
        rewritten.personal?.github || normalizedData.personal.github || "",
    },
    education: (rewritten.education || normalizedData.education || []).map(
      (e) => ({
        institution: e.institution || "",
        degree: e.degree || "",
        dates: e.dates || "",
        location: e.location || "",
        gpa: e.gpa || "",
      })
    ),
    experience: (rewritten.experience || normalizedData.experience || []).map(
      (e) => ({
        company: e.company || "",
        title: e.title || "",
        location: e.location || "",
        dates: e.dates || "",
        bullets: e.bullets || [],
      })
    ),
    projects: (rewritten.projects || normalizedData.projects || []).map(
      (p) => ({
        name: p.name || "",
        techStack: p.techStack || "",
        date: p.date || "",
        bullets: p.bullets || [],
        url: p.url || "",
        stars: p.stars || 0,
      })
    ),
    skills: {
      languages: rewritten.skills?.languages || normalizedData.skills.languages || [],
      backend: rewritten.skills?.backend || normalizedData.skills.backend || [],
      frontend: rewritten.skills?.frontend || normalizedData.skills.frontend || [],
      databases: rewritten.skills?.databases || normalizedData.skills.databases || [],
      devops: rewritten.skills?.devops || normalizedData.skills.devops || [],
      other: rewritten.skills?.other || normalizedData.skills.other || [],
    },
    competitive: {
      leetcode: {
        solved: rewritten.competitive?.leetcode?.solved || normalizedData.competitive.leetcode.solved || 0,
        rating: rewritten.competitive?.leetcode?.rating || normalizedData.competitive.leetcode.rating || 0,
        rank: rewritten.competitive?.leetcode?.rank || normalizedData.competitive.leetcode.rank || "",
      },
      codeforces: {
        rating: rewritten.competitive?.codeforces?.rating || normalizedData.competitive.codeforces.rating || 0,
        rank: rewritten.competitive?.codeforces?.rank || normalizedData.competitive.codeforces.rank || "",
      },
    },
  };

  // Log summary
  const totalBullets =
    data.experience.reduce((sum, e) => sum + e.bullets.length, 0) +
    data.projects.reduce((sum, p) => sum + p.bullets.length, 0);
  const inferredCount = JSON.stringify(data).split("[~]").length - 1;

  console.log("[Agent 2] Content writing complete:");
  console.log(`  Experience: ${data.experience.length} entries`);
  console.log(`  Projects: ${data.projects.length} entries`);
  console.log(`  Total bullets: ${totalBullets}`);
  console.log(`  Skills: ${Object.values(data.skills).flat().length} total`);
  if (inferredCount > 0) {
    console.log(`  Inferred metrics [~]: ${inferredCount} (user should verify)`);
  }
  if (jobDescription) {
    console.log(`  ATS tailored: yes`);
  }

  return {
    data,
    jobDescription,
  };
}
