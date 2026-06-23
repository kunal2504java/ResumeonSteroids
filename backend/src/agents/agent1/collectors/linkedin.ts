/**
 * LinkedIn Collector
 *
 * Fetches LinkedIn profile data via the Apify supreme_coder/linkedin-profile-scraper actor.
 * No cookies required — uses the Apify API with a token.
 *
 * Flow: User pastes LinkedIn URL → Apify scrapes profile → returns raw JSON
 * The raw JSON is then fed to Claude in Agent 1 for structured extraction.
 */

/**
 * Raw Apify response for a LinkedIn profile.
 * Apify returns inconsistent field names across profiles, so we keep
 * the full raw JSON and let Claude handle extraction in the orchestrator.
 */
export interface LinkedInRawData {
  source: "linkedin";
  profileUrl: string;
  /** The full raw JSON object returned by the Apify scraper */
  raw: Record<string, unknown>;
}

const APIFY_ACTOR_ID = "supreme_coder~linkedin-profile-scraper";
const APIFY_API_BASE = "https://api.apify.com/v2";

/**
 * Collect LinkedIn profile data via Apify.
 * Returns the raw Apify JSON — Claude extraction happens in Agent 1.
 */
export async function collectLinkedIn(profileUrl: string): Promise<LinkedInRawData> {
  const trimmed = profileUrl.trim();

  if (!trimmed) {
    throw new Error("No LinkedIn profile URL provided");
  }

  // Basic URL validation
  if (!trimmed.includes("linkedin.com/in/")) {
    throw new Error("Invalid LinkedIn profile URL. Expected format: https://www.linkedin.com/in/username");
  }

  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    throw new Error("APIFY_API_KEY is not configured");
  }

  console.log("[LinkedIn Collector] Calling Apify for:", trimmed);

  // Run the Apify actor synchronously (waits up to 300s for completion)
  const runRes = await fetch(
    `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [{ url: trimmed }],
      }),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text().catch(() => "");
    throw new Error(
      `LinkedIn scraper failed (${runRes.status}): ${err.slice(0, 200)}`
    );
  }

  const results = (await runRes.json()) as Array<Record<string, unknown>>;

  if (!results?.length) {
    throw new Error("No data returned from LinkedIn scraper");
  }

  const raw = results[0];
  console.log("[LinkedIn Collector] Got profile keys:", Object.keys(raw).join(", "));

  return {
    source: "linkedin",
    profileUrl: trimmed,
    raw,
  };
}
