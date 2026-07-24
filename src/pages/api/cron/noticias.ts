import type { APIRoute } from "astro";
import { jsonResponse } from "../../../lib/api/validators";
import { runNoticiaIAJob } from "../../../lib/noticiasIA/pipeline";

/**
 * Disparado semanalmente por .github/workflows/cron-noticias.yml (viernes
 * 16:00 hora Chile). Fuera de /api/admin/** a propósito: ese árbol lo protege
 * el middleware con una cookie de sesión HMAC, que un workflow de GitHub
 * Actions no puede sostener. Aquí usamos el mismo patrón de secreto
 * compartido que src/pages/api/marketing/enviar.ts.
 *
 * Uso: POST con header "Authorization: Bearer <NOTICIAS_CRON_SECRET>".
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const cronSecret = import.meta.env.NOTICIAS_CRON_SECRET;
    if (!cronSecret) {
      return jsonResponse({ ok: false, message: "Endpoint no configurado." }, 503);
    }
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonResponse({ ok: false, message: "No autorizado." }, 401);
    }

    const result = await runNoticiaIAJob();

    if (result.status === "error") {
      return jsonResponse({ ok: false, ...result }, 500);
    }
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
