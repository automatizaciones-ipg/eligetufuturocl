"""
============================================================================
ENRIQUECEDOR DE INSTITUCIONES con FIRECRAWL  ·  Elige Tu Futuro
============================================================================
Extrae detalles estructurados desde el SITIO OFICIAL de cada institución
(columna "Página web" del Excel SIES) usando Firecrawl + extracción por LLM,
y los guarda en la columna JSONB `detalles` de Supabase.

Esos detalles se muestran en /institucion/[id], arriba del mapa y antes de la
descripción (componente DetallesEnriquecidos).

Requisitos:
  pip install pandas python-dotenv supabase requests openpyxl
  .env con:
     SUPABASE_URL, SUPABASE_KEY        (igual que el resto de scripts ETL)
     FIRECRAWL_API_KEY                 (https://www.firecrawl.dev → API Keys)
  Ejecutar antes la migración: migracion_detalles_firecrawl.sql

Uso:
  python enriquecer_instituciones_firecrawl.py             # solo las que faltan (modo rápido)
  python enriquecer_instituciones_firecrawl.py --limite 5  # prueba con tope de seguridad
  python enriquecer_instituciones_firecrawl.py --refrescar # todas de nuevo
  python enriquecer_instituciones_firecrawl.py --profundo  # rastrea todo el sitio (máx precisión, +créditos)

Modos:
  rápido  (default): scrape de la home. Veloz y barato. Capta redes/contacto/eslogan.
  profundo (--profundo): /extract async que rastrea dominio/*. Mejor para fundación,
           sedes y dirección exacta (suelen estar en /nosotros, /historia, /contacto).

Idempotente y reanudable: por defecto solo procesa instituciones sin `detalles`.
============================================================================
"""

import os
import re
import sys
import json
import time
from datetime import datetime, timezone

import requests
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Salida UTF-8 en consolas Windows (evita UnicodeEncodeError con emojis/acentos)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# ── Config ──────────────────────────────────────────────────────────────────
FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v1/scrape"
FIRECRAWL_EXTRACT_URL = "https://api.firecrawl.dev/v1/extract"
PAUSA_SEG = 1.0        # cortesía entre llamadas
TIMEOUT_HTTP = 100
EXTRACT_POLL_MAX = 48  # intentos de sondeo (≈4 min) en modo profundo
EXTRACT_POLL_SEG = 5

# Esquema de extracción (lo que queremos de cada sitio oficial).
SCHEMA = {
    "type": "object",
    "properties": {
        "anio_fundacion": {"type": "integer", "description": "Año de fundación (solo el número, ej: 1988)"},
        "numero_sedes": {"type": "integer", "description": "Cantidad total de sedes o campus en Chile"},
        "direccion_exacta": {"type": "string", "description": "Dirección física completa de la casa central o sede principal (calle, número, comuna, ciudad)"},
        "ciudades": {"type": "array", "items": {"type": "string"}, "description": "Ciudades de Chile con sede"},
        "modalidades": {"type": "array", "items": {"type": "string"}, "description": "Modalidades: Presencial, Online, Semipresencial, Vespertino"},
        "telefono_admision": {"type": "string", "description": "Teléfono de contacto de admisión"},
        "email_admision": {"type": "string", "description": "Email de contacto de admisión"},
        "instagram": {"type": "string", "description": "URL completa del Instagram oficial"},
        "facebook": {"type": "string", "description": "URL completa del Facebook oficial"},
        "linkedin": {"type": "string", "description": "URL completa del LinkedIn oficial"},
        "youtube": {"type": "string", "description": "URL completa del canal de YouTube oficial"},
        "twitter": {"type": "string", "description": "URL completa del perfil de X/Twitter oficial"},
        "eslogan": {"type": "string", "description": "Lema o eslogan institucional, breve"},
    },
}

PROMPT = (
    "Extrae los datos institucionales de esta universidad, instituto profesional o CFT chileno. "
    "Usa SOLO información presente en el sitio; si un dato no aparece, omítelo. "
    "Las redes sociales deben ser URLs completas y oficiales (no de terceros)."
)

CAMPOS_URL = ("instagram", "facebook", "linkedin", "youtube", "twitter")


# ── Helpers ─────────────────────────────────────────────────────────────────
def normalizar_url(u: str) -> str:
    u = (u or "").strip()
    if not u or u.lower() in ("nan", "no informado", "s/i"):
        return ""
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u
    return u


