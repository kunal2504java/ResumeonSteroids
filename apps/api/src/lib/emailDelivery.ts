export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  provider: "resend";
  providerMessageId: string | null;
}

function requireEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM.");
  }

  return { apiKey, from };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey, from } = requireEmailConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ? [input.replyTo] : undefined,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        content_type: attachment.contentType,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend email failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const parsed = (await response.json().catch(() => ({}))) as { id?: string };
  return {
    provider: "resend",
    providerMessageId: parsed.id ?? null,
  };
}
