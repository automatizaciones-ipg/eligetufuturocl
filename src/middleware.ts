import { defineMiddleware } from "astro:middleware";

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
  ].join(" "),
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
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

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

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
