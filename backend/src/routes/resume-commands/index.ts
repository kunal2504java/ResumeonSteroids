import { Hono } from "hono";
import type { Context } from "hono";
import type { Resume } from "@resumeai/shared";
import { anthropic } from "../../lib/anthropic";
import { fillTemplate, type ResumeData } from "../../lib/fillTemplate";
import { compileLatexToPdf } from "../../lib/pdflatex";
import { sendEmail } from "../../lib/emailDelivery";
import { getSupabaseAdmin } from "../../lib/supabase";
import { optionalAuthMiddleware } from "../../middleware/auth";
import {
  buildFixPrompt,
  parseJsonObject,
  type ChatMessage,
} from "../ai/fix-resume";

const resumeCommandRoutes = new Hono();

interface ResumeCommandRequest {
  resume_id?: string;
  resume?: Resume;
  application_id?: string;
  opportunity_id?: string;
  instruction: string;
  job_description?: string;
  recipient_email?: string;
  delivery_channel?: "email";
  messages?: ChatMessage[];
}

function userId(c: Context) {
  return c.get("userId" as never) as string | undefined;
}

function asResumeData(resume: Resume): ResumeData {
  return {
    personalInfo: resume.personalInfo,
    summary: resume.summary,
    experience: resume.experience,
    education: resume.education,
    projects: resume.projects,
    skills: resume.skills,
    achievements: resume.achievements,
  };
}

function safeFilename(resume: Resume): string {
  const name = resume.personalInfo.name || resume.name || "resume";
  return `${name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").toLowerCase()}_resume.pdf`;
}

async function loadResume(input: ResumeCommandRequest, authUserId?: string): Promise<Resume> {
  if (input.resume) {
    return input.resume;
  }

  if (!input.resume_id || !authUserId) {
    throw new Error("resume or authenticated resume_id is required");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("resumes")
    .select("*")
    .eq("id", input.resume_id)
    .eq("user_id", authUserId)
    .single();

  if (error || !data) {
    throw new Error("Resume not found");
  }

  return {
    ...(data.data as Resume),
    id: data.id,
    userId: data.user_id,
    name: data.title ?? (data.data as Resume).name ?? "Resume",
    template: data.template ?? (data.data as Resume).template ?? "jake",
    createdAt: data.created_at ?? (data.data as Resume).createdAt ?? new Date().toISOString(),
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

async function createRun(input: ResumeCommandRequest, authUserId?: string) {
  if (!authUserId) {
    return null;
  }

  const { data } = await getSupabaseAdmin()
    .from("resume_command_runs")
    .insert({
      user_id: authUserId,
      resume_id: input.resume_id ?? input.resume?.id ?? null,
      application_id: input.application_id || null,
      opportunity_id: input.opportunity_id || null,
      instruction: input.instruction,
      status: "processing",
    })
    .select("*")
    .single();

  return data as { id: string } | null;
}

async function updateRun(
  runId: string | null,
  patch: Record<string, unknown>,
  authUserId?: string,
) {
  if (!runId || !authUserId) {
    return;
  }

  await getSupabaseAdmin()
    .from("resume_command_runs")
    .update(patch)
    .eq("id", runId)
    .eq("user_id", authUserId);
}

async function recordDelivery(input: {
  runId: string | null;
  userId?: string;
  recipient: string;
  provider?: string;
  providerMessageId?: string | null;
  filename?: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}) {
  if (!input.runId || !input.userId) {
    return;
  }

  await getSupabaseAdmin().from("resume_deliveries").insert({
    run_id: input.runId,
    user_id: input.userId,
    channel: "email",
    recipient: input.recipient,
    provider: input.provider ?? "resend",
    provider_message_id: input.providerMessageId ?? null,
    filename: input.filename ?? null,
    status: input.status,
    error: input.error ?? null,
  });
}

resumeCommandRoutes.post("/", optionalAuthMiddleware, async (c) => {
  const authUserId = userId(c);
  let runId: string | null = null;
  let recipient = "";

  try {
    const body = (await c.req.json()) as ResumeCommandRequest;
    if (!body.instruction?.trim()) {
      return c.json({ error: "instruction is required" }, 400);
    }

    const sourceResume = await loadResume(body, authUserId);
    recipient = body.recipient_email?.trim() || sourceResume.personalInfo.email;
    if (!recipient) {
      return c.json({ error: "recipient_email or resume personal email is required" }, 400);
    }

    const run = await createRun(body, authUserId);
    runId = run?.id ?? null;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 7000,
      messages: [
        {
          role: "user",
          content: buildFixPrompt(
            sourceResume,
            body.job_description,
            body.instruction,
            body.messages,
          ),
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

    const texContent = fillTemplate(asResumeData(outputResume));
    const { pdfBuffer } = await compileLatexToPdf(texContent, "resume-command-");
    const filename = safeFilename(outputResume);

    const email = await sendEmail({
      to: recipient,
      replyTo: outputResume.personalInfo.email || undefined,
      subject: `Your updated resume PDF is ready`,
      text: `Your resume has been updated and attached as ${filename}.\n\nChanges:\n${fixed.changes.map((change) => `- ${change}`).join("\n")}`,
      html: `<p>Your resume has been updated and attached as <strong>${filename}</strong>.</p><ul>${fixed.changes.map((change) => `<li>${change}</li>`).join("")}</ul>`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await recordDelivery({
      runId,
      userId: authUserId,
      recipient,
      provider: email.provider,
      providerMessageId: email.providerMessageId,
      filename,
      status: "sent",
    });
    await updateRun(
      runId,
      {
        status: "completed",
        output_resume: outputResume,
        changes: fixed.changes,
      },
      authUserId,
    );

    return c.json({
      run_id: runId,
      status: "completed",
      delivery: {
        channel: "email",
        recipient,
        status: "sent",
        provider: email.provider,
        provider_message_id: email.providerMessageId,
      },
      resume: outputResume,
      changes: fixed.changes,
      assistant_message: fixed.assistant_message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume command failed";
    await recordDelivery({
      runId,
      userId: authUserId,
      recipient: recipient || "unknown",
      status: "failed",
      error: message,
    });
    await updateRun(runId, { status: "failed", error: message }, authUserId);
    console.error("[Resume Command Error]", error);
    return c.json({ error: message, run_id: runId }, 500);
  }
});

resumeCommandRoutes.get("/:id", optionalAuthMiddleware, async (c) => {
  try {
    const authUserId = userId(c);
    const id = c.req.param("id");
    if (!authUserId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("resume_command_runs")
      .select("*, resume_deliveries(*)")
      .eq("id", id)
      .eq("user_id", authUserId)
      .single();

    if (error || !data) {
      return c.json({ error: "Run not found" }, 404);
    }

    return c.json({ run: data });
  } catch (error) {
    console.error("[Resume Command Get Error]", error);
    return c.json({ error: "Failed to fetch run" }, 500);
  }
});

export { resumeCommandRoutes };
