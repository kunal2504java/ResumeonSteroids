/**
 * Daily-deck job harvester.
 *
 * Runs a matrix of Google X-ray queries (role × ATS board × region) through
 * Serper, parses each result deterministically (company + role from the URL/title,
 * no AI), gates out senior roles, dedups by canonical URL, and upserts into the
 * global `job_postings` pool. JD text is NOT fetched here — it is filled lazily on
 * the first swipe-right via the existing extractJobPage().
 */

import { getSupabaseAdmin } from "./supabase";
import { serperSearch, type SerperOrganicResult } from "./serper";

export type BoardSource = "ashby" | "greenhouse" | "lever" | "workday";

export interface RoleQuery {
  key: string;
  phrase: string; // exact-phrase fragment incl. quotes, e.g. '"product analyst"'
}

export interface BoardGroup {
  source: BoardSource;
  sites: string[]; // domains folded into one (site:a OR site:b) clause
}

export interface RegionQuery {
  key: string;
  gl: string;
  location: string;
}

export interface ParsedPosting {
  company_name: string;
  role_title: string;
  canonical_url: string;
  source_url: string;
  source: BoardSource;
  region: string;
  employment_type: string | null;
  is_entry_level: boolean;
  title_raw: string;
  snippet: string;
  posted_at: string | null;
  matched_role: string;
  harvest_query: string;
  provider_metadata: Record<string, unknown>;
}

// --- curated matrix (extensible) -------------------------------------------

export const DEFAULT_ROLES: RoleQuery[] = [
  { key: "product_analyst", phrase: '"product analyst"' },
  { key: "associate_product_manager", phrase: '"associate product manager"' },
  { key: "product_manager_intern", phrase: '"product manager intern"' },
  { key: "product_management_intern", phrase: '"product management intern"' },
  { key: "product_intern", phrase: '"product intern"' },
  { key: "associate_product_analyst", phrase: '"associate product analyst"' },
];

export const DEFAULT_BOARDS: BoardGroup[] = [
  { source: "ashby", sites: ["jobs.ashbyhq.com"] },
  { source: "greenhouse", sites: ["job-boards.greenhouse.io", "boards.greenhouse.io"] },
  { source: "lever", sites: ["jobs.lever.co"] },
  { source: "workday", sites: ["myworkdayjobs.com"] },
];

export const DEFAULT_REGIONS: RegionQuery[] = [
  { key: "us", gl: "us", location: "United States" },
  { key: "in", gl: "in", location: "India" },
];

// Reject titles that are clearly not entry-level. "manager" is intentionally NOT
// here — Associate Product Manager and Product Manager Intern are entry-level.
const SENIOR_RE = /\b(senior|sr\.?|staff|lead|principal|director|head\s+of|vp|vice\s+president|chief)\b/i;
const SENIORITY_NEGATIVES = "-senior -staff -principal -director -lead";

export function isEntryLevel(title: string): boolean {
  return !SENIOR_RE.test(title);
}

export function buildQuery(board: BoardGroup, role: RoleQuery): string {
  const sites = board.sites.map((s) => `site:${s}`).join(" OR ");
  return `(${sites}) ${role.phrase} ${SENIORITY_NEGATIVES}`;
}

/** Strip tracking params and apply/application tails so one posting → one key. */
export function toCanonicalUrl(rawUrl: string): string {
  const u = new URL(rawUrl);
  u.search = "";
  u.hash = "";
  let path = u.pathname
    .replace(/\/(apply|application)(\/.*)?$/i, "")
    .replace(/\/+$/, "");
  if (path === "") path = "/";
  return `${u.protocol}//${u.host}${path}`;
}

/** True only for actual job-posting URLs (not ATS board landing pages). */
export function isPostingUrl(source: BoardSource, rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const segs = u.pathname.split("/").filter(Boolean);
    switch (source) {
      case "ashby":
        return segs.length >= 2; // /{company}/{uuid}
      case "lever":
        return segs.length >= 2; // /{company}/{uuid}
      case "greenhouse":
        return /\/jobs\//i.test(u.pathname);
      case "workday":
        return /\/job\//i.test(u.pathname);
      default:
        return true;
    }
  } catch {
    return false;
  }
}

