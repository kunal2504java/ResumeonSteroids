import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TailorRequestSchema } from "@/types/api";
import { TAILOR_PROMPT } from "@/lib/ai/prompts";
import { resumeToPlainText } from "@/lib/utils/resumeHelpers";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TailorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { jobDescription } = parsed.data;

    // In production, fetch resume from DB. For now, accept it in body.
    const resume = body.resume;
    if (!resume) {
      return Response.json({ error: "Resume data required" }, { status: 400 });
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

    return Response.json(result);
  } catch (error) {
    console.error("Tailor error:", error);
    return Response.json({ error: "Tailor analysis failed" }, { status: 500 });
  }
}
