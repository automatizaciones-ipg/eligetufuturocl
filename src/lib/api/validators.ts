export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(\+?56)?9\d{8}$/;

export function validarCampo(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }
  return value.trim();
}

export function validarEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validarTelefono(telefono: string): boolean {
  return PHONE_REGEX.test(telefono.replace(/[\s()\-+]/g, ""));
}

export function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
