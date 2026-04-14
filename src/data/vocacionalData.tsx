import { 
  Wrench, Microscope, Palette, Users, TrendingUp, FileText,
  BrainCircuit, Heart, Code, Briefcase 
} from "lucide-react";
import type { PreguntaTest, PerfilVocacional, AreaRIASEC } from "../types/vocacional";

export const PERFILES_RIASEC: Record<AreaRIASEC, PerfilVocacional> = {
  Realista: {
    titulo: "Práctico & Operativo (Realista)",
    descripcion: "Prefieres trabajar con herramientas, máquinas o al aire libre. Te gusta el trabajo manual, la ingeniería, la mecánica o la agronomía.",
    queryOr: "nombre_carrera.ilike.%ingeniería civil%,nombre_carrera.ilike.%mecánica%,nombre_carrera.ilike.%construcción%,nombre_carrera.ilike.%agronomía%,nombre_carrera.ilike.%logística%",
    color: "from-blue-600 to-cyan-500",
    textClass: "text-cyan-500",
  },
  Investigador: {
    titulo: "Analítico & Científico (Investigador)",
    descripcion: "Destacas resolviendo problemas complejos, analizando datos y creando soluciones mediante tecnología o ciencias exactas.",
    queryOr: "nombre_carrera.ilike.%informática%,nombre_carrera.ilike.%ciencias%,nombre_carrera.ilike.%datos%,nombre_carrera.ilike.%física%,nombre_carrera.ilike.%matemática%",
    color: "from-indigo-600 to-blue-500",
    textClass: "text-indigo-500",
  },
  Artistico: {
    titulo: "Creativo & Comunicador (Artístico)",
    descripcion: "Tu mayor talento es la innovación y la expresión. Tienes facilidad para diseñar, crear arte y comunicar mensajes visuales o escritos.",
    queryOr: "nombre_carrera.ilike.%diseño%,nombre_carrera.ilike.%arquitectura%,nombre_carrera.ilike.%periodismo%,nombre_carrera.ilike.%audiovisual%,nombre_carrera.ilike.%arte%",
    color: "from-fuchsia-600 to-pink-500",
    textClass: "text-fuchsia-500",
  },
  Social: {
    titulo: "Empático & Educador (Social)",
    descripcion: "Tu vocación es el bienestar humano. Tienes gran capacidad para entender, educar, cuidar o sanar a otras personas.",
    queryOr: "nombre_carrera.ilike.%psicología%,nombre_carrera.ilike.%pedagogía%,nombre_carrera.ilike.%medicina%,nombre_carrera.ilike.%enfermería%,nombre_carrera.ilike.%trabajo social%",
    color: "from-emerald-500 to-teal-500",
    textClass: "text-emerald-500",
  },
  Emprendedor: {
    titulo: "Líder & Estratega (Emprendedor)",
    descripcion: "Tienes un perfil de liderazgo nato. Te motiva organizar recursos, persuadir, negociar y dirigir proyectos hacia el éxito.",
    queryOr: "nombre_carrera.ilike.%derecho%,nombre_carrera.ilike.%comercial%,nombre_carrera.ilike.%relaciones públicas%,nombre_carrera.ilike.%marketing%,nombre_carrera.ilike.%negocios%",
    color: "from-amber-500 to-orange-500",
    textClass: "text-amber-500",
  },
  Convencional: {
    titulo: "Organizado & Metódico (Convencional)",
    descripcion: "Eres excelente estructurando información. Disfrutas el trabajo de oficina, finanzas, contabilidad y la gestión de datos.",
    queryOr: "nombre_carrera.ilike.%contabilidad%,nombre_carrera.ilike.%administración%,nombre_carrera.ilike.%auditoría%,nombre_carrera.ilike.%finanzas%,nombre_carrera.ilike.%recursos humanos%",
    color: "from-gray-600 to-slate-500",
    textClass: "text-gray-500",
  }
};

