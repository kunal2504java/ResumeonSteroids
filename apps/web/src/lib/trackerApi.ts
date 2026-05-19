import { createClient } from "@/lib/supabase/client";
import type {
  Application,
  ApplicationDetail,
  ApplicationStatus,
  InterviewPrep,
  JobOpportunity,
  Nudge,
  OutreachDraft,
  OutreachTarget,
  ResumeCommandRunResponse,
} from "@/types/tracker";
import type { Resume } from "@resumeai/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const LOCAL_APPLICATIONS_KEY = "resumeai_tracker_applications";
const LOCAL_NUDGES_KEY = "resumeai_tracker_nudges";
const LOCAL_OPPORTUNITIES_KEY = "resumeai_tracker_opportunities";

function hasSupabaseEnv() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : fallback;
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function localId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function localApplications() {
  return readLocal<Application[]>(LOCAL_APPLICATIONS_KEY, []);
}

function saveLocalApplications(applications: Application[]) {
  writeLocal(LOCAL_APPLICATIONS_KEY, applications);
}

function localOpportunities() {
  return readLocal<JobOpportunity[]>(LOCAL_OPPORTUNITIES_KEY, []);
}

function saveLocalOpportunities(opportunities: JobOpportunity[]) {
  writeLocal(LOCAL_OPPORTUNITIES_KEY, opportunities);
}

async function getToken(): Promise<string> {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Sign in is required to use the application tracker.");
  }
  return token;
}

