import { createMiddleware } from "hono/factory";
import { getSupabaseAdmin } from "../lib/supabase";

type Action = "rewrite" | "tailor" | "import";

const FREE_LIMITS: Record<Action, number> = {
  rewrite: 50,
  tailor: 10,
  import: 5,
};

const PRO_LIMITS: Record<Action, number> = {
  rewrite: 500,
  tailor: 100,
  import: 50,
};

export function rateLimitMiddleware(action: Action, isPro = false) {
  return createMiddleware(async (c, next) => {
    const userId = c.get("userId" as never) as string;
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const limit = isPro ? PRO_LIMITS[action] : FREE_LIMITS[action];
    const countField = `${action}_count`;
    const today = new Date().toISOString().split("T")[0];

    // Upsert today's usage row
    await getSupabaseAdmin()
      .from("ai_usage")
      .upsert(
        { user_id: userId, date: today },
        { onConflict: "user_id,date", ignoreDuplicates: true }
      );

    // Get current count
    const { data } = await getSupabaseAdmin()
      .from("ai_usage")
      .select()
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (!data) {
      return c.json({ error: "Rate limit check failed" }, 500);
    }

    const current = (data as Record<string, number>)[countField] ?? 0;
    if (current >= limit) {
      const resetAt = new Date();
      resetAt.setDate(resetAt.getDate() + 1);
      resetAt.setHours(0, 0, 0, 0);
      return c.json(
        {
          error: "Daily limit reached",
          remaining: 0,
          resetAt: resetAt.toISOString(),
        },
        429
      );
    }

    // Increment
    await getSupabaseAdmin()
      .from("ai_usage")
      .update({ [countField]: current + 1 })
      .eq("user_id", userId)
      .eq("date", today);

    // Set remaining header
    c.header("X-RateLimit-Remaining", String(limit - current - 1));
    await next();
  });
}
