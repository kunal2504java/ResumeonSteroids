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

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: EXPERIENCE_ENRICH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: EXPERIENCE_ENRICH_USER_PROMPT(
            JSON.stringify(context, null, 2)
          ),
        },
      ],
    });

    const text =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    const { questionsBlock, jsonPayload } = extractJsonPayload(text);

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
