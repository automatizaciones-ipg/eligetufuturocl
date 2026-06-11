import { BRAND } from "../brand";
import { buildEmailLayout, infoRow, messageBox, tagList } from "../layout";

export type TipoLead = "carrera" | "institucion";

export interface SolicitudLeadPayload {
  tipo: TipoLead;
  nombre: string;
  email: string;
  telefono: string;
  profesion?: string;
  tiposPregunta: string[];
  mensajeOtro?: string;
  nombreCarrera?: string;
  nombreInstitucion?: string;
  tipoInstitucion?: string;
  urlOrigen?: string;
}

const BADGE_POR_TIPO: Record<TipoLead, string> = {
  carrera: "Solicitud de Carrera",
  institucion: "Solicitud de Institución",
};

export function solicitudLeadAdminEmail(data: SolicitudLeadPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const entidad =
    data.tipo === "carrera"
      ? `${data.nombreCarrera ?? "Carrera"} — ${data.nombreInstitucion ?? "Institución"}`
      : data.nombreInstitucion ?? "Institución";

  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Nuevo lead desde el formulario de <strong>${data.tipo === "carrera" ? "carrera" : "institución"}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Interés", entidad)}
      ${data.tipoInstitucion ? infoRow("Tipo de institución", data.tipoInstitucion) : ""}
      ${infoRow("Nombre", data.nombre)}
      ${infoRow("Correo", data.email)}
      ${infoRow("Teléfono", data.telefono)}
      ${data.profesion ? infoRow("Profesión", data.profesion) : ""}
    </table>
    <p style="margin:24px 0 12px 0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1A1528;">Temas solicitados</p>
    <div style="margin-bottom:16px;">${tagList(data.tiposPregunta)}</div>
    ${data.mensajeOtro ? messageBox(data.mensajeOtro) : ""}`;

  return {
    subject: `📋 Nuevo lead: ${primerNombre} — ${entidad}`,
    html: buildEmailLayout({
      preheader: `${primerNombre} solicita información sobre ${entidad}.`,
      badge: BADGE_POR_TIPO[data.tipo],
      title: "Nueva Solicitud",
      subtitle: "Un postulante quiere más información",
      bodyHtml,
      buttons: data.urlOrigen
        ? [{ label: "Ver Página de Origen", href: data.urlOrigen, variant: "dark" }]
        : [{ label: "Abrir Plataforma", href: BRAND.siteUrl, variant: "dark" }],
    }),
  };
}

export function solicitudLeadConfirmacionEmail(data: SolicitudLeadPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const entidad =
    data.tipo === "carrera"
      ? `la carrera <strong>${data.nombreCarrera}</strong> en <strong>${data.nombreInstitucion}</strong>`
      : `<strong>${data.nombreInstitucion}</strong>`;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hola <strong>${primerNombre}</strong>,</p>
    <p style="margin:0 0 20px 0;">Registramos tu solicitud de información sobre ${entidad}. Te contactaremos pronto con los detalles que necesitas.</p>
    <p style="margin:0 0 12px 0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1A1528;">Temas que solicitaste</p>
    <div style="margin-bottom:20px;">${tagList(data.tiposPregunta)}</div>
    <p style="margin:0;font-size:14px;color:#64748B;">Mientras tanto, puedes seguir explorando carreras, becas y herramientas en nuestra plataforma.</p>`;

  const tituloEntidad =
    data.tipo === "carrera" ? (data.nombreCarrera ?? "tu carrera") : (data.nombreInstitucion ?? "la institución");

  return {
    subject: `✅ Solicitud registrada: ${tituloEntidad}`,
    html: buildEmailLayout({
      preheader: `Tu solicitud sobre ${tituloEntidad} fue registrada exitosamente.`,
      badge: "Confirmación de Solicitud",
      title: "¡Solicitud Enviada!",
      subtitle: "Tus datos fueron registrados con éxito",
      bodyHtml,
      buttons: [
        ...(data.urlOrigen ? [{ label: "Volver a la Página", href: data.urlOrigen }] : []),
        { label: "Buscador de Carreras", href: `${BRAND.siteUrl}/herramientas/buscador`, variant: data.urlOrigen ? "outline" : "primary" },
      ],
    }),
  };
}
