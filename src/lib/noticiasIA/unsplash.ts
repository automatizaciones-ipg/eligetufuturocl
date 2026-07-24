// src/lib/noticiasIA/unsplash.ts
// Cliente delgado a la Unsplash Search Photos API vía fetch nativo.
import type { UnsplashImages } from "./types";

const UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos";

type UnsplashPhoto = { urls: { raw: string } };
type UnsplashSearchResponse = { results: UnsplashPhoto[] };

function conCrop(rawUrl: string, width: number): string {
  return `${rawUrl}&q=80&w=${width}&auto=format&fit=crop`;
}

export async function buscarImagenes(keywords: string[]): Promise<UnsplashImages> {
  const accessKey = import.meta.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error("Falta UNSPLASH_ACCESS_KEY en las variables de entorno.");

  const query = keywords.join(" ");
  const url = `${UNSPLASH_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Unsplash API respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  if (!data.results || data.results.length < 3) {
    throw new Error(`Unsplash no devolvió suficientes fotos para "${query}".`);
  }

  const [principal, sec1, sec2] = data.results;
  return {
    principal: conCrop(principal.urls.raw, 1200),
    secundarias: [conCrop(sec1.urls.raw, 800), conCrop(sec2.urls.raw, 800)],
  };
}
