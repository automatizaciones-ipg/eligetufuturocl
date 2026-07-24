"""
Genera public/data/cortes_carreras.json: el "puntaje de corte" (último
seleccionado ponderado) por carrera y año, a partir de las bases DEMRE de
POSTULACIÓN/SELECCIÓN (portal-transparencia.demre.cl → Tipo "Postulación").

A diferencia de la referencia SIES (que es un PROMEDIO), el corte es el MÍNIMO
puntaje ponderado con que alguien quedó SELECCIONADO en la carrera — el dato que
permite el veredicto duro "te alcanza / no alcanza, te faltan X pts" del
simulador.

FLUJO
  1. Por cada archivo DEMRE de Postulación en raw/ (uno por año), filtra a los
     SELECCIONADOS y calcula MIN(ponderado) por carrera = corte de ese año.
  2. Cruza (match difuso por texto) las carreras DEMRE con las nuestras usando
     institución + nombre de carrera [+ jornada + sede], igual criterio que
     exportar_ponderaciones_json.py — porque el código DEMRE ≠ código SIES.
  3. Fusiona los años en {corte_2024, corte_2025, corte_2026} y escribe el JSON
     con la MISMA forma preciso/respaldo que ponderaciones (lo consume
     resolverCorte() en src/components/CalculadoraNem.tsx).

⚠️ El esquema exacto de las bases DEMRE (nombres de columna, formato ancho vs
   largo, si trae nombres o solo códigos) varía por año. Este script resuelve
   las columnas por PALABRAS CLAVE y, si corres con --inspeccionar, sólo vuelca
   las columnas detectadas y una muestra para afinar la config. Ajusta las
   listas COL_* de abajo contra el archivo real si el auto-match falla.

USO
  python exportar_cortes_json.py --inspeccionar        # vuelca columnas/muestra
  python exportar_cortes_json.py                       # genera el JSON
"""
import argparse
import json
import os
import sys
import unicodedata

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client


# Años que trackea el histórico del simulador (debe calzar con ANIOS_CORTE del
# front). Cada uno se busca en raw/ por su archivo DEMRE de postulación.
ANIOS = [2024, 2025, 2026]

# Palabras clave para resolver columnas del archivo DEMRE (se prueban en orden;
# gana la primera columna cuyo header normalizado las contenga TODAS).
COL_PONDERADO = [["ponderado"], ["puntaje", "postulacion"], ["puntaje", "carrera"]]
COL_ESTADO = [["estado", "preferencia"], ["situacion", "postulacion"], ["marca"], ["estado"], ["situacion"]]
COL_INSTITUCION_NOMBRE = [["nombre", "institucion"], ["institucion"], ["universidad"], ["ies"]]
COL_CARRERA_NOMBRE = [["nombre", "carrera"], ["carrera"]]
COL_JORNADA = [["jornada"]]
COL_SEDE = [["sede"]]

# Valores de la columna de estado que indican SELECCIONADO (matrícula/quedó).
# DEMRE suele usar "P" (seleccionado en preferencia)/"M" (matriculado)/"S". Se
# comparan normalizados (mayúsculas, sin espacios). Ajustar si el archivo usa
# otra codificación (correr --inspeccionar muestra los valores distintos).
ESTADOS_SELECCIONADO = {"P", "M", "S", "SELECCIONADO", "MATRICULADO", "1"}


def limpiar_texto(texto):
    if pd.isna(texto):
        return ""
    t = str(texto).upper().strip()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return t.replace("'", "").replace("-", " ")


def _norm_header(h):
    t = str(h).lower().strip()
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def resolver_columna(cols, candidatos):
    norms = {c: _norm_header(c) for c in cols}
    for grupo in candidatos:
        for c, n in norms.items():
            if all(k in n for k in grupo):
                return c
    return None


def cargar_demre(ruta):
    """Carga un archivo DEMRE (csv/txt con ; o ,, o xlsx). Devuelve DataFrame."""
    ext = os.path.splitext(ruta)[1].lower()
    if ext in (".xlsx", ".xls"):
        return pd.read_excel(ruta, dtype=str)
    # CSV/TXT: DEMRE suele venir con ; y latin-1, pero probamos alternativas.
    for sep in (";", ",", "|", "\t"):
        for enc in ("latin-1", "utf-8"):
            try:
                df = pd.read_csv(ruta, sep=sep, encoding=enc, dtype=str, low_memory=False)
                if df.shape[1] >= 3:
                    return df
            except Exception:
                continue
    raise SystemExit(f"No pude parsear {ruta} (probé ; , | tab / latin-1 utf-8).")


def archivos_por_anio():
    """Busca en raw/ un archivo de postulación DEMRE por año (por el año en el
    nombre + alguna pista de 'postulacion'/'seleccion')."""
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    raw = os.path.join(BASE_DIR, "raw")
    encontrados = {}
    for f in os.listdir(raw):
        nl = _norm_header(f)
        if not any(k in nl for k in ("postulacion", "seleccion", "postula")):
            continue
        for anio in ANIOS:
            if str(anio) in f:
                encontrados.setdefault(anio, os.path.join(raw, f))
    return encontrados


