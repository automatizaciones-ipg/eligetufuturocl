// Cliente mínimo para notificar leads a un Webhook de n8n. n8n centraliza
// desde ahí la escritura en la hoja "Leads" de Google Sheets y en Bitrix24
// (workflow que vive fuera de este repo).
//
// Seguridad:
// - La URL y el secreto viven SOLO en variables de entorno server-side (sin
//   prefijo PUBLIC_): jamás se incrustan en el bundle del navegador.
// - Autenticación por header `Authorization: Bearer <secreto>`, validado del
//   lado de n8n con su credencial nativa "Header Auth" en el nodo Webhook —
//   mismo patrón que NOTICIAS_CRON_SECRET, sin introducir un esquema nuevo.
// - Las credenciales de Google Sheets y de Bitrix24 nunca tocan este repo:
//   quedan enteramente dentro del credential store de n8n.

const TIMEOUT_MS = 10_000;

type WebhookConfig = {
  url: string;
  secret: string;
};

export function getWebhookConfig(): WebhookConfig | null {
  const url = import.meta.env.N8N_LEADS_WEBHOOK_URL;
  const secret = import.meta.env.N8N_LEADS_WEBHOOK_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

// Envía el lead al Webhook de n8n. Lanza si la respuesta no es 2xx para que
// el caller (registrarLead.ts) reintente con su propia lógica de backoff.
export async function enviarLeadAWebhook(payload: Record<string, unknown>): Promise<void> {
  const config = getWebhookConfig();
  if (!config) throw new Error("N8N_LEADS_WEBHOOK sin configurar");

  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Webhook n8n respondió ${res.status}`);
}