async function trackerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const trackerApi = {
  applications: {
    list: (status?: ApplicationStatus) =>
      hasSupabaseEnv()
        ? trackerFetch<{ applications: Application[] }>(
            `/api/applications${status ? `?status=${status}` : ""}`,
          )
        : Promise.resolve({
            applications: status
              ? localApplications().filter((application) => application.status === status)
              : localApplications(),
          }),
    create: (body: {
      company_name: string;
      role_title: string;
      jd_url?: string;
      jd_raw_text?: string;
      source?: string;
      location?: string;
      notes?: string;
    }) =>
      hasSupabaseEnv()
        ? trackerFetch<{ application: Application }>("/api/applications", {
            method: "POST",
            body: JSON.stringify(body),
          })
        : Promise.resolve().then(() => {
            const now = new Date().toISOString();
            const application: Application = {
              id: localId("app"),
              company_name: body.company_name,
              role_title: body.role_title,
              jd_url: body.jd_url,
              jd_raw_text: body.jd_raw_text,
              resume_run_id: null,
              status: "saved",
              source: body.source ?? "other",
              location: body.location,
              notes: body.notes,
              created_at: now,
              updated_at: now,
            };
            saveLocalApplications([application, ...localApplications()]);
            return { application };
          }),
    detail: (id: string) =>
      hasSupabaseEnv()
        ? trackerFetch<ApplicationDetail>(`/api/applications/${id}`)
        : Promise.resolve().then(() => {
            const application = localApplications().find((item) => item.id === id);
            if (!application) throw new Error("Application not found");
            return {
              application,
              events: [],
              drafts: [],
              targets: [],
              nudges: [],
              prep: null,
            };
          }),
    status: (id: string, new_status: ApplicationStatus) =>
      hasSupabaseEnv()
        ? trackerFetch<{ application: Application }>(`/api/applications/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ new_status }),
          })
        : Promise.resolve().then(() => {
            const applications = localApplications();
            const application = applications.find((item) => item.id === id);
            if (!application) throw new Error("Application not found");
            application.status = new_status;
            application.updated_at = new Date().toISOString();
            saveLocalApplications(applications);
            return { application };
          }),
    prep: (id: string) => trackerFetch<InterviewPrep>(`/api/applications/${id}/prep`),
    offer: (
      id: string,
      body: { amount: number; currency: string; components?: Record<string, number> },
    ) =>
      trackerFetch<{
        market_data: unknown;
        negotiation_draft: string;
        comparison: { offer_vs_market: string; total_comp: number };
      }>(`/api/applications/${id}/offer`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  nudges: {
    list: () =>
      hasSupabaseEnv()
        ? trackerFetch<{ nudges: Nudge[]; count: number }>("/api/nudges")
        : Promise.resolve({
            nudges: readLocal<Nudge[]>(LOCAL_NUDGES_KEY, []),
            count: readLocal<Nudge[]>(LOCAL_NUDGES_KEY, []).length,
          }),
    dismiss: (id: string, reason?: string) =>
      hasSupabaseEnv()
        ? trackerFetch<{ nudge: Nudge }>(`/api/nudges/${id}/dismiss`, {
            method: "POST",
            body: JSON.stringify({ reason }),
          })
        : Promise.resolve().then(() => {
            const nudges = readLocal<Nudge[]>(LOCAL_NUDGES_KEY, []);
            const nudge = nudges.find((item) => item.id === id);
            writeLocal(
              LOCAL_NUDGES_KEY,
              nudges.filter((item) => item.id !== id),
            );
            return { nudge: nudge as Nudge };
          }),
    complete: (id: string) =>
      hasSupabaseEnv()
        ? trackerFetch<{ nudge: Nudge }>(`/api/nudges/${id}/complete`, {
            method: "POST",
          })
        : Promise.resolve().then(() => {
            const nudges = readLocal<Nudge[]>(LOCAL_NUDGES_KEY, []);
            const nudge = nudges.find((item) => item.id === id);
            writeLocal(
              LOCAL_NUDGES_KEY,
              nudges.filter((item) => item.id !== id),
            );
            return { nudge: nudge as Nudge };
          }),
  },
  outreach: {
    targets: (applicationId: string) =>
      trackerFetch<{ targets: OutreachTarget[] }>(`/api/outreach/targets/${applicationId}`),
    findTargets: (body: {
      application_id: string;
      company_name: string;
      role_title: string;
      company_domain?: string;
    }) =>
      trackerFetch<{ targets: OutreachTarget[]; status: "found" | "not_found" }>(
        "/api/outreach/find-targets",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    generate: (body: {
      application_id: string;
      outreach_target_id: string;
      tone: "professional" | "casual" | "direct";
      candidate_context: Record<string, unknown>;
    }) =>
      trackerFetch<{ drafts: OutreachDraft[] }>("/api/outreach/generate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateDraft: (draftId: string, body: { subject_line?: string | null; body: string }) =>
      trackerFetch<{ draft: OutreachDraft }>(`/api/outreach/drafts/${draftId}`, {
        method: "PUT",
        body: JSON.stringify({ ...body, user_edited: true }),
      }),
    markSent: (draftId: string) =>
      trackerFetch<{ draft: OutreachDraft }>(`/api/outreach/drafts/${draftId}/mark-sent`, {
        method: "POST",
        body: JSON.stringify({ sent_at: new Date().toISOString() }),
      }),
  },
  opportunities: {
    list: () =>
      hasSupabaseEnv()
        ? trackerFetch<{ opportunities: JobOpportunity[] }>("/api/opportunities")
        : Promise.resolve({ opportunities: localOpportunities() }),
    create: (body: {
      company_name?: string;
      role_title?: string;
      location?: string;
      source?: string;
      source_url?: string;
      raw_text?: string;
    }) =>
      hasSupabaseEnv()
        ? trackerFetch<{ opportunity: JobOpportunity }>("/api/opportunities", {
            method: "POST",
            body: JSON.stringify(body),
          })
        : Promise.resolve().then(() => {
            const now = new Date().toISOString();
            const opportunity: JobOpportunity = {
              id: localId("opp"),
              company_name: body.company_name?.trim() || "Unknown company",
              role_title: body.role_title?.trim() || "Unknown role",
              location: body.location?.trim() || null,
              source: body.source ?? "manual",
              source_url: body.source_url?.trim() || null,
              raw_text: body.raw_text?.trim() || null,
              normalized_jd: body.raw_text?.trim() || "",
              status: "new",
              provider_metadata: { normalized_by: "local" },
              created_at: now,
              updated_at: now,
            };
            saveLocalOpportunities([opportunity, ...localOpportunities()]);
            return { opportunity };
          }),
    extract: (body: { url: string; create_application?: boolean }) =>
      hasSupabaseEnv()
        ? trackerFetch<{ opportunity: JobOpportunity; application: Application | null }>(
            "/api/opportunities/extract",
            {
              method: "POST",
              body: JSON.stringify(body),
            },
          )
        : Promise.resolve().then(() => {
            const now = new Date().toISOString();
            const opportunity: JobOpportunity = {
              id: localId("opp"),
              company_name: "Extracted company",
              role_title: "Extracted role",
              location: null,
              source: body.url.includes("linkedin.com") ? "linkedin_post" : "career_page",
              source_url: body.url,
              raw_text: body.url,
              normalized_jd:
                "Local mode cannot fetch remote job pages. Configure Supabase/API or paste the JD text for full extraction.",
              status: body.create_application ? "saved" : "new",
              provider_metadata: { normalized_by: "local_url_placeholder" },
              created_at: now,
              updated_at: now,
            };
            saveLocalOpportunities([opportunity, ...localOpportunities()]);

            let application: Application | null = null;
            if (body.create_application) {
              application = {
                id: localId("app"),
                company_name: opportunity.company_name,
                role_title: opportunity.role_title,
                jd_url: body.url,
                jd_raw_text: opportunity.normalized_jd,
                resume_run_id: null,
                status: "saved",
                source: opportunity.source === "linkedin_post" ? "linkedin" : "company_site",
                location: null,
                notes: `Created from job link ${body.url}`,
                created_at: now,
                updated_at: now,
              };
              saveLocalApplications([application, ...localApplications()]);
            }

            return { opportunity, application };
          }),
    createApplication: (id: string) =>
      hasSupabaseEnv()
        ? trackerFetch<{ application: Application }>(`/api/opportunities/${id}/create-application`, {
            method: "POST",
          })
        : Promise.resolve().then(() => {
            const opportunities = localOpportunities();
            const opportunity = opportunities.find((item) => item.id === id);
            if (!opportunity) throw new Error("Opportunity not found");
            const now = new Date().toISOString();
            const application: Application = {
              id: localId("app"),
              company_name: opportunity.company_name,
              role_title: opportunity.role_title,
              jd_url: opportunity.source_url,
              jd_raw_text: opportunity.normalized_jd ?? opportunity.raw_text,
              resume_run_id: null,
              status: "saved",
              source: opportunity.source === "linkedin_post" ? "linkedin" : "other",
              location: opportunity.location,
              notes: `Created from opportunity ${opportunity.id}`,
              created_at: now,
              updated_at: now,
            };
            opportunity.status = "saved";
            opportunity.updated_at = now;
            saveLocalOpportunities(opportunities);
            saveLocalApplications([application, ...localApplications()]);
            return { application };
          }),
  },
};

export async function sendResumeCommand(body: {
  resume: Resume;
  instruction: string;
  job_description?: string;
  recipient_email: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ResumeCommandRunResponse> {
  const res = await fetch(`${API_URL}/api/resume-commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<ResumeCommandRunResponse>;
}
