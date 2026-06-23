import { Hono } from "hono";
import { anthropic } from "../../lib/anthropic";
import {
  EXPERIENCE_ENRICH_SYSTEM_PROMPT,
  EXPERIENCE_ENRICH_USER_PROMPT,
} from "../../lib/prompts";
import { optionalAuthMiddleware } from "../../middleware/auth";

const route = new Hono();

interface ExperienceBullet {
  text: string;
  ats_keywords_used: string[];
  action_verb: string;
  has_metric: boolean;
  metric_source: "linkedin" | "github" | "old_resume" | "inferred";
}

interface ExperienceRole {
  company: string;
  title: string;
  duration: string;
  location: string;
  bullets: ExperienceBullet[];
  status: "complete" | "awaiting_user_input";
}

interface ExperienceEnrichmentResponse {
  experience: ExperienceRole[];
  roles_needing_input: string[];
}

interface RoleEvidenceSummary {
  company: string;
  title: string;
  duration: string;
  technologies: string[];
  metrics: string[];
  oldResumeBullets: string[];
  linkedinBullets: string[];
  githubRepoNames: string[];
  hasMeaningfulEvidence: boolean;
}

const STRONG_ACTION_VERBS = new Set([
  "engineered",
  "architected",
  "spearheaded",
  "reduced",
  "increased",
  "automated",
  "deployed",
  "optimised",
  "optimized",
  "refactored",
  "integrated",
  "shipped",
  "scaled",
  "led",
  "migrated",
  "built",
  "designed",
  "implemented",
  "launched",
  "established",
  "drove",
  "improved",
  "streamlined",
  "delivered",
  "owned",
]);

const FORBIDDEN_PHRASES = [
  "worked on",
  "worked with",
  "helped",
  "assisted",
  "supported",
  "contributed to",
  "responsible for",
  "involved in",
  "collaborated",
  "participated in",
];

const SHALLOW_PATTERNS = [
  "cross-functional teams",
  "strategic initiatives",
  "business operations",
  "product engineering initiatives",
  "hybrid work environment",
  "enhance product features",
  "develop and enhance",
  "startup environment",
  "leadership team",
];

