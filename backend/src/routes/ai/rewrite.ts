import { Hono } from "hono";
import { RewriteRequestSchema } from "@resumeai/shared/schemas";
import { anthropic } from "../../lib/anthropic";
import { REWRITE_PROMPT } from "../../lib/prompts";
import { authMiddleware } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rateLimit";

const route = new Hono();

route.post("/", authMiddleware, rateLimitMiddleware("rewrite"), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = RewriteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        400
      );
    }

    const { bullet, mode, jobDescription } = parsed.data;

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: REWRITE_PROMPT(bullet, mode, jobDescription),
        },
      ],
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[AI Rewrite Error]", error);
    return c.json({ error: "AI rewrite failed" }, 500);
  }
});

export { route as rewriteRoute };
