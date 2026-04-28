import type { ApplicationStatus } from "./applications";

export type NudgePriority = "high" | "medium" | "low";
export type NudgeActionType = "generate_draft" | "open_link" | "mark_done" | "open_draft" | "open_prep";

export interface ApplicationForNudge {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  status: ApplicationStatus;
  applied_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApplicationEventForNudge {
  event_type: string;
  created_at: string;
  event_data?: Record<string, unknown> | null;
}

export interface OutreachTargetForNudge {
  id?: string;
  target_name?: string | null;
  target_title?: string | null;
  is_mutual_connection?: boolean | null;
  mutual_connection_name?: string | null;
  mutual_connection_title?: string | null;
}

export interface ExistingNudgeForNudge {
  nudge_type: string;
  action_payload?: Record<string, unknown> | null;
  is_dismissed?: boolean | null;
}

export interface ComputedNudge {
  application_id: string;
  user_id: string;
  nudge_type: string;
  priority: NudgePriority;
  title: string;
  body: string;
  action_label: string;
  action_type: NudgeActionType;
  action_payload?: Record<string, unknown>;
  due_date?: string;
}

export interface NudgeEngineInput {
  application: ApplicationForNudge;
  events: ApplicationEventForNudge[];
  targets?: OutreachTargetForNudge[];
  existingNudges?: ExistingNudgeForNudge[];
  now?: Date;
}

export interface NudgeEngineResult {
  nudges: ComputedNudge[];
  autoTransitionTo?: ApplicationStatus;
}

const TERMINAL_STATUSES = new Set<ApplicationStatus>(["rejected", "withdrawn"]);
const OUTREACH_EVENT_TYPES = new Set(["outreach_sent", "email_sent", "dm_sent", "referral_sent"]);

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function wholeDaysBetween(from: Date | null, to: Date): number {
  if (!from) return 0;
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function hoursUntil(from: Date, to: Date | null): number | null {
  if (!to) return null;
  return (to.getTime() - from.getTime()) / 3_600_000;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
}

function latestEventDate(events: ApplicationEventForNudge[]): Date | null {
  return events.reduce<Date | null>((latest, event) => {
    const createdAt = parseDate(event.created_at);
    if (!createdAt) return latest;
    if (!latest || createdAt > latest) return createdAt;
    return latest;
  }, null);
}

function hasEvent(events: ApplicationEventForNudge[], types: Iterable<string>): boolean {
  const expected = new Set(types);
  return events.some((event) => expected.has(event.event_type));
}

function nudgeExists(
  existing: ExistingNudgeForNudge[],
  nudgeType: string,
  actionPayload?: Record<string, unknown>,
): boolean {
  return existing.some((nudge) => {
    if (nudge.is_dismissed || nudge.nudge_type !== nudgeType) return false;
    if (!actionPayload) return true;
    return JSON.stringify(nudge.action_payload ?? {}) === JSON.stringify(actionPayload);
  });
}

function buildNudge(
  application: ApplicationForNudge,
  input: Omit<ComputedNudge, "application_id" | "user_id">,
): ComputedNudge {
  return {
    application_id: application.id,
    user_id: application.user_id,
    ...input,
  };
}

function firstTarget(targets: OutreachTargetForNudge[]): OutreachTargetForNudge | null {
  return targets.find((target) => target.target_name || target.target_title) ?? null;
}

function firstMutualTarget(targets: OutreachTargetForNudge[]): OutreachTargetForNudge | null {
  return targets.find((target) => target.is_mutual_connection) ?? null;
}

function nextScreenDate(events: ApplicationEventForNudge[]): Date | null {
  const candidates = events
    .filter((event) => event.event_type === "screen_scheduled" || event.event_type === "interview_scheduled")
    .map((event) => {
      const eventData = event.event_data ?? {};
      const rawDate =
        typeof eventData.scheduled_at === "string"
          ? eventData.scheduled_at
          : typeof eventData.date === "string"
            ? eventData.date
            : event.created_at;
      return parseDate(rawDate);
    })
    .filter((date): date is Date => Boolean(date));

  return candidates.sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
}

export function runNudgeEngineForApplication(input: NudgeEngineInput): NudgeEngineResult {
  const now = input.now ?? new Date();
  const application = input.application;
  const events = input.events ?? [];
  const targets = input.targets ?? [];
  const existingNudges = input.existingNudges ?? [];

  if (TERMINAL_STATUSES.has(application.status)) {
    return { nudges: [] };
  }

  const nudges: ComputedNudge[] = [];
  const appliedAt = parseDate(application.applied_at) ?? parseDate(application.created_at);
  const lastActivityAt = latestEventDate(events) ?? appliedAt ?? parseDate(application.updated_at);
  const daysSinceApply = wholeDaysBetween(appliedAt, now);
  const daysSinceLastEvent = wholeDaysBetween(lastActivityAt, now);
  const hasOutreach = application.status === "outreach_sent" || hasEvent(events, OUTREACH_EVENT_TYPES);

  if (
    application.status === "applied" &&
    daysSinceLastEvent >= 5 &&
    !hasOutreach &&
    !nudgeExists(existingNudges, "send_follow_up", { draft_type: "follow_up" })
  ) {
    nudges.push(
      buildNudge(application, {
        nudge_type: "send_follow_up",
        priority: "high",
        title: `Follow up on your ${application.company_name} application`,
        body: `You applied ${daysSinceApply} days ago with no response. A follow-up email increases response rate by ~30%. We've drafted one for you.`,
        action_label: "View follow-up draft",
        action_type: "generate_draft",
        action_payload: { draft_type: "follow_up" },
        due_date: isoDate(now),
      }),
    );
  }

  const target = firstTarget(targets);
  if (
    application.status === "applied" &&
    daysSinceApply >= 1 &&
    !hasOutreach &&
    target &&
    !nudgeExists(existingNudges, "send_outreach")
  ) {
    nudges.push(
      buildNudge(application, {
        nudge_type: "send_outreach",
        priority: "high",
        title: `Send your cold email to ${target.target_name ?? "a contact"} at ${application.company_name}`,
        body: `Applications with direct outreach get 3x more responses. Your email to ${target.target_name ?? "this contact"} (${target.target_title ?? "contact"}) is ready to send.`,
        action_label: "Review and send",
        action_type: "open_draft",
        action_payload: { target_id: target.id },
        due_date: isoDate(now),
      }),
    );
  }

  if (
    application.status === "applied" &&
    daysSinceLastEvent >= 14 &&
    !nudgeExists(existingNudges, "ghosted_alert", { draft_type: "final_follow_up" })
  ) {
    nudges.push(
      buildNudge(application, {
        nudge_type: "ghosted_alert",
        priority: "low",
        title: `${application.company_name} hasn't responded in 2 weeks`,
        body: "This application may have gone cold. You can send one final follow-up or mark it as ghosted.",
        action_label: "Send final follow-up",
        action_type: "generate_draft",
        action_payload: { draft_type: "final_follow_up" },
        due_date: isoDate(now),
      }),
    );
  }

  const screenDate = nextScreenDate(events);
  const screenHours = hoursUntil(now, screenDate);
  if (
    application.status === "screen_scheduled" &&
    screenHours !== null &&
    screenHours >= 0 &&
    screenHours <= 48 &&
    !nudgeExists(existingNudges, "prep_interview")
  ) {
    nudges.push(
      buildNudge(application, {
        nudge_type: "prep_interview",
        priority: "high",
        title: `Your ${application.company_name} screen is in 48 hours`,
        body: `We've generated prep questions based on your resume and ${application.company_name}'s common interview patterns.`,
        action_label: "View prep questions",
        action_type: "open_prep",
        due_date: screenDate ? isoDate(screenDate) : isoDate(now),
      }),
    );
  }

  if (
    application.status === "screen_scheduled" &&
    daysSinceLastEvent >= 1 &&
    !hasEvent(events, ["thank_you"]) &&
    !nudgeExists(existingNudges, "send_thank_you", { draft_type: "thank_you" })
  ) {
    const lastEvent = events[0];
    const interviewerName =
      typeof lastEvent?.event_data?.interviewer_name === "string"
        ? lastEvent.event_data.interviewer_name
        : "your interviewer";
    nudges.push(
      buildNudge(application, {
        nudge_type: "send_thank_you",
        priority: "medium",
        title: `Send a thank-you note to ${interviewerName}`,
        body: "A thank-you email within 24 hours sets you apart. Takes 2 minutes. We've drafted it.",
        action_label: "View draft",
        action_type: "generate_draft",
        action_payload: { draft_type: "thank_you" },
        due_date: isoDate(now),
      }),
    );
  }

  if (application.status === "offer" && !nudgeExists(existingNudges, "negotiate_offer")) {
    nudges.push(
      buildNudge(application, {
        nudge_type: "negotiate_offer",
        priority: "high",
        title: `Congrats on the ${application.company_name} offer - here's how to negotiate`,
        body: "We've generated a negotiation email you can send today after comparing the offer against market data.",
        action_label: "View negotiation draft",
        action_type: "generate_draft",
        action_payload: { draft_type: "negotiation" },
        due_date: isoDate(now),
      }),
    );
  }

  const mutual = firstMutualTarget(targets);
  if (
    application.status === "saved" &&
    mutual &&
    !hasEvent(events, ["referral_sent"]) &&
    !nudgeExists(existingNudges, "request_referral")
  ) {
    const mutualName = mutual.mutual_connection_name ?? mutual.target_name ?? "a mutual connection";
    const mutualTitle = mutual.mutual_connection_title ?? mutual.target_title ?? "contact";
    nudges.push(
      buildNudge(application, {
        nudge_type: "request_referral",
        priority: "high",
        title: `You know ${mutualName} at ${application.company_name}`,
        body: `${mutualName} (${mutualTitle}) works at ${application.company_name}. A referral makes you 5x more likely to get an interview. We've written the message - just review and send.`,
        action_label: "View referral request",
        action_type: "open_draft",
        action_payload: { target_id: mutual.id, draft_type: "referral_request" },
        due_date: isoDate(now),
      }),
    );
  }

  const autoTransitionTo =
    (application.status === "applied" && daysSinceLastEvent >= 14) ||
    (application.status === "outreach_sent" && daysSinceLastEvent >= 7)
      ? "ghosted"
      : undefined;

  return { nudges, autoTransitionTo };
}

export function nextNudgeRunAt(from = new Date()): Date {
  const next = new Date(from);
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
  return next;
}
