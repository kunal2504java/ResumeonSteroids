import { Hono } from "hono";
import { LeetCodeImportSchema } from "@resumeai/shared/schemas";
import { fetchLeetCodeStats } from "../../../lib/leetcode";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = LeetCodeImportSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid username" }, 400);
    }

    const stats = await fetchLeetCodeStats(parsed.data.username);

    const achievement = [
      `LeetCode: ${stats.totalSolved} problems solved`,
      `(Easy: ${stats.easySolved}, Medium: ${stats.mediumSolved}, Hard: ${stats.hardSolved})`,
      stats.contestRating > 0
        ? `| Contest Rating: ${stats.contestRating}`
        : "",
      stats.topPercentage > 0 ? `(Top ${stats.topPercentage}%)` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return c.json({
      stats,
      achievement,
      skills: ["Problem Solving", "Data Structures", "Algorithms"],
    });
  } catch (error) {
    console.error("[LeetCode Import Error]", error);
    const message =
      error instanceof Error ? error.message : "LeetCode import failed";
    return c.json({ error: message }, 500);
  }
});

export { route as leetcodeImportRoute };
