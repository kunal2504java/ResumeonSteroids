import { createClient } from "@/lib/supabase/client";
import type {
  Application,
  ApplicationDetail,
  ApplicationStatus,
  InterviewPrep,
  Nudge,
  OutreachDraft,
  OutreachTarget,
} from "@/types/tracker";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getToken(): Promise<string> {
  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseEnv) {
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
      trackerFetch<{ applications: Application[] }>(
        `/api/applications${status ? `?status=${status}` : ""}`,
      ),
    create: (body: {
      company_name: string;
      role_title: string;
      jd_url?: string;
      jd_raw_text?: string;
      source?: string;
      location?: string;
      notes?: string;
    }) =>
      trackerFetch<{ application: Application }>("/api/applications", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    detail: (id: string) => trackerFetch<ApplicationDetail>(`/api/applications/${id}`),
    status: (id: string, new_status: ApplicationStatus) =>
      trackerFetch<{ application: Application }>(`/api/applications/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ new_status }),
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
    list: () => trackerFetch<{ nudges: Nudge[]; count: number }>("/api/nudges"),
    dismiss: (id: string, reason?: string) =>
      trackerFetch<{ nudge: Nudge }>(`/api/nudges/${id}/dismiss`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    complete: (id: string) =>
      trackerFetch<{ nudge: Nudge }>(`/api/nudges/${id}/complete`, {
        method: "POST",
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
};

