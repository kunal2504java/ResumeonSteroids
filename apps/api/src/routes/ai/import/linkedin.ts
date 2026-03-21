import { Hono } from "hono";
import { LinkedInImportSchema } from "@resumeai/shared/schemas";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const APIFY_ACTOR_ID = "curious_coder~linkedin-profile-scraper";
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
      return c.json({ error: "LinkedIn scraping is not configured (missing APIFY_API_KEY)" }, 503);
    }

    const { profileUrl } = parsed.data;

    // Run the Apify actor synchronously (waits up to 300s for completion)
    const runRes = await fetch(
      `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileUrls: [profileUrl],
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text().catch(() => "");
      console.error("[LinkedIn Apify Error]", runRes.status, err);
      return c.json({ error: "LinkedIn scraping failed" }, 502);
    }

    const results = (await runRes.json()) as Record<string, unknown>[];

    if (!results || results.length === 0) {
      return c.json({ error: "No data returned from LinkedIn scraper" }, 404);
    }

    const profile = results[0];

    // Normalize into our resume format
    const experience = normalizeExperience(profile);
    const education = normalizeEducation(profile);
    const skills = normalizeSkills(profile);

    return c.json({
      profile: {
        name: profile.fullName ?? profile.firstName
          ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
          : undefined,
        headline: profile.headline,
        summary: profile.summary ?? profile.about,
        url: profileUrl,
      },
      experience,
      education,
      skills,
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

function normalizeExperience(profile: Record<string, any>) {
  const positions = profile.experiences ?? profile.positions ?? profile.experience ?? [];
  if (!Array.isArray(positions)) return [];

  return positions.slice(0, 6).map((pos: any) => ({
    company: pos.companyName ?? pos.company ?? "",
    title: pos.title ?? pos.position ?? "",
    location: pos.location ?? pos.locationName ?? "",
    startDate: pos.startDate ?? pos.dateRange?.split("–")[0]?.trim() ?? "",
    endDate: pos.endDate ?? pos.dateRange?.split("–")[1]?.trim() ?? "Present",
    bullets: pos.description
      ? pos.description
          .split(/\n+/)
          .map((s: string) => s.replace(/^[-•]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
  }));
}

function normalizeEducation(profile: Record<string, any>) {
  const edu = profile.educations ?? profile.education ?? [];
  if (!Array.isArray(edu)) return [];

  return edu.slice(0, 4).map((e: any) => ({
    institution: e.schoolName ?? e.school ?? e.institutionName ?? "",
    degree: e.degreeName ?? e.degree ?? "",
    field: e.fieldOfStudy ?? e.field ?? "",
    location: e.location ?? "",
    startDate: e.startDate ?? e.dateRange?.split("–")[0]?.trim() ?? "",
    endDate: e.endDate ?? e.dateRange?.split("–")[1]?.trim() ?? "",
    gpa: "",
    coursework: [],
  }));
}

function normalizeSkills(profile: Record<string, any>) {
  const raw = profile.skills ?? [];
  const skillNames: string[] = Array.isArray(raw)
    ? raw.map((s: any) => (typeof s === "string" ? s : s.name ?? s.skill ?? "")).filter(Boolean)
    : [];

  return {
    languages: [] as string[],
    frameworks: [] as string[],
    tools: skillNames.slice(0, 20),
    databases: [] as string[],
  };
}

export { route as linkedinImportRoute };