def limpiar_detalles(raw: dict) -> dict:
    """Normaliza y descarta campos vacíos/ inválidos."""
    if not isinstance(raw, dict):
        return {}
    out = {}
    for k, v in raw.items():
        if v in (None, "", [], {}):
            continue
        if k in CAMPOS_URL:
            v = normalizar_url(str(v))
            if not v:
                continue
        if k == "anio_fundacion":
            try:
                v = int(re.findall(r"\d{4}", str(v))[0])
            except Exception:
                continue
        if k == "numero_sedes":
            try:
                v = int(re.findall(r"\d+", str(v))[0])
            except Exception:
                continue
        if isinstance(v, list):
            v = [str(x).strip() for x in v if str(x).strip()]
            if not v:
                continue
        if isinstance(v, str):
            v = v.strip()
            if not v:
                continue
        out[k] = v
    return out


def firecrawl_extraer(url: str, api_key: str):
    """Modo RÁPIDO: scrape de la home + extracción por LLM (síncrono).
    Barato y veloz; captura redes/contacto/eslogan (footer) muy bien."""
    payload = {
        "url": url,
        "formats": ["extract"],
        "extract": {"schema": SCHEMA, "prompt": PROMPT},
        "onlyMainContent": False,   # queremos footer/cabecera (redes, contacto)
        "timeout": 45000,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    resp = requests.post(FIRECRAWL_SCRAPE_URL, headers=headers, json=payload, timeout=TIMEOUT_HTTP)
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success"):
        return None
    d = data.get("data", {}) or {}
    # Tolerante a variantes de versión de la API (extract / json / llm_extraction)
    return d.get("extract") or d.get("json") or d.get("llm_extraction")


def firecrawl_extraer_profundo(url: str, api_key: str):
    """Modo PROFUNDO: /extract async que RASTREA todo el sitio (dominio/*) y
    extrae con LLM. Más preciso para fundación/sedes/dirección (que suelen estar
    en /nosotros, /historia, /contacto); consume más créditos y es más lento."""
    base = url.rstrip("/")
    payload = {"urls": [base, base + "/*"], "prompt": PROMPT, "schema": SCHEMA}
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    resp = requests.post(FIRECRAWL_EXTRACT_URL, headers=headers, json=payload, timeout=TIMEOUT_HTTP)
    resp.raise_for_status()
    arranque = resp.json()
    job_id = arranque.get("id")
    if not job_id:
        # Algunas respuestas devuelven data directa
        return arranque.get("data")

    # Sondeo hasta completar
    for _ in range(EXTRACT_POLL_MAX):
        time.sleep(EXTRACT_POLL_SEG)
        est = requests.get(f"{FIRECRAWL_EXTRACT_URL}/{job_id}", headers=headers, timeout=TIMEOUT_HTTP).json()
        estado = est.get("status")
        if estado == "completed":
            return est.get("data")
        if estado in ("failed", "cancelled"):
            return None
    return None  # timeout


# ── Lectura del Excel SIES (sitios web por institución) ──────────────────────
def cargar_webs_sies(ruta_excel: str) -> dict:
    """Devuelve { codigo_institucion(int): {'nombre': str, 'web': str} }."""
    df_raw = pd.read_excel(ruta_excel, header=None, dtype=str)

    header_row_index = -1
    for i in range(min(20, len(df_raw))):
        valores = [str(x).lower() for x in df_raw.iloc[i].values]
        has_codigo = any("código" in v or "codigo" in v for v in valores)
        has_web = any("página web" in v or "pagina web" in v or "sitio" in v or v.strip() == "web" for v in valores)
        if has_codigo and has_web:
            header_row_index = i
            break

    if header_row_index == -1:
        raise RuntimeError("No se encontró la fila de encabezados (Código institución / Página web).")

    print(f"🎯 Encabezados reales en la fila {header_row_index + 1} del Excel.")
    df = df_raw.copy()
    df.columns = df.iloc[header_row_index]
    df = df.iloc[header_row_index + 1:].reset_index(drop=True)

    col_codigo = col_nombre = col_web = None
    for col in df.columns:
        if pd.isna(col):
            continue
        c = str(col).lower()
        if ("código" in c or "codigo" in c) and "inst" in c:
            col_codigo = col
        if "nombre" in c and "inst" in c:
            col_nombre = col
        if "página web" in c or "pagina web" in c or c.strip() == "web" or "sitio" in c:
            col_web = col

    if not col_codigo or not col_web:
        raise RuntimeError(f"Columnas no detectadas. Disponibles: {list(df.columns)}")

    print(f"   ➤ Código -> [{col_codigo}]")
    print(f"   ➤ Nombre -> [{col_nombre}]")
    print(f"   ➤ Web    -> [{col_web}]")

    mapa = {}
    for _, row in df.iterrows():
        cod_val = row.get(col_codigo)
        if pd.isna(cod_val) or str(cod_val).strip().lower() in ("", "nan"):
            continue
        try:
            codigo = int(float(str(cod_val).strip()))
        except Exception:
            continue
        web = "" if pd.isna(row.get(col_web)) else normalizar_url(str(row.get(col_web)))
        nombre = "" if (col_nombre is None or pd.isna(row.get(col_nombre))) else str(row.get(col_nombre)).strip()
        mapa[codigo] = {"nombre": nombre, "web": web}
    return mapa


# ── Proceso principal ────────────────────────────────────────────────────────
def main():
    refrescar = "--refrescar" in sys.argv
    profundo = "--profundo" in sys.argv
    limite = None
    if "--limite" in sys.argv:
        try:
            limite = int(sys.argv[sys.argv.index("--limite") + 1])
        except Exception:
            limite = None

    print("\n" + "=" * 70)
    print("🔥 ENRIQUECIMIENTO DE INSTITUCIONES con FIRECRAWL")
    print("=" * 70 + "\n")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    # Carga .env desde el cwd y desde la raíz del repo (../../.env)
    load_dotenv()
    load_dotenv(os.path.join(BASE_DIR, "..", "..", ".env"))

    # Credenciales flexibles: usa SUPABASE_URL/SUPABASE_KEY o, si no existen,
    # las variables del proyecto (PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (os.environ.get("SUPABASE_KEY")
           or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
           or os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))
    fc_key = os.environ.get("FIRECRAWL_API_KEY")
    if not url or not key:
        print("❌ Faltan credenciales de Supabase en .env "
              "(SUPABASE_URL/SUPABASE_KEY o PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)")
        return
    if not fc_key:
        print("❌ Falta FIRECRAWL_API_KEY en .env (https://www.firecrawl.dev → API Keys)")
        return

    supabase: Client = create_client(url, key)
    print("✅ Conexión a Supabase establecida.")
    ruta_excel = os.path.join(BASE_DIR, "raw", "Instituciones_2025_2026_SIES.xlsx")
    if not os.path.exists(ruta_excel):
        print(f"❌ No se encontró el Excel: {ruta_excel}")
        return

    print("⏳ Leyendo sitios web del Excel SIES…")
    webs = cargar_webs_sies(ruta_excel)
    print(f"   {len(webs)} instituciones con datos en el Excel.\n")

    resp = supabase.table("instituciones").select(
        "codigo_institucion, nombre, detalles"
    ).execute()
    instituciones = resp.data or []

    pendientes = [
        inst for inst in instituciones
        if refrescar or not inst.get("detalles")
    ]
    if limite:
        pendientes = pendientes[:limite]

    modo = "PROFUNDO (rastrea todo el sitio)" if profundo else "RÁPIDO (home)"
    print(f"🔧 Modo: {modo}")
    print(f"📊 {len(pendientes)} institución(es) por enriquecer "
          f"({'todas, --refrescar' if refrescar else 'solo las que faltan'}"
          f"{f', limitado a {limite}' if limite else ''}).\n")

    stats = {"ok": 0, "sin_web": 0, "sin_datos": 0, "error": 0}
    for i, inst in enumerate(pendientes, 1):
        codigo = inst["codigo_institucion"]
        try:
            codigo_int = int(float(str(codigo)))
        except Exception:
            codigo_int = codigo

        datos = webs.get(codigo_int, {})
        web = datos.get("web", "")
        nombre = datos.get("nombre") or inst.get("nombre") or str(codigo)

        etiqueta = nombre[:50]
        print(f"[{i}/{len(pendientes)}] {etiqueta}…", end=" ", flush=True)

        if not web:
            print("⏩ sin web en SIES")
            stats["sin_web"] += 1
            continue

        try:
            crudo = firecrawl_extraer_profundo(web, fc_key) if profundo else firecrawl_extraer(web, fc_key)
        except Exception as e:
            print(f"❌ Firecrawl: {str(e)[:60]}")
            stats["error"] += 1
            time.sleep(PAUSA_SEG)
            continue

        detalles = limpiar_detalles(crudo or {})
        if not detalles:
            print("⚠️ sin datos útiles")
            stats["sin_datos"] += 1
            time.sleep(PAUSA_SEG)
            continue

        try:
            supabase.table("instituciones").update({
                "detalles": detalles,
                "sitio_web": web,
                "detalles_actualizado": datetime.now(timezone.utc).isoformat(),
            }).eq("codigo_institucion", codigo).execute()
            print(f"✅ {', '.join(detalles.keys())}")
            stats["ok"] += 1
        except Exception as e:
            print(f"❌ error BD: {str(e)[:60]}")
            stats["error"] += 1

        time.sleep(PAUSA_SEG)

    print("\n" + "=" * 70)
    print("RESUMEN")
    print(f"  ✅ Enriquecidas    : {stats['ok']}")
    print(f"  ⏩ Sin web (SIES)  : {stats['sin_web']}")
    print(f"  ⚠️ Sin datos útiles: {stats['sin_datos']}")
    print(f"  ❌ Errores         : {stats['error']}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
