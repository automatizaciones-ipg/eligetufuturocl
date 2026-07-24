"""
Exporta la REFERENCIA DE INGRESO por carrera (promedios de matrícula del cohorte
2025, fuente oficial SIES/MINEDUC) a un JSON estático que el FRONTEND consume
directo (public/data/referencia_ingreso.json), SIN tocar Supabase.

El simulador de admisión usa este dato para el veredicto "¿te alcanza?" v1:
compara el promedio PAES/NEM del alumno contra el promedio de los admitidos a
esa carrera. NO es el "corte" (último seleccionado) — eso es un promedio, no el
mínimo; el corte exacto viene después de las bases DEMRE (ver plan Parte 2).

A diferencia de exportar_ponderaciones_json.py (que cruza por texto
institución+carrera+jornada+sede), acá el JOIN es DIRECTO por `codigo_carrera`
(el código único SIES I…S…C…J…V…), porque la fuente ya trae ese mismo código y
la tarjeta del simulador ya lo lleva. Cero match difuso.

Fuente: src/datos_et/clean/carreras_bd_lista.json (derivado de oferta.xlsx /
mifuturo.cl). Ojo: sus claves de columna vienen con mojibake latin-1, por eso se
resuelven por substring normalizado y no por igualdad exacta de header.
"""
import json
import os
import re
import unicodedata


# Mismo criterio que esCodigoRutaValido() de src/utils/formatters.ts: descarta
# códigos basura que la ingesta SIES cuela (None, notas al pie tipo
# "FUENTE: Portal mifuturo.cl...") y que romperían el link a /carrera/[id].
_RE_CODIGO = re.compile(r"^[A-Za-z0-9_-]+$")


def es_codigo_valido(code):
    if code is None:
        return False
    s = str(code).strip()
    return 0 < len(s) <= 40 and bool(_RE_CODIGO.match(s))


def _norm(texto):
    t = str(texto).lower()
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def resolver_columna(muestra, *subs):
    """Encuentra el nombre real (con mojibake) de una columna por substrings."""
    subs_norm = [_norm(s) for s in subs]
    for k in muestra.keys():
        kn = _norm(k)
        if all(s in kn for s in subs_norm):
            return k
    return None


def a_float(valor, decimales):
    if valor is None:
        return None
    if isinstance(valor, bool):
        return None
    try:
        return round(float(valor), decimales)
    except (TypeError, ValueError):
        return None


def a_texto(valor):
    if valor is None:
        return None
    s = str(valor).strip()
    if s == "" or s.lower() in ("nan", "none"):
        return None
    return s


def exportar():
    print("🚀 Exportando referencia de ingreso (promedios de matrícula SIES 2025) a JSON estático\n")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_fuente = os.path.join(BASE_DIR, "clean", "carreras_bd_lista.json")
    # En public/ (no src/data/) para servirlo como asset estático y pedirlo con
    # fetch() en vez de inlinearlo en el bundle JS. Mismo criterio que
    # ponderaciones_carreras.json.
    ruta_salida = os.path.join(BASE_DIR, "..", "..", "public", "data", "referencia_ingreso.json")

    with open(ruta_fuente, "r", encoding="utf-8") as f:
        registros = json.load(f)
    print(f"📂 {len(registros)} registros en carreras_bd_lista.json.")

    muestra = registros[0]
    col_cod = resolver_columna(muestra, "codigo", "carrera")
    col_paes = resolver_columna(muestra, "promedio", "paes")
    col_nem = resolver_columna(muestra, "promedio", "nem")
    col_rango = resolver_columna(muestra, "rango", "ingreso")
    if not col_cod:
        raise SystemExit("No se pudo resolver la columna de código único de carrera.")
    print(f"🔑 Columnas: cod={col_cod!r} paes={col_paes!r} nem={col_nem!r} rango={col_rango!r}")

    salida = {}
    descartados_codigo = 0
    for r in registros:
        codigo = r.get(col_cod)
        if not es_codigo_valido(codigo):
            descartados_codigo += 1
            continue
        codigo = str(codigo).strip()

        promedio_paes = a_float(r.get(col_paes), 1) if col_paes else None
        promedio_nem = a_float(r.get(col_nem), 2) if col_nem else None
        pct_paes = a_texto(r.get(col_rango)) if col_rango else None

        # Sin ningún promedio, la carrera no aporta referencia — se omite para no
        # inflar el JSON con entradas vacías (mismo criterio que ponderaciones).
        if promedio_paes is None and promedio_nem is None:
            continue

        fila = {}
        if promedio_paes is not None:
            fila["promedio_paes"] = promedio_paes
        if promedio_nem is not None:
            fila["promedio_nem"] = promedio_nem
        if pct_paes is not None:
            fila["pct_paes"] = pct_paes

        # setdefault: si el mismo código apareciera dos veces, gana el primero.
        salida.setdefault(codigo, fila)

    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    con_paes = sum(1 for v in salida.values() if "promedio_paes" in v)
    con_nem = sum(1 for v in salida.values() if "promedio_nem" in v)
    tam_kb = os.path.getsize(ruta_salida) / 1024
    print("\n" + "=" * 60)
    print(f"🎯 Carreras con referencia: {len(salida)}")
    print(f"   • con promedio PAES: {con_paes}")
    print(f"   • con promedio NEM:  {con_nem}")
    print(f"🗑️  Descartadas por código inválido/basura: {descartados_codigo}")
    print(f"💾 Guardado en {ruta_salida} ({tam_kb:.0f} KB)")
    print("=" * 60)


if __name__ == "__main__":
    exportar()
