import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

def limpiar_nans(lista_dicts):
    limpia = []
    for fila in lista_dicts:
        fila_limpia = {}
        for k, v in fila.items():
            # Limpieza total de valores basuras de Excel
            if pd.isna(v) or v == "" or v == "nan" or v == "s/i" or v == "n/a" or v == "-":
                fila_limpia[k] = None
            elif isinstance(v, float) and v.is_integer():
                fila_limpia[k] = int(v)
            else:
                fila_limpia[k] = v
        limpia.append(fila_limpia)
    return limpia

def preparar_y_subir():
    print("🚀 Iniciando inyección (Modo Tipado Estricto y Upsert)...")
    
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    df_carreras = pd.read_json('clean/carreras_bd_lista.json')
    df_inst = pd.read_json('clean/instituciones_bd_lista.json')

    # --- TABLA INSTITUCIONES ---
    print("Preparando tabla Instituciones...")
    df_inst_clean = pd.DataFrame()
    df_inst_clean['codigo_institucion'] = df_inst['Código institución']
    df_inst_clean['nombre'] = df_inst['Nombre institución']
    df_inst_clean['tipo'] = df_inst['Tipo de institución']
    
    df_inst_clean = df_inst_clean.dropna(subset=['codigo_institucion'])
    df_inst_clean = df_inst_clean.drop_duplicates(subset=['codigo_institucion'])
    data_inst = limpiar_nans(df_inst_clean.to_dict(orient='records'))

    # --- TABLA CARRERAS ---
    print("Preparando tabla Carreras...")
    df_car_clean = pd.DataFrame()
    col_codigo = 'Código único de carrera ' if 'Código único de carrera ' in df_carreras.columns else 'Código único de carrera'
    
    df_car_clean['codigo_carrera'] = df_carreras[col_codigo]
    df_car_clean['codigo_institucion'] = df_carreras['Código institución']
    df_car_clean['nombre_carrera'] = df_carreras['Nombre carrera']
    df_car_clean['region'] = df_carreras['Región']
    df_car_clean['jornada'] = df_carreras['Jornada']
    df_car_clean['sede'] = df_carreras['Sede']
    
    # SOLUCIÓN DE RAÍZ: Limpiar símbolos de moneda y forzar a numérico
    arancel = df_carreras['Arancel Anual 2026'].astype(str).str.replace(r'[\$\.\s]', '', regex=True)
    df_car_clean['arancel_anual'] = pd.to_numeric(arancel, errors='coerce')
    
    df_car_clean['duracion_semestres'] = pd.to_numeric(df_carreras['Duración Formal (semestres)'], errors='coerce')
    df_car_clean['empleabilidad_1er_anio'] = pd.to_numeric(df_carreras['Empleabilidad 1er año'], errors='coerce')
    
    # Ingreso Promedio se pasa como texto explícito para soportar los rangos del gobierno
    df_car_clean['ingreso_promedio_4to_anio'] = df_carreras['Ingreso Promedio al 4° año'].astype(str)

    df_car_clean = df_car_clean.dropna(subset=['codigo_carrera'])
    data_carreras = limpiar_nans(df_car_clean.to_dict(orient='records'))

    # --- INYECCIÓN VÍA API ---
    try:
        print(f"Subiendo {len(data_inst)} instituciones...")
        # Usamos UPSERT: Si la institución ya existe, la ignora/actualiza, evitando errores
        supabase.table('instituciones').upsert(data_inst).execute()
        print("✅ Instituciones listas.")
        
        print(f"Subiendo {len(data_carreras)} carreras en lotes de 1000...")
        lote_size = 1000
        for i in range(0, len(data_carreras), lote_size):
            lote = data_carreras[i:i + lote_size]
            supabase.table('carreras').insert(lote).execute()
            print(f"  -> Lote {i} a {i+len(lote)} inyectado.")
            
        print("✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE A LA NUBE!")
    except Exception as e:
        print(f"❌ Error durante la subida a Supabase: {e}")

if __name__ == "__main__":
    preparar_y_subir()