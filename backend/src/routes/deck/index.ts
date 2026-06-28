import { Hono } from "hono";
import { runHarvest, type HarvestOptions } from "../../lib/harvester";

const deckRoutes = new Hono();

/**
 * Trigger a harvest run. This is a maintenance/cron endpoint, not a per-user one:
 * it writes the shared `job_postings` pool via the service role. Guard it with the
 * HARVEST_SECRET env var (sent as `Authorization: Bearer <secret>` or
 * `x-harvest-secret`). If HARVEST_SECRET is unset, the endpoint is open (dev only).
 */
deckRoutes.post("/harvest", async (c) => {
  const secret = process.env.HARVEST_SECRET;
  if (secret) {
    const auth = c.req.header("authorization");
    const headerSecret = c.req.header("x-harvest-secret") ?? auth?.replace(/^Bearer\s+/i, "");
    if (headerSecret !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  try {
    const body = (await c.req.json().catch(() => ({}))) as Partial<HarvestOptions> & {
      dryRun?: boolean;
    };
    const summary = await runHarvest({
      freshness: body.freshness,
      resultsPerQuery: body.resultsPerQuery,
      roles: body.roles,
      boards: body.boards,
      regions: body.regions,
      dryRun: body.dryRun ?? false,
    });
    return c.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Harvest failed";
    console.error("[Deck Harvest Error]", error);
    return c.json({ error: message }, 500);
  }
});

export { deckRoutes };
