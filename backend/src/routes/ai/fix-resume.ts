import { Hono } from "hono";
import type { Resume } from "@resumeai/shared";
import { anthropic } from "../../lib/anthropic";
import { optionalAuthMiddleware } from "../../middleware/auth";
import { rateLimitMiddleware } from "../../middleware/rateLimit";

const route = new Hono();

export interface FixResumeResponse {
  resume: Resume;
  changes: string[];
  assistant_message: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildFixPrompt(
  resume: Resume,
  jobDescription?: string,
  instruction?: string,
  messages?: ChatMessage[],
): string {
  const userInstruction =
    instruction?.trim() ||
    "Fix everything important automatically: quality, ATS fit, duplicate content, shallow bullets, one-page prioritisation, and readability.";

  return `You are an expert resume editor, ATS specialist, and senior technical recruiter.

You are operating inside a resume editor chatbot. The user can ask for focused changes
or broad fixes. Apply the requested change directly to the resume JSON.

Return ONLY valid JSON. No markdown fences, no preamble.

Primary goals:
1. Make the resume fit a strong 1-page software engineering resume.
2. Prioritise Experience over Projects when content competes for space.
3. Remove duplicate projects or bullets when the same work appears from GitHub and an existing resume.
4. Rewrite shallow experience bullets into specific, technical, metric-driven bullets.
5. Improve ATS keyword placement in experience and project bullets naturally.
6. Preserve factual truth. Do not invent employers, degrees, dates, links, or unsupported seniority.

Bullet rules:
- Start every bullet with a strong past-tense action verb.
- Use concrete technologies, systems, or shipped outcomes.
- Prefer metrics already present in the resume. If a metric must be inferred, use a conservative plausible estimate.
- Keep bullets under 22 words.
- Avoid: responsible for, helped with, worked on, assisted, familiar with, exposure to, various, multiple, several, numerous.
- No first-person pronouns.

One-page prioritisation:
- Keep 2-3 bullets for the most relevant experience roles.
- Keep 1-2 strongest projects only if they do not duplicate experience.
- Keep skills concise and ATS-parseable.
- Keep achievements only if they are stronger than the weakest project bullet.

Return this exact JSON shape:
{
  "resume": <the complete updated resume object, preserving the same schema and ids where possible>,
  "changes": ["short user-facing summary of what changed"],
  "assistant_message": "brief natural-language response explaining what you changed and anything the user should review"
}

Current user instruction:
${userInstruction}

Recent assistant conversation:
${messages?.length ? JSON.stringify(messages.slice(-8), null, 2) : "No previous messages."}

Job description, if provided:
${jobDescription?.trim() || "No job description provided."}

Resume JSON:
${JSON.stringify(resume, null, 2)}`;
}

export function parseJsonObject(text: string): FixResumeResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1]?.trim() ?? trimmed;
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI assistant returned no JSON object");
  }

  const parsed = JSON.parse(source.slice(first, last + 1)) as Partial<FixResumeResponse>;
  if (!parsed.resume || typeof parsed.resume !== "object") {
    throw new Error("AI assistant response missing resume");
  }

  return {
    resume: parsed.resume as Resume,
    changes: Array.isArray(parsed.changes)
      ? parsed.changes.map((item) => String(item)).filter(Boolean)
      : [],
    assistant_message:
      typeof parsed.assistant_message === "string"
        ? parsed.assistant_message
        : "I updated the resume with the requested changes.",
  };
}

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    if (userId) {
      const limiter = rateLimitMiddleware("tailor");
      let allowed = false;
      await limiter(c, async () => {
        allowed = true;
      });
      if (!allowed) {
        return c.res;
      }
    }

    const body = (await c.req.json()) as {
      resume?: Resume;
      jobDescription?: string;
      instruction?: string;
      messages?: ChatMessage[];
    };

    if (!body.resume) {
      return c.json({ error: "Resume data required" }, 400);
    }

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 7000,
      messages: [
        {
          role: "user",
          content: buildFixPrompt(
            body.resume,
            body.jobDescription,
            body.instruction,
            body.messages,
          ),
        },
      ],
    });

    const text =
      aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";
    const parsed = parseJsonObject(text);

    return c.json(parsed);
  } catch (error) {
    console.error("[AI Assistant Fix Error]", error);
    const message =
      error instanceof Error ? error.message : "AI assistant failed to fix resume";
    return c.json({ error: message }, 500);
  }
});

export { route as fixResumeRoute };
