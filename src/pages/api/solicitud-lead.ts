import type { APIRoute } from "astro";
import { validarCampo, validarEmail, validarTelefono, jsonResponse } from "../../lib/api/validators";
import { getEmailConfig, sendEmail } from "../../lib/resend";
import {
  solicitudLeadAdminEmail,
  solicitudLeadConfirmacionEmail,
  type TipoLead,
} from "../../lib/emails/templates/solicitud-lead";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const tipo: TipoLead = body.tipo === "institucion" ? "institucion" : "carrera";

    const nombre = validarCampo(body.nombre, "nombre");
    const email = validarCampo(body.email, "email");
    const telefono = validarCampo(body.telefono, "telefono");
    const profesion = typeof body.profesion === "string" ? body.profesion.trim() : "";

    const tiposPregunta = Array.isArray(body.tiposPregunta)
      ? body.tiposPregunta.filter((t: unknown) => typeof t === "string" && t.trim())
      : [];

    if (!validarEmail(email)) {
      return jsonResponse({ ok: false, message: "El correo no tiene un formato válido." }, 400);
    }

    if (!validarTelefono(telefono)) {
      return jsonResponse({ ok: false, message: "El teléfono no tiene un formato válido." }, 400);
    }

    if (tiposPregunta.length === 0) {
      return jsonResponse({ ok: false, message: "Selecciona al menos un tema de consulta." }, 400);
    }

    const mensajeOtro = typeof body.mensajeOtro === "string" ? body.mensajeOtro.trim() : "";
    if (tiposPregunta.includes("Otro") && !mensajeOtro) {
      return jsonResponse({ ok: false, message: "Detalla tu consulta en el campo 'Otro'." }, 400);
    }

    const payload = {
      tipo,
      nombre,
      email,
      telefono,
      profesion: profesion || undefined,
      tiposPregunta,
      mensajeOtro: mensajeOtro || undefined,
      nombreCarrera: typeof body.nombreCarrera === "string" ? body.nombreCarrera.trim() : undefined,
      nombreInstitucion: typeof body.nombreInstitucion === "string" ? body.nombreInstitucion.trim() : undefined,
      tipoInstitucion: typeof body.tipoInstitucion === "string" ? body.tipoInstitucion.trim() : undefined,
      urlOrigen: typeof body.urlOrigen === "string" ? body.urlOrigen.trim() : undefined,
    };

    const { toEmail } = getEmailConfig();

    const adminMail = solicitudLeadAdminEmail(payload);
    await sendEmail({
      to: toEmail,
      subject: adminMail.subject,
      html: adminMail.html,
      replyTo: email,
    });

    const confirmacion = solicitudLeadConfirmacionEmail(payload);
    await sendEmail({
      to: email,
      subject: confirmacion.subject,
      html: confirmacion.html,
    });

    return jsonResponse({ ok: true, message: "Solicitud registrada correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    const status = message.includes("variables de entorno") ? 500 : 400;
    return jsonResponse({ ok: false, message }, status);
  }
};
