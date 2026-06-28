import type { Resume } from "@resumeai/shared";
import { anthropic } from "./anthropic";
import { getSupabaseAdmin } from "./supabase";
import { buildFixPrompt, parseJsonObject, type ChatMessage } from "../routes/ai/fix-resume";

export interface TailorResult {
  outputResume: Resume;
  changes: string[];
  assistantMessage?: string;
}

/**
 * The pure tailoring step: run the make-better/tailor prompt over a resume and
 * return the rewritten resume plus the list of changes. No PDF, no email, no
 * persistence — just the AI transform. Shared by the email-delivery command flow
 * and the daily-deck "swipe right → tailor" flow.
 */
export async function tailorResume(
  sourceResume: Resume,
  jobDescription?: string,
  instruction = "Tailor this resume to the job description.",
  messages?: ChatMessage[],
): Promise<TailorResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 7000,
    messages: [
      {
        role: "user",
        content: buildFixPrompt(sourceResume, jobDescription, instruction, messages),
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const fixed = parseJsonObject(text);
  const outputResume: Resume = {
    ...sourceResume,
    ...fixed.resume,
    id: sourceResume.id,
    userId: sourceResume.userId,
    template: sourceResume.template,
    createdAt: sourceResume.createdAt,
    updatedAt: new Date().toISOString(),
  };

  return { outputResume, changes: fixed.changes, assistantMessage: fixed.assistant_message };
}

/**
 * Background-runnable tailoring against an existing resume_command_runs row.
 *
 * The caller supplies the resume snapshot directly, so this works whether the
 * student's resume lives in localStorage or Supabase — there is no server-side
 * resume load. It flips the run to `processing`, runs the tailor, and writes the
 * result (or error) back onto the run. The deck review stack reads `output_resume`
 * + `changes` off the run once `status` is `completed`.
 *
 * Fire-and-forget from the swipe endpoint: do not await it on the request path.
 */
export async function runTailoringInBackground(args: {
  runId: string;
  userId: string;
  resume: Resume;
  jobDescription?: string;
  instruction?: string;
}): Promise<void> {
  const { runId, userId, resume, jobDescription, instruction } = args;
  const supabase = getSupabaseAdmin();

  try {
    await supabase
      .from("resume_command_runs")
      .update({ status: "processing" })
      .eq("id", runId)
      .eq("user_id", userId);

    const { outputResume, changes } = await tailorResume(resume, jobDescription, instruction);

    await supabase
      .from("resume_command_runs")
      .update({ status: "completed", output_resume: outputResume, changes })
      .eq("id", runId)
      .eq("user_id", userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tailoring failed";
    console.error("[Deck Tailoring Error]", runId, message);
    await supabase
      .from("resume_command_runs")
      .update({ status: "failed", error: message })
      .eq("id", runId)
      .eq("user_id", userId);
  }
}
