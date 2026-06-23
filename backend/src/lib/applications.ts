export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "outreach_sent",
  "screen_scheduled",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_SOURCES = [
  "linkedin",
  "naukri",
  "company_site",
  "referral",
  "other",
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  saved: ["applied", "withdrawn"],
  applied: ["outreach_sent", "screen_scheduled", "rejected", "withdrawn", "ghosted"],
  outreach_sent: ["screen_scheduled", "rejected", "withdrawn", "ghosted"],
  screen_scheduled: ["interviewing", "rejected", "withdrawn"],
  interviewing: ["offer", "rejected", "withdrawn"],
  offer: ["withdrawn"],
  rejected: [],
  withdrawn: [],
  ghosted: ["applied"],
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function isApplicationSource(value: unknown): value is ApplicationSource {
  return typeof value === "string" && APPLICATION_SOURCES.includes(value as ApplicationSource);
}

export function canTransitionStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function parseLimit(value: string | undefined, fallback = 50): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

export function sanitizeApplicationPayload(body: Record<string, unknown>) {
  const companyName = typeof body.company_name === "string" ? body.company_name.trim() : "";
  const roleTitle = typeof body.role_title === "string" ? body.role_title.trim() : "";

  if (!companyName || !roleTitle) {
    return {
      error: "company_name and role_title are required",
      value: null,
    };
  }

  const requestedStatus = isApplicationStatus(body.status) ? body.status : "saved";
  const source = isApplicationSource(body.source) ? body.source : undefined;

  return {
    error: null,
    value: {
      company_name: companyName,
      role_title: roleTitle,
      status: requestedStatus,
      resume_run_id: typeof body.resume_run_id === "string" ? body.resume_run_id.trim() || null : null,
      jd_url: typeof body.jd_url === "string" ? body.jd_url.trim() || null : null,
      jd_raw_text: typeof body.jd_raw_text === "string" ? body.jd_raw_text.trim() || null : null,
      source: source ?? null,
      salary_min: typeof body.salary_min === "number" ? body.salary_min : null,
      salary_max: typeof body.salary_max === "number" ? body.salary_max : null,
      location: typeof body.location === "string" ? body.location.trim() || null : null,
      is_remote: typeof body.is_remote === "boolean" ? body.is_remote : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
      applied_at:
        requestedStatus === "applied"
          ? typeof body.applied_at === "string" && body.applied_at.trim()
            ? body.applied_at
            : new Date().toISOString()
          : null,
    },
  };
}
