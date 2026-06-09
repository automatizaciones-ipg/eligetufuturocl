import os
import time
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# ==========================================
# 1. BANCO DE TEXTOS (SEO 4.0 MARKETING JUVENIL)
# ==========================================

def clasificar_area_carrera(nombre_carrera):
    if not nombre_carrera: return 'general'
    nombre = str(nombre_carrera).lower()
    if any(word in nombre for word in ['ingeniería', 'informática', 'computación', 'datos', 'desarrollo', 'tecnología', 'software', 'redes']):
        return 'tecnologia'
    elif any(word in nombre for word in ['medicina', 'enfermería', 'kinesiología', 'odontología', 'salud', 'nutrición', 'obstetricia', 'terapia']):
        return 'salud'
    elif any(word in nombre for word in ['pedagogía', 'educación', 'profesor', 'párvulos', 'docencia']):
        return 'educacion'
    elif any(word in nombre for word in ['administración', 'comercial', 'contabilidad', 'auditoría', 'negocios', 'finanzas', 'marketing', 'logística']):
        return 'negocios'
    elif any(word in nombre for word in ['psicología', 'derecho', 'social', 'periodismo', 'sociología', 'humanidades', 'letras']):
        return 'humanidades'
    elif any(word in nombre for word in ['arquitectura', 'diseño', 'arte', 'música', 'audiovisual', 'teatro']):
        return 'artes'
    else:
        return 'general'

def generar_descripcion_carrera(nombre_carrera, nombre_institucion, acreditacion_carrera):
    carrera = str(nombre_carrera or 'la carrera').capitalize()
    institucion = str(nombre_institucion or 'esta institución').title()
    area = clasificar_area_carrera(nombre_carrera)
    
    intros = {
        'tecnologia': [
            f"Si buscas una de las carreras con mayor empleabilidad, estudiar {carrera} en {institucion} es tu mejor opción. Su perfil de egreso está altamente enfocado en transformación digital, desarrollo de software e innovación tecnológica.",
            f"El mercado laboral tecnológico exige expertos bien preparados. La carrera de {carrera} impartida por {institucion} te entrega una malla curricular actualizada para liderar proyectos tech de alto impacto."
        ],
        'salud': [
            f"La vocación de servicio y el área de la salud se unen en la carrera de {carrera} en {institucion}. Su plan de estudios contempla prácticas tempranas en campos clínicos, preparándote para la atención integral de pacientes.",
            f"Estudiar {carrera} en {institucion} te capacita con los más altos estándares clínicos. Una profesión con un tremendo impacto social y un campo laboral estable en el sistema de salud público y privado."
        ],
        'educacion': [
            f"¿Buscas transformar el futuro a través de la docencia? Estudiar {carrera} en {institucion} te dará las competencias pedagógicas e innovación educativa necesarias para liderar el aula de clases con éxito.",
            f"La carrera de {carrera} en {institucion} destaca por una formación docente de excelencia. El campo ocupacional abarca diversos proyectos educativos enfocados en las nuevas generaciones chilenas."
        ],
        'negocios': [
            f"Desarrolla tu visión estratégica y capacidad de gestión comercial al estudiar {carrera} en {institucion}. Una de las carreras tradicionales con mayor campo laboral en el mundo empresarial y del emprendimiento.",
            f"La malla curricular de {carrera} en {institucion} está diseñada para formar líderes corporativos. Aprende administración de empresas, finanzas y marketing con un enfoque práctico y competitivo."
        ],
        'humanidades': [
            f"Si te interesa el pensamiento crítico y el análisis social, {carrera} en {institucion} es la carrera ideal. Adquiere herramientas clave para desempeñarte con éxito en ciencias sociales, asesorías y el sector público.",
            f"Estudiar {carrera} en {institucion} te otorga un perfil profesional analítico muy valorado allá afuera. Su campo laboral se extiende a consultorías, investigación y desarrollo de proyectos comunitarios."
        ],
        'artes': [
            f"Potencia tu talento e intégrate a las industrias creativas estudiando {carrera} en {institucion}. Diseña un portafolio profesional potente basado en talleres prácticos, expresión estética e innovación visual.",
            f"El mundo visual y el diseño e innovación exigen técnica. Al estudiar {carrera} en {institucion}, aprenderás de la mano de profesionales activos en el circuito creativo nacional."
        ],
        'general': [
            f"Dar el salto y matricularte en {carrera} en {institucion} es asegurar una sólida formación profesional. El plan de estudios equilibra teoría avanzada con talleres prácticos demandados por el mercado de trabajo.",
            f"Si te llama la atención {carrera}, en {institucion} vas a encontrar una alternativa académica con excelente proyección a futuro y un perfil de egreso altamente competitivo."
        ]
    }
    
    texto_intro = random.choice(intros[area])
    
    acred_texto = str(acreditacion_carrera).strip()
    if acreditacion_carrera and acred_texto.lower() not in ['no acreditada', 'none', '']:
        cierre = random.choice([
            f"Un dato clave para tu postulación: este programa cuenta con acreditación vigente ({acred_texto}), garantizando la excelencia de su cuerpo docente y su prestigio laboral.",
            f"Al estar acreditada oficialmente ({acred_texto}), tienes la certeza de que su título profesional cuenta con el máximo reconocimiento del sistema de educación superior."
        ])
    else:
        cierre = random.choice([
            "Además, su perfil de egreso está directamente conectado con lo que las empresas y el mercado laboral exigen hoy en día.",
            "Esto te garantiza una rápida inserción laboral y las competencias necesarias para destacar en tus primeros años de ejercicio profesional."
        ])
        
    return f"{texto_intro} {cierre}"

