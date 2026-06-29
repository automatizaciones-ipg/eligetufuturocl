"""
============================================================================
INGESTA MANUAL DE DETALLES DE CARRERAS  ·  Elige Tu Futuro
============================================================================
Inyecta detalles de carreras curados a mano (perfil de egreso, campo laboral,
etc.) sin depender de Firecrawl. Pensado para garantizar que las carreras de
IPG y U. Autónoma queden completas aunque no haya créditos de scraping.

Actualiza por NOMBRE exacto (normalizado), aplicando cada entrada a todas las
carreras con ese nombre en cualquier institución (la info de perfil es genérica
por carrera). Idempotente.

Uso:  python ingest_carreras_manual.py
============================================================================
"""

import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", (s or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", "", s)).strip()


# Cada entrada: nombre EXACTO (como en la BD) -> detalles.
# La info es genérica por carrera (perfil de egreso, campo laboral, etc.).
DATOS = {
    "TECNICO DE NIVEL SUPERIOR EN TRABAJO SOCIAL": {
        "resumen": "Forma técnicos capaces de apoyar la intervención social en comunidades, familias y personas en situación de vulnerabilidad, colaborando con trabajadores sociales en programas de las áreas pública y privada.",
        "perfil_egreso": "El egresado apoya el diseño, ejecución y evaluación de programas sociales, realiza acompañamiento a usuarios, gestiona redes y recursos comunitarios y maneja registros y reportes de intervención.",
        "campo_laboral": ["Municipalidades y programas sociales del Estado", "Fundaciones y ONG", "Centros comunitarios", "Hogares y residencias", "Áreas de bienestar de empresas"],
        "que_aprenderas": ["Fundamentos del trabajo social", "Intervención familiar y comunitaria", "Políticas sociales y redes", "Gestión de casos", "Registro y evaluación de programas"],
        "habilidades": ["Empatía y escucha activa", "Trabajo en equipo", "Gestión de redes", "Comunicación efectiva", "Resolución de conflictos"],
        "titulo": "Técnico de Nivel Superior en Trabajo Social",
    },
    "TECNICO EN ENFERMERIA DE NIVEL SUPERIOR": {
        "resumen": "Prepara técnicos para asistir al equipo de salud en la atención de pacientes, aplicando cuidados básicos, controles y procedimientos en centros hospitalarios y de atención primaria.",
        "perfil_egreso": "El egresado brinda cuidados de enfermería bajo supervisión, toma signos vitales, administra tratamientos indicados, prepara material clínico y acompaña al paciente y su familia.",
        "campo_laboral": ["Hospitales y clínicas", "Consultorios y CESFAM", "Centros de adultos mayores", "Atención domiciliaria", "Servicios de urgencia"],
        "que_aprenderas": ["Anatomía y fisiología", "Cuidados básicos de enfermería", "Farmacología básica", "Primeros auxilios", "Control de infecciones"],
        "habilidades": ["Cuidado y vocación de servicio", "Precisión y responsabilidad", "Trabajo bajo presión", "Comunicación con el paciente", "Trabajo en equipo de salud"],
        "titulo": "Técnico de Nivel Superior en Enfermería",
    },
    "TECNICO DE NIVEL SUPERIOR EN PREVENCION DE RIESGOS": {
        "resumen": "Forma técnicos que identifican y controlan riesgos laborales para proteger la salud de los trabajadores y dar cumplimiento a la normativa de seguridad y salud ocupacional.",
        "perfil_egreso": "El egresado inspecciona condiciones de trabajo, elabora matrices de riesgo, implementa medidas preventivas, capacita al personal y apoya investigaciones de accidentes.",
        "campo_laboral": ["Empresas constructoras", "Minería e industria", "Mutualidades", "Logística y transporte", "Departamentos de prevención"],
        "que_aprenderas": ["Normativa de seguridad y salud", "Identificación y control de riesgos", "Prevención de incendios", "Higiene ocupacional", "Investigación de accidentes"],
        "habilidades": ["Atención al detalle", "Pensamiento preventivo", "Liderazgo y capacitación", "Comunicación", "Manejo normativo"],
        "titulo": "Técnico de Nivel Superior en Prevención de Riesgos",
    },
    "TECNICO DE NIVEL SUPERIOR EN GESTION LOGISTICA": {
        "resumen": "Prepara técnicos para gestionar el flujo de productos e información en la cadena de suministro: abastecimiento, almacenamiento, inventarios y distribución.",
        "perfil_egreso": "El egresado coordina bodegas e inventarios, gestiona despachos y recepciones, optimiza rutas y costos, y opera sistemas de gestión logística (WMS/ERP).",
        "campo_laboral": ["Empresas de distribución y retail", "Centros de bodegaje", "Comercio exterior y puertos", "Industria y manufactura", "Operadores logísticos"],
        "que_aprenderas": ["Gestión de bodegas e inventarios", "Cadena de suministro", "Distribución y transporte", "Comercio exterior", "Sistemas de información logística"],
        "habilidades": ["Organización", "Análisis de datos", "Resolución de problemas", "Trabajo en equipo", "Orientación a la eficiencia"],
        "titulo": "Técnico de Nivel Superior en Gestión Logística",
    },
    "TECNICO DE NIVEL SUPERIOR EN CONTABILIDAD GENERAL": {
        "resumen": "Forma técnicos para llevar la contabilidad de empresas, registrar operaciones, preparar información tributaria y apoyar la gestión financiera.",
        "perfil_egreso": "El egresado registra operaciones contables, confecciona libros y declaraciones, gestiona remuneraciones y obligaciones tributarias, y apoya estados financieros.",
        "campo_laboral": ["Empresas de cualquier rubro", "Estudios contables y auditoría", "Áreas de finanzas", "Servicios públicos", "Emprendimiento propio"],
        "que_aprenderas": ["Contabilidad general", "Tributación y normativa SII", "Remuneraciones", "Costos", "Software contable"],
        "habilidades": ["Rigurosidad numérica", "Orden y método", "Confidencialidad", "Manejo de software", "Análisis"],
        "titulo": "Técnico de Nivel Superior en Contabilidad General",
    },
    "TECNICO DE NIVEL SUPERIOR EN PROGRAMACION": {
        "resumen": "Prepara técnicos para desarrollar y mantener aplicaciones y sitios web, escribiendo código, gestionando bases de datos y participando en proyectos de software.",
        "perfil_egreso": "El egresado programa aplicaciones web y de escritorio, diseña y consulta bases de datos, prueba y depura software y trabaja con metodologías de desarrollo.",
        "campo_laboral": ["Empresas de software y TI", "Áreas de tecnología de cualquier empresa", "Startups", "Desarrollo freelance", "Soporte y mantención de sistemas"],
        "que_aprenderas": ["Lógica y algoritmos", "Programación web y orientada a objetos", "Bases de datos SQL", "Desarrollo front-end y back-end", "Control de versiones"],
        "habilidades": ["Pensamiento lógico", "Resolución de problemas", "Aprendizaje continuo", "Atención al detalle", "Trabajo en equipo"],
        "titulo": "Técnico de Nivel Superior en Programación",
    },
    "TECNICO DE NIVEL SUPERIOR EN MARKETING DIGITAL": {
        "resumen": "Forma técnicos capaces de planificar y ejecutar campañas de marketing en medios digitales, gestionar redes sociales y analizar resultados para potenciar marcas.",
        "perfil_egreso": "El egresado crea contenidos, gestiona redes sociales y campañas de publicidad digital, optimiza posicionamiento (SEO/SEM) y mide resultados con analítica web.",
        "campo_laboral": ["Agencias de marketing y publicidad", "Áreas de marketing de empresas", "E-commerce", "Emprendimiento digital", "Community management"],
        "que_aprenderas": ["Estrategia de marketing digital", "Redes sociales y contenidos", "Publicidad SEM y SEO", "Analítica web", "E-commerce"],
        "habilidades": ["Creatividad", "Comunicación", "Análisis de datos", "Adaptabilidad", "Orientación a resultados"],
        "titulo": "Técnico de Nivel Superior en Marketing Digital",
    },
    "ODONTOLOGIA": {
        "resumen": "Forma cirujanos dentistas capaces de prevenir, diagnosticar y tratar enfermedades de la cavidad oral, promoviendo la salud bucal de las personas y comunidades.",
        "perfil_egreso": "El egresado diagnostica y trata patologías bucales y dentales, realiza procedimientos preventivos y restauradores, y promueve la salud oral con enfoque ético y basado en evidencia.",
        "campo_laboral": ["Consultas y clínicas dentales", "Hospitales y CESFAM", "Salud pública", "Docencia e investigación", "Ejercicio independiente"],
        "que_aprenderas": ["Anatomía y fisiología oral", "Operatoria y endodoncia", "Periodoncia y cirugía", "Odontopediatría", "Rehabilitación oral"],
        "habilidades": ["Precisión manual", "Empatía con el paciente", "Ética profesional", "Atención al detalle", "Toma de decisiones clínicas"],
        "titulo": "Cirujano Dentista",
    },
    "PERIODISMO": {
        "resumen": "Forma periodistas capaces de investigar, producir y comunicar información veraz y relevante en distintos medios y plataformas, con sentido crítico y ético.",
        "perfil_egreso": "El egresado investiga y redacta noticias y reportajes, produce contenidos para medios y plataformas digitales, gestiona comunicación estratégica y verifica fuentes con rigor.",
        "campo_laboral": ["Medios de comunicación (prensa, radio, TV, digital)", "Comunicación corporativa y prensa", "Agencias y productoras", "Comunicación digital y RR.SS.", "Comunicación gubernamental"],
        "que_aprenderas": ["Géneros y redacción periodística", "Investigación y verificación", "Comunicación digital y multimedia", "Ética y legislación de medios", "Comunicación estratégica"],
        "habilidades": ["Redacción y comunicación", "Pensamiento crítico", "Curiosidad e investigación", "Trabajo bajo plazos", "Manejo de herramientas digitales"],
        "titulo": "Periodista / Licenciado en Comunicación Social",
    },
    "QUIMICA Y FARMACIA": {
        "resumen": "Forma químicos farmacéuticos expertos en medicamentos: su composición, acción, uso racional y control de calidad, contribuyendo a la salud de las personas.",
        "perfil_egreso": "El egresado dispensa y controla medicamentos, asesora sobre su uso racional, participa en desarrollo y control de calidad de fármacos y realiza farmacovigilancia.",
        "campo_laboral": ["Farmacias y droguerías", "Industria farmacéutica", "Hospitales y clínicas", "Laboratorios de control de calidad", "Salud pública e investigación"],
        "que_aprenderas": ["Química y bioquímica", "Farmacología y toxicología", "Tecnología farmacéutica", "Control de calidad", "Atención farmacéutica"],
        "habilidades": ["Rigurosidad científica", "Atención al detalle", "Responsabilidad sanitaria", "Análisis", "Ética profesional"],
        "titulo": "Químico Farmacéutico",
    },
    "OBSTETRICIA Y PUERICULTURA": {
        "resumen": "Forma matronas y matrones capaces de acompañar la salud sexual y reproductiva de la mujer y el recién nacido, desde la prevención hasta el parto y el puerperio.",
        "perfil_egreso": "El egresado realiza control prenatal, atención del parto de bajo riesgo, cuidados del recién nacido, salud sexual y reproductiva y educación en autocuidado.",
        "campo_laboral": ["Hospitales y clínicas", "CESFAM y atención primaria", "Programas de salud de la mujer", "Salud pública", "Ejercicio independiente"],
        "que_aprenderas": ["Salud sexual y reproductiva", "Control prenatal y parto", "Neonatología", "Ginecología", "Educación para la salud"],
        "habilidades": ["Empatía y contención", "Toma de decisiones clínicas", "Trabajo bajo presión", "Comunicación", "Ética y responsabilidad"],
        "titulo": "Matrón / Matrona",
    },
    "PEDAGOGIA EN EDUCACION PARVULARIA": {
        "resumen": "Forma educadoras y educadores de párvulos capaces de potenciar el desarrollo integral de niños y niñas en la primera infancia mediante experiencias de aprendizaje significativas.",
        "perfil_egreso": "El egresado diseña y conduce experiencias educativas para la primera infancia, evalúa aprendizajes, trabaja con las familias y crea ambientes seguros y estimulantes.",
        "campo_laboral": ["Jardines infantiles y salas cuna", "Colegios (nivel preescolar)", "Programas de primera infancia (JUNJI, Integra)", "Educación no formal", "Emprendimiento educativo"],
        "que_aprenderas": ["Desarrollo infantil", "Didáctica de la primera infancia", "Currículum y evaluación", "Trabajo con familias", "Juego y aprendizaje"],
        "habilidades": ["Vocación pedagógica", "Creatividad", "Paciencia y afectividad", "Comunicación", "Trabajo en equipo"],
        "titulo": "Educador(a) de Párvulos / Licenciado en Educación",
    },
    "INGENIERIA EN MINAS": {
        "resumen": "Forma ingenieros capaces de planificar, operar y optimizar procesos de extracción y procesamiento de minerales, con foco en productividad, seguridad y sustentabilidad.",
        "perfil_egreso": "El egresado planifica y supervisa operaciones mineras, optimiza procesos extractivos, gestiona recursos y equipos, y aplica estándares de seguridad y medio ambiente.",
        "campo_laboral": ["Empresas mineras", "Empresas contratistas y servicios mineros", "Plantas de procesamiento", "Consultoras", "Organismos del sector minero"],
        "que_aprenderas": ["Geología y yacimientos", "Explotación de minas", "Procesamiento de minerales", "Seguridad minera", "Gestión de operaciones"],
        "habilidades": ["Liderazgo", "Análisis técnico", "Toma de decisiones", "Orientación a la seguridad", "Trabajo en terreno"],
        "titulo": "Ingeniero en Minas",
    },
    "TECNICO DE NIVEL SUPERIOR EN CIBERSEGURIDAD": {
        "resumen": "Forma técnicos para proteger sistemas, redes y datos frente a amenazas digitales, aplicando medidas de seguridad y respondiendo a incidentes.",
        "perfil_egreso": "El egresado implementa controles de seguridad, monitorea redes y sistemas, detecta y responde a incidentes, y apoya el cumplimiento de políticas de ciberseguridad.",
        "campo_laboral": ["Áreas de TI y seguridad de empresas", "Empresas de servicios de ciberseguridad", "Banca y retail", "Soporte y operaciones de seguridad (SOC)", "Sector público"],
        "que_aprenderas": ["Redes y sistemas operativos", "Seguridad de la información", "Ethical hacking básico", "Gestión de incidentes", "Normativa y buenas prácticas"],
        "habilidades": ["Pensamiento analítico", "Atención al detalle", "Aprendizaje continuo", "Ética profesional", "Resolución de problemas"],
        "titulo": "Técnico de Nivel Superior en Ciberseguridad",
    },
}

