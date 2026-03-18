import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RESUME_PARSE_PROMPT } from "@/lib/ai/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      text = data.text;
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
      return Response.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
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
      return Response.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return Response.json({ resumeData: parsed, rawText: text.slice(0, 2000) });
  } catch (error) {
    console.error("Resume import error:", error);
    return Response.json({ error: "Resume import failed" }, { status: 500 });
  }
}