function prettifySlug(slug: string): string {
  return slug
    .replace(/[-_]+\d+$/i, "") // trailing "-2" style disambiguators
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function companyFromUrl(source: BoardSource, rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (source === "workday") {
      const sub = u.hostname.split(".")[0];
      return sub ? prettifySlug(sub) : null;
    }
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg ? prettifySlug(seg) : null;
  } catch {
    return null;
  }
}

function cleanRole(role: string): string {
  return role
    .replace(/\s*[-|]\s*(jobs|greenhouse|lever|myworkdayjobs\.com|careers).*$/i, "")
    .replace(/\s*\(.*?\)\s*$/, "") // trailing "(Remote)" etc.
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministically pull company + role from a board result. AI-free. */
export function parseResult(
  source: BoardSource,
  title: string,
  url: string,
): { company: string; role: string } {
  const urlCompany = companyFromUrl(source, url);
  let company: string | null = null;
  let role = title;

  if (source === "ashby") {
    const m = title.match(/^(.+?)\s+@\s+(.+?)\s*-\s*Jobs\s*$/i);
    if (m) {
      role = m[1];
      company = m[2];
    }
  } else if (source === "greenhouse") {
    const m = title.match(/^Job Application for (.+?) at (.+?)\s*-\s*Greenhouse/i);
    if (m) {
      role = m[1];
      company = m[2];
    } else {
      role = title.split(/\s+[-|]\s+/)[0] ?? title;
    }
  } else if (source === "lever") {
    const parts = title.split(/\s+-\s+/);
    if (parts.length >= 2) {
      if (/lever/i.test(parts[parts.length - 1])) parts.pop();
      company = parts.shift() ?? null;
      role = parts.join(" - ") || title;
    }
  } else if (source === "workday") {
    role = title.split(/\s+[-|]\s+/)[0] ?? title;
  }

  return {
    company: (company || urlCompany || "Unknown company").trim(),
    role: cleanRole(role) || "Unknown role",
  };
}

/** Serper's `date` ("3 days ago" / "Jun 17, 2026") → ISO, best-effort. */
export function parsePostedDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  const rel = s.match(/^(\d+)\s+(hour|day|week|month|year)s?\s+ago$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unitMs: Record<string, number> = {
      hour: 3_600_000,
      day: 86_400_000,
      week: 604_800_000,
      month: 2_592_000_000,
      year: 31_536_000_000,
    };
    const ms = unitMs[rel[2].toLowerCase()];
    if (ms) return new Date(Date.now() - n * ms).toISOString();
  }
  const abs = new Date(s);
  return Number.isNaN(abs.getTime()) ? null : abs.toISOString();
}

function detectEmploymentType(title: string, snippet: string): string | null {
  if (/\bintern(ship)?\b/i.test(title)) return "intern";
  if (/\bintern(ship)?\b/i.test(snippet) && /\bproduct\b/i.test(title)) return "intern";
  return null;
}

/** Turn one Serper result into a ParsedPosting, or null if it should be dropped. */
export function resultToPosting(
  result: SerperOrganicResult,
  ctx: { source: BoardSource; region: string; roleKey: string; query: string },
): ParsedPosting | null {
  if (!result.link || !result.title) return null;
  if (!isPostingUrl(ctx.source, result.link)) return null;

  const title = result.title;
  const snippet = result.snippet ?? "";

  // On-topic guard: exact-phrase queries are tight, but keep a cheap product gate.
  if (!/\bproduct\b/i.test(title) && !/\bproduct\b/i.test(snippet)) return null;
  if (!isEntryLevel(title)) return null;

  let canonical: string;
  try {
    canonical = toCanonicalUrl(result.link);
  } catch {
    return null;
  }

  const { company, role } = parseResult(ctx.source, title, result.link);

  return {
    company_name: company,
    role_title: role,
    canonical_url: canonical,
    source_url: result.link,
    source: ctx.source,
    region: ctx.region,
    employment_type: detectEmploymentType(title, snippet),
    is_entry_level: true,
    title_raw: title,
    snippet,
    posted_at: parsePostedDate(result.date),
    matched_role: ctx.roleKey,
    harvest_query: ctx.query,
    provider_metadata: { board: ctx.source, date_text: result.date ?? null },
  };
}

