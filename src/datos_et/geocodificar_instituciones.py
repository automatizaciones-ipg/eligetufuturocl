"""
============================================================================
GEOCODIFICADOR DE INSTITUCIONES  ·  Elige Tu Futuro
============================================================================
Obtiene las coordenadas REALES de cada institución a partir de su dirección
oficial ("Dirección Sede Central" del Excel SIES) y las guarda en Supabase.

Por qué NO scrapeamos Google Maps:
  - Viola los Términos de Servicio de Google y es legalmente riesgoso.
  - Es frágil (cambios de DOM, CAPTCHAs, baneos de IP).
  Con la dirección real, un geocoder normal entrega coordenadas tan precisas
  como Google, de forma legal, gratuita y reproducible.

Requisitos:
  pip install pandas python-dotenv supabase requests openpyxl
  .env con SUPABASE_URL y SUPABASE_KEY (mismas que el resto de scripts ETL).
  Ejecutar antes la migración: migracion_geocoding_instituciones.sql

Uso:
  python geocodificar_instituciones.py            # geocodifica las que faltan
  python geocodificar_instituciones.py --refrescar # recalcula TODAS

El script es idempotente y reanudable: por defecto solo procesa instituciones
sin coordenadas, respeta el límite de 1 req/seg de Nominatim y reintenta con
consultas progresivamente más simples.
============================================================================
"""

import os
import re
import sys
import time
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
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "EligeTuFuturo-Geocoder/1.0 (https://eligetufuturo.cl)"
PAUSA_SEG = 1.1          # política de uso de Nominatim: máx 1 req/seg
TIMEOUT = 15

# Caja delimitadora de Chile continental + insular, para descartar falsos positivos.
CHILE_BBOX = {"lat_min": -56.0, "lat_max": -17.0, "lng_min": -110.0, "lng_max": -66.0}


def coord_en_chile(lat: float, lng: float) -> bool:
    return (CHILE_BBOX["lat_min"] <= lat <= CHILE_BBOX["lat_max"]
            and CHILE_BBOX["lng_min"] <= lng <= CHILE_BBOX["lng_max"])


