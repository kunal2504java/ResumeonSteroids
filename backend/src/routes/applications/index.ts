import { Hono } from "hono";
import type { Context } from "hono";
import { anthropic } from "../../lib/anthropic";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authMiddleware } from "../../middleware/auth";
import {
  canTransitionStatus,
  isApplicationStatus,
  parseLimit,
  sanitizeApplicationPayload,
  type ApplicationStatus,
} from "../../lib/applications";
import { refreshNudgesForApplication } from "../../lib/nudgePersistence";
import {
  combinePrepQuestions,
  compareOfferToMarket,
  computeTotalComp,
  fallbackMarketData,
  fallbackNegotiationDraft,
  fallbackStarAnswers,
  generateResumeQuestions,
  type MarketData,
  type PrepQuestion,
  type StarAnswer,
} from "../../lib/prepOffer";

const applicationRoutes = new Hono();
type AuthContext = Context<{ Variables: { userId: string } }>;

function userIdFromContext(c: AuthContext) {
  return c.get("userId");
}

async function fetchApplication(id: string, userId: string) {
  return getSupabaseAdmin()
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
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

async function refreshNudgesSafely(applicationId: string, userId: string) {
  try {
    await refreshNudgesForApplication(applicationId, userId);
  } catch (error) {
    console.warn("[Nudge Refresh Warning]", error);
  }
}

function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

function extractResumeBullets(application: Record<string, unknown>): string[] {
  const notes = typeof application.notes === "string" ? application.notes : "";
  return notes
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 20)
    .slice(0, 12);
}

async function scrapeInterviewQuestions(companyName: string, roleTitle: string): Promise<string[]> {
  const apiKey = process.env.APIFY_API_KEY;
  const actorId = process.env.APIFY_INTERVIEW_QUESTIONS_ACTOR;
  if (!apiKey || !actorId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, roleTitle, maxResults: 15 }),
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<Record<string, unknown>>;
    return data
      .map((item) =>
        typeof item.question === "string"
          ? item.question
          : typeof item.text === "string"
            ? item.text
            : "",
      )
      .filter(Boolean)
      .slice(0, 15);
  } catch {
    return [];
  }
}

async function generateStarAnswers(input: {
  companyName: string;
  roleTitle: string;
  questions: PrepQuestion[];
}): Promise<StarAnswer[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2200,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: `Generate concise STAR interview answer outlines for this application.

Company: ${input.companyName}
Role: ${input.roleTitle}
Questions:
${JSON.stringify(input.questions, null, 2)}

Rules:
- Ground answers in the question; do not invent employer-specific facts.
- Keep each STAR field to one short sentence.
- Return ONLY JSON: { "star_answers": [{ "question": "...", "situation": "...", "task": "...", "action": "...", "result": "..." }] }`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = extractJson<{ star_answers?: StarAnswer[] }>(text);
    if (Array.isArray(parsed.star_answers) && parsed.star_answers.length > 0) {
      return parsed.star_answers;
    }
  } catch (error) {
    console.warn("[Interview Prep LLM Fallback]", error);
  }

  return fallbackStarAnswers(input.questions);
}

async function scrapeMarketData(input: {
  companyName: string;
  roleTitle: string;
  location?: string | null;
  currency: string;
}): Promise<MarketData | null> {
  const apiKey = process.env.APIFY_API_KEY;
  const actorId = process.env.APIFY_COMPENSATION_ACTOR;
  if (!apiKey || !actorId) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<Record<string, unknown>>;
    const salaries = data
      .map((item) => Number(item.totalComp ?? item.total_comp ?? item.salary ?? item.amount ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    if (salaries.length === 0) {
      return null;
    }

    const percentile = (p: number) => salaries[Math.min(salaries.length - 1, Math.floor(p * salaries.length))];
    return {
      p25: percentile(0.25),
      median: percentile(0.5),
      p75: percentile(0.75),
      currency: input.currency,
      sources: ["apify_compensation_scrape"],
    };
  } catch {
    return null;
  }
}

async function generateNegotiationDraft(input: {
  companyName: string;
  roleTitle: string;
  totalComp: number;
  marketData: MarketData;
  offerVsMarket: "below" | "at" | "above";
}): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: `Write a concise offer negotiation email.

Context:
${JSON.stringify(input, null, 2)}

Rules:
- If offerVsMarket is below, use below-market framing.
- If offerVsMarket is at or above, frame around role scope and responsibilities.
- Ask for 15-20% above current total compensation as the anchor.
- Include fallback asks: signing bonus, equity, extra PTO, or flexibility.
- Return ONLY JSON: { "negotiation_draft": "..." }`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = extractJson<{ negotiation_draft?: string }>(text);
    if (parsed.negotiation_draft) {
      return parsed.negotiation_draft;
    }
  } catch (error) {
    console.warn("[Negotiation Draft Fallback]", error);
  }

  return fallbackNegotiationDraft(input);
}