export interface HarvestOptions {
  roles?: RoleQuery[];
  boards?: BoardGroup[];
  regions?: RegionQuery[];
  freshness?: string; // tbs value; default "qdr:w"
  resultsPerQuery?: number; // num; default 10
  dryRun?: boolean; // skip the DB upsert, just return parsed rows
  apiKey?: string; // Serper key override (scripts/tests)
}

export interface HarvestSummary {
  queries: number;
  rawResults: number;
  kept: number;
  deduped: number;
  upserted: number;
  skipped: number;
  byBoard: Record<string, number>;
  errors: string[];
  sample: ParsedPosting[];
}

/**
 * Run the harvest matrix. Returns a summary; with `dryRun: true` it parses and
 * dedups but does not touch the database (used for live verification of parsing).
 */
export async function runHarvest(opts: HarvestOptions = {}): Promise<HarvestSummary> {
  const roles = opts.roles ?? DEFAULT_ROLES;
  const boards = opts.boards ?? DEFAULT_BOARDS;
  const regions = opts.regions ?? DEFAULT_REGIONS;
  const freshness = opts.freshness ?? "qdr:w";
  const num = opts.resultsPerQuery ?? 10;

  const byCanonical = new Map<string, ParsedPosting>();
  const byBoard: Record<string, number> = {};
  const errors: string[] = [];
  let queries = 0;
  let rawResults = 0;
  let kept = 0;
  let skipped = 0;

  for (const region of regions) {
    for (const board of boards) {
      for (const role of roles) {
        const q = buildQuery(board, role);
        queries += 1;
        let results: SerperOrganicResult[] = [];
        try {
          results = await serperSearch(
            { q, tbs: freshness, gl: region.gl, location: region.location, num },
            opts.apiKey,
          );
        } catch (err) {
          errors.push(`${board.source}/${role.key}/${region.key}: ${(err as Error).message}`);
          continue;
        }

        rawResults += results.length;
        for (const r of results) {
          const posting = resultToPosting(r, {
            source: board.source,
            region: region.key,
            roleKey: role.key,
            query: q,
          });
          if (!posting) {
            skipped += 1;
            continue;
          }
          kept += 1;
          // Keep the first occurrence; prefer one that carries a posted date.
          const existing = byCanonical.get(posting.canonical_url);
          if (!existing || (!existing.posted_at && posting.posted_at)) {
            byCanonical.set(posting.canonical_url, posting);
            byBoard[board.source] = (byBoard[board.source] ?? 0) + (existing ? 0 : 1);
          }
        }
      }
    }
  }

  const rows = [...byCanonical.values()];
  let upserted = 0;

  if (!opts.dryRun && rows.length > 0) {
    const nowIso = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    // Omit normalized_jd (preserve lazy fill) and first_seen_at (preserve original).
    const payload = rows.map((r) => ({
      company_name: r.company_name,
      role_title: r.role_title,
      canonical_url: r.canonical_url,
      source_url: r.source_url,
      source: r.source,
      region: r.region,
      employment_type: r.employment_type,
      is_entry_level: r.is_entry_level,
      title_raw: r.title_raw,
      snippet: r.snippet,
      posted_at: r.posted_at,
      matched_role: r.matched_role,
      harvest_query: r.harvest_query,
      provider_metadata: r.provider_metadata,
      last_seen_at: nowIso,
    }));

    for (let i = 0; i < payload.length; i += 200) {
      const chunk = payload.slice(i, i + 200);
      const { error, count } = await supabase
        .from("job_postings")
        .upsert(chunk, { onConflict: "canonical_url", count: "exact" });
      if (error) {
        errors.push(`upsert: ${error.message}`);
      } else {
        upserted += count ?? chunk.length;
      }
    }
  }

  return {
    queries,
    rawResults,
    kept,
    deduped: rows.length,
    upserted,
    skipped,
    byBoard,
    errors,
    sample: rows.slice(0, 12),
  };
}
