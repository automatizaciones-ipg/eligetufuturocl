import type { APIRoute } from "astro";
import { jsonResponse } from "../../../lib/api/validators";
import { getEmailConfig, sendEmail } from "../../../lib/resend";
import {
  buildNewsletterEmail,
  newsletterEjemplo,
  type NewsletterPayload,
} from "../../../lib/emails/templates/marketing";

/**
 * API base para envío de boletines / avisos de marketing.
 *
 * Uso en producción:
 * - Proteger con MARKETING_API_SECRET (header Authorization: Bearer <secret>)
 * - Conectar audiencia desde Resend Audiences o tu base de datos
 *
 * Body esperado:
 * {
 *   "destinatarios": ["usuario@email.cl"],
 *   "newsletter": { ...NewsletterPayload }  // opcional, usa ejemplo si no se envía
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const marketingSecret = import.meta.env.MARKETING_API_SECRET;
    if (marketingSecret) {
      const auth = request.headers.get("authorization");
      if (auth !== `Bearer ${marketingSecret}`) {
        return jsonResponse({ ok: false, message: "No autorizado." }, 401);
      }
    }

    const body = await request.json();
    const destinatarios: string[] = Array.isArray(body.destinatarios)
      ? body.destinatarios.filter((e: unknown) => typeof e === "string" && e.includes("@"))
      : [];

    if (destinatarios.length === 0) {
      return jsonResponse({ ok: false, message: "Debes indicar al menos un destinatario." }, 400);
    }

    const newsletter: NewsletterPayload = body.newsletter ?? newsletterEjemplo();
    const { subject, html } = buildNewsletterEmail(newsletter);

    getEmailConfig();

    const resultados = await Promise.allSettled(
      destinatarios.map((to) => sendEmail({ to, subject, html }))
    );

    const enviados = resultados.filter((r) => r.status === "fulfilled").length;
    const fallidos = resultados.length - enviados;

    return jsonResponse({
      ok: fallidos === 0,
      message: `Enviados: ${enviados}, fallidos: ${fallidos}.`,
      enviados,
      fallidos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
