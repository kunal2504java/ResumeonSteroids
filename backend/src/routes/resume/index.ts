import { Hono } from "hono";
import { getSupabaseAdmin } from "../../lib/supabase";
import { authMiddleware } from "../../middleware/auth";

const resumeRoutes = new Hono();

// List all resumes for the authenticated user
resumeRoutes.get("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;

    const { data, error } = await getSupabaseAdmin()
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json({ error: "Failed to fetch resumes" }, 500);
    }

    return c.json(data);
  } catch (error) {
    console.error("[Resume List Error]", error);
    return c.json({ error: "Failed to fetch resumes" }, 500);
  }
});

// Get a single resume by ID
resumeRoutes.get("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;
    const id = c.req.param("id");

    const { data, error } = await getSupabaseAdmin()
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return c.json({ error: "Resume not found" }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error("[Resume Get Error]", error);
    return c.json({ error: "Failed to fetch resume" }, 500);
  }
});

// Create a new resume
resumeRoutes.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;
    const body = await c.req.json();

    const { data, error } = await getSupabaseAdmin()
      .from("resumes")
      .insert({
        user_id: userId,
        title: body.title ?? "Untitled Resume",
        template: body.template ?? "jake",
        data: body.data ?? {},
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: "Failed to create resume" }, 500);
    }

    return c.json(data, 201);
  } catch (error) {
    console.error("[Resume Create Error]", error);
    return c.json({ error: "Failed to create resume" }, 500);
  }
});

// Update a resume
resumeRoutes.patch("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;
    const id = c.req.param("id");
    const body = await c.req.json();

    const { data, error } = await getSupabaseAdmin()
      .from("resumes")
      .update({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.template !== undefined && { template: body.template }),
        ...(body.data !== undefined && { data: body.data }),
        ...(body.ats_score !== undefined && { ats_score: body.ats_score }),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Resume not found" }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error("[Resume Update Error]", error);
    return c.json({ error: "Failed to update resume" }, 500);
  }
});

// Also support PUT for backwards compatibility
resumeRoutes.put("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;
    const id = c.req.param("id");
    const body = await c.req.json();

    const { data, error } = await getSupabaseAdmin()
      .from("resumes")
      .update({ data: body })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Resume not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("[Resume PUT Error]", error);
    return c.json({ error: "Failed to update resume" }, 500);
  }
});

// Delete a resume
resumeRoutes.delete("/:id", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId" as never) as string;
    const id = c.req.param("id");

    const { error } = await getSupabaseAdmin()
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return c.json({ error: "Failed to delete resume" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("[Resume Delete Error]", error);
    return c.json({ error: "Failed to delete resume" }, 500);
  }
});

export { resumeRoutes };
