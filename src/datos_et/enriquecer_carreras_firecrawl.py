"""
============================================================================
ENRIQUECEDOR DE CARRERAS con FIRECRAWL  ·  Elige Tu Futuro
============================================================================
Investiga en la WEB PÚBLICA el perfil profesional de cada carrera (perfil de
egreso, campo laboral, qué aprenderás, habilidades, título) y lo guarda en la
columna JSONB `detalles` de `carreras`.

Eficiencia: hay ~9.900 carreras pero solo ~1.575 NOMBRES únicos. El perfil de
egreso de "Actuación Teatral" es el mismo en toda institución, así que
enriquecemos UNA vez por nombre y lo aplicamos a todas las carreras con ese
nombre (actualización masiva). 6x menos llamadas, misma precisión.

Procesa los nombres MÁS COMUNES primero → máxima cobertura por crédito.

Requisitos:
  pip install pandas python-dotenv supabase requests openpyxl
  .env con FIRECRAWL_API_KEY (+ Supabase, resuelto de forma flexible)
  Ejecutar antes: migracion_detalles_carreras.sql

Uso:
  python enriquecer_carreras_firecrawl.py --limite 10   # prueba (10 nombres top)
  python enriquecer_carreras_firecrawl.py --limite 200  # cubre la mayoría del tráfico
  python enriquecer_carreras_firecrawl.py               # todos los nombres que falten
  python enriquecer_carreras_firecrawl.py --solo "Actuación Teatral"  # un nombre puntual
============================================================================
"""

import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

FIRECRAWL_SEARCH_URL = "https://api.firecrawl.dev/v1/search"
FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v1/scrape"
PAUSA_SEG = 1.0
TIMEOUT_HTTP = 100

SCHEMA = {
    "type": "object",
    "properties": {
        "resumen": {"type": "string", "description": "Descripción clara y atractiva de en qué consiste la carrera (2-3 frases)"},
        "perfil_egreso": {"type": "string", "description": "Qué es capaz de hacer el profesional egresado (2-3 frases)"},
        "campo_laboral": {"type": "array", "items": {"type": "string"}, "description": "Lugares, áreas o cargos donde puede desempeñarse"},
        "que_aprenderas": {"type": "array", "items": {"type": "string"}, "description": "Principales áreas o materias que se estudian"},
        "habilidades": {"type": "array", "items": {"type": "string"}, "description": "Habilidades y competencias clave que desarrolla"},
        "titulo": {"type": "string", "description": "Título profesional o técnico que se obtiene"},
    },
}
PROMPT = (
    "Extrae información general y precisa sobre esta carrera de educación superior chilena. "
    "Usa SOLO datos presentes en la página. Responde en español, claro y conciso."
)

# Dominios preferidos (info confiable de carreras en Chile) y a evitar.
DOMINIOS_PREF = ("mifuturo.cl", "mineduc.cl", ".edu", "universidad", "uchile", "duoc", "inacap", "santotomas", "aiep")
DOMINIOS_EVITAR = ("facebook.", "instagram.", "youtube.", "tiktok.", "linkedin.", "twitter.", "x.com")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", (s or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", "", s)).strip()


def limpiar(raw: dict) -> dict:
    if not isinstance(raw, dict):
        return {}
    out = {}
    for k, v in raw.items():
        if v in (None, "", [], {}):
            continue
        if isinstance(v, list):
            v = [str(x).strip() for x in v if str(x).strip()][:8]
            if not v:
                continue
        elif isinstance(v, str):
            v = v.strip()
            if not v:
                continue
        out[k] = v
    return out


def firecrawl_search(query, api_key, limit=4):
    try:
        r = requests.post(
            FIRECRAWL_SEARCH_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"query": query, "limit": limit},
            timeout=TIMEOUT_HTTP,
        )
        r.raise_for_status()
        data = r.json()
        if not data.get("success"):
            return []
        urls = [it.get("url") for it in data.get("data", []) if it.get("url")]
        return urls
    except Exception:
        return []


def firecrawl_extraer(url, api_key):
    payload = {
        "url": url,
        "formats": ["extract"],
        "extract": {"schema": SCHEMA, "prompt": PROMPT},
        "onlyMainContent": True,
        "timeout": 45000,
    }
    r = requests.post(
        FIRECRAWL_SCRAPE_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json=payload,
        timeout=TIMEOUT_HTTP,
    )
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        return None
    d = data.get("data", {}) or {}
    return d.get("extract") or d.get("json") or d.get("llm_extraction")


def elegir_urls(urls):
    """Ordena: dominios preferidos primero, descarta redes sociales."""
    buenos = [u for u in urls if not any(b in u.lower() for b in DOMINIOS_EVITAR)]
    pref = [u for u in buenos if any(p in u.lower() for p in DOMINIOS_PREF)]
    resto = [u for u in buenos if u not in pref]
    return pref + resto


