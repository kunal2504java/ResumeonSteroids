import { Hono } from "hono";
import { anthropic } from "../../../lib/anthropic";
import { RESUME_PARSE_PROMPT } from "../../../lib/prompts";
import { optionalAuthMiddleware } from "../../../middleware/auth";

const route = new Hono();

route.post("/", optionalAuthMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
    } else if (
      file.name.endsWith(".docx") ||
      file.name.endsWith(".doc")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) {
      return c.json({ error: "Could not extract text from file" }, 400);
    }

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: RESUME_PARSE_PROMPT(text.slice(0, 8000)),
        },
      ],
    });

    const responseText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return c.json({ error: "Failed to parse AI response" }, 500);
    }

    return c.json({ resumeData: parsed, rawText: text.slice(0, 2000) });
  } catch (error) {
    console.error("[Resume Import Error]", error);
    return c.json({ error: "Resume import failed" }, 500);
  }
});

export { route as resumeImportRoute };
