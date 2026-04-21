import os
import pandas as pd
import unicodedata
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURACIÓN Y LIMPIEZA ---
def limpiar_texto(texto):
    """Limpia texto para matches perfectos."""
    if pd.isna(texto): return ""
    t = str(texto).upper().strip()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    return t.replace("'", "").replace("-", " ")

LISTA_GRATUIDAD = [
    "PONTIFICIA UNIVERSIDAD CATOLICA DE CHILE", "PONTIFICIA UNIVERSIDAD CATOLICA DE VALPARAISO",
    "UNIVERSIDAD DE CHILE", "UNIVERSIDAD DE SANTIAGO DE CHILE", "UNIVERSIDAD de CONCEPCION",
    "UNIVERSIDAD TECNICA FEDERICO SANTA MARIA", "UNIVERSIDAD DE TALCA", "UNIVERSIDAD DE LOS LAGOS",
    "UNIVERSIDAD DE VALPARAISO", "UNIVERSIDAD DE LA FRONTERA", "UNIVERSIDAD DE ANTOFAGASTA",
    "UNIVERSIDAD DE LA SERENA", "UNIVERSIDAD DE MAGALLANES", "UNIVERSIDAD DE ATACAMA",
    "UNIVERSIDAD DEL BIO-BIO", "UNIVERSIDAD ARTURO PRAT", "UNIVERSIDAD DE PLAYA ANCHA",
    "UNIVERSIDAD CATOLICA DEL MAULE", "UNIVERSIDAD CATOLICA de LA SANTISIMA CONCEPCION",
    "UNIVERSIDAD CATOLICA DE TEMUCO", "UNIVERSIDAD CATOLICA DEL NORTE", "UNIVERSIDAD AUSTRAL DE CHILE",
    "UNIVERSIDAD DE TARAPACA", "UNIVERSIDAD TECNOLOGICA METROPOLITANA", "UNIVERSIDAD DE O HIGGINS",
    "UNIVERSIDAD DE AYSEN", "UNIVERSIDAD METROPOLITANA DE CIENCIAS DE LA EDUCACION",
    "UNIVERSIDAD ALBERTO HURTADO", "UNIVERSIDAD DIEGO PORTALES", "UNIVERSIDAD CATOLICA CARDENAL RAUL SILVA HENRIQUEZ",
    "UNIVERSIDAD ACADEMIA DE HUMANISMO CRISTIANO", "UNIVERSIDAD AUTONOMA DE CHILE", "UNIVERSIDAD BERNARDO O HIGGINS",
    "UNIVERSIDAD FINIS TERRAE", "UNIVERSIDAD SANTO TOMAS", "UNIVERSIDAD MAYOR",
    "IP DUOC UC", "IP INACAP", "IP SANTO TOMAS", "IP ARCOS", "IP AGRARIO ADOLFO MATTHEI",
    "IP ESCUELA DE CONTADORES AUDITORES", "IP DE CHILE", "IP VIRGINIO GOMEZ",
    "CFT INACAP", "CFT SANTO TOMAS", "CFT ENAC", "CFT SAN AGUSTIN", "CFT PUCV", "CFT LOTA ARAUCO",
    "CFT CEDUC UCN", "CFT JUAN BOHON", "CFT ESTATAL DE VALPARAISO", "CFT ESTATAL DEL MAULE",
    "CFT ESTATAL DE LA ARAUCANIA", "CFT ESTATAL DE LOS LAGOS", "CFT ESTATAL DE ANTOFAGASTA",
    "CFT ESTATAL DE LOS RIOS", "CFT ESTATAL DE TARAPACA", "CFT ESTATAL DE ATACAMA",
    "CFT ESTATAL DE COQUIMBO", "CFT ESTATAL DE ARICA Y PARINACOTA"
]