def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


def main():
    refrescar = "--refrescar" in sys.argv
    limite = None
    solo = None
    if "--limite" in sys.argv:
        try:
            limite = int(sys.argv[sys.argv.index("--limite") + 1])
        except Exception:
            limite = None
    if "--solo" in sys.argv:
        try:
            solo = sys.argv[sys.argv.index("--solo") + 1]
        except Exception:
            solo = None

    print("\n" + "=" * 70)
    print("🎓 ENRIQUECIMIENTO DE CARRERAS con FIRECRAWL")
    print("=" * 70 + "\n")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    load_dotenv()
    load_dotenv(os.path.join(BASE_DIR, "..", "..", ".env"))

    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (os.environ.get("SUPABASE_KEY")
           or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
           or os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))
    fc_key = os.environ.get("FIRECRAWL_API_KEY")
    if not url or not key:
        print("❌ Faltan credenciales de Supabase en .env")
        return
    if not fc_key:
        print("❌ Falta FIRECRAWL_API_KEY en .env")
        return

    sb: Client = create_client(url, key)
    print("✅ Conexión a Supabase establecida.")

    # 1) Traer todas las carreras (paginado) y agrupar por nombre normalizado.
    print("⏳ Cargando carreras y agrupando por nombre…")
    grupos = {}   # norm -> {"raw": nombre, "codigos": [...], "tiene": bool}
    page = 0
    while True:
        r = sb.table("carreras").select("codigo_carrera, nombre_carrera, detalles").range(page * 1000, page * 1000 + 999).execute()
        if not r.data:
            break
        for row in r.data:
            nombre = (row.get("nombre_carrera") or "").strip()
            if not nombre:
                continue
            n = norm(nombre)
            g = grupos.setdefault(n, {"raw": nombre, "codigos": [], "tiene": False})
            g["codigos"].append(row["codigo_carrera"])
            if row.get("detalles"):
                g["tiene"] = True
        page += 1
        if page > 40:
            break

    print(f"   {len(grupos)} nombres de carrera únicos.")

    # 2) Seleccionar pendientes, ordenados por frecuencia (más comunes primero).
    pendientes = []
    for n, g in grupos.items():
        if solo and norm(solo) != n:
            continue
        if refrescar or not g["tiene"]:
            pendientes.append((n, g))
    pendientes.sort(key=lambda x: len(x[1]["codigos"]), reverse=True)
    if limite:
        pendientes = pendientes[:limite]

    print(f"📊 {len(pendientes)} nombre(s) por enriquecer "
          f"({'--refrescar' if refrescar else 'solo los que faltan'}"
          f"{f', limitado a {limite}' if limite else ''}).\n")

    stats = {"ok": 0, "sin_fuente": 0, "sin_datos": 0, "error": 0, "carreras": 0}
    for i, (n, g) in enumerate(pendientes, 1):
        nombre = g["raw"]
        ncarreras = len(g["codigos"])
        print(f"[{i}/{len(pendientes)}] {nombre[:48]} (x{ncarreras})…", end=" ", flush=True)

        urls = elegir_urls(firecrawl_search(
            f"{nombre} carrera educación superior Chile perfil de egreso campo laboral", fc_key))
        time.sleep(PAUSA_SEG)
        if not urls:
            print("⏩ sin fuentes")
            stats["sin_fuente"] += 1
            continue

        detalles = {}
        for u in urls[:2]:   # intenta las 2 mejores fuentes
            try:
                crudo = firecrawl_extraer(u, fc_key)
            except Exception:
                crudo = None
            time.sleep(PAUSA_SEG)
            d = limpiar(crudo or {})
            if d:
                detalles = d
                break

        if not detalles:
            print("⚠️ sin datos")
            stats["sin_datos"] += 1
            continue

        try:
            ahora = datetime.now(timezone.utc).isoformat()
            for chunk in chunks(g["codigos"], 200):
                sb.table("carreras").update(
                    {"detalles": detalles, "detalles_actualizado": ahora}
                ).in_("codigo_carrera", chunk).execute()
            print(f"✅ {', '.join(detalles.keys())}  → {ncarreras} carreras")
            stats["ok"] += 1
            stats["carreras"] += ncarreras
        except Exception as e:
            print(f"❌ error BD: {str(e)[:50]}")
            stats["error"] += 1

    print("\n" + "=" * 70)
    print("RESUMEN")
    print(f"  ✅ Nombres enriquecidos : {stats['ok']}")
    print(f"  📚 Carreras cubiertas   : {stats['carreras']}")
    print(f"  ⏩ Sin fuente web       : {stats['sin_fuente']}")
    print(f"  ⚠️ Sin datos útiles     : {stats['sin_datos']}")
    print(f"  ❌ Errores              : {stats['error']}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