def cortes_de_archivo(ruta, inspeccionar=False):
    """Devuelve {(inst_clean, carrera_clean, jornada_clean, sede_clean): corte}
    para un año, o vuelca info si inspeccionar=True."""
    df = cargar_demre(ruta)
    cols = list(df.columns)
    c_pond = resolver_columna(cols, COL_PONDERADO)
    c_estado = resolver_columna(cols, COL_ESTADO)
    c_inst = resolver_columna(cols, COL_INSTITUCION_NOMBRE)
    c_carr = resolver_columna(cols, COL_CARRERA_NOMBRE)
    c_jor = resolver_columna(cols, COL_JORNADA)
    c_sede = resolver_columna(cols, COL_SEDE)

    if inspeccionar:
        print(f"\n📄 {os.path.basename(ruta)}  ({len(df)} filas, {len(cols)} columnas)")
        print("   Columnas:", cols)
        print(f"   → ponderado={c_pond!r} estado={c_estado!r} institucion={c_inst!r} "
              f"carrera={c_carr!r} jornada={c_jor!r} sede={c_sede!r}")
        if c_estado:
            print(f"   Valores de estado ({c_estado}):", df[c_estado].dropna().astype(str).str.upper().str.strip().value_counts().head(15).to_dict())
        print("   Muestra:")
        print(df.head(3).to_string())
        return {}

    faltan = [n for n, c in [("ponderado", c_pond), ("estado", c_estado), ("institucion", c_inst), ("carrera", c_carr)] if c is None]
    if faltan:
        raise SystemExit(
            f"⚠️ No pude resolver columnas {faltan} en {os.path.basename(ruta)}. "
            f"Corre con --inspeccionar y ajusta las listas COL_* del script.")

    def es_sel(v):
        return limpiar_texto(v).replace(" ", "") in ESTADOS_SELECCIONADO

    def a_num(v):
        try:
            return float(str(v).replace(",", "."))
        except (TypeError, ValueError):
            return None

    cortes = {}
    for _, row in df.iterrows():
        if not es_sel(row.get(c_estado)):
            continue
        pond = a_num(row.get(c_pond))
        if pond is None or pond <= 0:
            continue
        inst = limpiar_texto(row.get(c_inst))
        carr = limpiar_texto(row.get(c_carr))
        if not inst or not carr:
            continue
        jor = limpiar_texto(row.get(c_jor)) if c_jor else ""
        sede = limpiar_texto(row.get(c_sede)) if c_sede else ""
        key = (inst, carr, jor, sede)
        # El corte = MÍNIMO ponderado entre seleccionados.
        if key not in cortes or pond < cortes[key]:
            cortes[key] = pond
    return cortes


def cargar_crosswalk_instituciones():
    """{nombre_institucion_clean: codigo_institucion} desde Supabase, para
    traducir el nombre DEMRE a nuestro codigo_institucion (las claves del JSON
    van en NUESTRO keyspace para que resolverCorte() del front matchee)."""
    load_dotenv()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
           or os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))
    if not url or not key:
        raise SystemExit("Faltan credenciales Supabase (PUBLIC_SUPABASE_URL + anon/service key).")
    sb: Client = create_client(url, key)
    mapa = {}
    inicio, rango = 0, 1000
    while True:
        res = sb.table("instituciones").select("codigo_institucion,nombre").range(inicio, inicio + rango - 1).execute()
        if not res.data:
            break
        for i in res.data:
            if i.get("nombre") and i.get("codigo_institucion") is not None:
                mapa.setdefault(limpiar_texto(i["nombre"]), i["codigo_institucion"])
        inicio += rango
    return mapa


def exportar():
    print("🚀 Generando cortes_carreras.json desde las bases DEMRE de postulación\n")
    archivos = archivos_por_anio()
    if not archivos:
        raise SystemExit(
            "No encontré archivos DEMRE de postulación en raw/. Descarga desde\n"
            "portal-transparencia.demre.cl → Proceso <año> → Tipo 'Postulación' → DESCARGAR\n"
            "y deja el/los archivo(s) (con el año en el nombre) en src/datos_et/raw/.")
    print("📂 Archivos detectados:", {a: os.path.basename(p) for a, p in archivos.items()})

    crosswalk = cargar_crosswalk_instituciones()
    print(f"🔗 Crosswalk institución→código: {len(crosswalk)} instituciones.")

    preciso, respaldo = {}, {}
    sin_inst = 0
    for anio, ruta in sorted(archivos.items()):
        cortes = cortes_de_archivo(ruta)
        print(f"🎯 Adm. {anio}: {len(cortes)} carreras con corte.")
        for (inst_clean, carr_clean, jor, sede), corte in cortes.items():
            cod_inst = crosswalk.get(inst_clean)
            if cod_inst is None:
                sin_inst += 1
                continue
            corte_int = int(round(corte))
            key_resp = f"{cod_inst}_{carr_clean}"
            key_prec = f"{key_resp}_{jor}_{sede}"
            respaldo.setdefault(key_resp, {})[f"corte_{anio}"] = corte_int
            preciso.setdefault(key_prec, {})[f"corte_{anio}"] = corte_int

    salida = {"preciso": preciso, "respaldo": respaldo}
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_salida = os.path.join(BASE_DIR, "..", "..", "public", "data", "cortes_carreras.json")
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    tam_kb = os.path.getsize(ruta_salida) / 1024
    print("\n" + "=" * 60)
    print(f"🎯 Claves precisas: {len(preciso)}  ·  respaldo: {len(respaldo)}")
    print(f"⚠️ Carreras DEMRE sin match de institución: {sin_inst}")
    print(f"💾 Guardado en {ruta_salida} ({tam_kb:.0f} KB)")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspeccionar", action="store_true",
                        help="Sólo vuelca columnas/muestra de los archivos DEMRE (para afinar la config).")
    args = parser.parse_args()
    if args.inspeccionar:
        archivos = archivos_por_anio()
        if not archivos:
            print("No encontré archivos de postulación en raw/ (nombre con año + 'postulacion'/'seleccion').")
            sys.exit(0)
        for anio, ruta in sorted(archivos.items()):
            cortes_de_archivo(ruta, inspeccionar=True)
    else:
        exportar()