def inyeccion_maestra():
    print("🚀 INICIANDO INYECCIÓN PROFESIONAL INTELIGENTE (Omitiendo ya procesados)\n")
    
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    supabase: Client = create_client(url, key)

    # ==========================================
    # 1. ACTUALIZAR GRATUIDAD (INSTITUCIONES)
    # ==========================================
    print("--- FASE 1: GRATUIDAD ---")
    # AHORA TAMBIÉN DESCARGAMOS EL ESTADO ACTUAL PARA NO SOBRESCRIBIR POR GUSTO
    res_inst = supabase.table('instituciones').select('codigo_institucion, nombre, adscrita_gratuidad').execute()
    inst_db = res_inst.data
    gratuidad_limpia = [limpiar_texto(n) for n in LISTA_GRATUIDAD]
    
    contador_nuevas_gratuidad = 0
    omitidas_gratuidad = 0

    for inst in inst_db:
        es_gratuidad = limpiar_texto(inst['nombre']) in gratuidad_limpia
        
        # LÓGICA INTELIGENTE: Si ya tiene el dato correcto, la saltamos
        if inst['adscrita_gratuidad'] == es_gratuidad:
            omitidas_gratuidad += 1
            continue

        # Si no lo tiene, hacemos update
        datos = {"adscrita_gratuidad": es_gratuidad, "acreditada": es_gratuidad}
        supabase.table('instituciones').update(datos).eq('codigo_institucion', inst['codigo_institucion']).execute()
        
        if es_gratuidad:
            contador_nuevas_gratuidad += 1
            print(f"✅ NUEVA Gratuidad inyectada: {inst['nombre']}")

    print(f"⏩ Instituciones omitidas (ya actualizadas anteriormente): {omitidas_gratuidad}")
    print(f"✨ Nuevas instituciones actualizadas: {contador_nuevas_gratuidad}")

    # ==========================================
    # 2. ACTUALIZAR ACREDITACIÓN (CARRERAS)
    # ==========================================
    print("\n--- FASE 2: ACREDITACIÓN DE CARRERAS ---")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ruta_csv = os.path.join(BASE_DIR, 'raw', 'Oferta_Academica_2026_SIES_12_01_2026_WEB_E.csv')
    
    try:
        # Agregamos low_memory=False para silenciar el warning de Pandas
        print("⏳ Procesando CSV (Esto toma un par de segundos)...")
        df = pd.read_csv(ruta_csv, sep=';', encoding='latin-1', low_memory=False)
        print(f"📂 Archivo CSV cargado: {len(df)} registros encontrados en el SIES.")
        
        mapa_acred = {}
        for _, row in df.iterrows():
            key = f"{row['Código IES']}_{limpiar_texto(row['Nombre Carrera'])}"
            acred_bruta = row.get('Acreditación Carrera o Programa')
            
            if pd.isna(acred_bruta) or str(acred_bruta).strip() == '':
                mapa_acred[key] = 'No Acreditada'
            else:
                mapa_acred[key] = str(acred_bruta).strip()

        # Paginación interactiva
        inicio, rango = 0, 1000
        actualizadas = 0
        omitidas_carreras = 0
        sin_match = 0

        print("📥 Iniciando revisión y cruce de base de datos...")
        while True:
            # DESCARGAMOS TAMBIÉN EL ESTADO ACTUAL DE LA ACREDITACIÓN
            res_carreras = supabase.table('carreras').select('id, codigo_institucion, nombre_carrera, acreditacion_carrera').range(inicio, inicio + rango - 1).execute()
            if not res_carreras.data: break
            
            for c in res_carreras.data:
                key_db = f"{c['codigo_institucion']}_{limpiar_texto(c['nombre_carrera'])}"
                
                if key_db in mapa_acred:
                    acred_valor = mapa_acred[key_db]
                    
                    # LÓGICA INTELIGENTE: Si ya tiene esa acreditación, la saltamos
                    if str(c.get('acreditacion_carrera')) == acred_valor:
                        omitidas_carreras += 1
                        continue
                    
                    # Si el dato es nuevo o cambió, actualizamos
                    supabase.table('carreras').update({"acreditacion_carrera": acred_valor}).eq('id', c['id']).execute()
                    actualizadas += 1
                    
                    # Log en tiempo real para que veas qué está haciendo
                    print(f"🟢 UPDATE [ID {c['id']}] {c['nombre_carrera'][:20]}... -> Ahora es: {acred_valor}")
                else:
                    sin_match += 1
            
            inicio += rango
            print(f"📦 Bloque de {inicio} carreras analizado...")

    except Exception as e:
        print(f"❌ Error crítico en fase carreras: {e}")

    print("\n" + "="*50)
    print("🎉 PROCESO FINALIZADO CON ÉXITO")
    print(f"🏛️ Instituciones con nueva gratuidad: {contador_nuevas_gratuidad} (Omitidas: {omitidas_gratuidad})")
    print(f"🎓 Carreras con nueva acreditación: {actualizadas} (Omitidas por estar al día: {omitidas_carreras})")
    print(f"⚠️ Carreras sin match en SIES: {sin_match}")
    print("="*50)

if __name__ == "__main__":
    inyeccion_maestra()