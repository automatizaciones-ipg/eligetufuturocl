import os
import pandas as pd
import unicodedata
from dotenv import load_dotenv
from supabase import create_client, Client

def limpiar_texto_cruce(texto):
    """Limpieza fonética extrema para asegurar el match entre BD y SIES."""
    if pd.isna(texto): 
        return ""
    t = str(texto).upper().strip()
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')

def inyectar_empleabilidad():
    print("🚀 Iniciando Actualización Quirúrgica (MODO SUPERVISADO)...")
    
    # 1. Conexión a Supabase
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print("❌ Error: Credenciales de Supabase (.env) no encontradas.")
        return
    supabase: Client = create_client(url, key)

    # 2. Cargar el EXCEL del SIES directamente
    ruta_excel = 'raw/empleo_sies.xlsx'
    print(f"📂 Leyendo Excel oficial: {ruta_excel}")
    try:
        df_empleo = pd.read_excel(ruta_excel, sheet_name='Carreras e IES (2025-2026)', header=0) 
    except Exception as e:
        print(f"❌ Error al leer el Excel: {e}")
        return

    # 3. Construir Cerebro de Cruce
    print("🧠 Construyendo mapa de cruce fonético...")
    mapa_datos = {}
    
    for idx, row in df_empleo.iterrows():
        cod_inst = row.get('Código')
        if pd.isna(cod_inst): continue
        try: cod_inst = int(cod_inst)
        except: continue

        emp = row.get('Empleabilidad 1er año')
        if pd.isna(emp) or str(emp).lower().strip() in ['s/i', 'n/a', '-', 'sin información', 'nan']:
            emp_clean = None
        else:
            try: emp_clean = float(emp)
            except: emp_clean = None

        ing = row.get('Ingreso Promedio al 4° año')
        if pd.isna(ing) or str(ing).lower().strip() in ['s/i', 'n/a', '-', 'sin información', 'nan']:
            ing_clean = None
        else:
            ing_clean = str(ing).strip()

        nom_gen = limpiar_texto_cruce(row.get('Nombre carrera genérica'))
        nom_tit = limpiar_texto_cruce(row.get('Nombre carrera (del título)'))

        datos = {'empleabilidad': emp_clean, 'ingreso': ing_clean}
        
        if nom_gen: mapa_datos[f"{cod_inst}_{nom_gen}"] = datos
        if nom_tit: mapa_datos[f"{cod_inst}_{nom_tit}"] = datos

    print(f"✅ Mapa construido con {len(mapa_datos)} combinaciones únicas del Mineduc.")

    # 4. Descargar TODO de tu Supabase
    print("📥 Descargando carreras actuales de Supabase (paginado)...")
    carreras_db = []
    inicio = 0
    rango = 1000
    while True:
        res = supabase.table('carreras').select('id, codigo_institucion, nombre_carrera').range(inicio, inicio + rango - 1).execute()
        if not res.data: break
        carreras_db.extend(res.data)
        inicio += rango

    total_carreras = len(carreras_db)
    print(f"✅ Se descargaron {total_carreras} carreras de tu BD para analizar.")

    # 5. Cruzar datos e Inyectar con LOGS EN TIEMPO REAL
    print("\n⚙️ INICIANDO INYECCIÓN A SUPABASE (No cierres la consola)...\n")
    actualizadas = 0
    sin_datos = 0
    errores = 0

    for i, carrera in enumerate(carreras_db, 1):
        c_id = carrera['id']
        c_inst = carrera['codigo_institucion']
        nombre_original = carrera['nombre_carrera']
        c_nom = limpiar_texto_cruce(nombre_original)

        key = f"{c_inst}_{c_nom}"
        
        # Evaluar si hay match
        if key in mapa_datos and (mapa_datos[key]['empleabilidad'] is not None or mapa_datos[key]['ingreso'] is not None):
            nuevos_datos = {
                'empleabilidad_1er_anio': mapa_datos[key]['empleabilidad'],
                'ingreso_promedio_4to_anio': mapa_datos[key]['ingreso']
            }
            
            try:
                # Update individual a la BD
                supabase.table('carreras').update(nuevos_datos).eq('id', c_id).execute()
                actualizadas += 1
                
                # LOG DE ÉXITO VISUAL: Te muestra qué le inyectó
                emp_str = f"{nuevos_datos['empleabilidad_1er_anio']*100:.1f}%" if nuevos_datos['empleabilidad_1er_anio'] else "N/A"
                print(f"🟢 [{i}/{total_carreras}] MATCH! ID {c_id} | {nombre_original[:25]}... -> Emp: {emp_str} | Sueldo: {nuevos_datos['ingreso_promedio_4to_anio']}")
            
            except Exception as e:
                errores += 1
                print(f"🔴 [{i}/{total_carreras}] ERROR EN ID {c_id}: {e} (Saltando a la siguiente...)")
        
        else:
            sin_datos += 1
            # Si no hace match, solo imprime un punto o un resumen cada 100 para no saturar la pantalla
            if i % 100 == 0:
                print(f"⏳ [{i}/{total_carreras}] Escaneando... (Actualizadas hasta ahora: {actualizadas})")

    # RESUMEN FINAL
    print("\n=======================================================")
    print(f"🎉 PROCESO FINALIZADO")
    print(f"✅ ÉXITOS: {actualizadas} carreras actualizadas con datos.")
    print(f"⚠️ SIN MATCH/INFO: {sin_datos} carreras.")
    if errores > 0:
        print(f"🔴 ERRORES DE RED/BD: {errores} carreras fallaron.")
    print("=======================================================\n")

if __name__ == "__main__":
    inyectar_empleabilidad()