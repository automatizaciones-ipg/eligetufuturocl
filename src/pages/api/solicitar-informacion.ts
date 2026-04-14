import type { APIRoute } from "astro";
import { Resend } from "resend";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validarCampo = (value: unknown, fieldName: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }
  return value.trim();
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabaseServer = getSupabaseServerClient();
    const body = await request.json();

    const nombre = validarCampo(body.nombre, "nombre");
    const correo = validarCampo(body.correo, "correo");
    const telefono = validarCampo(body.telefono, "telefono");
    const perfil = validarCampo(body.perfil, "perfil");
    const carreras = validarCampo(body.carreras, "carreras");
    const mensaje = validarCampo(body.mensaje, "mensaje");

    if (!EMAIL_REGEX.test(correo)) {
      return new Response(
        JSON.stringify({ ok: false, message: "El correo no tiene un formato valido." }),
        { status: 400 }
      );
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
      return new Response(
        JSON.stringify({ ok: false, message: "No se pudo registrar la solicitud." }),
        { status: 500 }
      );
    }

    const resendApiKey = import.meta.env.RESEND_API_KEY;
    const resendFromEmail = import.meta.env.RESEND_FROM_EMAIL;
    const resendToEmail = import.meta.env.RESEND_TO_EMAIL;

    if (!resendApiKey || !resendFromEmail || !resendToEmail) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: "Faltan variables de entorno de Resend (API key o correos).",
        }),
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: resendFromEmail,
      to: [resendToEmail],
      subject: `Nueva solicitud vocacional - ${nombre}`,
      html: `
        <h2>Nueva solicitud de informacion vocacional</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Correo:</strong> ${correo}</p>
        <p><strong>Telefono:</strong> ${telefono}</p>
        <p><strong>Perfil detectado:</strong> ${perfil}</p>
        <p><strong>Carreras sugeridas:</strong> ${carreras}</p>
        <p><strong>Mensaje:</strong> ${mensaje}</p>
      `,
    });

    if (emailError) {
      console.error("Error enviando email con Resend:", emailError);
      return new Response(
        JSON.stringify({
          ok: false,
          message: "La solicitud se guardo, pero el correo no pudo enviarse.",
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Solicitud enviada correctamente." }),
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return new Response(JSON.stringify({ ok: false, message }), { status: 400 });
  }
};
