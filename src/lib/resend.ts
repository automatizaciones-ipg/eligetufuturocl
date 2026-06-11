import { Resend } from "resend";

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  siteUrl: string;
}

export function getEmailConfig(): EmailConfig {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL;
  const toEmail = import.meta.env.RESEND_TO_EMAIL;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || "https://eligetufuturo.cl";

  if (!apiKey || !fromEmail || !toEmail) {
    throw new Error(
      "Faltan variables de entorno: RESEND_API_KEY, RESEND_FROM_EMAIL o RESEND_TO_EMAIL."
    );
  }

  return { apiKey, fromEmail, toEmail, siteUrl };
}

export function getResendClient(): Resend {
  const { apiKey } = getEmailConfig();
  return new Resend(apiKey);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { fromEmail } = getEmailConfig();
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: params.from ?? fromEmail,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });

  if (error) {
    console.error("[Resend]", error);
    throw new Error(error.message || "Error al enviar el correo.");
  }

  return data;
}
