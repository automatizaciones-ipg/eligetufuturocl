import type { APIRoute } from "astro";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { validarCampo, validarEmail, jsonResponse } from "../../lib/api/validators";
import { getEmailConfig, sendEmail } from "../../lib/resend";
import {
  vocacionalAsesoriaAdminEmail,
  vocacionalAsesoriaConfirmacionEmail,
  vocacionalResultadosEmail,
} from "../../lib/emails/templates/vocacional";

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseServer = getSupabaseServerClient();
    const body = await request.json();

    const tipoAccion = body.tipo === "auto" ? "auto" : "contacto";

    const nombre = validarCampo(body.nombre, "nombre");
    const correo = validarCampo(body.correo, "correo");
    const telefono = validarCampo(body.telefono, "telefono");
    const perfil = validarCampo(body.perfil, "perfil");
    const carreras = validarCampo(body.carreras, "carreras");

    const mensaje =
      tipoAccion === "auto"
        ? "Envío automático de resultados al finalizar el test."
        : validarCampo(body.mensaje, "mensaje");

    if (!validarEmail(correo)) {
      return jsonResponse({ ok: false, message: "El correo no tiene un formato válido." }, 400);
    }

    const { error: insertError } = await supabaseServer
      .from("solicitudes_informacion_vocacional")
      .insert([
        {
          nombre,
          correo,
          telefono,
          perfil_detectado: perfil,
          carreras_sugeridas: carreras,
          mensaje,
        },
      ]);

    if (insertError) {
      console.error("Error insertando solicitud:", insertError);
      return jsonResponse(
        { ok: false, message: "No se pudo registrar la información en la base de datos." },
        500
      );
    }

    const { toEmail } = getEmailConfig();
    const payload = { nombre, correo, telefono, perfil, carreras, mensaje };

    if (tipoAccion === "auto") {
      const resultados = vocacionalResultadosEmail(payload);
      await sendEmail({
        to: correo,
        subject: resultados.subject,
        html: resultados.html,
      });
    } else {
      const adminMail = vocacionalAsesoriaAdminEmail(payload);
      await sendEmail({
        to: toEmail,
        subject: adminMail.subject,
        html: adminMail.html,
        replyTo: correo,
      });

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
    const status =
      message.includes("variables de entorno") || message.includes("Supabase") ? 500 : 400;
    return jsonResponse({ ok: false, message }, status);
  }
};
