// src/lib/admin/session.ts
// Sesión del panel admin oculto: cookie firmada con HMAC-SHA256 (sin
// dependencias nuevas, sin usuarios/roles — un solo operador con contraseña).
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function getSessionSecret(): string {
  const secret = import.meta.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const secret = getSessionSecret();
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${b64}.${sign(b64, secret)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return false;
  }

  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;

  const expected = sign(b64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// Compara contra ADMIN_PASSWORD en tiempo constante (evita timing attacks).
export function checkAdminPassword(candidate: string): boolean {
  const expected = import.meta.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;

  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a); // mantiene tiempo constante aunque ya sabemos que falla
    return false;
  }
  return timingSafeEqual(a, b);
}
