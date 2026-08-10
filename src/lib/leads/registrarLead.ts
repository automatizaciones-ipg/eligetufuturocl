// Registro unificado de leads: se notifican a un Webhook de n8n, que desde
// ahí centraliza la escritura en la hoja "Leads" de Google Sheets y en el
// funnel de Bitrix24 (workflow que vive fuera de este repo).
//
// Contrato con los endpoints: `registrarLeadEnCRM` es fire-and-forget y
// JAMÁS lanza — un fallo de n8n (caído, red, secreto inválido) nunca puede
// romper ni retrasar la respuesta al estudiante; el correo/insert principal
// sigue su curso y el error se loguea sin PII.

import { randomUUID } from "node:crypto";
import { enviarLeadAWebhook, getWebhookConfig } from "./n8nWebhook";

export type OrigenLead =
  | "test_vocacional" // terminó el test (correo automático de resultados)
  | "asesoria_test" // pidió asesoría desde los resultados del test
  | "contacto_web" // formulario de /contacto
  | "solicitud_carrera" // "solicitar información" en ficha de carrera
  | "solicitud_institucion"; // "solicitar información" en ficha de institución

export type LeadParaCRM = {
  origen: OrigenLead;
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string;
  temaConsulta?: string;
  perfilRiasec?: string;
  carrerasInteres?: string;
  carrera?: string;
  institucion?: string;
  profesion?: string;
  urlOrigen?: string;
};

const MAX_CAMPO = 1500;

// ── Sanitización ─────────────────────────────────────────────────────────────

// Limpieza genérica (caracteres de control + cap de longitud) para cualquier
// destino aguas abajo. OJO: el escape anti-inyección-de-fórmulas de
// Sheets/CSV (anteponer apóstrofo a valores que empiezan con = + - @) NO va
// aquí — un valor "'-Juan" quedaría mal en el nombre de un contacto de
// Bitrix. Ese escape es responsabilidad de la rama de n8n que escribe a
// Google Sheets, justo antes de su nodo de Sheets.
function limpiarCampo(valor: string | undefined): string {
  if (!valor) return "";
  let v = valor.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (v.length > MAX_CAMPO) v = `${v.slice(0, MAX_CAMPO)}…`;
  return v;
}

// Normaliza a formato E.164 chileno (+569XXXXXXXX) para que Bitrix lo tome
// como teléfono válido sin transformaciones en n8n. Si no calza con un móvil
// chileno, se deja tal cual (ya pasó validarTelefono en el endpoint).
function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  const local = digitos.startsWith("56") ? digitos.slice(2) : digitos;
  return local.length === 9 && local.startsWith("9") ? `+56${local}` : telefono.trim();
}

// Fecha ISO 8601 con la hora y el offset reales de Chile (-04:00 / -03:00
// según horario de verano): legible en la planilla y parseable por n8n.
function fechaChileISO(): string {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", timeZoneName: "longOffset" })
      .formatToParts(ahora)
      .find((x) => x.type === "timeZoneName")
      ?.value.replace("GMT", "") || "-04:00";
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offset}`;
}

// ── Registro ─────────────────────────────────────────────────────────────────

let avisoSinConfig = false;

export function registrarLeadEnCRM(lead: LeadParaCRM): void {
  // Fire-and-forget deliberado: no se espera la respuesta de n8n para no
  // sumar latencia al usuario. El servidor Node standalone sigue vivo tras
  // responder, así que la promesa termina igual.
  void intentarRegistro(lead, false);
}

async function intentarRegistro(lead: LeadParaCRM, esReintento: boolean): Promise<void> {
  try {
    if (!getWebhookConfig()) {
      if (!avisoSinConfig) {
        avisoSinConfig = true;
        console.warn(
          "[leads-webhook] N8N_LEADS_WEBHOOK_* sin configurar: los leads no se notifican a n8n."
        );
      }
      return;
    }

    const payload = {
      idEvento: randomUUID(),
      fecha: fechaChileISO(),
      origen: lead.origen,
      nombre: limpiarCampo(lead.nombre),
      email: limpiarCampo(lead.email.toLowerCase()),
      telefono: limpiarCampo(normalizarTelefono(lead.telefono)),
      mensaje: limpiarCampo(lead.mensaje),
      temaConsulta: limpiarCampo(lead.temaConsulta),
      perfilRiasec: limpiarCampo(lead.perfilRiasec),
      carrerasInteres: limpiarCampo(lead.carrerasInteres),
      carrera: limpiarCampo(lead.carrera),
      institucion: limpiarCampo(lead.institucion),
      profesion: limpiarCampo(lead.profesion),
      urlOrigen: limpiarCampo(lead.urlOrigen),
    };

    await enviarLeadAWebhook(payload);
  } catch (error) {
    if (!esReintento) {
      await new Promise((resolver) => setTimeout(resolver, 2000));
      return intentarRegistro(lead, true);
    }
    // Log sin PII: solo el origen y el detalle técnico del error.
    console.error(
      `[leads-webhook] Falló el registro (origen=${lead.origen}):`,
      error instanceof Error ? error.message : error
    );
  }
}
