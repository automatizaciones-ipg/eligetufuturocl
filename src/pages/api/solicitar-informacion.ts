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

    // Identificamos el tipo de acción: 'auto' (carga inicial de resultados) o 'contacto' (formulario manual)
    const tipoAccion = body.tipo === "auto" ? "auto" : "contacto";

    // Validamos campos compartidos de la evaluación
    const nombre = validarCampo(body.nombre, "nombre");
    const correo = validarCampo(body.correo, "correo");
    const telefono = validarCampo(body.telefono, "telefono");
    const perfil = validarCampo(body.perfil, "perfil");
    const carreras = validarCampo(body.carreras, "carreras");
    
    // Si es automático, asignamos un mensaje por defecto; si es manual, lo validamos rigurosamente
    const mensaje = tipoAccion === "auto" 
      ? "Envío automático de resultados al finalizar el test." 
      : validarCampo(body.mensaje, "mensaje");

    if (!EMAIL_REGEX.test(correo)) {
      return new Response(
        JSON.stringify({ ok: false, message: "El correo no tiene un formato válido." }),
        { status: 400 }
      );
    }

    // 1. Guardar en Supabase (Usando tu tabla exacta)
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
        JSON.stringify({ ok: false, message: "No se pudo registrar la información en la base de datos." }),
        { status: 500 }
      );
    }

    // Inicializar variables de entorno de Resend
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

    // 2. Lógica de Correos Ingeniosos según el origen
    if (tipoAccion === "auto") {
      // CORREO PREMIUM PARA EL ALUMNO (Resultados automáticos)
      const primerNombre = nombre.split(" ")[0];
      const listaCarrerasHTML = carreras.split(",").map(c => `
        <div style="margin-bottom: 12px; padding: 14px 18px; border-left: 4px solid #6544FF; background-color: #f8fafc; border-radius: 0 12px 12px 0;">
          <h4 style="margin: 0; color: #1A1528; font-size: 16px; font-family: sans-serif;">${c.trim()}</h4>
        </div>
      `).join("");

      const { error: studentEmailError } = await resend.emails.send({
        from: resendFromEmail,
        to: [correo], // Va dirigido al alumno
        subject: `🎯 ¡Tu futuro ideal está aquí, ${primerNombre}! Tus Resultados del Test`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 600px; margin: 0 auto; color: #334155; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background-color: #1A1528; padding: 40px 30px; text-align: center;">
              <span style="background-color: rgba(101, 68, 255, 0.2); color: #947BFF; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Análisis Algorítmico Completo</span>
              <h1 style="color: #ffffff; margin: 15px 0 0 0; font-size: 28px; font-style: italic; font-weight: 900; text-transform: uppercase;">¡Hola, ${primerNombre}! 🚀</h1>
            </div>
            <div style="padding: 35px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #475569;">Felicidades por dar el primer paso para definir tu carrera. Nuestro sistema ha procesado tus respuestas con éxito.</p>
              
              <div style="background-color: #6544FF; color: #ffffff; padding: 20px; border-radius: 16px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 13px; text-transform: uppercase; tracking: 1px; opacity: 0.8; font-weight: bold;">Tu perfil vocacional predominante es:</p>
                <h2 style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; font-style: italic;">${perfil}</h2>
              </div>

              <h3 style="color: #1A1528; font-size: 18px; font-weight: 800; margin-bottom: 15px;">Tus Carreras de Alta Coincidencia:</h3>
              ${listaCarrerasHTML}

              <p style="font-size: 14px; color: #64748B; margin-top: 30px; line-height: 1.5;">Si necesitas conocer mallas curriculares, financiamiento, becas o procesos de admisión especiales de estas carreras, puedes solicitar asesoría gratuita directamente en nuestra plataforma.</p>
              
              <div style="text-align: center; margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 25px;">
                <a href="https://eligetufuturo.cl" style="background-color: #1A1528; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">Visitar EligeTuFuturo</a>
              </div>
            </div>
          </div>
        `,
      });

      if (studentEmailError) console.error("Error al enviar correo al alumno:", studentEmailError);

    } else {
      // CORREO PARA EL ADMINISTRADOR (El alumno usó el formulario de contacto)
      const { error: adminEmailError } = await resend.emails.send({
        from: resendFromEmail,
        to: [resendToEmail],
        subject: `🔥 Lead Interesado: Solicitud Vocacional - ${nombre}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6544FF;">Nueva solicitud de información extendida</h2>
            <p>Un alumno ha visto sus resultados y solicita que un asesor lo contacte:</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Correo:</strong> ${correo}</p>
            <p><strong>Teléfono:</strong> ${telefono}</p>
            <p><strong>Perfil obtenido:</strong> ${perfil}</p>
            <p><strong>Carreras sugeridas:</strong> ${carreras}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 0 0 5px 0; font-weight: bold;">Mensaje del Alumno:</p>
              <p style="margin: 0; color: #555;">"${mensaje}"</p>
            </div>
          </div>
        `,
      });

      if (adminEmailError) {
        console.error("Error enviando email de contacto al admin:", adminEmailError);
        return new Response(
          JSON.stringify({ ok: false, message: "Se registró tu contacto, pero el aviso al asesor falló." }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Proceso completado con éxito." }),
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return new Response(JSON.stringify({ ok: false, message }), { status: 400 });
  }
};