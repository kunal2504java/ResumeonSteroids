import { Hono } from "hono";
import { CodeforcesImportSchema } from "@resumeai/shared/schemas";
import { fetchCodeforcesUser } from "../../../lib/codeforces";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CodeforcesImportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid handle" }, 400);
    }

    const user = await fetchCodeforcesUser(parsed.data.handle);

    const achievement = `Codeforces: ${user.maxRank} (max rating ${user.maxRating})`;

    return c.json({
      stats: user,
      achievement,
    });
  } catch (error) {
    console.error("[Codeforces Import Error]", error);
    const message =
      error instanceof Error ? error.message : "Codeforces import failed";
    return c.json({ error: message }, 500);
  }
});

export { route as codeforcesImportRoute };
