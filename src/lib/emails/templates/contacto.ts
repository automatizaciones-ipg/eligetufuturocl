import { BRAND } from "../brand";
import { buildEmailLayout, infoRow, messageBox } from "../layout";

const TIPO_LABELS: Record<string, string> = {
  "consulta-general": "Consulta General",
  "consulta-carreras": "Consulta sobre Carreras",
  "otro-motivo": "Otro motivo",
};

export interface ContactoPayload {
  nombre: string;
  correo: string;
  telefono: string;
  tipoMensaje: string;
  mensaje: string;
}

export function contactoAdminEmail(data: ContactoPayload): { subject: string; html: string } {
  const tipoLabel = TIPO_LABELS[data.tipoMensaje] ?? data.tipoMensaje;
  const primerNombre = data.nombre.split(" ")[0];

  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Recibiste un nuevo mensaje desde el formulario de contacto de <strong>${BRAND.name}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
      ${infoRow("Nombre", data.nombre)}
      ${infoRow("Correo", data.correo)}
      ${infoRow("Teléfono", data.telefono)}
      ${infoRow("Tipo de consulta", tipoLabel)}
    </table>
    ${messageBox(data.mensaje)}
    <p style="margin:24px 0 0 0;font-size:13px;color:#64748B;">Responde directamente al correo del usuario para dar seguimiento.</p>`;

  return {
    subject: `📩 Nuevo contacto: ${primerNombre} — ${tipoLabel}`,
    html: buildEmailLayout({
      preheader: `${primerNombre} envió un mensaje de contacto.`,
      badge: "Formulario de Contacto",
      title: "Nuevo Mensaje",
      subtitle: "Un visitante necesita tu atención",
      bodyHtml,
      buttons: [{ label: "Ir al Panel", href: BRAND.siteUrl, variant: "dark" }],
    }),
  };
}

export function contactoConfirmacionEmail(data: ContactoPayload): { subject: string; html: string } {
  const primerNombre = data.nombre.split(" ")[0];
  const tipoLabel = TIPO_LABELS[data.tipoMensaje] ?? data.tipoMensaje;

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hola <strong>${primerNombre}</strong>,</p>
    <p style="margin:0 0 20px 0;">Recibimos tu mensaje correctamente. Nuestro equipo revisará tu consulta sobre <strong>${tipoLabel}</strong> y te responderá <strong>pronto</strong>.</p>
    ${messageBox(data.mensaje)}
    <p style="margin:20px 0 0 0;font-size:14px;color:#64748B;">Mientras tanto, puedes explorar carreras, hacer el test vocacional o revisar becas en nuestra plataforma.</p>`;

  return {
    subject: `✅ Recibimos tu mensaje, ${primerNombre}`,
    html: buildEmailLayout({
      preheader: "Tu mensaje fue recibido. Te responderemos pronto.",
      badge: "Confirmación",
      title: "¡Mensaje Enviado!",
      subtitle: "Gracias por contactarnos",
      bodyHtml,
      buttons: [
        { label: "Test Vocacional", href: `${BRAND.siteUrl}/herramientas/test-vocacional` },
        { label: "Buscador de Carreras", href: `${BRAND.siteUrl}/herramientas/buscador`, variant: "outline" },
      ],
    }),
  };
}
