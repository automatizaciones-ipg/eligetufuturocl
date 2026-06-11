import { BRAND, COLORS } from "../brand";
import { buildEmailLayout } from "../layout";

/**
 * Plantilla base para boletines, avisos y campañas de marketing.
 * Usar con la API /api/marketing/enviar cuando tengas audiencia configurada.
 */
export interface NewsletterPayload {
  titulo: string;
  subtitulo?: string;
  preheader?: string;
  secciones: NewsletterSeccion[];
  ctaPrincipal?: { label: string; href: string };
  ctaSecundario?: { label: string; href: string };
  /** Pie legal para cumplir normativa de emails comerciales */
  incluirDesuscripcion?: boolean;
  enlaceDesuscripcion?: string;
}

export interface NewsletterSeccion {
  titulo?: string;
  contenido: string;
  imagenUrl?: string;
  enlace?: string;
}

function renderSeccion(seccion: NewsletterSeccion): string {
  const imagen = seccion.imagenUrl
    ? `<a href="${seccion.enlace ?? "#"}" style="display:block;margin-bottom:16px;">
         <img src="${seccion.imagenUrl}" alt="" width="536" style="width:100%;max-width:536px;border-radius:16px;display:block;" />
       </a>`
    : "";

  const titulo = seccion.titulo
    ? `<h3 style="margin:0 0 10px 0;font-size:18px;font-weight:900;color:${COLORS.darkAlt};font-style:italic;text-transform:uppercase;">${seccion.titulo}</h3>`
    : "";

  return `
    <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid ${COLORS.border};">
      ${imagen}
      ${titulo}
      <p style="margin:0;color:${COLORS.text};font-size:15px;line-height:1.65;">${seccion.contenido}</p>
      ${seccion.enlace ? `<p style="margin:14px 0 0 0;"><a href="${seccion.enlace}" style="color:${COLORS.primary};font-weight:700;font-size:14px;text-decoration:none;">Leer más →</a></p>` : ""}
    </div>`;
}

export function buildNewsletterEmail(payload: NewsletterPayload): { subject: string; html: string } {
  const seccionesHtml = payload.secciones.map(renderSeccion).join("");
  const desuscripcion = payload.incluirDesuscripcion
    ? `<p style="margin:24px 0 0 0;font-size:11px;color:#94A3B8;text-align:center;">
         Recibes este correo porque estás suscrito a ${BRAND.name}.
         ${payload.enlaceDesuscripcion ? `<a href="${payload.enlaceDesuscripcion}" style="color:${COLORS.lavender};">Cancelar suscripción</a>` : ""}
       </p>`
    : "";

  const bodyHtml = `${seccionesHtml}${desuscripcion}`;

  const buttons = [
    ...(payload.ctaPrincipal ? [{ label: payload.ctaPrincipal.label, href: payload.ctaPrincipal.href }] : []),
    ...(payload.ctaSecundario
      ? [{ label: payload.ctaSecundario.label, href: payload.ctaSecundario.href, variant: "outline" as const }]
      : []),
  ];

  return {
    subject: payload.titulo,
    html: buildEmailLayout({
      preheader: payload.preheader ?? payload.subtitulo,
      badge: "Boletín Informativo",
      title: payload.titulo,
      subtitle: payload.subtitulo,
      bodyHtml,
      buttons,
      footerNote: "Boletín informativo de EligeTuFuturo · Educación superior en Chile",
    }),
  };
}

/** Ejemplo listo para pruebas o como referencia de estructura */
export function newsletterEjemplo(): NewsletterPayload {
  return {
    titulo: "Novedades PAES 2026",
    subtitulo: "Fechas clave, becas y herramientas para tu postulación",
    preheader: "Todo lo que necesitas saber para la admisión 2026",
    secciones: [
      {
        titulo: "Calendario actualizado",
        contenido:
          "Revisa las fechas de inscripción, rendición y resultados del proceso de admisión 2026 en nuestro calendario interactivo.",
        enlace: `${BRAND.siteUrl}/herramientas/calendario`,
      },
      {
        titulo: "Test vocacional gratuito",
        contenido:
          "Descubre tu perfil RIASEC y las carreras con mayor compatibilidad según tus intereses y la oferta nacional.",
        enlace: `${BRAND.siteUrl}/herramientas/test-vocacional`,
      },
    ],
    ctaPrincipal: { label: "Explorar Herramientas", href: BRAND.siteUrl },
    ctaSecundario: { label: "Buscador de Carreras", href: `${BRAND.siteUrl}/herramientas/buscador` },
    incluirDesuscripcion: true,
    enlaceDesuscripcion: `${BRAND.siteUrl}/contacto`,
  };
}
