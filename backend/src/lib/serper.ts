/**
 * Thin client over the Serper Google Search API (https://serper.dev).
 *
 * Used by the daily-deck harvester to X-ray ATS job boards
 * (e.g. `site:jobs.ashbyhq.com "product analyst"`). One call = 1 Serper credit.
 */

const SERPER_ENDPOINT = "https://google.serper.dev/search";

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  /** Only present when a time filter (`tbs`) is applied — e.g. "3 days ago" or "Jun 17, 2026". */
  date?: string;
  position?: number;
}

export interface SerperSearchParams {
  q: string;
  /** Time filter, e.g. "qdr:w" (past week), "qdr:m" (past month). Makes Serper attach `date`. */
  tbs?: string;
  /** Country code to bias results, e.g. "us", "in". */
  gl?: string;
  /** Human location string, e.g. "United States", "India". */
  location?: string;
  /** Results per page (max 100; default 10). */
  num?: number;
  /** 1-indexed page for pagination. */
  page?: number;
}

function resolveApiKey(override?: string): string {
  const key = override ?? process.env.SERPER_API_KEY;
  if (!key) {
    throw new Error("Missing SERPER_API_KEY. Add it to backend/.env");
  }
  return key;
}

/**
 * Run one Google search through Serper and return its organic results.
 * `apiKey` can be passed explicitly (handy for scripts/tests); otherwise it is
 * read from `SERPER_API_KEY`.
 */
export async function serperSearch(
  params: SerperSearchParams,
  apiKey?: string,
): Promise<SerperOrganicResult[]> {
  const key = resolveApiKey(apiKey);

  const body: Record<string, unknown> = { q: params.q };
  if (params.tbs) body.tbs = params.tbs;
  if (params.gl) body.gl = params.gl;
  if (params.location) body.location = params.location;
  if (params.num) body.num = params.num;
  if (params.page) body.page = params.page;

  const response = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Serper search failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { organic?: SerperOrganicResult[] };
  return Array.isArray(data.organic) ? data.organic : [];
}
