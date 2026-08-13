// src/lib/markdown.ts
// ============================================================================
// Conversor Markdown → HTML sin dependencias, para el cuerpo de las noticias.
//
// Por qué no usamos react-markdown: la ficha /noticia/[id] ahora se renderiza
// en el servidor (antes era `client:only` y el componente nunca se ejecutaba
// ahí). Al hacerlo, `react-markdown` pasó a formar parte del arranque del
// módulo en el servidor y en Hostinger eso devolvía 500 en TODAS las rutas de
// noticia —incluso con un id inválido, que ni consulta la base—, mientras el
// mismo artefacto funcionaba en local. Este módulo es código propio: siempre
// entra en el bundle y no depende de que el runtime resuelva un paquete.
//
// Cubre exactamente el subconjunto que produce el pipeline de noticias IA
// (verificado contra la tabla `noticias`): encabezados, negrita, cursiva,
// listas ordenadas y no ordenadas, citas, enlaces, imágenes y reglas. No hay
// tablas, ni código, ni HTML crudo.
//
// Seguridad: el texto se escapa ANTES de aplicar las transformaciones, así que
// cualquier HTML que llegue en el markdown se renderiza como texto y no puede
// inyectar marcado. Las URLs se filtran a http/https/mailto y rutas internas.
// ============================================================================

const CLASES = {
  h1: "text-3xl md:text-4xl font-black text-slate-800 mt-10 mb-4 tracking-tight uppercase italic leading-tight",
  h2: "text-2xl md:text-3xl font-black text-slate-800 mt-8 mb-3 tracking-tight",
  h3: "text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-2",
  h4: "text-lg md:text-xl font-bold text-slate-800 mt-5 mb-2",
  p: "text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-6",
  strong: "font-black text-slate-900 bg-indigo-50/80 px-1 rounded",
  ul: "list-disc pl-6 space-y-2 mb-6 text-slate-600 font-medium",
  ol: "list-decimal pl-6 space-y-2 mb-6 text-slate-600 font-medium",
  li: "pl-1",
  blockquote:
    "bg-[#0A0518]/5 rounded-[2rem] p-6 my-8 border-l-8 border-[#1A1528] italic text-slate-700 font-medium",
  img: "w-full rounded-[2rem] my-8 shadow-md object-cover max-h-[400px]",
  hr: "my-10 border-slate-100",
  a: "text-[#6544FF] underline underline-offset-2 hover:no-underline",
} as const;

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Solo esquemas seguros: descarta `javascript:`, `data:` y similares. */
function urlSegura(url: string): string | null {
  const limpia = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(limpia)) return escapar(limpia);
  return null;
}

/** Aplica el formato en línea sobre texto YA escapado. */
function enLinea(texto: string): string {
  let salida = escapar(texto);

  // Imágenes antes que enlaces: comparten sintaxis salvo el `!` inicial.
  salida = salida.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_m, alt: string, url: string) => {
      const href = urlSegura(url);
      if (!href) return "";
      return `<img src="${href}" alt="${alt}" loading="lazy" class="${CLASES.img}" />`;
    },
  );

  salida = salida.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_m, texto: string, url: string) => {
      const href = urlSegura(url);
      if (!href) return texto;
      const externo = /^https?:\/\//i.test(href);
      const extra = externo ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}" class="${CLASES.a}"${extra}>${texto}</a>`;
    },
  );

  // Negrita antes que cursiva, para que `**texto**` no se lea como dos cursivas.
  salida = salida.replace(
    /\*\*([^*]+)\*\*/g,
    `<strong class="${CLASES.strong}">$1</strong>`,
  );
  salida = salida.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  salida = salida.replace(/(^|\s)_([^_\n]+)_/g, "$1<em>$2</em>");

  return salida;
}

/**
 * Convierte el `cuerpo_markdown` de una noticia en HTML listo para insertar.
 * Determinista y sin estado: el mismo texto produce siempre el mismo HTML, en
 * servidor y en cliente, de modo que la hidratación no encuentra diferencias.
 */
export function markdownAHtml(markdown: string | null | undefined): string {
  if (!markdown) return "";

  const lineas = markdown.replace(/\r\n/g, "\n").split("\n");
  const salida: string[] = [];

  let parrafo: string[] = [];
  let lista: { tipo: "ul" | "ol"; items: string[] } | null = null;
  let cita: string[] = [];

  const cerrarParrafo = () => {
    if (!parrafo.length) return;
    salida.push(`<p class="${CLASES.p}">${enLinea(parrafo.join(" "))}</p>`);
    parrafo = [];
  };
  const cerrarLista = () => {
    if (!lista) return;
    const items = lista.items
      .map((i) => `<li class="${CLASES.li}">${enLinea(i)}</li>`)
      .join("");
    salida.push(`<${lista.tipo} class="${CLASES[lista.tipo]}">${items}</${lista.tipo}>`);
    lista = null;
  };
  const cerrarCita = () => {
    if (!cita.length) return;
    salida.push(
      `<blockquote class="${CLASES.blockquote}">${enLinea(cita.join(" "))}</blockquote>`,
    );
    cita = [];
  };
  const cerrarTodo = () => {
    cerrarParrafo();
    cerrarLista();
    cerrarCita();
  };

  for (const linea of lineas) {
    const l = linea.trim();

    if (!l) {
      cerrarTodo();
      continue;
    }

    // Regla horizontal
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(l)) {
      cerrarTodo();
      salida.push(`<hr class="${CLASES.hr}" />`);
      continue;
    }

    // Encabezados
    const enc = l.match(/^(#{1,6})\s+(.*)$/);
    if (enc) {
      cerrarTodo();
      const nivel = Math.min(enc[1].length, 4);
      const etiqueta = `h${nivel}` as "h1" | "h2" | "h3" | "h4";
      salida.push(
        `<${etiqueta} class="${CLASES[etiqueta]}">${enLinea(enc[2])}</${etiqueta}>`,
      );
      continue;
    }

    // Cita
    const c = l.match(/^>\s?(.*)$/);
    if (c) {
      cerrarParrafo();
      cerrarLista();
      cita.push(c[1]);
      continue;
    }
    cerrarCita();

    // Lista no ordenada
    const ul = l.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      cerrarParrafo();
      if (lista?.tipo !== "ul") {
        cerrarLista();
        lista = { tipo: "ul", items: [] };
      }
      lista.items.push(ul[1]);
      continue;
    }

    // Lista ordenada
    const ol = l.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      cerrarParrafo();
      if (lista?.tipo !== "ol") {
        cerrarLista();
        lista = { tipo: "ol", items: [] };
      }
      lista.items.push(ol[1]);
      continue;
    }

    cerrarLista();
    parrafo.push(l);
  }

  cerrarTodo();
  return salida.join("\n");
}

/** Versión en texto plano, para descripciones y JSON-LD. */
export function markdownATexto(markdown: string | null | undefined): string {
  if (!markdown) return "";
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>)\s*/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
