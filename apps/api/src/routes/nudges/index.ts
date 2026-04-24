import { Hono } from "hono";
import type { Context } from "hono";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authMiddleware } from "../../middleware/auth";

type AuthContext = Context<{ Variables: { userId: string } }>;

const nudgeRoutes = new Hono();

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

nudgeRoutes.get("/", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const { data, error } = await getSupabaseAdmin()
      .from("nudges")
      .select("*, applications(company_name, role_title, status)")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({ error: "Failed to fetch nudges" }, 500);
    }

    const nudges = (data ?? []).sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.priority ?? "medium"] ?? 1;
      const priorityB = PRIORITY_ORDER[b.priority ?? "medium"] ?? 1;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return String(a.due_date ?? "").localeCompare(String(b.due_date ?? ""));
    });

    return c.json({ nudges, count: nudges.length });
  } catch (error) {
    console.error("[Get Nudges Error]", error);
    return c.json({ error: "Failed to fetch nudges" }, 500);
  }
});

nudgeRoutes.post("/:id/dismiss", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "id is required" }, 400);
    }

    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = await getSupabaseAdmin()
      .from("nudges")
      .update({
        is_dismissed: true,
        action_payload: {
          dismiss_reason: typeof body.reason === "string" ? body.reason : "",
        },
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      return c.json({ error: "Nudge not found" }, 404);
    }

    return c.json({ nudge: data });
  } catch (error) {
    console.error("[Dismiss Nudge Error]", error);
    return c.json({ error: "Failed to dismiss nudge" }, 500);
  }
});

nudgeRoutes.post("/:id/complete", authMiddleware, async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "id is required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: nudge, error: fetchError } = await supabase
      .from("nudges")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !nudge) {
      return c.json({ error: "Nudge not found" }, 404);
    }

    const { data, error } = await supabase
      .from("nudges")
      .update({ is_dismissed: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to complete nudge" }, 500);
    }

    await supabase.from("application_events").insert({
      application_id: nudge.application_id,
      user_id: userId,
      event_type: "note_added",
      event_data: {
        note: `Completed nudge: ${nudge.title}`,
        nudge_id: id,
        nudge_type: nudge.nudge_type,
      },
    });

    return c.json({ nudge: data });
  } catch (error) {
    console.error("[Complete Nudge Error]", error);
    return c.json({ error: "Failed to complete nudge" }, 500);
  }
});

export { nudgeRoutes };

