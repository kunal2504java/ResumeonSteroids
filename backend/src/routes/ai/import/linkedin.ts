import { Hono } from "hono";
import { LinkedInImportSchema } from "@resumeai/shared/schemas";
import { anthropic } from "../../../lib/anthropic";
import { LINKEDIN_ANALYZE_PROMPT } from "../../../lib/prompts";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const APIFY_ACTOR_ID = "supreme_coder~linkedin-profile-scraper";
const APIFY_API_BASE = "https://api.apify.com/v2";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = LinkedInImportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid LinkedIn profile URL" }, 400);
    }

    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return c.json(
        { error: "LinkedIn scraping is not configured (missing APIFY_API_KEY)" },
        503
      );
    }

    const { profileUrl } = parsed.data;

    console.log("[LinkedIn] Starting Apify scrape for:", profileUrl);

    // Run the Apify actor synchronously (waits up to 300s for completion)
    const runRes = await fetch(
      `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: [{ url: profileUrl }],
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text().catch(() => "");
      console.error("[LinkedIn Apify Error]", runRes.status, err);
      return c.json(
        {
          error: `LinkedIn scraping failed (${runRes.status}): ${err.slice(0, 200)}`,
        },
        502
      );
    }

    const results = (await runRes.json()) as Record<string, unknown>[];
    console.log("[LinkedIn] Got results:", results?.length ?? 0, "profiles");

    if (!results || results.length === 0) {
      return c.json({ error: "No data returned from LinkedIn scraper" }, 404);
    }

    const profile = results[0];
    console.log("[LinkedIn] Profile keys:", Object.keys(profile));

    // Normalize into our resume format
    const experience = normalizeExperience(profile);
    const education = normalizeEducation(profile);
    const skills = normalizeSkills(profile);

    const name = (
      profile.fullName ??
      (profile.firstName
        ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
        : undefined)
      ) as string | undefined;

    const profileSummary = {
      name,
      headline: profile.headline ?? profile.occupation ?? "",
      summary: profile.summary ?? profile.about ?? "",
      location: profile.geoLocationName ?? profile.geoCountryName ?? "",
      profileUrl,
    };

    const enriched = await enrichLinkedInImport({
      profile: profileSummary,
      experience,
      education,
      skills,
    });

    return c.json({
      profile: {
        name,
        headline: profile.headline ?? profile.occupation,
        summary: enriched.summary || profile.summary || profile.about,
        location: profile.geoLocationName ?? profile.geoCountryName,
        url: profileUrl,
      },
      experience: enriched.experience.length ? enriched.experience : experience,
      education,
      skills: mergeSkillBuckets(skills, enriched.skills),
      linkedinUrl: profileUrl,
    });
  } catch (error) {
    console.error("[LinkedIn Import Error]", error);
    const message =
      error instanceof Error ? error.message : "LinkedIn import failed";
    return c.json({ error: message }, 500);
  }
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatTimePeriodDate(dateObj: any): string {
  if (!dateObj) return "";
  if (typeof dateObj === "string") return dateObj;
  // Handle { month: 10, year: 2022 } format from Apify
  if (dateObj.year) {
    const month = dateObj.month
      ? String(dateObj.month).padStart(2, "0")
      : "";
    return month ? `${dateObj.year}-${month}` : `${dateObj.year}`;
  }
  return "";
}

function normalizeExperience(profile: Record<string, any>) {
  const positions =
    profile.positions ??
    profile.experiences ??
    profile.experience ??
    [];
  if (!Array.isArray(positions)) return [];

  return positions.slice(0, 6).map((pos: any) => {
    // Apify format uses timePeriod.startDate/endDate objects { month, year }
    const tp = pos.timePeriod ?? {};
    const startDate =
      pos.startDate ??
      formatTimePeriodDate(tp.startDate) ??
      pos.dateRange?.split("–")[0]?.trim() ??
      "";
    const endDate =
      pos.endDate ??
      formatTimePeriodDate(tp.endDate) ??
      pos.dateRange?.split("–")[1]?.trim() ??
      "";

    // company can be an object { name, url, logo } or a plain string
    const companyName =
      pos.companyName ??
      (typeof pos.company === "object" ? pos.company?.name : pos.company) ??
      "";

    return {
      company: companyName,
      title: pos.title ?? pos.position ?? "",
      location: pos.location ?? pos.locationName ?? "",
      startDate,
      endDate: endDate || "Present",
      bullets: pos.description
        ? pos.description
            .split(/\n+/)
            .map((s: string) => s.replace(/^[-•]\s*/, "").trim())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    };
  });
}

function normalizeEducation(profile: Record<string, any>) {
  const edu = profile.educations ?? profile.education ?? [];
  if (!Array.isArray(edu)) return [];

  return edu.slice(0, 4).map((e: any) => {
    const tp = e.timePeriod ?? {};
    const startDate =
      e.startDate ??
      formatTimePeriodDate(tp.startDate) ??
      e.dateRange?.split("–")[0]?.trim() ??
      "";
    const endDate =
      e.endDate ??
      formatTimePeriodDate(tp.endDate) ??
      e.dateRange?.split("–")[1]?.trim() ??
      "";

    return {
      institution: e.schoolName ?? e.school ?? e.institutionName ?? "",
      degree: e.degreeName ?? e.degree ?? "",
      field: e.fieldOfStudy ?? e.field ?? "",
      location: e.location ?? "",
      startDate,
      endDate,
      gpa: "",
      coursework: [],
    };
  });
}

function normalizeSkills(profile: Record<string, any>) {
  const raw = profile.skills ?? [];
  const skillNames: string[] = Array.isArray(raw)
    ? raw
        .map((s: any) =>
          typeof s === "string" ? s : (s.name ?? s.skill ?? "")
        )
        .filter(Boolean)
    : [];

  return {
    languages: [] as string[],
    frameworks: [] as string[],
    tools: skillNames.slice(0, 20),
    databases: [] as string[],
  };
}

async function enrichLinkedInImport(input: {
  profile: {
    name?: string;
    headline?: unknown;
    summary?: unknown;
    location?: unknown;
    profileUrl: string;
  };
  experience: Array<{
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
    coursework: string[];
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
  };
}) {
  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: LINKEDIN_ANALYZE_PROMPT(
            JSON.stringify(input.profile, null, 2),
            JSON.stringify(input.experience, null, 2),
            JSON.stringify(input.education, null, 2),
            JSON.stringify(input.skills, null, 2)
          ),
        },
      ],
    });

    const text =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    const parsed = JSON.parse(text) as {
      summary?: string;
      experience?: Array<{
        company?: string;
        title?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        bullets?: string[];
      }>;
      skills?: {
        languages?: string[];
        frameworks?: string[];
        tools?: string[];
        databases?: string[];
      };
    };

    return {
      summary: parsed.summary?.trim() || "",
      experience: (parsed.experience ?? [])
        .map((item, index) => ({
          company: item.company || input.experience[index]?.company || "",
          title: item.title || input.experience[index]?.title || "",
          location: item.location || input.experience[index]?.location || "",
          startDate: item.startDate || input.experience[index]?.startDate || "",
          endDate: item.endDate || input.experience[index]?.endDate || "",
          bullets: (item.bullets ?? []).filter(Boolean).slice(0, 4),
        }))
        .filter((item) => item.company || item.title),
      skills: {
        languages: parsed.skills?.languages ?? [],
        frameworks: parsed.skills?.frameworks ?? [],
        tools: parsed.skills?.tools ?? [],
        databases: parsed.skills?.databases ?? [],
      },
    };
  } catch (error) {
    console.warn("[LinkedIn Import] AI enrichment failed, using normalized scrape only", error);
    return {
      summary: "",
      experience: [],
      skills: {
        languages: [] as string[],
        frameworks: [] as string[],
        tools: [] as string[],
        databases: [] as string[],
      },
    };
  }
}

function mergeSkillBuckets(
  base: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
  },
  enriched: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
  }
) {
  return {
    languages: Array.from(new Set([...(base.languages || []), ...(enriched.languages || [])])),
    frameworks: Array.from(new Set([...(base.frameworks || []), ...(enriched.frameworks || [])])),
    tools: Array.from(new Set([...(base.tools || []), ...(enriched.tools || [])])),
    databases: Array.from(new Set([...(base.databases || []), ...(enriched.databases || [])])),
  };
}

export { route as linkedinImportRoute };
