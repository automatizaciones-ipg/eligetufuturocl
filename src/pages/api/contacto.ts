import type { APIRoute } from "astro";
import { validarCampo, validarEmail, validarTelefono, jsonResponse } from "../../lib/api/validators";
import { getEmailConfig, sendEmail } from "../../lib/resend";
import { contactoAdminEmail, contactoConfirmacionEmail } from "../../lib/emails/templates/contacto";

const TIPOS_VALIDOS = ["consulta-general", "consulta-carreras", "otro-motivo"];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const nombre = validarCampo(body.nombre, "nombre");
    const correo = validarCampo(body.correo, "correo");
    const telefono = validarCampo(body.telefono, "telefono");
    const tipoMensaje = validarCampo(body.tipoMensaje, "tipoMensaje");
    const mensaje = validarCampo(body.mensaje, "mensaje");

    if (!validarEmail(correo)) {
      return jsonResponse({ ok: false, message: "El correo no tiene un formato válido." }, 400);
    }

    if (!validarTelefono(telefono)) {
      return jsonResponse({ ok: false, message: "El teléfono no tiene un formato válido (9 dígitos)." }, 400);
    }

    if (!TIPOS_VALIDOS.includes(tipoMensaje)) {
      return jsonResponse({ ok: false, message: "Tipo de mensaje no válido." }, 400);
    }

    if (mensaje.length < 10) {
      return jsonResponse({ ok: false, message: "El mensaje debe tener al menos 10 caracteres." }, 400);
    }

    const payload = { nombre, correo, telefono, tipoMensaje, mensaje };
    const { toEmail } = getEmailConfig();

    const adminMail = contactoAdminEmail(payload);
    await sendEmail({
      to: toEmail,
      subject: adminMail.subject,
      html: adminMail.html,
      replyTo: correo,
    });

    const confirmacion = contactoConfirmacionEmail(payload);
    await sendEmail({
      to: correo,
      subject: confirmacion.subject,
      html: confirmacion.html,
    });

    return jsonResponse({ ok: true, message: "Mensaje enviado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    const status = message.includes("variables de entorno") ? 500 : 400;
    return jsonResponse({ ok: false, message }, status);
  }
};
