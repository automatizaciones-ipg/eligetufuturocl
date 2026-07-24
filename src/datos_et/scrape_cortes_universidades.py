"""
Construye public/data/cortes_carreras.json con el "puntaje último matriculado"
(≈ puntaje de corte / último seleccionado) por carrera y año, scrapeado de las
publicaciones OFICIALES de cada universidad.

Por qué no DEMRE: el portal de bases de datos DEMRE (la fuente comprehensiva)
está detrás de un reCAPTCHA, así que no es scrapeable automáticamente. En su
lugar, cada universidad publica oficialmente su "puntaje último matriculado" por
carrera — este script lo cosecha universidad por universidad. Cobertura =
universidades del sistema centralizado que publican tablas (NO IP/CFT ni
admisión propia; esas quedan sin corte y el simulador cae al veredicto SIES).

FORMATO DE SALIDA (igual que ponderaciones, lo consume resolverCorte() del
front): {"preciso": {}, "respaldo": {"<codInst>_<CARRERA CLEAN>": {"corte_2024":..,
"corte_2025":.., "corte_2026":..}}}. Los cortes universitarios son por carrera
(no por sede/jornada) → se emiten a nivel "respaldo".

Cada universidad se configura en UNIVERSIDADES con su URL y el índice de columna
de cada año. Correr con --diagnostico <cod> vuelca la tabla cruda para calibrar.
"""
import argparse
import io
import json
import os
import unicodedata

import pandas as pd
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

UA = {"User-Agent": "Mozilla/5.0 (compatible; EligeTuFuturo/1.0; +https://eligetufuturo.cl)"}

# Registro de universidades. Dos formatos:
#  · modo "multi": UNA tabla con una columna de corte por año (`cols`: año→col).
#  · modo "por_anio": UNA página por año (`urls`: año→url), corte en `corte_col`.
# Común: `tabla` (índice), `carrera_col`, `skiprows` (filas de cabecera).
UNIVERSIDADES = [
    {
        "codigo_institucion": 86,  # Pontificia Universidad Católica de Chile
        "nombre": "Pontificia Universidad Católica de Chile",
        "modo": "multi",
        "url": "https://admision.uc.cl/recursos/puntajes-de-ultimos-matriculados-admisiones-anteriores/",
        "tabla": 0, "carrera_col": 0, "skiprows": 2,
        "cols": {2026: 2, 2025: 4, 2024: 6},  # "Puntaje último matriculado" por año
    },
    {
        "codigo_institucion": 70,  # Universidad de Chile
        "nombre": "Universidad de Chile",
        "modo": "por_anio",
        "tabla": 0, "carrera_col": 1, "corte_col": 3, "skiprows": 1,  # col 3 = "Último/a seleccionado/a"
        "urls": {
            2024: "https://uchile.cl/admision-y-matriculas/admision-regular-pregrado/puntajes-de-ingreso-2024",
            2026: "https://uchile.cl/admision-y-matriculas/admision-regular-pregrado/puntajes-de-ingreso",
        },
    },
]

# Años que el simulador muestra en el histórico (calza con ANIOS_CORTE del front).
ANIOS = [2024, 2025, 2026]


import re

_PARENTESIS = re.compile(r"\([^)]*\)")


def limpiar_texto(texto):
    if pd.isna(texto):
        return ""
    t = str(texto).upper().strip()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    t = _PARENTESIS.sub("", t)  # quita anotaciones "(*)", "(Campus X)", etc.
    for ch in "¹²³⁴⁵*†‡":
        t = t.replace(ch, "")
    t = t.replace("'", "").replace("-", " ")
    return " ".join(t.split())


def a_corte(valor):
    """'793,12' / '793.12' / '793' → 793 (int) o None."""
    if pd.isna(valor):
        return None
    s = str(valor).strip().replace(".", "").replace(",", ".")
    try:
        n = float(s)
        return int(round(n)) if 100 <= n <= 1000 else None
    except (TypeError, ValueError):
        return None


def _filas_tabla(html, indice_tabla):
    """Devuelve las filas de la tabla como listas de TEXTO CRUDO por celda
    (preserva la coma decimal chilena, que pandas.read_html destruye)."""
    soup = BeautifulSoup(html, "html.parser")
    tablas = soup.find_all("table")
    t = tablas[indice_tabla]
    filas = []
    for tr in t.find_all("tr"):
        celdas = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
        if celdas:
            filas.append(celdas)
    return filas


def _fetch_filas(url, tabla):
    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    return _filas_tabla(r.text, tabla)