applicationRoutes.post("/", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const body = (await c.req.json()) as Record<string, unknown>;
    const parsed = sanitizeApplicationPayload(body);

    if (parsed.error || !parsed.value) {
      return c.json({ error: parsed.error }, 400);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("applications")
      .insert({
        ...parsed.value,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create application" }, 500);
    }

    if (data.status === "applied") {
      await logApplicationEvent({
        applicationId: data.id,
        userId,
        eventType: "applied",
        eventData: { source: data.source, applied_at: data.applied_at },
      });
      await refreshNudgesSafely(data.id, userId);
    }

    return c.json({ application: data }, 201);
  } catch (error) {
    console.error("[Application Create Error]", error);
    return c.json({ error: "Failed to create application" }, 500);
  }
});

applicationRoutes.get("/", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const status = c.req.query("status");
    const sortBy = c.req.query("sort_by") ?? "updated_at";
    const limit = parseLimit(c.req.query("limit"));

    let query = getSupabaseAdmin()
      .from("applications")
      .select("*, nudges(*)")
      .eq("user_id", userId)
      .limit(limit);

    if (status) {
      if (!isApplicationStatus(status)) {
        return c.json({ error: "Invalid application status" }, 400);
      }
      query = query.eq("status", status);
    }

    const orderColumn = sortBy === "created_at" || sortBy === "applied_at" ? sortBy : "updated_at";
    const { data, error } = await query.order(orderColumn, { ascending: false });

    if (error) {
      return c.json({ error: "Failed to fetch applications" }, 500);
    }

    return c.json({ applications: data ?? [] });
  } catch (error) {
    console.error("[Application List Error]", error);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

applicationRoutes.get("/:id/prep", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const id = c.req.param("id");
    const { data: application, error } = await fetchApplication(id, userId);
    if (error || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from("interview_prep")
      .select("*")
      .eq("application_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return c.json({
        questions: [
          ...((existing.company_questions as unknown[]) ?? []),
          ...((existing.resume_questions as unknown[]) ?? []),
        ],
        company_questions: existing.company_questions ?? [],
        resume_questions: existing.resume_questions ?? [],
        star_answers: existing.star_answers ?? [],
      });
    }

    const companyQuestions = await scrapeInterviewQuestions(
      application.company_name,
      application.role_title,
    );
    const resumeQuestions = generateResumeQuestions(
      extractResumeBullets(application),
      application.role_title,
    );
    const questions = combinePrepQuestions(companyQuestions, resumeQuestions);
    const starAnswers = await generateStarAnswers({
      companyName: application.company_name,
      roleTitle: application.role_title,
      questions,
    });

    const companyOnly = questions.filter((question) => question.source === "company");
    const resumeOnly = questions.filter((question) => question.source === "resume");
    const { data, error: insertError } = await supabase
      .from("interview_prep")
      .insert({
        application_id: id,
        user_id: userId,
        company_questions: companyOnly,
        resume_questions: resumeOnly,
        star_answers: starAnswers,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      return c.json({ error: "Failed to save interview prep" }, 500);
    }

    return c.json({
      questions,
      company_questions: data.company_questions ?? [],
      resume_questions: data.resume_questions ?? [],
      star_answers: data.star_answers ?? [],
    });
  } catch (error) {
    console.error("[Interview Prep Error]", error);
    return c.json({ error: "Failed to generate interview prep" }, 500);
  }
});

applicationRoutes.post("/:id/offer", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const id = c.req.param("id");
    const body = (await c.req.json()) as Record<string, unknown>;
    const { data: application, error } = await fetchApplication(id, userId);
    if (error || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const components =
      typeof body.components === "object" && body.components !== null
        ? (body.components as Record<string, unknown>)
        : {};
    const currency = typeof body.currency === "string" ? body.currency : "INR";
    const baseSalary = Number(body.amount ?? components.base_salary ?? components.base ?? 0);
    const bonus = Number(components.bonus ?? 0);
    const equityValue = Number(components.equity_value ?? components.equity ?? 0);
    const joiningBonus = Number(components.joining_bonus ?? components.signing_bonus ?? 0);

    if (!Number.isFinite(baseSalary) || baseSalary <= 0) {
      return c.json({ error: "amount must be a positive number" }, 400);
    }

    const currentStatus = application.status as ApplicationStatus;
    if (currentStatus !== "offer" && !canTransitionStatus(currentStatus, "offer")) {
      return c.json(
        { error: `Cannot record an offer while application is ${currentStatus}` },
        400,
      );
    }

    const totalComp = computeTotalComp({
      base_salary: baseSalary,
      bonus,
      equity_value: equityValue,
      joining_bonus: joiningBonus,
    });
    const marketData =
      (await scrapeMarketData({
        companyName: application.company_name,
        roleTitle: application.role_title,
        location: application.location,
        currency,
      })) ?? fallbackMarketData(application.role_title, currency);
    const offerVsMarket = compareOfferToMarket(totalComp, marketData);
    const negotiationDraft = await generateNegotiationDraft({
      companyName: application.company_name,
      roleTitle: application.role_title,
      totalComp,
      marketData,
      offerVsMarket,
    });

    const { data, error: insertError } = await getSupabaseAdmin()
      .from("offer_details")
      .insert({
        application_id: id,
        user_id: userId,
        base_salary: baseSalary,
        bonus,
        equity_value: equityValue,
        joining_bonus: joiningBonus,
        total_comp: totalComp,
        currency,
        market_data: marketData,
        negotiation_draft: negotiationDraft,
        offer_vs_market: offerVsMarket,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      return c.json({ error: "Failed to save offer details" }, 500);
    }

    await logApplicationEvent({
      applicationId: id,
      userId,
      eventType: "offer_received",
      eventData: {
        amount: baseSalary,
        total_comp: totalComp,
        currency,
        offer_vs_market: offerVsMarket,
      },
    });

    if (currentStatus !== "offer") {
      await getSupabaseAdmin()
        .from("applications")
        .update({ status: "offer" })
        .eq("id", id)
        .eq("user_id", userId);

      await logApplicationEvent({
        applicationId: id,
        userId,
        eventType: "status_changed",
        eventData: {
          from_status: currentStatus,
          to_status: "offer",
          reason: "offer_details_submitted",
        },
      });
    }

    await refreshNudgesSafely(id, userId);

    return c.json({
      market_data: marketData,
      negotiation_draft: negotiationDraft,
      comparison: {
        offer_vs_market: offerVsMarket,
        total_comp: totalComp,
      },
      offer: data,
    });
  } catch (error) {
    console.error("[Offer Error]", error);
    return c.json({ error: "Failed to generate offer negotiation package" }, 500);
  }
});

