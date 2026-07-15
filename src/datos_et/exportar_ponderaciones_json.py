"""
Exporta las ponderaciones oficiales SIES a un JSON estático que el FRONTEND
consume directamente (src/data/ponderaciones_carreras.json), SIN tocar
Supabase. Es un stopgap mientras no se corre migracion_ponderaciones_carreras.sql
en producción: el simulador cruza este JSON con lo que Supabase ya devuelve
hoy (columnas existentes) para calcular el puntaje ponderado.

Reemplazar este JSON por las columnas reales de Supabase (ver
backfill_ponderaciones.py) es la solución definitiva; esto es solo mientras
tanto. Mismo criterio de limpieza/match que backfill_ponderaciones.py.
"""
import json
import os
import unicodedata
import pandas as pd


def limpiar_texto(texto):
    if pd.isna(texto):
        return ""
    t = str(texto).upper().strip()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return t.replace("'", "").replace("-", " ")


def a_entero(valor):
    if pd.isna(valor) or str(valor).strip() == "":
        return None
    try:
        return int(float(valor))
    except (TypeError, ValueError):
        return None


COLUMNAS_PONDERACION = {
    "ponderacion_notas": "Ponderación Notas",
    "ponderacion_ranking": "Ponderación Ranking Notas",
    "ponderacion_lenguaje": "Ponderación Lenguaje",
    "ponderacion_matematica": "Ponderación Matemáticas",
    "ponderacion_matematica2": "Ponderación Matemáticas 2",
    "ponderacion_historia": "Ponderación Historia",
    "ponderacion_ciencias": "Ponderación Ciencias",
    "ponderacion_otros": "Ponderación Otros",
}


def construir_fila(row):
    datos = {
        campo: a_entero(row.get(col_csv))
        for campo, col_csv in COLUMNAS_PONDERACION.items()
    }
    datos["vacantes_semestre_1"] = a_entero(row.get("Vacantes Semestre Uno"))
    datos["vacantes_semestre_2"] = a_entero(row.get("Vacantes Semestre Dos"))
    requisito = row.get("Requisito Ingreso")
    datos["requisito_ingreso"] = None if pd.isna(requisito) else str(requisito).strip()
    demre = row.get("Demre")
    datos["usa_demre"] = None if pd.isna(demre) else bool(a_entero(demre))
    # Si no pondera NADA, no sirve como match real (fila vacía del CSV).
    if all(datos[c] is None for c in COLUMNAS_PONDERACION):
        return None
    return datos


def exportar():
    print("🚀 Exportando ponderaciones SIES a JSON estático (sin tocar Supabase)\n")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_csv = os.path.join(BASE_DIR, "raw", "Oferta_Academica_2026_SIES_12_01_2026_WEB_E.csv")
    # En public/ (no src/data/) para que se sirva como asset estático y el
    # front lo pida con fetch() en vez de quedar inlineado en el bundle JS.
    ruta_salida = os.path.join(BASE_DIR, "..", "..", "public", "data", "ponderaciones_carreras.json")

    print("⏳ Procesando CSV...")
    df = pd.read_csv(ruta_csv, sep=";", encoding="latin-1", low_memory=False)
    print(f"📂 {len(df)} registros SIES encontrados.")

    mapa_preciso = {}
    mapa_respaldo = {}

    for _, row in df.iterrows():
        fila = construir_fila(row)
        if fila is None:
            continue

        nombre_clean = limpiar_texto(row["Nombre Carrera"])
        institucion = row["Código IES"]
        if pd.isna(institucion):
            continue
        institucion = int(institucion)

        key_respaldo = f"{institucion}_{nombre_clean}"
        mapa_respaldo.setdefault(key_respaldo, fila)

        key_preciso = f"{key_respaldo}_{limpiar_texto(row.get('Jornada'))}_{limpiar_texto(row.get('Nombre Sede'))}"
        mapa_preciso.setdefault(key_preciso, fila)

    # Filtra al universo SIES completo (29.627 filas) a solo las claves que
    # las carreras YA CARGADAS en Supabase realmente necesitan (generadas
    # aparte, ver claves_necesarias.json) — si no, el JSON pesa ~9MB y se
    # manda entero al navegador de cada visitante por nada.
    ruta_claves = os.path.join(BASE_DIR, "claves_necesarias.json")
    if os.path.exists(ruta_claves):
        with open(ruta_claves, "r", encoding="utf-8") as f:
            necesarias = json.load(f)
        set_preciso = set(necesarias["preciso"])
        set_respaldo = set(necesarias["respaldo"])
        mapa_preciso = {k: v for k, v in mapa_preciso.items() if k in set_preciso}
        mapa_respaldo = {k: v for k, v in mapa_respaldo.items() if k in set_respaldo}
        print(f"🧹 Filtrado a claves usadas por Supabase (claves_necesarias.json).")
    else:
        print("⚠️  No se encontró claves_necesarias.json — exportando el universo SIES completo (JSON grande).")

    salida = {"preciso": mapa_preciso, "respaldo": mapa_respaldo}

    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    tam_kb = os.path.getsize(ruta_salida) / 1024
    print(f"🎯 Claves precisas (institución+carrera+jornada+sede): {len(mapa_preciso)}")
    print(f"🔁 Claves de respaldo (institución+carrera): {len(mapa_respaldo)}")
    print(f"💾 Guardado en {ruta_salida} ({tam_kb:.0f} KB)")


if __name__ == "__main__":
    exportar()
