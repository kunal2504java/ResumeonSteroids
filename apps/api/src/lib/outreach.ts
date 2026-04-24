export type OutreachTone = "professional" | "casual" | "direct";

export type DraftType =
  | "cold_email"
  | "linkedin_dm"
  | "referral_request"
  | "follow_up";

export type EmailConfidence = "high" | "medium" | "low";

export interface RawContact {
  [key: string]: unknown;
}

export interface RankedContact {
  target_name: string;
  target_title: string;
  target_linkedin_url: string | null;
  email: string | null;
  email_confidence: EmailConfidence | null;
  relevance_score: number;
  mutual_connection_name: string | null;
  mutual_connection_title: string | null;
  raw_data: Record<string, unknown>;
}

export interface EmailCandidateResult {
  email: string;
  confidence: EmailConfidence;
  pattern_used: string;
}

export interface MutualConnection {
  name: string;
  title: string;
  linkedin_url: string | null;
  connection_degree: 1 | 2;
  mutual_friend: string | null;
}

export interface OutreachDraftContent {
  draft_type: DraftType;
  subject_line?: string | null;
  body: string;
  metadata?: Record<string, unknown>;
}

export const EMAIL_PATTERNS = [
  "{first}.{last}@{domain}",
  "{first}{last}@{domain}",
  "{f}{last}@{domain}",
  "{first}@{domain}",
  "{first}_{last}@{domain}",
] as const;

const DIRECT_AUTHORITY_TERMS = [
  "engineering manager",
  "senior engineering manager",
  "director of engineering",
  "vp engineering",
  "head of engineering",
  "tech lead",
  "staff engineer",
];

const REFERRAL_TERMS = ["senior software engineer", "principal engineer", "senior product manager"];
const RECRUITER_TERMS = ["technical recruiter", "talent acquisition", "recruiter", "hr manager"];
const FORBIDDEN_OUTREACH_PHRASES = [
  "i hope this finds you well",
  "i am writing to express my interest",
  "i would love to",
  "please find attached",
  "i am a passionate",
  "i have always admired",
  "my name is",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value: string): string {
  return value.toLowerCase();
}

function titleFrom(raw: RawContact): string {
  return (
    asString(raw.title) ||
    asString(raw.headline) ||
    asString(raw.position) ||
    asString(raw.jobTitle) ||
    asString(raw.occupation)
  );
}

function nameFrom(raw: RawContact): string {
  return (
    asString(raw.fullName) ||
    asString(raw.name) ||
    [asString(raw.firstName), asString(raw.lastName)].filter(Boolean).join(" ")
  );
}

function linkedinUrlFrom(raw: RawContact): string | null {
  return (
    asString(raw.linkedinUrl) ||
    asString(raw.profileUrl) ||
    asString(raw.url) ||
    asString(raw.linkedInUrl) ||
    null
  );
}

function emailFrom(raw: RawContact): string | null {
  return asString(raw.email) || asString(raw.workEmail) || null;
}

