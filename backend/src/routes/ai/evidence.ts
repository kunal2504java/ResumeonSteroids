import { Hono } from "hono";
import type { Resume } from "@resumeai/shared";
import { anthropic } from "../../lib/anthropic";
import { optionalAuthMiddleware } from "../../middleware/auth";
import {
  fetchGitHubUser,
  fetchGitHubRepos,
  fetchRepoContribution,
  fetchExternalContributions,
  type GitHubUser,
  type RepoContribution,
  type ExternalContributions,
} from "../../lib/github";
import { fetchLeetCodeStats, type LeetCodeData } from "../../lib/leetcode";
import { fetchCodeforcesUser, type CodeforcesUser } from "../../lib/codeforces";

const route = new Hono();

/** Max scores per category — the rubric ceiling, enforced both in prompt and code. */
const CATEGORY_MAX = {
  open_source: 35,
  self_projects: 30,
  production: 25,
  technical_skills: 10,
} as const;
type CategoryKey = keyof typeof CATEGORY_MAX;

export interface CategoryScore {
  score: number;
  max: number;
  evidence: string;
}

export interface EvidenceReport {
  scores: Record<CategoryKey, CategoryScore>;
  bonus: { total: number; breakdown: string };
  deductions: { total: number; reasons: string };
  key_strengths: string[];
  areas_for_improvement: string[];
  total_score: number; // out of 100 base (+bonus −deductions), capped 0..120
  grade: "A" | "B" | "C" | "D" | "F";
  grounding: {
    github: boolean;
    leetcode: boolean;
    codeforces: boolean;
    notes: string[];
  };
}

interface Grounding {
  user: GitHubUser | null;
  repos: RepoContribution[];
  external: ExternalContributions | null;
  leetcode: LeetCodeData | null;
  codeforces: CodeforcesUser | null;
  notes: string[];
}

