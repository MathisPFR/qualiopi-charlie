import fs from "fs/promises";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getClientConfig } from "@/lib/config";

export type MailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer;
};

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: MailAttachment[];
};

/** Destinataire autorisé en mode test Resend (onboarding@resend.dev). */
export function getResendTestRecipient(): string | undefined {
  return (
    process.env.MAIL_TEST_TO ??
    process.env.MAIL_DEV_REDIRECT ??
    undefined
  );
}

function applyDevRedirect(input: SendMailInput): SendMailInput {
  const redirect = process.env.MAIL_DEV_REDIRECT?.trim();
  if (!redirect) return input;

  const originalTo = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  return {
    ...input,
    to: redirect,
    subject: `[POC — destinataire réel: ${originalTo}] ${input.subject}`,
    html: `<p style="color:#666;font-size:12px">Mode test Resend : cet email aurait été envoyé à <strong>${originalTo}</strong>.</p>
${input.html}`,
  };
}

export async function sendMail(input: SendMailInput): Promise<{ id?: string }> {
  const provider = process.env.MAIL_PROVIDER ?? "resend";
  const fromName = process.env.MAIL_FROM_NAME ?? getClientConfig().orgName;
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM manquant dans .env");

  const effectiveInput = applyDevRedirect(input);
  const toList = Array.isArray(effectiveInput.to)
    ? effectiveInput.to
    : [effectiveInput.to];
  const attachments = await resolveAttachments(effectiveInput.attachments ?? []);

  if (provider === "smtp") {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: toList.join(", "),
      subject: effectiveInput.subject,
      html: effectiveInput.html,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    return { id: info.messageId };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY manquant. Créez un compte sur resend.com ou utilisez MAIL_PROVIDER=smtp"
    );
  }
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${from}>`,
    to: toList,
    subject: effectiveInput.subject,
    html: effectiveInput.html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    })),
  });
  if (error) throw new Error(error.message);
  return { id: data?.id };
}

async function resolveAttachments(
  items: MailAttachment[]
): Promise<{ filename: string; content: Buffer }[]> {
  const out: { filename: string; content: Buffer }[] = [];
  for (const item of items) {
    if (item.content) {
      out.push({ filename: item.filename, content: item.content });
    } else if (item.path) {
      out.push({
        filename: item.filename,
        content: await fs.readFile(item.path),
      });
    }
  }
  return out;
}
