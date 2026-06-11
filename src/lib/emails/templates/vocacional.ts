import { BRAND } from "../brand";
import { buildEmailLayout, highlightBox, infoRow, messageBox, tagList } from "../layout";

export interface VocacionalPayload {
  nombre: string;
  correo: string;
  telefono: string;
  perfil: string;
  carreras: string;
  mensaje?: string;
}

export function vocacionalResultadosEmail(data: VocacionalPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const listaCarreras = data.carreras
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hola <strong>${primerNombre}</strong>,</p>
    <p style="margin:0 0 20px 0;">Felicidades por dar el primer paso para definir tu carrera. Nuestro algoritmo procesó tus respuestas con éxito.</p>
    ${highlightBox("Tu perfil vocacional predominante", data.perfil)}
    <p style="margin:24px 0 12px 0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1A1528;">Carreras de alta coincidencia</p>
    <div style="margin-bottom:20px;">${tagList(listaCarreras)}</div>
    <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">Si necesitas mallas curriculares, financiamiento, becas o procesos de admisión, solicita asesoría gratuita directamente en nuestra plataforma.</p>`;

  return {
    subject: `🎯 Tus resultados del Test Vocacional, ${primerNombre}`,
    html: buildEmailLayout({
      preheader: `Tu perfil es ${data.perfil}. Revisa tus carreras recomendadas.`,
      badge: "Análisis Algorítmico Completo",
      title: `¡Hola, ${primerNombre}!`,
      subtitle: "Tus resultados oficiales del test vocacional",
      bodyHtml,
      buttons: [
        { label: "Explorar Carreras", href: `${BRAND.siteUrl}/herramientas/buscador` },
        { label: "Ver Instituciones", href: `${BRAND.siteUrl}/herramientas/instituciones`, variant: "outline" },
      ],
    }),
  };
}

export function vocacionalAsesoriaAdminEmail(data: VocacionalPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const mensaje = data.mensaje ?? "Sin mensaje adicional.";

  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Un alumno completó el test vocacional y solicita <strong>asesoría personalizada</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Nombre", data.nombre)}
      ${infoRow("Correo", data.correo)}
      ${infoRow("Teléfono", data.telefono)}
      ${infoRow("Perfil detectado", data.perfil)}
      ${infoRow("Carreras sugeridas", data.carreras)}
    </table>
    ${messageBox(mensaje)}`;

  return {
    subject: `🔥 Lead vocacional: ${primerNombre} solicita asesoría`,
    html: buildEmailLayout({
      preheader: `${primerNombre} quiere más información tras su test vocacional.`,
      badge: "Test Vocacional · Más Información",
      title: "Solicitud de Asesoría",
      subtitle: "Lead calificado desde resultados del test",
      bodyHtml,
      buttons: [{ label: "Abrir Plataforma", href: BRAND.siteUrl, variant: "dark" }],
    }),
  };
}

export function vocacionalAsesoriaConfirmacionEmail(data: VocacionalPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const mensaje = data.mensaje ?? "";

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hola <strong>${primerNombre}</strong>,</p>
    <p style="margin:0 0 20px 0;">Tu solicitud de asesoría fue vinculada a tu perfil <strong>${data.perfil}</strong>. Un asesor revisará tus carreras afines y te contactará a la brevedad.</p>
    ${mensaje ? messageBox(mensaje) : ""}
    <p style="margin:20px 0 0 0;font-size:14px;color:#64748B;">Mientras esperas, puedes seguir explorando las carreras recomendadas para tu perfil.</p>`;

  return {
    subject: `✅ Solicitud de asesoría recibida, ${primerNombre}`,
    html: buildEmailLayout({
      preheader: "Un asesor revisará tu perfil vocacional pronto.",
      badge: "Asesoría Personalizada",
      title: "¡Solicitud Enviada!",
      subtitle: "Tu mensaje fue enlazado a tu perfil vocacional",
      bodyHtml,
      buttons: [
        { label: "Buscador de Carreras", href: `${BRAND.siteUrl}/herramientas/buscador` },
        { label: "Repetir Test", href: `${BRAND.siteUrl}/herramientas/test-vocacional`, variant: "outline" },
      ],
    }),
  };
}
