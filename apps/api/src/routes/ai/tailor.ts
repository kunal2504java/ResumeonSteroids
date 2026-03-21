import { Hono } from "hono";
import { TailorRequestSchema } from "@resumeai/shared/schemas";
import { anthropic } from "../../lib/anthropic";
import { TAILOR_PROMPT } from "../../lib/prompts";
import { resumeToPlainText } from "../../lib/resumeHelpers";
import { authMiddleware } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rateLimit";

const route = new Hono();

route.post("/", authMiddleware, rateLimitMiddleware("tailor"), async (c) => {
  try {
    const body = await c.req.json();
    const parsed = TailorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        400
      );
    }

    const { jobDescription } = parsed.data;

    const resume = body.resume;
    if (!resume) {
      return c.json({ error: "Resume data required" }, 400);
    }

    const resumeText = resumeToPlainText(resume);

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: TAILOR_PROMPT(resumeText, jobDescription),
        },
      ],
    });

    const text =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = {
        missingKeywords: [],
        suggestedChanges: [],
        overallMatch: 0,
        atsScore: 0,
      };
    }

    return c.json(result);
  } catch (error) {
    console.error("[Tailor Error]", error);
    return c.json({ error: "Tailor analysis failed" }, 500);
  }
});

export { route as tailorRoute };