# ==========================================
# 2. MOTOR FRANCOTIRADOR (SOLO NULLS)
# ==========================================
def inyeccion_francotirador():
    tiempo_inicio = time.time()
    print("======================================================================")
    print("🎯 INICIANDO MODO FRANCOTIRADOR: INYECCIÓN EXCLUSIVA EN NULLS")
    print("======================================================================\n")
    
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ ERROR: Faltan credenciales SUPABASE_URL o SUPABASE_KEY.")
        return
        
    supabase: Client = create_client(url, key)

    # --- 1. CARGAR MAPA DE INSTITUCIONES ---
    print("📥 Cargando mapa de instituciones...")
    try:
        res_inst = supabase.table('instituciones').select('codigo_institucion, nombre').execute()
        mapa_instituciones = {inst['codigo_institucion']: inst['nombre'] for inst in res_inst.data}
    except Exception as e:
        print(f"❌ Error al cargar instituciones: {e}")
        return

    # --- 2. BÚSQUEDA EXCLUSIVA DE VACÍOS (LA MAGIA ESTÁ AQUÍ) ---
    print("🔍 Consultando a Supabase ÚNICAMENTE las carreras con descripción en NULL...")
    inicio, rango = 0, 1000
    carreras_reparadas = 0
    bloque_n = 1

    while True:
        try:
            # MAGIA: Usamos .is_('descripcion', 'null') para que Supabase NO nos envíe las que ya están listas.
            res_carreras = supabase.table('carreras').select(
                'id, codigo_institucion, nombre_carrera, acreditacion_carrera'
            ).is_('descripcion', 'null').range(inicio, inicio + rango - 1).execute()
            
            carreras_vacias = res_carreras.data
            
            # Si la lista vuelve vacía, significa que ya no hay NULLs en la base de datos.
            if not carreras_vacias:
                break 
            
            for c in carreras_vacias:
                # Obtenemos datos seguros
                id_carrera = c.get('id')
                nombre_carrera = c.get('nombre_carrera')
                cod_inst = c.get('codigo_institucion')
                acreditacion = c.get('acreditacion_carrera', 'No Acreditada')
                
                nombre_inst = mapa_instituciones.get(cod_inst, "esta institución")
                
                # Generamos texto
                desc_nueva = generar_descripcion_carrera(nombre_carrera, nombre_inst, acreditacion)
                
                # Inyectamos
                supabase.table('carreras').update({"descripcion": desc_nueva}).eq('id', id_carrera).execute()
                carreras_reparadas += 1
                
                nombre_seguro = str(nombre_carrera or 'Desconocida')[:40]
                print(f"   🎯 [INYECTADA ID {id_carrera}] {nombre_seguro}...")
            
            bloque_n += 1
            inicio += rango
            
        except Exception as e:
            print(f"❌ Error en el bloque {bloque_n}: {e}")
            break 

    # --- 3. MÉTRICAS FINALES ---
    duracion = time.time() - tiempo_inicio
    print("\n" + "="*70)
    print("🎉 OPERACIÓN FRANCOTIRADOR COMPLETADA")
    print("="*70)
    print(f"⏱️ Tiempo total    : {duracion:.2f} segundos")
    print(f"🛡️ Carreras sanas  : (Intactas, no se descargaron de la BD)")
    print(f"🎯 Carreras curadas: {carreras_reparadas} (Rellenadas con éxito SEO)")
    print("="*70)

if __name__ == "__main__":
    inyeccion_francotirador()