function buildContext(body: Record<string, unknown>): Record<string, unknown> {
  const linkedin = (body.linkedin as Record<string, unknown> | undefined) ?? {};
  const github = (body.github as Record<string, unknown> | undefined) ?? {};
  const resume = (body.resume as Record<string, unknown> | undefined) ?? {};
  const jdAnalysis = (body.jd_analysis as Record<string, unknown> | undefined) ?? {};
  const gapAnalysis = (body.gap_analysis as Record<string, unknown> | undefined) ?? {};

  return {
    candidate: {
      linkedin: {
        profile: linkedin.profile ?? {},
        experience: linkedin.experience ?? [],
        education: linkedin.education ?? [],
        skills: linkedin.skills ?? {},
      },
      github: {
        profile: github.profile ?? {},
        repos: github.repoEvidence ?? github.projects ?? [],
      },
      old_resume: {
        raw_text: resume.rawText ?? "",
        sections: {
          experience:
            (resume.resumeData as Record<string, unknown> | undefined)?.experience ?? [],
          projects:
            (resume.resumeData as Record<string, unknown> | undefined)?.projects ?? [],
        },
      },
      project_entries: [
        ...(((resume.resumeData as Record<string, unknown> | undefined)?.projects as unknown[]) ?? []),
        ...(((github.projects as unknown[]) ?? [])),
      ],
    },
    jd_analysis: {
      ats_keywords: jdAnalysis.ats_keywords ?? [],
      required_skills: jdAnalysis.required_skills ?? [],
    },
    gap_analysis: {
      soft_gaps: gapAnalysis.soft_gaps ?? [],
    },
  };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function roleKey(company: string, title: string): string {
  return `${company}::${title}`.trim().toLowerCase();
}

function splitBullets(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function extractMetrics(items: string[]): string[] {
  const matches = new Set<string>();
  for (const item of items) {
    const found = item.match(/\b\d+(?:\.\d+)?(?:%|x|ms|s|m|k|M|\+)?\b/g) ?? [];
    for (const metric of found) {
      matches.add(metric);
    }
  }
  return Array.from(matches).slice(0, 6);
}

function extractTechnologies(items: string[]): string[] {
  const matches = new Set<string>();
  const regex =
    /\b(?:Python|Java|TypeScript|JavaScript|React|Next\.js|Nextjs|Node\.js|Node|Express|Go|Golang|Rust|AWS|GCP|Azure|Docker|Kubernetes|PostgreSQL|Postgres|MongoDB|Redis|GraphQL|REST|gRPC|Kafka|Terraform|CI\/CD|GitHub Actions|FastAPI|Django|Flask|SQL|Spark|Airflow|Pandas|NumPy|Tailwind|React Native|Supabase|Firebase)\b/gi;

  for (const item of items) {
    const found = item.match(regex) ?? [];
    for (const token of found) {
      matches.add(token);
    }
  }

  return Array.from(matches).slice(0, 12);
}

function buildEvidenceIndex(context: Record<string, unknown>): Map<string, RoleEvidenceSummary> {
  const candidate = (context.candidate as Record<string, unknown> | undefined) ?? {};
  const linkedin = (candidate.linkedin as Record<string, unknown> | undefined) ?? {};
  const oldResume = (candidate.old_resume as Record<string, unknown> | undefined) ?? {};
  const github = (candidate.github as Record<string, unknown> | undefined) ?? {};

  const entries = new Map<string, RoleEvidenceSummary>();

  const linkedinExperience = Array.isArray(linkedin.experience) ? linkedin.experience : [];
  for (const rawEntry of linkedinExperience) {
    const entry = (rawEntry as Record<string, unknown> | undefined) ?? {};
    const company = cleanText(entry.company);
    const title = cleanText(entry.title);
    const duration = [cleanText(entry.startDate), cleanText(entry.endDate)].filter(Boolean).join(" - ");
    const linkedinBullets = splitBullets(entry.bullets);
    const key = roleKey(company, title);
    if (!key) continue;

    entries.set(key, {
      company,
      title,
      duration,
      technologies: extractTechnologies(linkedinBullets),
      metrics: extractMetrics(linkedinBullets),
      oldResumeBullets: [],
      linkedinBullets,
      githubRepoNames: [],
      hasMeaningfulEvidence: linkedinBullets.length > 0,
    });
  }

  const oldResumeSections =
    ((oldResume.sections as Record<string, unknown> | undefined)?.experience as unknown[]) ?? [];
  for (const rawEntry of oldResumeSections) {
    const entry = (rawEntry as Record<string, unknown> | undefined) ?? {};
    const company = cleanText(entry.company);
    const title = cleanText(entry.title);
    const key = roleKey(company, title);
    if (!key) continue;

    const oldResumeBullets = splitBullets(entry.bullets);
    const existing = entries.get(key);
    const mergedBullets = [...(existing?.oldResumeBullets ?? []), ...oldResumeBullets];
    const allEvidence = [
      ...(existing?.linkedinBullets ?? []),
      ...mergedBullets,
    ];

    entries.set(key, {
      company: company || existing?.company || "",
      title: title || existing?.title || "",
      duration: existing?.duration || [cleanText(entry.startDate), cleanText(entry.endDate)].filter(Boolean).join(" - "),
      technologies: extractTechnologies(allEvidence),
      metrics: extractMetrics(allEvidence),
      oldResumeBullets: mergedBullets,
      linkedinBullets: existing?.linkedinBullets ?? [],
      githubRepoNames: existing?.githubRepoNames ?? [],
      hasMeaningfulEvidence: allEvidence.length > 0,
    });
  }

  const githubRepos = Array.isArray(github.repos) ? github.repos : [];
  const repoNames = githubRepos
    .map((repo) => cleanText((repo as Record<string, unknown> | undefined)?.name))
    .filter(Boolean);

  for (const [key, summary] of entries) {
    const allEvidence = [
      ...summary.linkedinBullets,
      ...summary.oldResumeBullets,
      ...repoNames,
    ];
    entries.set(key, {
      ...summary,
      technologies: extractTechnologies(allEvidence),
      metrics: extractMetrics(allEvidence),
      githubRepoNames: repoNames.slice(0, 6),
      hasMeaningfulEvidence:
        summary.hasMeaningfulEvidence ||
        summary.oldResumeBullets.length > 0 ||
        repoNames.length > 0,
    });
  }

  return entries;
}

function evaluateBulletQuality(
  bullet: ExperienceBullet,
  evidence: RoleEvidenceSummary | undefined,
): string[] {
  const issues: string[] = [];
  const text = cleanText(bullet.text);
  const lower = text.toLowerCase();

  if (!text) {
    return ["bullet is empty"];
  }

  const firstWord = lower.split(/\s+/)[0] ?? "";
  if (!STRONG_ACTION_VERBS.has(firstWord)) {
    issues.push("does not start with a strong past-tense action verb");
  }

  if (!/\d/.test(text)) {
    issues.push("does not contain a quantified metric");
  }

  if (text.split(/\s+/).filter(Boolean).length > 20) {
    issues.push("exceeds 20 words");
  }

  if (FORBIDDEN_PHRASES.some((phrase) => lower.includes(phrase))) {
    issues.push("uses a forbidden weak phrase");
  }

  if (SHALLOW_PATTERNS.some((phrase) => lower.includes(phrase))) {
    issues.push("reads like generic corporate filler");
  }

  if (
    evidence &&
    evidence.technologies.length > 0 &&
    !evidence.technologies.some((token) => lower.includes(token.toLowerCase()))
  ) {
    issues.push("does not mention any grounded technology from the source evidence");
  }

  return issues;
}

function findWeakRoles(
  response: ExperienceEnrichmentResponse,
  evidenceIndex: Map<string, RoleEvidenceSummary>,
): Array<{ role: ExperienceRole; issues: string[]; evidence?: RoleEvidenceSummary }> {
  const weakRoles: Array<{ role: ExperienceRole; issues: string[]; evidence?: RoleEvidenceSummary }> = [];

  for (const role of response.experience) {
    if (role.status !== "complete") {
      continue;
    }

    const key = roleKey(role.company, role.title);
    const evidence = evidenceIndex.get(key);
    const roleIssues: string[] = [];

    if (role.bullets.length < 2 && evidence?.hasMeaningfulEvidence) {
      roleIssues.push("returned fewer than 2 bullets despite having usable evidence");
    }

    for (const bullet of role.bullets) {
      const bulletIssues = evaluateBulletQuality(bullet, evidence);
      if (bulletIssues.length > 0) {
        roleIssues.push(`"${bullet.text}" -> ${bulletIssues.join(", ")}`);
      }
    }

    if (roleIssues.length > 0) {
      weakRoles.push({ role, issues: roleIssues, evidence });
    }
  }

  return weakRoles;
}

function buildCorrectivePrompt(
  weakRoles: Array<{ role: ExperienceRole; issues: string[]; evidence?: RoleEvidenceSummary }>,
): string {
  const roleLines = weakRoles.map(({ role, issues, evidence }) => {
    const evidenceSummary = evidence
      ? [
          evidence.technologies.length
            ? `technologies: ${evidence.technologies.join(", ")}`
            : "",
          evidence.metrics.length ? `metrics: ${evidence.metrics.join(", ")}` : "",
          evidence.oldResumeBullets.length
            ? `old_resume_bullets: ${evidence.oldResumeBullets.slice(0, 3).join(" | ")}`
            : "",
          evidence.linkedinBullets.length
            ? `linkedin_bullets: ${evidence.linkedinBullets.slice(0, 3).join(" | ")}`
            : "",
        ]
          .filter(Boolean)
          .join("; ")
      : "no additional evidence summary";

    return [
      `Role: ${role.company} | ${role.title} | ${role.duration}`,
      `Problems: ${issues.join(" ; ")}`,
      `Grounded evidence: ${evidenceSummary}`,
      "Rewrite this role with materially stronger, more technical, more specific bullets. Do not return generic wording.",
    ].join("\n");
  });

  return [
    "Your previous response contained weak experience bullets.",
    "Rewrite only the failing roles below and then return the full required JSON again.",
    "Hard requirements:",
    "- Every complete role must have 2-3 bullets if evidence exists",
    "- Every bullet must include a metric",
    "- Every bullet must include a concrete technical or execution detail",
    "- Do not use vague filler such as cross-functional, strategic initiatives, business operations, or product engineering initiatives",
    "- Ground each bullet in the supplied evidence; use old resume bullets and technologies when available",
    "",
    roleLines.join("\n\n"),
  ].join("\n");
}

async function generateExperienceEnrichment(
  context: Record<string, unknown>,
  correctivePrompt?: string,
) {
  const messages: Array<{ role: "user"; content: string }> = [
    {
      role: "user",
      content: EXPERIENCE_ENRICH_USER_PROMPT(JSON.stringify(context, null, 2)),
    },
  ];

  if (correctivePrompt) {
    messages.push({
      role: "user",
      content: correctivePrompt,
    });
  }

  return anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: EXPERIENCE_ENRICH_SYSTEM_PROMPT,
    messages,
  });
}

