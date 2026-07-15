import os
import unicodedata
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURACIÓN Y LIMPIEZA (mismo criterio que master_injector.py) ---
def limpiar_texto(texto):
    """Limpia texto para matches perfectos (sin tildes, mayúsculas, sin espacios extra)."""
    if pd.isna(texto):
        return ""
    t = str(texto).upper().strip()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return t.replace("'", "").replace("-", " ")


def a_entero(valor):
    """Convierte un valor de ponderación/vacantes del CSV a int o None."""
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


def construir_fila_update(row):
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

    return datos


def backfill_ponderaciones():
    print("🚀 INICIANDO BACKFILL DE PONDERACIONES SIES (Fase 1 del Simulador de Admisión)\n")

    load_dotenv()
    # El .env del proyecto usa PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (no
    # SUPABASE_URL/SUPABASE_KEY) — se necesita la service-role key porque el
    # backfill hace UPDATE, y la anon key no tiene permiso de escritura.
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit(
            "Faltan credenciales de Supabase: define PUBLIC_SUPABASE_URL y "
            "SUPABASE_SERVICE_ROLE_KEY en tu .env antes de correr este script."
        )
    supabase: Client = create_client(url, key)

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_csv = os.path.join(BASE_DIR, "raw", "Oferta_Academica_2026_SIES_12_01_2026_WEB_E.csv")

    print("⏳ Procesando CSV (Esto toma un par de segundos)...")
    df = pd.read_csv(ruta_csv, sep=";", encoding="latin-1", low_memory=False)
    print(f"📂 Archivo CSV cargado: {len(df)} registros encontrados en el SIES.")

    # Mapa PRECISO: institución + carrera + jornada + sede (distingue versiones
    # del mismo programa, ej. presencial vs a distancia).
    mapa_preciso = {}
    # Mapa de RESPALDO: institución + carrera (igual criterio que ya usa
    # master_injector.py para acreditación) — se usa solo si no hay match preciso.
    mapa_respaldo = {}

    for _, row in df.iterrows():
        nombre_clean = limpiar_texto(row["Nombre Carrera"])
        institucion = row["Código IES"]
        fila = construir_fila_update(row)

        key_respaldo = f"{institucion}_{nombre_clean}"
        mapa_respaldo.setdefault(key_respaldo, fila)

        key_preciso = f"{key_respaldo}_{limpiar_texto(row.get('Jornada'))}_{limpiar_texto(row.get('Nombre Sede'))}"
        mapa_preciso.setdefault(key_preciso, fila)

    inicio, rango = 0, 1000
    actualizadas_preciso = 0
    actualizadas_respaldo = 0
    omitidas = 0
    sin_match = 0

    print("📥 Iniciando revisión y cruce con Supabase...")
    while True:
        res_carreras = (
            supabase.table("carreras")
            .select(
                "id, codigo_institucion, nombre_carrera, jornada, sede, "
                "ponderacion_notas, ponderacion_ranking, ponderacion_lenguaje, "
                "ponderacion_matematica, ponderacion_matematica2, ponderacion_historia, "
                "ponderacion_ciencias, ponderacion_otros"
            )
            .range(inicio, inicio + rango - 1)
            .execute()
        )
        if not res_carreras.data:
            break

        for c in res_carreras.data:
            nombre_clean = limpiar_texto(c["nombre_carrera"])
            key_respaldo = f"{c['codigo_institucion']}_{nombre_clean}"
            key_preciso = f"{key_respaldo}_{limpiar_texto(c.get('jornada'))}_{limpiar_texto(c.get('sede'))}"

            fila = mapa_preciso.get(key_preciso)
            es_preciso = fila is not None
            if fila is None:
                fila = mapa_respaldo.get(key_respaldo)

            if fila is None:
                sin_match += 1
                continue

            # LÓGICA INTELIGENTE: si ya tiene exactamente esos valores, se salta.
            ya_al_dia = all(c.get(campo) == fila[campo] for campo in COLUMNAS_PONDERACION)
            if ya_al_dia:
                omitidas += 1
                continue

            supabase.table("carreras").update(fila).eq("id", c["id"]).execute()
            if es_preciso:
                actualizadas_preciso += 1
            else:
                actualizadas_respaldo += 1

        inicio += rango
        print(f"📦 Bloque de {inicio} carreras analizado...")

    print("\n" + "=" * 60)
    print("🎉 BACKFILL DE PONDERACIONES FINALIZADO")
    print(f"🎯 Actualizadas con match preciso (institución+carrera+jornada+sede): {actualizadas_preciso}")
    print(f"🔁 Actualizadas con match de respaldo (institución+carrera): {actualizadas_respaldo}")
    print(f"⏩ Omitidas (ya estaban al día): {omitidas}")
    print(f"⚠️ Sin match en el SIES: {sin_match}")
    print("=" * 60)


if __name__ == "__main__":
    backfill_ponderaciones()
