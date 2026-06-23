import { Hono } from "hono";
import type { Context } from "hono";
import { anthropic } from "../../lib/anthropic";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authMiddleware } from "../../middleware/auth";

type AuthContext = Context<{ Variables: { userId: string } }>;

const opportunityRoutes = new Hono();

interface NormalizedOpportunity {
  company_name: string;
  role_title: string;
  location: string | null;
  normalized_jd: string;
  provider_metadata: Record<string, unknown>;
}

interface ExtractedJobPage {
  url: string;
  title: string;
  text: string;
  sourceType: string;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) {
    return stripHtml(title).slice(0, 180);
  }

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return ogTitle ? stripHtml(ogTitle).slice(0, 180) : "";
}

function sourceTypeFromUrl(url: string): string {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("greenhouse.io") || host.includes("greenhouse")) return "greenhouse";
  if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "workday";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("keka.com") || host.includes("keka")) return "keka";
  if (host.includes("lever.co")) return "lever";
  return "career_page";
}

async function extractJobPage(url: string): Promise<ExtractedJobPage> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https job links are supported");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ResumeAIJobExtractor/1.0; +https://resumeai.local)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch job page (${response.status})`);
  }

  const html = await response.text();
  const text = stripHtml(html).slice(0, 30000);
  if (text.length < 120) {
    throw new Error("Job page did not expose enough readable text. Paste the JD text instead.");
  }

  return {
    url,
    title: titleFromHtml(html),
    text,
    sourceType: sourceTypeFromUrl(url),
  };
}

async function normalizeOpportunity(input: {
  companyName?: string;
  roleTitle?: string;
  location?: string;
  rawText?: string;
  sourceUrl?: string;
}): Promise<NormalizedOpportunity> {
  const company = input.companyName?.trim();
  const role = input.roleTitle?.trim();

  if (company && role) {
    return {
      company_name: company,
      role_title: role,
      location: input.location?.trim() || null,
      normalized_jd: input.rawText?.trim() || "",
      provider_metadata: { normalized_by: "manual" },
    };
  }

  const text = input.rawText?.trim() || input.sourceUrl?.trim();
  if (!text) {
    throw new Error("Provide company/role or raw job text/source URL");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: `Extract a job opportunity from this LinkedIn/job post input.

Rules:
- Do not invent company or role. Use "Unknown company" or "Unknown role" if missing.
- Keep normalized_jd concise but include responsibilities, requirements, location, and application instructions if present.
- Return ONLY JSON.

Input:
${text}

Schema:
{
  "company_name": "...",
  "role_title": "...",
  "location": null,
  "normalized_jd": "...",
  "provider_metadata": {
    "source_type": "linkedin_post|job_url|manual_text|unknown",
    "detected_seniority": "...",
    "keywords": ["..."]
  }
}`,
      },
    ],
  });

  const responseText = response.content[0]?.type === "text" ? response.content[0].text : "";
  const parsed = extractJson<Partial<NormalizedOpportunity>>(responseText);

  return {
    company_name: clean(parsed.company_name) || "Unknown company",
    role_title: clean(parsed.role_title) || "Unknown role",
    location: clean(parsed.location) || input.location?.trim() || null,
    normalized_jd: clean(parsed.normalized_jd) || input.rawText?.trim() || "",
    provider_metadata:
      typeof parsed.provider_metadata === "object" && parsed.provider_metadata !== null
        ? parsed.provider_metadata
        : { normalized_by: "llm" },
  };
}

async function createOpportunityFromNormalized(input: {
  userId: string;
  source: string;
  sourceUrl?: string;
  rawText?: string;
  normalized: NormalizedOpportunity;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("job_opportunities")
    .insert({
      user_id: input.userId,
      company_name: input.normalized.company_name,
      role_title: input.normalized.role_title,
      location: input.normalized.location,
      source: input.source,
      source_url: input.sourceUrl || null,
      raw_text: input.rawText || null,
      normalized_jd: input.normalized.normalized_jd,
      provider_metadata: input.normalized.provider_metadata,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to save opportunity");
  }

  await getSupabaseAdmin().from("job_source_events").insert({
    opportunity_id: data.id,
    user_id: input.userId,
    provider:
      input.normalized.provider_metadata.normalized_by === "manual"
        ? "manual"
        : String(input.normalized.provider_metadata.source_type ?? "job_extractor"),
    status: "success",
    raw_payload: input.normalized.provider_metadata,
  });

  return data;
}

opportunityRoutes.get("/", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const status = c.req.query("status");
    let query = getSupabaseAdmin()
      .from("job_opportunities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return c.json({ error: "Failed to fetch opportunities" }, 500);
    }

    return c.json({ opportunities: data ?? [] });
  } catch (error) {
    console.error("[Opportunity List Error]", error);
    return c.json({ error: "Failed to fetch opportunities" }, 500);
  }
});

