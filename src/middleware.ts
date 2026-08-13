import { defineMiddleware } from "astro:middleware";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "./lib/admin/session";

// ── Rate Limiter ──────────────────────────────────────────────────────────────
// Límite: 10 peticiones POST a /api/ por IP por ventana de 1 minuto.
// Almacenamiento en memoria — adecuado para instancia Node.js única.

const rlStore = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;

// Purga entradas expiradas cada 5 minutos para evitar fugas de memoria.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rlStore) {
    if (now > entry.resetAt) rlStore.delete(key);
  }
}, 5 * 60_000);

function checkRateLimit(
  ip: string,
  pathname: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = rlStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RL_WINDOW_MS;
    rlStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: RL_MAX - 1, resetAt };
  }

  if (entry.count >= RL_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RL_MAX - entry.count, resetAt: entry.resetAt };
}

// ── Content Security Policy ───────────────────────────────────────────────────
// Orígenes inventariados: GA4, Clarity, Supabase, Google Fonts.
// 'unsafe-inline' en script-src es necesario para los snippets de GA4 y Clarity.

const CSP = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://www.clarity.ms",
    "https://scripts.clarity.ms",
  ].join(" "),
  [
    "style-src 'self' 'unsafe-inline'",
    "https://fonts.googleapis.com",
  ].join(" "),
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  [
    "connect-src 'self'",
    "https://ffxyckspcsxlhxapboql.supabase.co",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://www.clarity.ms",
    "https://c.bing.com",
    "https://n.clarity.ms",
    "https://nominatim.openstreetmap.org",
  ].join(" "),
  "media-src 'none'",
  "object-src 'none'",
  "frame-src https://www.openstreetmap.org",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// ── Security headers ──────────────────────────────────────────────────────────

function applySecurityHeaders(response: Response): void {
  const h = response.headers;
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  h.set("Content-Security-Policy", CSP);
}

// ── Middleware ────────────────────────────────────────────────────────────────

// ── Gate del panel admin oculto ─────────────────────────────────────────────
// Protege /admin/** (páginas) y /api/admin/** (rutas) con una cookie de sesión
// firmada. /admin/login y /api/admin/login quedan abiertas (son el propio
// formulario de acceso). Ver src/lib/admin/session.ts.

function isProtectedAdminRoute(pathname: string): boolean {
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPublicAdminRoute = pathname === "/admin/login" || pathname === "/api/admin/login";
  return (isAdminPage || isAdminApi) && !isPublicAdminRoute;
}

// ── Canonicalización de URL ──────────────────────────────────────────────────
// El sitio respondía 200 en tres direcciones distintas para la misma página:
// con y sin `www.`, y con y sin barra final (que además se auto-canonicalizaba
// hacia la variante con barra, distinta de la que declara el sitemap). Eso son
// URLs duplicadas compitiendo entre sí. Aquí se consolidan con un 301 antes de
// que la petición llegue a renderizar nada.
//
// Se excluye /api/*: un 301 rompería los POST de los formularios.
//
// CRÍTICO — también se excluyen las rutas prerenderizadas. Durante el build,
// Astro invoca el middleware con la URL en su forma con barra final; si aquí se
// devuelve una redirección, Astro la SERIALIZA como el contenido estático de la
// página y el archivo generado deja de tener la página: pasa a ser un "meta
// refresh". Sin esta guarda, el build horneaba 11.599 de 11.601 páginas como
// redirecciones. Además, en runtime el adaptador Node sirve los archivos
// prerenderizados sin pasar por el middleware, así que la redirección tampoco
// se aplicaría nunca: la única canonicalización que reciben es la etiqueta
// <link rel="canonical">, que ya se genera correcta en el build.

function urlCanonica(url: URL, request: Request, esPrerenderizada: boolean): string | null {
  if (esPrerenderizada) return null;
  if (url.pathname.startsWith("/api/")) return null;

  // El host real detrás del CDN de Hostinger.
  const host = request.headers.get("host") ?? url.host;
  let destinoHost = host;
  let cambiado = false;

  if (host.startsWith("www.")) {
    destinoHost = host.slice(4);
    cambiado = true;
  }

  let destinoPath = url.pathname;
  if (destinoPath.length > 1 && destinoPath.endsWith("/")) {
    destinoPath = destinoPath.replace(/\/+$/, "") || "/";
    cambiado = true;
  }

  if (!cambiado) return null;

  // Detrás del CDN la petición llega por http, así que el esquema real viene en
  // x-forwarded-proto. Sin esta lectura el redirect forzaría https incluso en
  // desarrollo, donde localhost no lo sirve.
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    url.protocol.replace(":", "") ||
    "https";

  return `${proto}://${destinoHost}${destinoPath}${url.search}`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  const destino = urlCanonica(url, request, context.isPrerendered === true);
  if (destino) return Response.redirect(destino, 301);

  if (isProtectedAdminRoute(url.pathname)) {
    const token = context.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isValidSessionToken(token)) {
      if (url.pathname.startsWith("/api/admin/")) {
        return new Response(JSON.stringify({ ok: false, message: "No autorizado." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/admin/login");
    }
  }

  // Aplicar rate limiting solo a peticiones POST a /api/
  if (request.method === "POST" && url.pathname.startsWith("/api/")) {
    const ip =
      (() => {
        try {
          return context.clientAddress;
        } catch {
          return undefined;
        }
      })() ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const { allowed, remaining, resetAt } = checkRateLimit(ip, url.pathname);

    if (!allowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(RL_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }

    // Añadir headers informativos en requests permitidos
    const response = await next();
    applySecurityHeaders(response);
    response.headers.set("X-RateLimit-Limit", String(RL_MAX));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  const response = await next();
  applySecurityHeaders(response);
  return response;
});