export const PREGUNTAS_REALES: PreguntaTest[] = [
  {
    id: 1,
    pregunta: "En tu día a día, ¿qué actividad te genera mayor satisfacción?",
    opciones: [
      { id: "1a", texto: "Armar, reparar o usar herramientas tecnológicas/físicas", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" },
      { id: "1b", texto: "Investigar el porqué de las cosas y leer sobre ciencia", icono: <Microscope className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "1c", texto: "Dibujar, escribir, tocar música o crear contenido", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "1d", texto: "Escuchar a un amigo con problemas y darle consejos", icono: <Heart className="w-8 h-8" />, areaAfinidad: "Social" }
    ]
  },
  {
    id: 2,
    pregunta: "Si tuvieras que organizar un evento masivo, ¿cuál sería tu rol?",
    opciones: [
      { id: "2a", texto: "Gestionar el presupuesto y la logística en Excel", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" },
      { id: "2b", texto: "Liderar al equipo, buscar auspicios y tomar decisiones", icono: <TrendingUp className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "2c", texto: "Asegurarme de que todos los invitados se sientan integrados", icono: <Users className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "2d", texto: "Diseñar la identidad visual y la escenografía", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" }
    ]
  },
  {
    id: 3,
    pregunta: "¿Cómo prefieres resolver un problema difícil?",
    opciones: [
      { id: "3a", texto: "Aplicando fórmulas lógicas o código de programación", icono: <Code className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "3b", texto: "Organizando los datos paso a paso sistemáticamente", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" },
      { id: "3c", texto: "Convenciendo a otros para que apoyen mi estrategia", icono: <Briefcase className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "3d", texto: "Buscando una solución práctica y tangible (manos a la obra)", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" }
    ]
  },
  {
    id: 4,
    pregunta: "¿Qué tipo de proyecto escolar te entusiasma más?",
    opciones: [
      { id: "4a", texto: "Construir un prototipo o maqueta funcional", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" },
      { id: "4b", texto: "Realizar un experimento y analizar resultados", icono: <Microscope className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "4c", texto: "Crear una campaña visual o audiovisual", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "4d", texto: "Diseñar un plan de ayuda comunitaria", icono: <Users className="w-8 h-8" />, areaAfinidad: "Social" }
    ]
  },
  {
    id: 5,
    pregunta: "Cuando trabajas en equipo, ¿en qué rol destacas más?",
    opciones: [
      { id: "5a", texto: "Coordinar tareas y tomar decisiones clave", icono: <Briefcase className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "5b", texto: "Ordenar cronograma, documentos y entregables", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" },
      { id: "5c", texto: "Proponer ideas innovadoras fuera de lo común", icono: <BrainCircuit className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "5d", texto: "Resolver tareas técnicas concretas del proyecto", icono: <Code className="w-8 h-8" />, areaAfinidad: "Investigador" }
    ]
  },
  {
    id: 6,
    pregunta: "¿Cuál de estas materias te resulta más natural?",
    opciones: [
      { id: "6a", texto: "Matemática y física aplicada", icono: <Code className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "6b", texto: "Historia, lenguaje y comunicación", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "6c", texto: "Biología y ciencias de la salud", icono: <Heart className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "6d", texto: "Tecnología y talleres prácticos", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" }
    ]
  },
  {
    id: 7,
    pregunta: "¿Qué logro te haría sentir más orgulloso/a en 5 años?",
    opciones: [
      { id: "7a", texto: "Dirigir un negocio o startup", icono: <TrendingUp className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "7b", texto: "Desarrollar una solución científica o tecnológica", icono: <Microscope className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "7c", texto: "Impactar positivamente en la vida de personas", icono: <Users className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "7d", texto: "Crear una obra o proyecto creativo reconocido", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" }
    ]
  },
  {
    id: 8,
    pregunta: "En un trabajo ideal, ¿cómo prefieres tu rutina?",
    opciones: [
      { id: "8a", texto: "Con tareas claras, procesos y estructura", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" },
      { id: "8b", texto: "Con dinámicas sociales y colaboración constante", icono: <Users className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "8c", texto: "Con retos de liderazgo y toma de decisiones", icono: <Briefcase className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "8d", texto: "Con trabajo práctico en terreno o laboratorio", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" }
    ]
  },
  {
    id: 9,
    pregunta: "Si debes elegir una actividad extracurricular, sería:",
    opciones: [
      { id: "9a", texto: "Club de robótica o programación", icono: <Code className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "9b", texto: "Centro de estudiantes o debates", icono: <TrendingUp className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "9c", texto: "Voluntariado o tutorías escolares", icono: <Heart className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "9d", texto: "Diseño, música o teatro", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" }
    ]
  },
  {
    id: 10,
    pregunta: "¿Cómo tomas decisiones importantes para tu futuro?",
    opciones: [
      { id: "10a", texto: "Analizo datos, pros y contras detalladamente", icono: <Microscope className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "10b", texto: "Escucho a personas con experiencia y necesidades reales", icono: <Users className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "10c", texto: "Me guío por una visión personal creativa", icono: <BrainCircuit className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "10d", texto: "Prefiero seguir un plan concreto y ordenado", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" }
    ]
  },
  {
    id: 11,
    pregunta: "¿Qué tipo de entorno laboral te motiva más?",
    opciones: [
      { id: "11a", texto: "Empresas con metas exigentes y crecimiento", icono: <TrendingUp className="w-8 h-8" />, areaAfinidad: "Emprendedor" },
      { id: "11b", texto: "Laboratorios, investigación o análisis técnico", icono: <Microscope className="w-8 h-8" />, areaAfinidad: "Investigador" },
      { id: "11c", texto: "Hospitales, escuelas o contextos de ayuda social", icono: <Heart className="w-8 h-8" />, areaAfinidad: "Social" },
      { id: "11d", texto: "Talleres, plantas o trabajo operacional", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" }
    ]
  },
  {
    id: 12,
    pregunta: "Frente a una tarea nueva, ¿qué describes mejor?",
    opciones: [
      { id: "12a", texto: "Busco procedimientos y checklists para ejecutarla bien", icono: <FileText className="w-8 h-8" />, areaAfinidad: "Convencional" },
      { id: "12b", texto: "Experimento hasta encontrar una solución original", icono: <Palette className="w-8 h-8" />, areaAfinidad: "Artistico" },
      { id: "12c", texto: "Me enfoco en resultados concretos y aplicables", icono: <Wrench className="w-8 h-8" />, areaAfinidad: "Realista" },
      { id: "12d", texto: "Pienso cómo liderar y escalar la idea", icono: <Briefcase className="w-8 h-8" />, areaAfinidad: "Emprendedor" }
    ]
  }
];

export const FRASES_ANALISIS = [
  "Cuantificando vectores RIASEC...",
  "Consultando mallas curriculares en Supabase...",
  "Cruzando afinidad con instituciones chilenas...",
  "Generando expediente vocacional..."
];