def scrapear_tabla(uni, diagnostico=False):
    """Devuelve {carrera_clean: {corte_ANIO: int}} para una universidad."""
    cortes = {}  # carrera_clean -> {corte_ANIO: int}

    if uni["modo"] == "multi":
        filas = _fetch_filas(uni["url"], uni["tabla"])
        if diagnostico:
            print(f"\n📄 {uni['nombre']} — {len(filas)} filas")
            for f in filas[:6]:
                print("  ", f)
            return {}
        min_ancho = max(uni["cols"].values())
        for row in filas[uni["skiprows"]:]:
            if len(row) <= min_ancho:
                continue
            carrera = limpiar_texto(row[uni["carrera_col"]])
            if not carrera:
                continue
            for anio, col in uni["cols"].items():
                c = a_corte(row[col])
                if c is not None:
                    cortes.setdefault(carrera, {})[f"corte_{anio}"] = c

    elif uni["modo"] == "por_anio":
        for anio, url in uni["urls"].items():
            filas = _fetch_filas(url, uni["tabla"])
            if diagnostico:
                print(f"\n📄 {uni['nombre']} {anio} — {len(filas)} filas")
                for f in filas[:6]:
                    print("  ", f)
                continue
            for row in filas[uni["skiprows"]:]:
                if len(row) <= uni["corte_col"]:
                    continue
                carrera = limpiar_texto(row[uni["carrera_col"]])
                c = a_corte(row[uni["corte_col"]])
                if carrera and c is not None:
                    cortes.setdefault(carrera, {})[f"corte_{anio}"] = c

    return cortes


def carreras_de_institucion(sb, cod_inst):
    """{nombre_carrera_clean} de una institución (para matchear los nombres
    scrapeados con los nuestros)."""
    nombres = set()
    inicio, rango = 0, 1000
    while True:
        res = sb.table("carreras").select("nombre_carrera").eq("codigo_institucion", cod_inst).range(inicio, inicio + rango - 1).execute()
        if not res.data:
            break
        for c in res.data:
            nombres.add(limpiar_texto(c["nombre_carrera"]))
        inicio += rango
    return nombres


def construir():
    print("🚀 Construyendo cortes_carreras.json desde publicaciones oficiales universitarias\n")
    load_dotenv()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
           or os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))
    if not url or not key:
        raise SystemExit("Faltan credenciales Supabase en .env.")
    sb: Client = create_client(url, key)

    respaldo = {}
    total_scrap = total_match = 0
    for uni in UNIVERSIDADES:
        cod = uni["codigo_institucion"]
        try:
            cortes = scrapear_tabla(uni)
        except Exception as e:
            print(f"⚠️  {uni['nombre']}: error scrapeando ({type(e).__name__}: {e}). Se omite.")
            continue
        nuestras = carreras_de_institucion(sb, cod)
        matched = 0
        no_match = []
        for carrera_clean, datos in cortes.items():
            total_scrap += 1
            if carrera_clean in nuestras:
                respaldo[f"{cod}_{carrera_clean}"] = datos
                matched += 1
            else:
                no_match.append(carrera_clean)
        total_match += matched
        print(f"🏛️  {uni['nombre']} (cod {cod}): {len(cortes)} carreras scrapeadas, "
              f"{matched} matcheadas con nuestra BD, {len(no_match)} sin match.")
        if no_match:
            print("     Sin match (revisar nombres):", ", ".join(sorted(no_match)[:12]),
                  ("…" if len(no_match) > 12 else ""))

    salida = {"preciso": {}, "respaldo": respaldo}
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_salida = os.path.join(BASE_DIR, "..", "..", "public", "data", "cortes_carreras.json")
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    tam_kb = os.path.getsize(ruta_salida) / 1024
    print("\n" + "=" * 60)
    print(f"🎯 Cortes escritos (respaldo): {len(respaldo)}  "
          f"(de {total_scrap} scrapeadas, {total_match} matcheadas)")
    print(f"💾 Guardado en {ruta_salida} ({tam_kb:.0f} KB)")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--diagnostico", type=int, help="codigo_institucion a diagnosticar (vuelca tabla cruda)")
    args = parser.parse_args()
    if args.diagnostico:
        uni = next((u for u in UNIVERSIDADES if u["codigo_institucion"] == args.diagnostico), None)
        if not uni:
            raise SystemExit(f"No hay universidad con código {args.diagnostico} en UNIVERSIDADES.")
        scrapear_tabla(uni, diagnostico=True)
    else:
        construir()
