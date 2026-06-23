import { createMiddleware } from "hono/factory";
import { getSupabaseAdmin } from "../lib/supabase";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", user.id);
  await next();
});

/** Like authMiddleware but allows unauthenticated requests through. */
export const optionalAuthMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const supabase = getSupabaseAdmin();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        c.set("userId", user.id);
      }
    } catch {
      // Supabase not configured — skip auth
    }
  }
  await next();
});