function extractJsonPayload(text: string): {
  questionsBlock: string;
  jsonPayload: ExperienceEnrichmentResponse;
} {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("Experience enrichment returned no JSON payload");
  }

  const questionsBlock = trimmed.slice(0, jsonStart).trim();
  const jsonText = trimmed.slice(jsonStart);
  const parsed = JSON.parse(jsonText) as ExperienceEnrichmentResponse;

  return {
    questionsBlock,
    jsonPayload: {
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      roles_needing_input: Array.isArray(parsed.roles_needing_input)
        ? parsed.roles_needing_input.map((item) => String(item))
        : [],
    },
  };
}

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const context = buildContext(body);
    const evidenceIndex = buildEvidenceIndex(context);

    const initialResponse = await generateExperienceEnrichment(context);
    const initialText =
      initialResponse.content[0].type === "text" ? initialResponse.content[0].text : "";
    let { questionsBlock, jsonPayload } = extractJsonPayload(initialText);

    const weakRoles = findWeakRoles(jsonPayload, evidenceIndex);
    if (weakRoles.length > 0) {
      const retryResponse = await generateExperienceEnrichment(
        context,
        buildCorrectivePrompt(weakRoles),
      );
      const retryText =
        retryResponse.content[0].type === "text" ? retryResponse.content[0].text : "";
      const retryParsed = extractJsonPayload(retryText);
      questionsBlock = retryParsed.questionsBlock;
      jsonPayload = retryParsed.jsonPayload;
    }

    return c.json({
      experience: jsonPayload.experience,
      rolesNeedingInput: jsonPayload.roles_needing_input,
      questionsBlock,
    });
  } catch (error) {
    console.error("[Experience Enrichment Error]", error);
    const message =
      error instanceof Error ? error.message : "Experience enrichment failed";
    return c.json({ error: message }, 500);
  }
});

export { route as enrichExperienceRoute };
