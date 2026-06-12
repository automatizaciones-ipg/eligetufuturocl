// src/pages/api/solicitar-informacion.ts
import type { APIRoute } from "astro";
import { validarCampo, validarEmail, jsonResponse } from "../../lib/api/validators";
import { getEmailConfig, sendEmail } from "../../lib/resend";
import {
  vocacionalResultadosEmail,
  vocacionalAsesoriaAdminEmail,
  vocacionalAsesoriaConfirmacionEmail,
} from "../../lib/emails/templates/vocacional";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const tipoAccion = body.tipo === "auto" ? "auto" : "contacto";

    // Validación de campos comunes
    const nombre = validarCampo(body.nombre, "nombre");
    const correo = validarCampo(body.correo, "correo");
    const telefono = validarCampo(body.telefono, "telefono");
    const perfil = validarCampo(body.perfil, "perfil");
    const carreras = validarCampo(body.carreras, "carreras");

    if (!validarEmail(correo)) {
      return jsonResponse({ ok: false, message: "El correo no tiene un formato válido." }, 400);
    }

    // Para acción "contacto", el mensaje es obligatorio
    let mensaje = "";
    if (tipoAccion === "contacto") {
      mensaje = validarCampo(body.mensaje, "mensaje");
      if (mensaje.length < 5) {
        return jsonResponse({ ok: false, message: "El mensaje debe tener al menos 5 caracteres." }, 400);
      }
    }

    const payload = { nombre, correo, telefono, perfil, carreras, mensaje };
    const { toEmail } = getEmailConfig();

    // Envío según el tipo
    if (tipoAccion === "auto") {
      // Enviar correo al alumno con sus resultados
      const resultados = vocacionalResultadosEmail(payload);
      await sendEmail({
        to: correo,
        subject: resultados.subject,
        html: resultados.html,
      });
    } else {
      // Aviso al admin
      const adminMail = vocacionalAsesoriaAdminEmail(payload);
      await sendEmail({
        to: toEmail,
        subject: adminMail.subject,
        html: adminMail.html,
        replyTo: correo,
      });

      // Confirmación al alumno
      const confirmacion = vocacionalAsesoriaConfirmacionEmail(payload);
      await sendEmail({
        to: correo,
        subject: confirmacion.subject,
        html: confirmacion.html,
      });
    }

    return jsonResponse({ ok: true, message: "Proceso completado con éxito." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    console.error("Error en API solicitar-informacion:", message);
    return jsonResponse({ ok: false, message }, 400);
  }
};