# ── Geocodificación (Nominatim / OpenStreetMap) ─────────────────────────────
def geocodificar(consulta: str):
    """Devuelve (lat, lng) o None. Filtra resultados fuera de Chile."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": consulta, "format": "json", "limit": 1, "countrycodes": "cl"},
            headers={"User-Agent": USER_AGENT, "Accept-Language": "es"},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return None
        lat, lng = float(data[0]["lat"]), float(data[0]["lon"])
        if not coord_en_chile(lat, lng):
            return None
        return (lat, lng)
    except Exception:
        return None


def geocodificar_con_respaldos(direccion: str, nombre: str):
    """
    Intenta varias consultas, de la más específica a la más general:
      1) dirección real + Chile
      2) nombre + dirección (ayuda cuando la dirección sola es ambigua)
      3) nombre institución + Chile
    Devuelve (lat, lng, consulta_usada) o (None, None, None).
    """
    intentos = []
    if direccion:
        intentos.append(f"{direccion}, Chile")
        if nombre:
            intentos.append(f"{nombre}, {direccion}, Chile")
    if nombre:
        intentos.append(f"{nombre}, Chile")

    for consulta in intentos:
        coord = geocodificar(consulta)
        time.sleep(PAUSA_SEG)  # respetar a Nominatim entre cada intento
        if coord:
            return coord[0], coord[1], consulta
    return None, None, None


# ── Lectura del Excel SIES (detección robusta de encabezados) ────────────────
def cargar_direcciones_sies(ruta_excel: str) -> dict:
    """Devuelve { codigo_institucion(int): {'nombre': str, 'direccion': str} }."""
    df_raw = pd.read_excel(ruta_excel, header=None, dtype=str)

    header_row_index = -1
    for i in range(min(20, len(df_raw))):
        valores = [str(x).lower() for x in df_raw.iloc[i].values]
        has_codigo = any("código" in v or "codigo" in v for v in valores)
        has_dir = any("direcci" in v for v in valores)
        if has_codigo and has_dir:
            header_row_index = i
            break

    if header_row_index == -1:
        raise RuntimeError("No se encontró la fila de encabezados (Código institución / Dirección).")

    print(f"🎯 Encabezados reales en la fila {header_row_index + 1} del Excel.")
    df = df_raw.copy()
    df.columns = df.iloc[header_row_index]
    df = df.iloc[header_row_index + 1:].reset_index(drop=True)

    col_codigo = col_nombre = col_dir = None
    for col in df.columns:
        if pd.isna(col):
            continue
        c = str(col).lower()
        if ("código" in c or "codigo" in c) and "inst" in c:
            col_codigo = col
        if "nombre" in c and "inst" in c:
            col_nombre = col
        if "direcci" in c:
            col_dir = col

    if not col_codigo or not col_dir:
        raise RuntimeError(f"Columnas no detectadas. Disponibles: {list(df.columns)}")

    print(f"   ➤ Código    -> [{col_codigo}]")
    print(f"   ➤ Nombre    -> [{col_nombre}]")
    print(f"   ➤ Dirección -> [{col_dir}]")

    mapa = {}
    for _, row in df.iterrows():
        cod_val = row.get(col_codigo)
        if pd.isna(cod_val) or str(cod_val).strip().lower() in ("", "nan"):
            continue
        try:
            codigo = int(float(str(cod_val).strip()))
        except Exception:
            continue
        direccion = "" if pd.isna(row.get(col_dir)) else str(row.get(col_dir)).strip()
        nombre = "" if (col_nombre is None or pd.isna(row.get(col_nombre))) else str(row.get(col_nombre)).strip()
        mapa[codigo] = {"nombre": nombre, "direccion": re.sub(r"\s+", " ", direccion)}
    return mapa


# ── Proceso principal ────────────────────────────────────────────────────────
def main():
    refrescar = "--refrescar" in sys.argv

    print("\n" + "=" * 70)
    print("🗺️  GEOCODIFICACIÓN DE INSTITUCIONES (desde dirección SIES real)")
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
    if not url or not key:
        print("❌ Faltan credenciales de Supabase en .env "
              "(SUPABASE_URL/SUPABASE_KEY o PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)")
        return

    supabase: Client = create_client(url, key)
    print("✅ Conexión a Supabase establecida.")
    ruta_excel = os.path.join(BASE_DIR, "raw", "Instituciones_2025_2026_SIES.xlsx")
    if not os.path.exists(ruta_excel):
        print(f"❌ No se encontró el Excel: {ruta_excel}")
        return

    print("⏳ Leyendo direcciones del Excel SIES…")
    direcciones = cargar_direcciones_sies(ruta_excel)
    print(f"   {len(direcciones)} instituciones con datos en el Excel.\n")

    # Traer instituciones de la BD (solo las que faltan, salvo --refrescar).
    # Incluimos `detalles` para preferir la dirección exacta extraída por
    # Firecrawl cuando exista (mayor precisión que la dirección del Excel).
    resp = supabase.table("instituciones").select(
        "codigo_institucion, nombre, latitud, longitud, detalles"
    ).execute()
    instituciones = resp.data or []

    pendientes = [
        inst for inst in instituciones
        if refrescar or inst.get("latitud") is None or inst.get("longitud") is None
    ]
    print(f"📊 {len(pendientes)} institución(es) por geocodificar "
          f"({'todas, --refrescar' if refrescar else 'solo las que faltan'}).\n")

    stats = {"ok": 0, "sin_match": 0, "error": 0}
    for i, inst in enumerate(pendientes, 1):
        codigo = inst["codigo_institucion"]
        try:
            codigo_int = int(float(str(codigo)))
        except Exception:
            codigo_int = codigo

        datos = direcciones.get(codigo_int, {})
        # Prioridad: dirección exacta extraída del sitio (Firecrawl) > dirección SIES
        detalles = inst.get("detalles") or {}
        dir_exacta = detalles.get("direccion_exacta") if isinstance(detalles, dict) else None
        direccion = (dir_exacta or datos.get("direccion") or "").strip()
        nombre = datos.get("nombre") or inst.get("nombre") or ""

        etiqueta = (nombre or str(codigo))[:55]
        print(f"[{i}/{len(pendientes)}] {etiqueta}…", end=" ", flush=True)

        lat, lng, consulta = geocodificar_con_respaldos(direccion, nombre)
        if lat is None:
            print("⚠️ sin coincidencia")
            stats["sin_match"] += 1
            continue

        try:
            supabase.table("instituciones").update({
                "latitud": lat,
                "longitud": lng,
                "direccion": direccion or None,
            }).eq("codigo_institucion", codigo).execute()
            print(f"✅ {lat:.5f}, {lng:.5f}")
            stats["ok"] += 1
        except Exception as e:
            print(f"❌ error BD: {e}")
            stats["error"] += 1

    print("\n" + "=" * 70)
    print("RESUMEN")
    print(f"  ✅ Geocodificadas : {stats['ok']}")
    print(f"  ⚠️ Sin match      : {stats['sin_match']}")
    print(f"  ❌ Errores BD     : {stats['error']}")
    print("=" * 70 + "\n")


# ----------------------------------------------------------------------------
# OPCIONAL — Precisión premium con Google Geocoding API
# ----------------------------------------------------------------------------
# Si más adelante quieres exactitud "Google" en casos difíciles, reemplaza la
# llamada a geocodificar() por esta (requiere GOOGLE_MAPS_API_KEY en .env y
# habilitar Geocoding API; tiene crédito mensual gratuito que cubre de sobra
# un lote único de instituciones):
#
# def geocodificar_google(consulta: str):
#     api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
#     resp = requests.get(
#         "https://maps.googleapis.com/maps/api/geocode/json",
#         params={"address": consulta, "region": "cl", "key": api_key},
#         timeout=TIMEOUT,
#     )
#     data = resp.json()
#     if data.get("status") == "OK":
#         loc = data["results"][0]["geometry"]["location"]
#         return (loc["lat"], loc["lng"])
#     return None
# ----------------------------------------------------------------------------


if __name__ == "__main__":
    main()