# Variantes que comparten los mismos detalles que una entrada base
# (PLAN CONTINUIDAD / PROFESIONAL apuntan a la misma carrera).
ALIAS = {
    "TECNICO DE NIVEL SUPERIOR EN CIENCIAS DE DATOS": None,
}


def main():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    load_dotenv()
    load_dotenv(os.path.join(BASE_DIR, "..", "..", ".env"))
    url = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
    key = (os.environ.get("SUPABASE_KEY")
           or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
           or os.environ.get("PUBLIC_SUPABASE_ANON_KEY"))
    sb: Client = create_client(url, key)
    print("✅ Conexión a Supabase establecida.")

    # Índice nombre normalizado -> [codigos]
    print("⏳ Indexando carreras...")
    idx = {}
    page = 0
    while True:
        r = sb.table("carreras").select("codigo_carrera, nombre_carrera").range(page * 1000, page * 1000 + 999).execute()
        if not r.data:
            break
        for row in r.data:
            idx.setdefault(norm(row["nombre_carrera"]), []).append(row["codigo_carrera"])
        page += 1
        if page > 40:
            break

    ahora = datetime.now(timezone.utc).isoformat()
    total_carreras = 0
    for nombre, detalles in DATOS.items():
        codigos = idx.get(norm(nombre), [])
        if not codigos:
            print(f"  ⚠️ sin coincidencia exacta: {nombre}")
            continue
        for i in range(0, len(codigos), 200):
            chunk = codigos[i:i + 200]
            sb.table("carreras").update(
                {"detalles": detalles, "detalles_actualizado": ahora}
            ).in_("codigo_carrera", chunk).execute()
        print(f"  ✅ {nombre[:50]} → {len(codigos)} carreras")
        total_carreras += len(codigos)

    print(f"\n🎉 Listo: {len(DATOS)} nombres, {total_carreras} carreras actualizadas.")


if __name__ == "__main__":
    main()
