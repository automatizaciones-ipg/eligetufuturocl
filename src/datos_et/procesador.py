import pandas as pd
import numpy as np
import os

# Rutas de archivos
RAW_OFERTA = 'raw/oferta.xlsx'
RAW_EMPLEO = 'raw/empleo.xlsx'
RAW_INSTITUCIONES = 'raw/instituciones.xlsx'
CLEAN_OUTPUT = 'clean/carreras_bd_lista.json'
CLEAN_INSTITUCIONES = 'clean/instituciones_bd_lista.json'

def ejecutar_etl():
    print("🚀 Iniciando proceso ETL Profesional...")
    
    # 1. EXTRACCIÓN MILIMÉTRICA
    print("Leyendo las hojas exactas y saltando portadas del gobierno...")
    try:
        # Apuntamos al nombre exacto de la hoja y le decimos que los encabezados están en la fila 1 (header=1)
        df_oferta = pd.read_excel(RAW_OFERTA, sheet_name='Busc. Carreras  2025-2026', header=1)
        # Empleo tiene los encabezados en la fila 0 (header=0)
        df_empleo = pd.read_excel(RAW_EMPLEO, sheet_name='Carreras e IES (2025-2026)', header=0)
        # Instituciones tiene los encabezados en la fila 1
        df_inst = pd.read_excel(RAW_INSTITUCIONES, sheet_name='Buscador IES 25-26', header=1)
    except Exception as e:
        print(f"❌ Error crítico: Verifica que los nombres de los archivos sean exactos. Detalles: {e}")
        return

    # 2. LIMPIEZA DE COLUMNAS (Quitar espacios invisibles que deja el Excel)
    print("Limpiando estructura de columnas...")
    df_oferta.columns = df_oferta.columns.str.strip()
    df_empleo.columns = df_empleo.columns.str.strip()
    df_inst.columns = df_inst.columns.str.strip()

    # Reemplazar los "S/I" y "n/a" del gobierno por nulos reales de base de datos
    df_oferta = df_oferta.replace(['s/i', 'n/a', 'S/I', 'N/A', '-'], np.nan)
    df_empleo = df_empleo.replace(['s/i', 'n/a', 'S/I', 'N/A', '-'], np.nan)

    # Convertimos los nombres a mayúsculas estrictas para que el cruce sea perfecto
    df_oferta['Nombre_Clean'] = df_oferta['Nombre carrera'].astype(str).str.upper().str.strip()
    df_empleo['Nombre_Clean'] = df_empleo['Nombre carrera genérica'].astype(str).str.upper().str.strip()

    # 3. CRUCE DE DATOS
    print("Cruzando bases de datos (Match por Institución y Carrera)...")
    # En empleo.xlsx, la columna se llama "Código", la renombramos a "Código institución"
    df_empleo = df_empleo.rename(columns={'Código': 'Código institución'})
    
    # Hacemos el cruce (Left Join)
    df_carreras_full = pd.merge(
        df_oferta,
        df_empleo[['Código institución', 'Nombre_Clean', 'Empleabilidad 1er año', 'Ingreso Promedio al 4° año']],
        on=['Código institución', 'Nombre_Clean'],
        how='left'
    )

    # 4. EXPORTACIÓN A JSON PARA SUPABASE
    print("Generando archivos JSON finales...")
    os.makedirs('clean', exist_ok=True)
    df_carreras_full = df_carreras_full.drop(columns=['Nombre_Clean'])
    
    df_carreras_full.to_json(CLEAN_OUTPUT, orient='records', force_ascii=False)
    df_inst.to_json(CLEAN_INSTITUCIONES, orient='records', force_ascii=False)
    
    print(f"✅ EXITO TOTAL: {len(df_carreras_full)} carreras listas.")
    print(f"✅ EXITO TOTAL: {len(df_inst)} instituciones listas.")

if __name__ == "__main__":
    ejecutar_etl()