applicationRoutes.get("/:id", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const id = c.req.param("id");

    const { data: application, error } = await fetchApplication(id, userId);
    if (error || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const supabase = getSupabaseAdmin();
    const [events, drafts, targets, nudges, prep] = await Promise.all([
      supabase
        .from("application_events")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("outreach_drafts")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("outreach_targets")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("nudges")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", userId)
        .eq("is_dismissed", false)
        .order("due_date", { ascending: true }),
      supabase
        .from("interview_prep")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return c.json({
      application,
      events: events.data ?? [],
      drafts: drafts.data ?? [],
      targets: targets.data ?? [],
      nudges: nudges.data ?? [],
      prep: prep.data ?? null,
    });
  } catch (error) {
    console.error("[Application Detail Error]", error);
    return c.json({ error: "Failed to fetch application" }, 500);
  }
});

applicationRoutes.put("/:id/status", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const id = c.req.param("id");
    const body = (await c.req.json()) as {
      new_status?: unknown;
      event_data?: Record<string, unknown>;
    };

    if (!isApplicationStatus(body.new_status)) {
      return c.json({ error: "Invalid new_status" }, 400);
    }

    const { data: application, error: fetchError } = await fetchApplication(id, userId);
    if (fetchError || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const currentStatus = application.status as ApplicationStatus;
    const nextStatus = body.new_status;
    if (!canTransitionStatus(currentStatus, nextStatus)) {
      return c.json(
        { error: `Cannot transition application from ${currentStatus} to ${nextStatus}` },
        400,
      );
    }

    const patch: Record<string, unknown> = {
      status: nextStatus,
    };
    if (nextStatus === "applied" && !application.applied_at) {
      patch.applied_at = new Date().toISOString();
    }

    const { data, error } = await getSupabaseAdmin()
      .from("applications")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to update application status" }, 500);
    }

    await logApplicationEvent({
      applicationId: id,
      userId,
      eventType: nextStatus === "applied" ? "applied" : "status_changed",
      eventData: {
        from_status: currentStatus,
        to_status: nextStatus,
        ...(body.event_data ?? {}),
      },
    });

    await refreshNudgesSafely(id, userId);

    return c.json({ application: data });
  } catch (error) {
    console.error("[Application Status Error]", error);
    return c.json({ error: "Failed to update application status" }, 500);
  }
});

applicationRoutes.post("/:id/events", authMiddleware, async (c) => {
  try {
    const userId = userIdFromContext(c);
    const id = c.req.param("id");
    const body = (await c.req.json()) as {
      event_type?: string;
      event_data?: Record<string, unknown>;
    };

    if (!body.event_type) {
      return c.json({ error: "event_type is required" }, 400);
    }

    const { data: application, error } = await fetchApplication(id, userId);
    if (error || !application) {
      return c.json({ error: "Application not found" }, 404);
    }

    const result = await logApplicationEvent({
      applicationId: id,
      userId,
      eventType: body.event_type,
      eventData: body.event_data ?? {},
    });

    if (result.error) {
      return c.json({ error: "Failed to log event" }, 500);
    }

    await refreshNudgesSafely(id, userId);

    return c.json({ success: true }, 201);
  } catch (error) {
    console.error("[Application Event Error]", error);
    return c.json({ error: "Failed to log event" }, 500);
  }
});

export { applicationRoutes };
