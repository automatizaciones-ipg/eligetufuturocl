// src/lib/seo.ts
// ============================================================================
// Configuración central de SEO / GEO para Elige Tu Futuro
// Punto único de verdad para metadatos, Open Graph, JSON-LD y datos de marca.
// ============================================================================

/** URL canónica del sitio (sin slash final). Se puede sobreescribir con PUBLIC_SITE_URL. */
export const SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL || "https://eligetufuturo.cl"
).replace(/\/$/, "");

export const SITE = {
  name: "Elige Tu Futuro",
  shortName: "EligeTuFuturo",
  /** Idioma + país para hreflang / og:locale */
  lang: "es-CL",
  locale: "es_CL",
  /** Descripción por defecto (≈155 caracteres, optimizada para SERP) */
  description:
    "Elige Tu Futuro es la plataforma chilena de orientación vocacional: test vocacional gratuito, buscador de carreras e instituciones, calculadora de puntaje PAES, calendario de admisión, becas, FUAS y empleabilidad para la Admisión 2026.",
  /** Palabras clave semilla (apoyo, no determinantes en Google actual). */
  keywords: [
    "orientación vocacional Chile",
    "test vocacional gratis",
    "carreras universitarias Chile",
    "puntaje PAES",
    "calculadora NEM",
    "becas y gratuidad",
    "FUAS 2026",
    "admisión 2026",
    "instituciones educación superior Chile",
    "empleabilidad carreras",
  ],
  /** Imagen social por defecto (1200x630 recomendado). Debe existir en /public. */
  defaultOgImage: "/imagenes/imagen_portada.png",
  themeColor: "#6544FF",
  twitterHandle: "@eligetufuturocl",
  email: "contacto@eligetufuturo.cl",
  social: {
    instagram: "https://www.instagram.com/eligetufuturo.cl",
  },
  /** Organización legal vinculada (aparece en el proyecto: IPG / IP). Ajustable. */
  organizationType: "EducationalOrganization",
} as const;

/** Construye una URL absoluta a partir de una ruta o URL. */
export function absoluteUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export type SeoProps = {
  title: string;
  description?: string;
  /** Ruta o URL de la imagen social. */
  image?: string;
  /** Ruta canónica explícita; por defecto se deriva de la URL actual. */
  canonical?: string;
  /** og:type — "website" | "article" | "profile" ... */
  type?: string;
  /** Evita indexación (páginas de formularios/resultados privados). */
  noindex?: boolean;
  /** Bloques JSON-LD adicionales específicos de la página. */
  jsonLd?: Record<string, unknown>[];
  /** Metadatos de artículo (para noticias). */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
};

// ============================================================================
// Constructores de JSON-LD (Schema.org) — base del SEO técnico y GEO
// ============================================================================

/** Organización — identidad de la marca para Google Knowledge Graph y motores IA. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": SITE.organizationType,
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logos_web/logo_principal_color.webp"),
    },
    image: absoluteUrl(SITE.defaultOgImage),
    description: SITE.description,
    email: SITE.email,
    areaServed: { "@type": "Country", name: "Chile" },
    sameAs: Object.values(SITE.social),
  };
}

/** WebSite + SearchAction — habilita el cuadro de búsqueda de sitio en Google. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/herramientas/buscador?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Migas de pan — refuerza la jerarquía del sitio en SERP y para IA. */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/** FAQPage — clave para GEO: respuestas directas que los LLM citan. */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Course — para páginas de carrera (rich results de cursos/programas). */
export function courseSchema(opts: {
  name: string;
  description: string;
  url: string;
  providerName?: string;
  providerUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    inLanguage: SITE.lang,
    ...(opts.providerName && {
      provider: {
        "@type": "CollegeOrUniversity",
        name: opts.providerName,
        ...(opts.providerUrl && { url: opts.providerUrl }),
      },
    }),
  };
}

/** EducationalOrganization — para páginas de institución. */
export function educationalOrgSchema(opts: {
  name: string;
  description: string;
  url: string;
  logo?: string;
  type?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    ...(opts.logo && { logo: absoluteUrl(opts.logo) }),
    areaServed: { "@type": "Country", name: "Chile" },
  };
}

/** NewsArticle — para noticias. */
export function newsArticleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: opts.headline,
    description: opts.description,
    url: absoluteUrl(opts.url),
    ...(opts.image && { image: absoluteUrl(opts.image) }),
    ...(opts.datePublished && { datePublished: opts.datePublished }),
    dateModified: opts.dateModified || opts.datePublished,
    inLanguage: SITE.lang,
    author: { "@type": "Organization", name: opts.author || SITE.name },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: absoluteUrl(opts.url),
  };
}
