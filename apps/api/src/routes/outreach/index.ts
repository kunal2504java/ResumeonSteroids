import { resolveMx } from "node:dns/promises";
import { Hono } from "hono";
import type { Context } from "hono";
import { anthropic } from "../../lib/anthropic";
import { canTransitionStatus, type ApplicationStatus } from "../../lib/applications";
import {
  eventTypeForDraft,
  attachMutualConnections,
  findEmailByPattern,
  findMutualConnections,
  inferCompanyDomain,
  scoreAndRankContacts,
  splitName,
  validateOutreachDrafts,
  type DraftType,
  type OutreachDraftContent,
  type OutreachTone,
  type RawContact,
} from "../../lib/outreach";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authMiddleware } from "../../middleware/auth";

type AuthContext = Context<{ Variables: { userId: string } }>;

const outreachRoutes = new Hono();
const APIFY_API_BASE = "https://api.apify.com/v2";
const DEFAULT_EMPLOYEES_ACTOR = "curious_coder~linkedin-company-employees-scraper";

function requireString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isTone(value: unknown): value is OutreachTone {
  return value === "professional" || value === "casual" || value === "direct";
}

function isoDateAfter(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function fetchApplication(applicationId: string, userId: string) {
  return getSupabaseAdmin()
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();
}

async function fetchTarget(targetId: string, userId: string) {
  return getSupabaseAdmin()
    .from("outreach_targets")
    .select("*")
    .eq("id", targetId)
    .eq("user_id", userId)
    .single();
}

async function verifyDomainMx(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) {
    return false;
  }

  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

async function scrapeCompanyContacts(companyName: string): Promise<RawContact[]> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error("APIFY_API_KEY is not configured");
  }

  const actorId = process.env.APIFY_COMPANY_EMPLOYEES_ACTOR ?? DEFAULT_EMPLOYEES_ACTOR;
  const response = await fetch(
    `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        maxResults: 20,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apify contact scrape failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as RawContact[]) : [];
}

function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

async function callJsonModel<T>(prompt: string, maxTokens = 900): Promise<T> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return extractJson<T>(text);
}

function buildBaseContext(input: {
  application: Record<string, unknown>;
  target: Record<string, unknown>;
  candidateContext: Record<string, unknown>;
  tone: OutreachTone;
}) {
  return JSON.stringify(
    {
      tone: input.tone,
      application: {
        company_name: input.application.company_name,
        role_title: input.application.role_title,
        job_url: input.application.job_url,
        jd_raw_text: input.application.jd_raw_text,
      },
      target: {
        name: input.target.target_name,
        title: input.target.target_title,
        linkedin_url: input.target.target_linkedin_url,
        email: input.target.target_email,
        mutual_connection_name: input.target.mutual_connection_name,
      },
      candidate_context: input.candidateContext,
    },
    null,
    2,
  );
}

function coldEmailPrompt(context: string): string {
  return `You are a world-class job search coach writing a cold outreach email.
Write on behalf of the candidate to the specific target.

Rules:
- Under 150 words total
- Open with a specific observation from the context
- Connect the candidate's top achievement to a likely company problem
- Ask for a specific 15-minute call
- No corporate filler
- Never use: "I hope this finds you well", "I am writing to express my interest", "I would love to", "Please find attached", "I am a passionate", "I have always admired", "My name is"

Context:
${context}

Return ONLY JSON:
{
  "subject": "...",
  "body": "...",
  "personalisation_hooks": ["..."],
  "cta": "..."
}`;
}

function linkedInPrompt(context: string): string {
  return `You are writing LinkedIn outreach.

Rules:
- connection_request: max 300 characters, no ask
- follow_up_dm: max 500 characters, brief context and one specific ask
- Mention something specific from the target/company/candidate context
- No template language

Context:
${context}

Return ONLY JSON:
{
  "connection_request": "...",
  "follow_up_dm": "...",
  "personalisation_hook": "..."
}`;
}

function referralPrompt(context: string): string {
  return `You are writing a referral request to someone the candidate knows at the target company.

Rules:
- Warm, direct, and easy to say yes
- Mention the exact role
- Ask: "Would you be able to refer me internally or connect me with the hiring manager for this role?"
- Include a copy-paste fit paragraph
- Make it easy to decline
- Under 200 words

Context:
${context}

Return ONLY JSON:
{
  "subject": "...",
  "body": "...",
  "fit_paragraph": "..."
}`;
}

async function generateDraftContents(input: {
  application: Record<string, unknown>;
  target: Record<string, unknown>;
  candidateContext: Record<string, unknown>;
  tone: OutreachTone;
}): Promise<OutreachDraftContent[]> {
  const context = buildBaseContext(input);
  const [coldEmail, linkedIn, referral] = await Promise.all([
    callJsonModel<{
      subject?: string;
      body?: string;
      personalisation_hooks?: string[];
      cta?: string;
    }>(coldEmailPrompt(context)),
    callJsonModel<{
      connection_request?: string;
      follow_up_dm?: string;
      personalisation_hook?: string;
    }>(linkedInPrompt(context)),
    callJsonModel<{
      subject?: string;
      body?: string;
      fit_paragraph?: string;
    }>(referralPrompt(context)),
  ]);

  return [
    {
      draft_type: "cold_email",
      subject_line: coldEmail.subject ?? null,
      body: coldEmail.body ?? "",
      metadata: {
        personalisation_hooks: coldEmail.personalisation_hooks ?? [],
        cta: coldEmail.cta ?? "",
      },
    },
    {
      draft_type: "linkedin_dm",
      subject_line: null,
      body: [
        `Connection request: ${linkedIn.connection_request ?? ""}`,
        `Follow-up DM: ${linkedIn.follow_up_dm ?? ""}`,
      ].join("\n\n"),
      metadata: {
        connection_request: linkedIn.connection_request ?? "",
        follow_up_dm: linkedIn.follow_up_dm ?? "",
        personalisation_hook: linkedIn.personalisation_hook ?? "",
      },
    },
    {
      draft_type: "referral_request",
      subject_line: referral.subject ?? null,
      body: referral.body ?? "",
      metadata: {
        fit_paragraph: referral.fit_paragraph ?? "",
      },
    },
  ];
}

async function logApplicationEvent(input: {
  applicationId: string;
  userId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
}) {
  return getSupabaseAdmin().from("application_events").insert({
    application_id: input.applicationId,
    user_id: input.userId,
    event_type: input.eventType,
    event_data: input.eventData ?? {},
  });
}

outreachRoutes.post("/find-targets", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const body = (await c.req.json()) as Record<string, unknown>;
    const applicationId = requireString(body.application_id);
    const companyName = requireString(body.company_name);
    const roleTitle = requireString(body.role_title);
    const companyDomain = requireString(body.company_domain) || inferCompanyDomain(companyName);
    const userConnections = Array.isArray(body.user_connections)
      ? (body.user_connections as RawContact[])
      : [];

    if (!applicationId || !companyName || !roleTitle) {
      return c.json({ error: "application_id, company_name, and role_title are required" }, 400);
    }

    const { data: application, error: appError } = await fetchApplication(applicationId, userId);
    if (appError || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const scrapedContacts = await scrapeCompanyContacts(companyName);
    const mutualConnections = findMutualConnections({
      companyName,
      companyContacts: scrapedContacts,
      userConnections,
    });
    const rawContacts = attachMutualConnections(scrapedContacts, mutualConnections);
    const ranked = scoreAndRankContacts(rawContacts, roleTitle);

    const enrichedTargets = await Promise.all(
      ranked.map(async (target) => {
        if (target.email || !companyDomain) {
          return target;
        }

        const { first, last } = splitName(target.target_name);
        const email = await findEmailByPattern({
          firstName: first,
          lastName: last,
          companyDomain,
          verifyMx: verifyDomainMx,
        });

        return {
          ...target,
          email: email?.email ?? null,
          email_confidence: email?.confidence ?? null,
          email_pattern_used: email?.pattern_used ?? null,
        };
      }),
    );

    const rows = enrichedTargets.map((target) => ({
      application_id: applicationId,
      user_id: userId,
      company_name: companyName,
      target_name: target.target_name,
      target_title: target.target_title,
      target_linkedin_url: target.target_linkedin_url,
      target_email: target.email,
      email_confidence: target.email_confidence,
      email_pattern_used:
        "email_pattern_used" in target ? (target.email_pattern_used as string | null) : null,
      is_mutual_connection: Boolean(target.mutual_connection_name),
      mutual_connection_name: target.mutual_connection_name,
      mutual_connection_title: target.mutual_connection_title,
      scrape_source: "linkedin_search",
    }));

    if (rows.length === 0) {
      return c.json({ targets: [], status: "not_found" });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("outreach_targets")
      .insert(rows)
      .select("*");

    if (error) {
      console.error("[Outreach Targets Insert Error]", error);
      return c.json({ error: "Failed to save outreach targets" }, 500);
    }

    return c.json({
      targets: data ?? [],
      status: rows.length > 0 ? "found" : "not_found",
    });
  } catch (error) {
    console.error("[Find Targets Error]", error);
    const message = error instanceof Error ? error.message : "Failed to find outreach targets";
    const status = message.includes("APIFY_API_KEY") ? 503 : 500;
    return c.json({ error: message }, status);
  }
});

outreachRoutes.get("/targets/:application_id", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const applicationId = c.req.param("application_id");
    if (!applicationId) {
      return c.json({ error: "application_id is required" }, 400);
    }

    const { data: application, error: appError } = await fetchApplication(applicationId, userId);
    if (appError || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("outreach_targets")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({ error: "Failed to fetch outreach targets" }, 500);
    }

    return c.json({ targets: data ?? [] });
  } catch (error) {
    console.error("[Get Targets Error]", error);
    return c.json({ error: "Failed to fetch outreach targets" }, 500);
  }
});

outreachRoutes.post("/generate", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const body = (await c.req.json()) as Record<string, unknown>;
    const applicationId = requireString(body.application_id);
    const targetId = requireString(body.outreach_target_id);
    const tone = isTone(body.tone) ? body.tone : "professional";
    const candidateContext =
      typeof body.candidate_context === "object" && body.candidate_context !== null
        ? (body.candidate_context as Record<string, unknown>)
        : {};

    if (!applicationId || !targetId) {
      return c.json({ error: "application_id and outreach_target_id are required" }, 400);
    }

    const [{ data: application, error: appError }, { data: target, error: targetError }] =
      await Promise.all([fetchApplication(applicationId, userId), fetchTarget(targetId, userId)]);

    if (appError || !application) {
      return c.json({ error: "Application not found" }, 404);
    }
    if (targetError || !target || target.application_id !== applicationId) {
      return c.json({ error: "Outreach target not found" }, 404);
    }

    const drafts = await generateDraftContents({
      application,
      target,
      candidateContext,
      tone,
    });
    const validationIssues = validateOutreachDrafts(drafts);
    if (validationIssues.length > 0) {
      return c.json({ error: "Generated drafts failed quality checks", details: validationIssues }, 502);
    }

    const rows = drafts.map((draft) => ({
      application_id: applicationId,
      outreach_target_id: targetId,
      user_id: userId,
      draft_type: draft.draft_type,
      subject_line: draft.subject_line ?? null,
      body: draft.body,
      tone,
      version: 1,
    }));

    const { data, error } = await getSupabaseAdmin()
      .from("outreach_drafts")
      .insert(rows)
      .select("*");

    if (error) {
      console.error("[Outreach Draft Insert Error]", error);
      return c.json({ error: "Failed to save outreach drafts" }, 500);
    }

    return c.json({ drafts: data ?? [] });
  } catch (error) {
    console.error("[Generate Outreach Error]", error);
    const message = error instanceof Error ? error.message : "Failed to generate outreach drafts";
    return c.json({ error: message }, 500);
  }
});

outreachRoutes.put("/drafts/:draft_id", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const draftId = c.req.param("draft_id");
    if (!draftId) {
      return c.json({ error: "draft_id is required" }, 400);
    }
    const body = (await c.req.json()) as Record<string, unknown>;
    const draftBody = requireString(body.body);

    if (!draftBody) {
      return c.json({ error: "body is required" }, 400);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("outreach_drafts")
      .update({
        subject_line:
          typeof body.subject_line === "string" ? body.subject_line.trim() : undefined,
        body: draftBody,
        user_edited: body.user_edited === true,
      })
      .eq("id", draftId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      return c.json({ error: "Draft not found or update failed" }, 404);
    }

    return c.json({ draft: data });
  } catch (error) {
    console.error("[Update Draft Error]", error);
    return c.json({ error: "Failed to update draft" }, 500);
  }
});

outreachRoutes.post("/drafts/:draft_id/mark-sent", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const draftId = c.req.param("draft_id");
    if (!draftId) {
      return c.json({ error: "draft_id is required" }, 400);
    }
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const sentAt = requireString(body.sent_at) || new Date().toISOString();

    const { data: draft, error: draftError } = await getSupabaseAdmin()
      .from("outreach_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", userId)
      .single();

    if (draftError || !draft) {
      return c.json({ error: "Draft not found" }, 404);
    }

    if (draft.is_sent) {
      return c.json({ draft });
    }

    const { data: application, error: appError } = await fetchApplication(
      draft.application_id,
      userId,
    );
    if (appError || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const { data: updatedDraft, error: updateError } = await getSupabaseAdmin()
      .from("outreach_drafts")
      .update({ is_sent: true, sent_at: sentAt })
      .eq("id", draftId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedDraft) {
      return c.json({ error: "Failed to mark draft as sent" }, 500);
    }

    const draftType = draft.draft_type as DraftType;
    await logApplicationEvent({
      applicationId: draft.application_id,
      userId,
      eventType: eventTypeForDraft(draftType),
      eventData: {
        draft_id: draftId,
        outreach_target_id: draft.outreach_target_id,
        draft_type: draftType,
        sent_at: sentAt,
      },
    });

    const currentStatus = application.status as ApplicationStatus;
    if (canTransitionStatus(currentStatus, "outreach_sent")) {
      await getSupabaseAdmin()
        .from("applications")
        .update({ status: "outreach_sent" })
        .eq("id", draft.application_id)
        .eq("user_id", userId);

      await logApplicationEvent({
        applicationId: draft.application_id,
        userId,
        eventType: "status_changed",
        eventData: {
          from: currentStatus,
          to: "outreach_sent",
          reason: "outreach_draft_sent",
        },
      });
    }

    const existingFollowUp = await getSupabaseAdmin()
      .from("nudges")
      .select("id")
      .eq("application_id", draft.application_id)
      .eq("user_id", userId)
      .eq("nudge_type", "send_follow_up")
      .eq("is_dismissed", false)
      .limit(1);

    if (!existingFollowUp.data?.length) {
      await getSupabaseAdmin().from("nudges").insert({
        application_id: draft.application_id,
        user_id: userId,
        nudge_type: "send_follow_up",
        priority: "medium",
        title: `Follow up with ${application.company_name}`,
        body: "If there is no response, send a concise follow-up five days after this outreach.",
        action_label: "Draft follow-up",
        action_type: "generate_draft",
        action_payload: {
          draft_type: "follow_up",
          outreach_target_id: draft.outreach_target_id,
        },
        due_date: isoDateAfter(5),
      });
    }

    return c.json({ draft: updatedDraft });
  } catch (error) {
    console.error("[Mark Draft Sent Error]", error);
    return c.json({ error: "Failed to mark draft as sent" }, 500);
  }
});

export { outreachRoutes };
