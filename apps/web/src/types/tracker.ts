export type ApplicationStatus =
  | "saved"
  | "applied"
  | "outreach_sent"
  | "screen_scheduled"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export interface Application {
  id: string;
  company_name: string;
  role_title: string;
  jd_url?: string | null;
  jd_raw_text?: string | null;
  resume_run_id?: string | null;
  status: ApplicationStatus;
  source?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  location?: string | null;
  is_remote?: boolean | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  applied_at?: string | null;
  nudges?: Nudge[];
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface OutreachTarget {
  id: string;
  application_id: string;
  company_name: string;
  target_name?: string | null;
  target_title?: string | null;
  target_linkedin_url?: string | null;
  target_email?: string | null;
  email_confidence?: "high" | "medium" | "low" | null;
  is_mutual_connection?: boolean | null;
  mutual_connection_name?: string | null;
  mutual_connection_title?: string | null;
  created_at: string;
}

export interface OutreachDraft {
  id: string;
  application_id: string;
  outreach_target_id?: string | null;
  draft_type: "cold_email" | "linkedin_dm" | "referral_request" | "follow_up";
  subject_line?: string | null;
  body: string;
  tone?: "professional" | "casual" | "direct" | null;
  is_sent: boolean;
  user_edited: boolean;
  created_at: string;
}

export interface Nudge {
  id: string;
  application_id: string;
  nudge_type: string;
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  action_label?: string | null;
  action_type?: string | null;
  action_payload?: Record<string, unknown> | null;
  due_date?: string | null;
  is_dismissed: boolean;
  created_at: string;
  applications?: {
    company_name?: string;
    role_title?: string;
    status?: ApplicationStatus;
  };
}

export interface ApplicationDetail {
  application: Application;
  events: ApplicationEvent[];
  drafts: OutreachDraft[];
  targets: OutreachTarget[];
  nudges: Nudge[];
  prep?: InterviewPrep | null;
}

export interface InterviewPrep {
  questions: PrepQuestion[];
  company_questions: PrepQuestion[];
  resume_questions: PrepQuestion[];
  star_answers: StarAnswer[];
}

export interface PrepQuestion {
  question: string;
  source: "company" | "resume";
  category: "technical" | "behavioral" | "company";
}

export interface StarAnswer {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