/** Pull a bare github username out of a URL or a raw handle (with or without protocol). */
function parseGithubUsername(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/^@/, "");
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  s = s.replace(/^github\.com\//i, ""); // strip the bare host form too
  const seg = s.split(/[/?#]/)[0]?.trim();
  return seg && /^[a-zA-Z0-9-]+$/.test(seg) ? seg : null;
}

/** Best-effort live evidence gather. Any source can fail without sinking the rest. */
async function gatherEvidence(
  resume: Resume,
  handles: { github?: string; leetcode?: string; codeforces?: string },
): Promise<Grounding> {
  const notes: string[] = [];
  const githubUser =
    parseGithubUsername(handles.github) ?? parseGithubUsername(resume.personalInfo.github);

  let user: GitHubUser | null = null;
  let repos: RepoContribution[] = [];
  let external: ExternalContributions | null = null;
  if (githubUser) {
    try {
      const [u, repoList, ext] = await Promise.all([
        fetchGitHubUser(githubUser),
        fetchGitHubRepos(githubUser),
        fetchExternalContributions(githubUser).catch(() => null), // merged PRs to others' repos
      ]);
      user = u;
      external = ext;
      // Contributor share for the top owned repos → owned OSS-vs-personal classification.
      repos = await Promise.all(
        repoList.slice(0, 8).map((r) => fetchRepoContribution(githubUser, r)),
      );
    } catch (err) {
      notes.push(`GitHub fetch failed for "${githubUser}": ${(err as Error).message}`);
    }
  } else {
    notes.push("No GitHub username available — open-source/projects scored from resume text only.");
  }

  let leetcode: LeetCodeData | null = null;
  if (handles.leetcode?.trim()) {
    try {
      leetcode = await fetchLeetCodeStats(handles.leetcode.trim());
    } catch (err) {
      notes.push(`LeetCode fetch failed: ${(err as Error).message}`);
    }
  }

  let codeforces: CodeforcesUser | null = null;
  if (handles.codeforces?.trim()) {
    try {
      codeforces = await fetchCodeforcesUser(handles.codeforces.trim());
    } catch (err) {
      notes.push(`Codeforces fetch failed: ${(err as Error).message}`);
    }
  }

  return { user, repos, external, leetcode, codeforces, notes };
}

function formatGrounding(g: Grounding): string {
  const parts: string[] = [];

  if (g.user) {
    parts.push(
      `=== GITHUB (live) ===\nProfile: ${g.user.login} — ${g.user.public_repos} public repos, ${g.user.followers} followers.${g.user.bio ? ` Bio: ${g.user.bio}` : ""}`,
    );
    if (g.repos.length) {
      parts.push("Top repositories (forks excluded, by stars):");
      for (const r of g.repos) {
        parts.push(
          `- ${r.name} — ${r.stars}★ ${r.language ?? "?"} [${r.projectType}; your commits: ${r.authorCommits}; contributors: ${r.totalContributors}]${r.topics.length ? ` topics: ${r.topics.slice(0, 6).join(", ")}` : ""}`,
        );
      }
      const ownsOnly = g.repos.every((r) => r.projectType === "self_project");
      parts.push(
        `Open-source signal: ${ownsOnly ? "ALL listed repos are single-contributor personal projects — no collaborative/OSS contribution evidence." : "some repos have multiple contributors."}`,
      );
    } else {
      parts.push("No non-fork repositories found.");
    }

    if (g.external && g.external.totalMergedPrs > 0) {
      parts.push(
        "=== EXTERNAL OPEN-SOURCE CONTRIBUTIONS (merged PRs into repos NOT owned by the candidate — the strongest OSS signal) ===",
      );
      parts.push(
        `${g.external.totalMergedPrs} merged PR(s) across ${g.external.externalRepoCount} external repositories.`,
      );
      if (g.external.externalRepos.length) {
        parts.push("Top external repos contributed to (by stars):");
        for (const r of g.external.externalRepos) {
          parts.push(
            `- ${r.repo} — ${r.stars}★ (${r.prCount} merged PR${r.prCount > 1 ? "s" : ""} by this candidate)`,
          );
        }
      }
    } else if (g.user) {
      parts.push(
        "=== EXTERNAL OPEN-SOURCE CONTRIBUTIONS ===\nNo merged pull requests into repositories owned by others were found.",
      );
    }
  } else {
    parts.push("=== GITHUB ===\nNot available.");
  }

  if (g.leetcode) {
    const l = g.leetcode;
    parts.push(
      `=== LEETCODE (live) ===\n${l.totalSolved} solved (Easy ${l.easySolved} / Medium ${l.mediumSolved} / Hard ${l.hardSolved})${l.contestRating ? `, contest rating ${l.contestRating}` : ""}${l.topPercentage ? ` (top ${l.topPercentage}%)` : ""}.`,
    );
  }
  if (g.codeforces) {
    const c = g.codeforces;
    parts.push(
      `=== CODEFORCES (live) ===\n${c.handle}: rating ${c.rating} (max ${c.maxRating}), rank ${c.rank}.`,
    );
  }
  return parts.join("\n");
}

function buildEvidencePrompt(resume: Resume, grounding: Grounding, jobDescription?: string): string {
  return `You are a senior technical recruiter SCORING a candidate's substance — the real engineering work behind the resume. You are NOT rewriting the resume.

Return ONLY valid JSON. No markdown fences, no preamble.

FAIRNESS — your scores MUST ignore: name, gender, demographics, college/university name, GPA/grades, and city/location. Score only technical evidence.

Score four categories. Stay within each maximum:

1. Open Source — /35. Genuine contribution to OTHER people's projects / community.
   - The STRONGEST signal is the "EXTERNAL OPEN-SOURCE CONTRIBUTIONS" section — merged PRs into repos the candidate does NOT own. Weight merged PRs into high-star (1000+) projects most heavily. A merged PR into a major project outweighs owning a personal multi-contributor repo.
   - 25-35: multiple merged PRs into popular OSS (1000+ stars), GSoC, or sustained major community work.
   - 15-24: several merged PRs into others' repos, or meaningful collaborative work.
   - 5-10: only owned repos, few/no external merged PRs.
   - 0-4: no GitHub or only tutorial repos.
   - HARD RULE: owning repositories (even multi-contributor) is NOT the same as contributing to others. If there are ZERO external merged PRs, Open Source MUST be ≤ 10 regardless of owned repos.

2. Self Projects — /30. Complexity and real-world impact of personal/side/hackathon projects.
   - 20-30: complex, multi-tech, real architecture, real users.
   - 10-19: moderate complexity, several features.
   - 1-9: simple tutorial projects (todo, calculator, basic CRUD, weather, notes, portfolio clones).
   - 0: no projects or only trivial ones.
   - Projects with NO working link/demo: score 30-50% lower. Generic names (Todo App, Calculator): penalize.

3. Production — /25. Real-world / internship / production engineering experience (work + roles).
   - Founder / co-founder / early engineer (first ~10-20): extra credit for initiative and building from scratch.

4. Technical Skills — /10. Breadth and depth of skills with evidence in projects/work/competitions.
   - Competitive-programming signal (LeetCode/Codeforces) counts here: strong ratings/solve counts raise this.

BONUS (max 20 total, added after): GSoC +5, GirlScript/Outreachy/Season of Docs +3, startup founder/co-founder +3 to +5, early engineer +2 to +3, portfolio site +2, LinkedIn present +1, strong competitive-programming (CF Expert+/LeetCode 2000+ rating or 500+ solved) +2 to +3.

DEDUCTIONS (subtracted after): -2 to -5 if only simple tutorial projects; -1 to -3 per simple project beyond the first; -3 to -5 per project with no link/demo; mandatory 3-5 if all GitHub repos are single-contributor.

${jobDescription?.trim() ? "JOB DESCRIPTION (weight relevance to THIS role — reward evidence aligned with its required skills, and note misalignment):\n" + jobDescription.trim() : "No job description provided — score against a strong software-engineering bar."}

GROUNDING EVIDENCE (live data — trust it over resume claims; if it contradicts the resume, score the evidence and flag it):
${formatGrounding(grounding)}

RESUME:
${JSON.stringify(resume, null, 2)}

Rules:
- Every category score MUST include a one-to-three sentence "evidence" string citing the specific signal it's based on (a repo, a rating, a role). Do not leave it empty.
- Do NOT list "open source contributions" as a strength unless there is real external-contribution evidence.
- Be specific and honest. If evidence is thin, score low and say why in areas_for_improvement.

Return this exact JSON shape:
{
  "scores": {
    "open_source": { "score": <0-35>, "evidence": "..." },
    "self_projects": { "score": <0-30>, "evidence": "..." },
    "production": { "score": <0-25>, "evidence": "..." },
    "technical_skills": { "score": <0-10>, "evidence": "..." }
  },
  "bonus": { "total": <0-20>, "breakdown": "..." },
  "deductions": { "total": <number ≥ 0>, "reasons": "..." },
  "key_strengths": ["1-5 concrete strengths grounded in evidence"],
  "areas_for_improvement": ["1-4 concrete, actionable gaps"]
}`;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampCategory(raw: unknown, key: CategoryKey): CategoryScore {
  const obj = (raw ?? {}) as Partial<CategoryScore>;
  const max = CATEGORY_MAX[key];
  return {
    score: Math.max(0, Math.min(max, num(obj.score))),
    max,
    evidence: typeof obj.evidence === "string" ? obj.evidence : "No evidence provided.",
  };
}

function gradeFor(total: number): EvidenceReport["grade"] {
  const t = Math.min(100, total);
  if (t >= 90) return "A";
  if (t >= 80) return "B";
  if (t >= 70) return "C";
  if (t >= 60) return "D";
  return "F";
}

export function parseEvidence(text: string, grounding: Grounding): EvidenceReport {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Evidence evaluator returned no JSON object");
  }
  const parsed = JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
  const rawScores = (parsed.scores ?? {}) as Record<string, unknown>;

  const scores = {
    open_source: clampCategory(rawScores.open_source, "open_source"),
    self_projects: clampCategory(rawScores.self_projects, "self_projects"),
    production: clampCategory(rawScores.production, "production"),
    technical_skills: clampCategory(rawScores.technical_skills, "technical_skills"),
  };

  const bonusObj = (parsed.bonus ?? {}) as { total?: unknown; breakdown?: unknown };
  const dedObj = (parsed.deductions ?? {}) as { total?: unknown; reasons?: unknown };
  const bonus = { total: Math.max(0, Math.min(20, num(bonusObj.total))), breakdown: String(bonusObj.breakdown ?? "") };
  const deductions = { total: Math.max(0, num(dedObj.total)), reasons: String(dedObj.reasons ?? "") };

  const base = scores.open_source.score + scores.self_projects.score + scores.production.score + scores.technical_skills.score;
  const total = Math.max(0, Math.min(120, base + bonus.total - deductions.total));

  const toStrings = (v: unknown, cap: number): string[] =>
    Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, cap) : [];

  return {
    scores,
    bonus,
    deductions,
    key_strengths: toStrings(parsed.key_strengths, 5),
    areas_for_improvement: toStrings(parsed.areas_for_improvement, 4),
    total_score: Math.round(total * 10) / 10,
    grade: gradeFor(total),
    grounding: {
      github: !!grounding.user,
      leetcode: !!grounding.leetcode,
      codeforces: !!grounding.codeforces,
      notes: grounding.notes,
    },
  };
}

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = (await c.req.json()) as {
      resume?: Resume;
      jobDescription?: string;
      github?: string;
      leetcode?: string;
      codeforces?: string;
    };
    if (!body.resume) {
      return c.json({ error: "Resume data required" }, 400);
    }

    const grounding = await gatherEvidence(body.resume, {
      github: body.github,
      leetcode: body.leetcode,
      codeforces: body.codeforces,
    });

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        { role: "user", content: buildEvidencePrompt(body.resume, grounding, body.jobDescription) },
      ],
    });

    const text = aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";
    return c.json(parseEvidence(text, grounding));
  } catch (error) {
    console.error("[Evidence Evaluator Error]", error);
    const message = error instanceof Error ? error.message : "Evidence evaluation failed";
    return c.json({ error: message }, 500);
  }
});

export { route as evidenceRoute };