function normalizedName(value: string): string {
  return lower(value).replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function splitRoleTokens(roleTitle: string): string[] {
  return lower(roleTitle)
    .replace(/[^\w\s+/#.-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !["senior", "junior", "lead", "staff"].includes(token));
}

function titleContainsAny(title: string, terms: string[]): boolean {
  const normalized = lower(title);
  return terms.some((term) => normalized.includes(term));
}

export function scoreContact(raw: RawContact, roleTitle: string): RankedContact {
  const name = nameFrom(raw);
  const title = titleFrom(raw);
  const titleLower = lower(title);
  const roleLower = lower(roleTitle);
  let score = 0;

  if (titleContainsAny(title, DIRECT_AUTHORITY_TERMS)) {
    score += 3;
  }

  const roleTokens = splitRoleTokens(roleTitle);
  if (roleTokens.some((token) => titleLower.includes(token))) {
    score += 2;
  }

  if (
    (roleLower.includes("senior") && titleLower.includes("senior")) ||
    (roleLower.includes("staff") && titleLower.includes("staff")) ||
    (roleLower.includes("lead") && titleLower.includes("lead"))
  ) {
    score += 2;
  }

  if (titleContainsAny(title, REFERRAL_TERMS)) {
    score += 2;
  }

  if (titleContainsAny(title, RECRUITER_TERMS)) {
    score += 1;
  }

  if (asString(raw.mutualFriend) || asString(raw.mutual_connection_name)) {
    score += 2;
  }

  return {
    target_name: name,
    target_title: title,
    target_linkedin_url: linkedinUrlFrom(raw),
    email: emailFrom(raw),
    email_confidence: emailFrom(raw) ? "high" : null,
    relevance_score: score,
    mutual_connection_name: asString(raw.mutualFriend) || asString(raw.mutual_connection_name) || null,
    mutual_connection_title: asString(raw.mutualFriendTitle) || asString(raw.mutual_connection_title) || null,
    raw_data: { ...raw },
  };
}

export function scoreAndRankContacts(
  rawContacts: RawContact[],
  roleTitle: string,
  limit = 5,
): RankedContact[] {
  return rawContacts
    .map((raw) => scoreContact(raw, roleTitle))
    .filter((contact) => contact.target_name && contact.target_title)
    .sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return a.target_name.localeCompare(b.target_name);
    })
    .slice(0, limit);
}

export function findMutualConnections(input: {
  companyName: string;
  companyContacts: RawContact[];
  userConnections: RawContact[];
}): MutualConnection[] {
  const companyName = lower(input.companyName);
  const userConnectionNames = new Map<string, RawContact>();

  for (const connection of input.userConnections) {
    const name = nameFrom(connection);
    if (!name) {
      continue;
    }
    const company =
      lower(asString(connection.companyName) || asString(connection.company) || asString(connection.currentCompany));
    if (company && !company.includes(companyName) && !companyName.includes(company)) {
      continue;
    }
    userConnectionNames.set(normalizedName(name), connection);
  }

  return input.companyContacts
    .map<MutualConnection | null>((contact) => {
      const name = nameFrom(contact);
      const matched = userConnectionNames.get(normalizedName(name));
      if (!matched) {
        return null;
      }

      return {
        name,
        title: titleFrom(contact) || titleFrom(matched),
        linkedin_url: linkedinUrlFrom(contact) ?? linkedinUrlFrom(matched),
        connection_degree: 1 as const,
        mutual_friend: name,
      };
    })
    .filter((item): item is MutualConnection => Boolean(item));
}

export function attachMutualConnections(
  companyContacts: RawContact[],
  mutualConnections: MutualConnection[],
): RawContact[] {
  const mutualByName = new Map(
    mutualConnections.map((connection) => [normalizedName(connection.name), connection]),
  );

  return companyContacts.map((contact) => {
    const mutual = mutualByName.get(normalizedName(nameFrom(contact)));
    if (!mutual) {
      return contact;
    }

    return {
      ...contact,
      mutualFriend: mutual.mutual_friend ?? mutual.name,
      mutualFriendTitle: mutual.title,
    };
  });
}

export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  return {
    first: parts[0] ?? "",
    last: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

export function generateEmailCandidates(
  firstName: string,
  lastName: string,
  companyDomain: string,
): string[] {
  const first = firstName.trim().toLowerCase();
  const last = lastName.trim().toLowerCase();
  const domain = companyDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const f = first.charAt(0);

  if (!first || !domain) {
    return [];
  }

  const values = EMAIL_PATTERNS.map((pattern) =>
    pattern
      .replace("{first}", first)
      .replace("{last}", last)
      .replace("{f}", f)
      .replace("{domain}", domain),
  );

  return Array.from(new Set(values.filter((email) => !email.includes("..") && !email.includes("@@"))));
}

export function detectEmailPattern(
  email: string,
  firstName: string,
  lastName: string,
  companyDomain: string,
): string {
  const candidates = generateEmailCandidates(firstName, lastName, companyDomain);
  const normalized = email.toLowerCase();
  const index = candidates.findIndex((candidate) => candidate === normalized);
  return index >= 0 ? EMAIL_PATTERNS[index] : "unknown";
}

export async function findEmailByPattern(input: {
  firstName: string;
  lastName: string;
  companyDomain: string;
  verifyMx: (email: string) => Promise<boolean>;
  hunterLookup?: () => Promise<EmailCandidateResult | null>;
}): Promise<EmailCandidateResult | null> {
  if (input.hunterLookup) {
    const hunterResult = await input.hunterLookup();
    if (hunterResult) {
      return hunterResult;
    }
  }

  const candidates = generateEmailCandidates(input.firstName, input.lastName, input.companyDomain);
  if (candidates.length === 0) {
    return null;
  }

  for (const email of candidates) {
    if (await input.verifyMx(email)) {
      return {
        email,
        confidence: "medium",
        pattern_used: detectEmailPattern(email, input.firstName, input.lastName, input.companyDomain),
      };
    }
  }

  return {
    email: candidates[0],
    confidence: "low",
    pattern_used: EMAIL_PATTERNS[0],
  };
}

export function inferCompanyDomain(companyName: string): string {
  const cleaned = companyName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation|technologies|technology|software)\b/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "")
    .trim();

  return cleaned ? `${cleaned}.com` : "";
}

export function validateOutreachDraft(draft: OutreachDraftContent): string[] {
  const issues: string[] = [];
  const body = draft.body.trim();
  const lowerBody = lower(body);
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  if (!body) {
    issues.push("body is required");
  }

  if (draft.draft_type === "cold_email" && wordCount > 150) {
    issues.push("cold email must be under 150 words");
  }

  if (draft.draft_type === "linkedin_dm") {
    const connectionRequest = asString(draft.metadata?.connection_request);
    const followUp = asString(draft.metadata?.follow_up_dm) || body;
    if (connectionRequest && connectionRequest.length > 300) {
      issues.push("LinkedIn connection request must be under 300 characters");
    }
    if (followUp.length > 500) {
      issues.push("LinkedIn follow-up DM must be under 500 characters");
    }
  }

  if (draft.draft_type === "referral_request" && !asString(draft.metadata?.fit_paragraph)) {
    issues.push("referral request must include a fit paragraph");
  }

  if (FORBIDDEN_OUTREACH_PHRASES.some((phrase) => lowerBody.includes(phrase))) {
    issues.push("draft contains forbidden outreach phrasing");
  }

  return issues;
}

export function validateOutreachDrafts(drafts: OutreachDraftContent[]): string[] {
  return drafts.flatMap((draft) =>
    validateOutreachDraft(draft).map((issue) => `${draft.draft_type}: ${issue}`),
  );
}

export function eventTypeForDraft(draftType: DraftType): string {
  if (draftType === "linkedin_dm") {
    return "dm_sent";
  }
  if (draftType === "referral_request") {
    return "referral_sent";
  }
  return "email_sent";
}
