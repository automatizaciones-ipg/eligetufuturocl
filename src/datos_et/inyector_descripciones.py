import os
import time
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# ==========================================
# 1. MOTORES DE GENERACIÓN DE TEXTO (SEO & UX)
# ==========================================
def generar_descripcion_institucion(nombre, adscrita_gratuidad, acreditada):
    """Genera un texto profesional para la institución basado en sus atributos."""
    nombre_formateado = str(nombre).title()
    
    # Textos dinámicos según los booleanos
    txt_gratuidad = "forma parte del sistema de Gratuidad, facilitando el acceso equitativo a la educación superior" if adscrita_gratuidad else "ofrece diversas vías de financiamiento y becas para sus estudiantes"
    txt_acreditacion = "cuenta con acreditación institucional, lo que garantiza el cumplimiento de altos estándares de calidad académica." if acreditada else "se encuentra en constante proceso de mejora y actualización de sus estándares educativos."
    
    return (
        f"{nombre_formateado} es una destacada institución de educación superior comprometida con la excelencia "
        f"académica y la formación integral de sus estudiantes. Actualmente, la institución {txt_gratuidad}. "
        f"Además, {txt_acreditacion} Su enfoque pedagógico busca preparar profesionales "
        f"altamente capacitados para los desafíos del mercado laboral actual."
    )

def generar_descripcion_carrera(nombre_carrera, nombre_institucion, acreditacion_carrera):
    """Genera un texto enfocado en persuadir e informar al futuro estudiante."""
    carrera_formateada = str(nombre_carrera).capitalize()
    institucion_formateada = str(nombre_institucion).title()
    
    # Lógica de acreditación de la carrera
    acred_texto = str(acreditacion_carrera).strip()
    if acred_texto and acred_texto.lower() != 'no acreditada' and acred_texto.lower() != 'none':
        txt_calidad = f"cuenta con una acreditación vigente ({acred_texto}), asegurando la calidad de su malla curricular."
    else:
        txt_calidad = "está diseñada bajo estrictos criterios de calidad, adaptándose a las necesidades tecnológicas y sociales del entorno."
        
    return (
        f"El programa de {carrera_formateada} impartido por {institucion_formateada} entrega a sus estudiantes "
        f"las herramientas teóricas y prácticas necesarias para destacar en su área de especialización. "
        f"Esta carrera {txt_calidad} Los egresados estarán preparados para liderar proyectos, innovar en su campo "
        f"y contribuir significativamente al desarrollo del país."
    )

# ==========================================
# 2. FUNCIÓN PRINCIPAL DE INYECCIÓN
# ==========================================
def inyeccion_descripciones():
    tiempo_inicio = time.time()
    print("======================================================================")
    print("🚀 INICIANDO INYECTOR EXCLUSIVO DE DESCRIPCIONES (INSTITUCIONES Y CARRERAS)")
    print("======================================================================\n")
    
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ ERROR: Faltan credenciales SUPABASE_URL o SUPABASE_KEY en tu .env")
        return
        
    supabase: Client = create_client(url, key)

    # ---------------------------------------------------------
    # FASE 1: DESCRIPCIONES DE INSTITUCIONES
    # ---------------------------------------------------------
    print("🏛️ FASE 1: Generando descripciones para INSTITUCIONES...")
    try:
        res_inst = supabase.table('instituciones').select('codigo_institucion, nombre, adscrita_gratuidad, acreditada, descripcion').execute()
        instituciones_db = res_inst.data
        
        # Diccionario para usar luego en la Fase 2 sin hacer doble consulta
        mapa_instituciones = {} 
        
        inst_inyectadas = 0
        inst_omitidas = 0

        for inst in instituciones_db:
            # Guardamos el nombre para la fase de carreras
            mapa_instituciones[inst['codigo_institucion']] = inst['nombre']
            
            # Generamos el texto ideal
            desc_propuesta = generar_descripcion_institucion(
                inst['nombre'], 
                inst.get('adscrita_gratuidad', False), 
                inst.get('acreditada', False)
            )
            
            # Smart Delta Check: Evita reescribir si ya está igual
            desc_actual = inst.get('descripcion')
            if str(desc_actual).strip() == desc_propuesta.strip():
                inst_omitidas += 1
                continue
                
            # Inyección real en BD
            supabase.table('instituciones').update({"descripcion": desc_propuesta}).eq('codigo_institucion', inst['codigo_institucion']).execute()
            inst_inyectadas += 1
            print(f"   ✅ [UPDATE] Institución: {inst['nombre'][:40]}...")

        print(f"▶️ Resultado Instituciones: {inst_inyectadas} inyectadas | {inst_omitidas} ya estaban perfectas.\n")
    except Exception as e:
        print(f"❌ Error crítico en Fase 1: {e}\n")
        return # Si falla esto, no podemos seguir a carreras porque necesitamos mapa_instituciones

    # ---------------------------------------------------------
    # FASE 2: DESCRIPCIONES DE CARRERAS (Con Paginación)
    # ---------------------------------------------------------
    print("🎓 FASE 2: Generando descripciones para CARRERAS...")
    inicio, rango = 0, 1000
    carreras_inyectadas = 0
    carreras_omitidas = 0
    bloque_n = 1

    while True:
        try:
            res_carreras = supabase.table('carreras').select(
                'id, codigo_institucion, nombre_carrera, acreditacion_carrera, descripcion'
            ).range(inicio, inicio + rango - 1).execute()
            
            carreras_db = res_carreras.data
            if not carreras_db: break # Salimos del bucle si ya no hay más datos
            
            for c in carreras_db:
                nombre_inst = mapa_instituciones.get(c['codigo_institucion'], "esta institución")
                
                desc_propuesta = generar_descripcion_carrera(
                    c['nombre_carrera'], 
                    nombre_inst, 
                    c.get('acreditacion_carrera', 'No Acreditada')
                )
                
                desc_actual = c.get('descripcion')
                if str(desc_actual).strip() == desc_propuesta.strip():
                    carreras_omitidas += 1
                    continue
                
                # Update en la base de datos
                supabase.table('carreras').update({"descripcion": desc_propuesta}).eq('id', c['id']).execute()
                carreras_inyectadas += 1
                print(f"   🟢 [ID {c['id']}] Carrera actualizada: {c['nombre_carrera'][:35]}...")
            
            print(f"📦 Bloque {bloque_n:02d} completado (Filas {inicio} al {inicio + len(carreras_db)})")
            
            bloque_n += 1
            inicio += rango
            
        except Exception as e:
            print(f"❌ Error en el bloque {bloque_n} de Carreras: {e}")
            break

    # ---------------------------------------------------------
    # MÉTRICAS FINALES
    # ---------------------------------------------------------
    duracion = time.time() - tiempo_inicio
    print("\n" + "="*70)
    print("🎉 INYECCIÓN DE DESCRIPCIONES COMPLETADA")
    print("="*70)
    print(f"⏱️ Tiempo total  : {duracion:.2f} segundos")
    print(f"🏛️ Instituciones : {inst_inyectadas} inyectadas / {inst_omitidas} omitidas")
    print(f"🎓 Carreras      : {carreras_inyectadas} inyectadas / {carreras_omitidas} omitidas")
    print("="*70)

if __name__ == "__main__":
    inyeccion_descripciones()