opportunityRoutes.post("/", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const body = (await c.req.json()) as Record<string, unknown>;
    const source = clean(body.source) || "manual";
    const sourceUrl = clean(body.source_url);
    const rawText = clean(body.raw_text);

    const normalized = await normalizeOpportunity({
      companyName: clean(body.company_name),
      roleTitle: clean(body.role_title),
      location: clean(body.location),
      rawText,
      sourceUrl,
    });

    const data = await createOpportunityFromNormalized({
      userId,
      source,
      sourceUrl,
      rawText,
      normalized,
    });

    return c.json({ opportunity: data }, 201);
  } catch (error) {
    console.error("[Opportunity Create Error]", error);
    const message = error instanceof Error ? error.message : "Failed to create opportunity";
    return c.json({ error: message }, 500);
  }
});

opportunityRoutes.post("/extract", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const body = (await c.req.json()) as Record<string, unknown>;
    const url = clean(body.url || body.source_url);
    const createApplication = body.create_application === true;

    if (!url) {
      return c.json({ error: "url is required" }, 400);
    }

    const extracted = await extractJobPage(url);
    const normalized = await normalizeOpportunity({
      rawText: [extracted.title, extracted.text].filter(Boolean).join("\n\n"),
      sourceUrl: url,
    });
    normalized.provider_metadata = {
      ...normalized.provider_metadata,
      extracted_title: extracted.title,
      source_type: extracted.sourceType,
      normalized_by: "job_url_extractor",
    };

    const opportunity = await createOpportunityFromNormalized({
      userId,
      source: extracted.sourceType === "linkedin" ? "linkedin_post" : extracted.sourceType,
      sourceUrl: url,
      rawText: extracted.text,
      normalized,
    });

    let application = null;
    if (createApplication) {
      const { data, error } = await getSupabaseAdmin()
        .from("applications")
        .insert({
          user_id: userId,
          company_name: opportunity.company_name,
          role_title: opportunity.role_title,
          jd_url: opportunity.source_url,
          jd_raw_text: opportunity.normalized_jd || opportunity.raw_text,
          source: extracted.sourceType === "linkedin" ? "linkedin" : "company_site",
          location: opportunity.location,
          notes: `Created from extracted job link ${opportunity.source_url}`,
        })
        .select("*")
        .single();

      if (error || !data) {
        return c.json({ error: "Opportunity saved, but application creation failed" }, 500);
      }

      await getSupabaseAdmin()
        .from("job_opportunities")
        .update({ status: "saved" })
        .eq("id", opportunity.id)
        .eq("user_id", userId);
      application = data;
    }

    return c.json({ opportunity, application, extracted }, 201);
  } catch (error) {
    console.error("[Opportunity Extract Error]", error);
    const message = error instanceof Error ? error.message : "Failed to extract job link";
    return c.json({ error: message }, 500);
  }
});

opportunityRoutes.post("/:id/create-application", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { data: opportunity, error: oppError } = await getSupabaseAdmin()
      .from("job_opportunities")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (oppError || !opportunity) {
      return c.json({ error: "Opportunity not found" }, 404);
    }

    const { data: application, error } = await getSupabaseAdmin()
      .from("applications")
      .insert({
        user_id: userId,
        company_name: opportunity.company_name,
        role_title: opportunity.role_title,
        jd_url: opportunity.source_url,
        jd_raw_text: opportunity.normalized_jd || opportunity.raw_text,
        source: opportunity.source === "linkedin_post" ? "linkedin" : "other",
        location: opportunity.location,
        notes: `Created from opportunity ${opportunity.id}`,
      })
      .select("*")
      .single();

    if (error || !application) {
      return c.json({ error: "Failed to create application" }, 500);
    }

    await getSupabaseAdmin()
      .from("job_opportunities")
      .update({ status: "saved" })
      .eq("id", id)
      .eq("user_id", userId);

    return c.json({ application });
  } catch (error) {
    console.error("[Opportunity Application Error]", error);
    return c.json({ error: "Failed to create application from opportunity" }, 500);
  }
});

export { opportunityRoutes };
