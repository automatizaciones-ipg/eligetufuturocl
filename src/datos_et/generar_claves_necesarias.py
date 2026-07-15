"""
Genera src/datos_et/claves_necesarias.json: la lista de claves de match
(institución+carrera[+jornada+sede]) que las carreras YA CARGADAS en Supabase
realmente necesitan.

exportar_ponderaciones_json.py usa este archivo para filtrar el universo SIES
completo (~29.600 filas) a solo lo que el simulador puede llegar a pedir — sin
esto, el JSON público pesa ~9MB y se manda entero a cada visitante por nada.

Correr ANTES de exportar_ponderaciones_json.py, y volver a correr cada vez que
cambien las carreras cargadas en Supabase (altas, bajas, cambios de
jornada/sede). Mismo criterio de limpieza (limpiar_texto) y misma forma de
armar las claves que backfill_ponderaciones.py — tiene que dar EXACTO el mismo
resultado o las claves no cruzan nunca.
"""
import json
import os
import unicodedata

from dotenv import load_dotenv
from supabase import create_client, Client


def limpiar_texto(texto):
    if texto is None:
        return ""
    t = str(texto).upper().strip()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return t.replace("'", "").replace("-", " ")


def generar_claves_necesarias():
    print("🚀 Generando claves_necesarias.json desde las carreras cargadas en Supabase\n")

    load_dotenv()
    # Solo lectura (SELECT) — la anon key alcanza, pero se acepta la service-role
    # por si ya está configurada (mismo fallback que backfill_ponderaciones.py).
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_KEY")
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        raise SystemExit(
            "Faltan credenciales de Supabase: define PUBLIC_SUPABASE_URL y "
            "PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY) en tu .env."
        )
    supabase: Client = create_client(url, key)

    set_preciso = set()
    set_respaldo = set()

    inicio, rango = 0, 1000
    total = 0
    print("📥 Leyendo tabla carreras...")
    while True:
        res = (
            supabase.table("carreras")
            .select("codigo_institucion, nombre_carrera, jornada, sede")
            .range(inicio, inicio + rango - 1)
            .execute()
        )
        if not res.data:
            break

        for c in res.data:
            if c.get("codigo_institucion") is None:
                continue
            nombre_clean = limpiar_texto(c["nombre_carrera"])
            key_respaldo = f"{c['codigo_institucion']}_{nombre_clean}"
            key_preciso = f"{key_respaldo}_{limpiar_texto(c.get('jornada'))}_{limpiar_texto(c.get('sede'))}"
            set_respaldo.add(key_respaldo)
            set_preciso.add(key_preciso)

        total += len(res.data)
        inicio += rango
        print(f"📦 {total} carreras leídas...")

    salida = {"preciso": sorted(set_preciso), "respaldo": sorted(set_respaldo)}

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_salida = os.path.join(BASE_DIR, "claves_necesarias.json")
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    tam_kb = os.path.getsize(ruta_salida) / 1024
    print("\n" + "=" * 60)
    print(f"🎯 Claves precisas (institución+carrera+jornada+sede): {len(set_preciso)}")
    print(f"🔁 Claves de respaldo (institución+carrera): {len(set_respaldo)}")
    print(f"💾 Guardado en {ruta_salida} ({tam_kb:.0f} KB)")
    print("=" * 60)
    print("\n➡️  Ahora corre exportar_ponderaciones_json.py para regenerar el JSON público.")


if __name__ == "__main__":
    generar_claves_necesarias()
