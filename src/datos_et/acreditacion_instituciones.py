import os
import re
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# =========================================================
# MOTOR DE TRANSFORMACIÓN DE DATOS (PARSEO SEGURO)
# =========================================================
def extraer_anios_acreditacion(valor):
    """Extrae matemáticamente el número de años, soportando cualquier formato loco del SIES."""
    if pd.isna(valor) or str(valor).strip() == '': 
        return 0
    
    valor_str = str(valor).strip().lower()
    
    if 'no' in valor_str or 'sin' in valor_str:
        return 0
        
    digitos = re.findall(r'\d+', valor_str)
    if digitos:
        return int(digitos[0])
    
    return 0

# =========================================================
# FUNCIÓN PRINCIPAL DE INYECCIÓN
# =========================================================
def inyectar_acreditacion_institucional():
    print("\n" + "="*70)
    print("🚀 INICIANDO INYECCIÓN BLINDADA DE ACREDITACIÓN INSTITUCIONAL 2026")
    print("="*70 + "\n")
    
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ ERROR FATAL: Credenciales de Supabase no encontradas en el archivo .env")
        return
        
    try:
        supabase: Client = create_client(url, key)
        print("✅ Conexión a Supabase establecida exitosamente.")
    except Exception as e:
        print(f"❌ ERROR DE CONEXIÓN: No se pudo conectar a la base de datos. Detalles: {e}")
        return

    # RUTEO DINÁMICO
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_excel = os.path.join(BASE_DIR, 'raw', 'Instituciones_2025_2026_SIES.xlsx')
    
    if not os.path.exists(ruta_excel):
        print(f"❌ ERROR DE ARCHIVO: No se encontró el Excel.\nEsperado en: {ruta_excel}")
        return

    try:
        print("\n⏳ [Fase 1] Escaneando estructura del Excel Oficial...")
        # 💡 SOLUCIÓN EXTREMA: Leer sin cabeceras para buscar dónde están realmente
        df_raw = pd.read_excel(ruta_excel, header=None, dtype=str)
        
        header_row_index = -1
        
        # Escaneamos las primeras 20 filas buscando las verdaderas cabeceras
        for i in range(min(20, len(df_raw))):
            row_values = [str(x).lower() for x in df_raw.iloc[i].values]
            
            # Buscamos palabras clave de las columnas que necesitamos
            has_codigo = any('código' in val or 'codigo' in val for val in row_values)
            has_ies = any('ies' in val or 'institución' in val or 'institucion' in val for val in row_values)
            
            if has_codigo and has_ies:
                header_row_index = i
                break
                
        if header_row_index == -1:
            print("❌ ERROR ESTRUCTURAL FATAL: No se encontró ninguna fila que contenga los nombres de las columnas (Código IES).")
            return
            
        print(f"🎯 ¡Cabeceras reales encontradas en la fila {header_row_index + 1} del Excel!")
        
        # -------------------------------------------------------------
        # RECONSTRUCCIÓN DEL DATAFRAME
        # -------------------------------------------------------------
        # Asignamos esa fila como las cabeceras reales y cortamos la "basura" de arriba
        df = df_raw.copy()
        df.columns = df.iloc[header_row_index]
        df = df.iloc[header_row_index + 1:].reset_index(drop=True)
        
        # -------------------------------------------------------------
        # DETECCIÓN DE COLUMNAS EXACTAS
        # -------------------------------------------------------------
        col_codigo = None
        col_anios = None
        
        for col in df.columns:
            if pd.isna(col): continue
            c_low = str(col).lower()
            
            if ('código' in c_low or 'codigo' in c_low) and ('ies' in c_low or 'inst' in c_low):
                col_codigo = col
            # Buscamos columnas como "Años de Acreditación" o "Acreditación Institucional"
            if ('año' in c_low and 'acred' in c_low) or ('acreditación' in c_low and 'inst' in c_low) or ('acreditacion' in c_low and 'inst' in c_low):
                col_anios = col

        if not col_codigo or not col_anios: 
            print("❌ ERROR ESTRUCTURAL: No detecté las columnas necesarias.")
            print(f"📊 Columnas reconstruidas: {list(df.columns)}")
            return

        print(f"   ➤ Columna identificadora -> [{col_codigo}]")
        print(f"   ➤ Columna de Años        -> [{col_anios}]")

        # -------------------------------------------------------------
        # CREACIÓN DEL DICCIONARIO DE MEMORIA
        # -------------------------------------------------------------
        print("\n⏳ [Fase 2] Extrayendo datos y limpiando celdas...")
        mapa_acreditacion = {}
        for idx, row in df.iterrows():
            try:
                cod_val = row.get(col_codigo)
                if pd.isna(cod_val) or str(cod_val).strip() == '' or str(cod_val).lower() == 'nan': continue
                
                # Conversión estricta a Integer de Python
                codigo_ies = int(float(str(cod_val).strip())) 
                
                anios_crudos = row.get(col_anios)
                anios_limpios = extraer_anios_acreditacion(anios_crudos)
                
                mapa_acreditacion[codigo_ies] = anios_limpios
            except Exception:
                # Ignoramos filas que son basura o totales
                continue

        print(f"🧠 Diccionario en memoria listo: {len(mapa_acreditacion)} instituciones procesadas.")

        # -------------------------------------------------------------
        # DESCARGA DE BD PARA IDEMPOTENCIA
        # -------------------------------------------------------------
        print("\n📥 [Fase 3] Descargando estado actual de Supabase...")
        res_inst = supabase.table('instituciones').select('codigo_institucion, nombre, acreditada, anios_acreditacion').execute()
        inst_db = res_inst.data
        
        if not inst_db:
            print("⚠️ No tienes instituciones registradas en tu Base de Datos.")
            return

        stats = {"updates": 0, "omitidas": 0, "sin_match": 0, "errores": 0}

        # -------------------------------------------------------------
        # CRUCE QUIRÚRGICO (FILA POR FILA)
        # -------------------------------------------------------------
        print("\n⚙️ [Fase 4] INICIANDO INYECCIÓN Y CRUCE QUIRÚRGICO")
        print("-" * 70)
        
        for inst in inst_db:
            cod_db = int(inst['codigo_institucion'])
            
            if cod_db in mapa_acreditacion:
                anios_excel = int(mapa_acreditacion[cod_db])
                es_acreditada = bool(anios_excel > 0)
                
                # Leer BD
                anios_bd = int(inst.get('anios_acreditacion') or 0)
                acreditada_bd = bool(inst.get('acreditada') or False)
                
                # IDEMPOTENCIA
                if anios_bd == anios_excel and acreditada_bd == es_acreditada:
                    stats["omitidas"] += 1
                    continue
                
                # PAYLOAD
                datos_update = {
                    "anios_acreditacion": anios_excel,
                    "acreditada": es_acreditada
                }
                
                try:
                    supabase.table('instituciones').update(datos_update).eq('codigo_institucion', cod_db).execute()
                    stats["updates"] += 1
                    print(f"🟢 EXITO [{cod_db}] {inst['nombre'][:35]:<35} | Años: {anios_bd} ➔ {anios_excel} | Acred: {acreditada_bd} ➔ {es_acreditada}")
                except Exception as update_e:
                    stats["errores"] += 1
                    print(f"❌ ERROR AL ACTUALIZAR [{cod_db}] {inst['nombre']}: {update_e}")
                    
            else:
                stats["sin_match"] += 1

    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO GLOBAL: El proceso falló y fue abortado.\nDetalle Técnico: {e}")

    # =========================================================
    # REPORTE FINAL DE DATA ENGINEERING
    # =========================================================
    print("\n" + "="*70)
    print("📊 REPORTE FINAL DE EJECUCIÓN (DATA PIPELINE SIES)")
    print("="*70)
    print(f"  ✅ Actualizadas con éxito : {stats['updates']} instituciones")
    print(f"  ⏩ Omitidas (Ya al día)   : {stats['omitidas']} instituciones")
    print(f"  ⚠️ Sin cruce (No en SIES) : {stats['sin_match']} instituciones")
    if stats['errores'] > 0:
        print(f"  ❌ Errores de inyección   : {stats['errores']} instituciones")
    print("="*70 + "\n")

if __name__ == "__main__":
    inyectar_acreditacion_institucional()