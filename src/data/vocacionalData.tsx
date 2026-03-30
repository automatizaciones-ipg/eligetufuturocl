// src/data/vocacionalData.tsx
import { 
    BrainCircuit, Palette, Briefcase, Heart, 
    Microscope, Zap, LineChart, Users, Code, Calculator, Sparkles, Target,
    Building2
  } from "lucide-react";
  
  export const PERFILES_VOCACIONALES = {
    a: {
      titulo: "Analítico & Tecnológico",
      descripcion: "Posees una mente lógica y estructurada. Destacas resolviendo problemas complejos, analizando datos y creando soluciones mediante tecnología o ciencias exactas.",
      queryOr: "nombre_carrera.ilike.%ingeniería%,nombre_carrera.ilike.%computación%,nombre_carrera.ilike.%datos%,nombre_carrera.ilike.%ciencias%,nombre_carrera.ilike.%tecnología%",
      color: "from-blue-600 to-cyan-500",
      textClass: "text-cyan-500",
      keywordBuscador: "Tecnología"
    },
    b: {
      titulo: "Creativo & Comunicador",
      descripcion: "Tu mayor talento es la innovación y la expresión. Tienes facilidad para conceptualizar ideas, diseñar y comunicar mensajes de forma visual o escrita.",
      queryOr: "nombre_carrera.ilike.%diseño%,nombre_carrera.ilike.%arte%,nombre_carrera.ilike.%arquitectura%,nombre_carrera.ilike.%periodismo%,nombre_carrera.ilike.%audiovisual%",
      color: "from-fuchsia-600 to-pink-500",
      textClass: "text-fuchsia-500",
      keywordBuscador: "Diseño"
    },
    c: {
      titulo: "Estratega & Emprendedor",
      descripcion: "Tienes un perfil de liderazgo nato. Te motiva organizar recursos, optimizar procesos, negociar y dirigir proyectos hacia el éxito y crecimiento económico.",
      queryOr: "nombre_carrera.ilike.%administración%,nombre_carrera.ilike.%comercial%,nombre_carrera.ilike.%negocios%,nombre_carrera.ilike.%finanzas%,nombre_carrera.ilike.%logística%",
      color: "from-amber-500 to-orange-500",
      textClass: "text-amber-500",
      keywordBuscador: "Administración"
    },
    d: {
      titulo: "Empático & Social",
      descripcion: "Tu vocación es el bienestar humano. Tienes una gran capacidad para entender, ayudar, educar o cuidar a otras personas e impactar positivamente en la sociedad.",
      queryOr: "nombre_carrera.ilike.%psicología%,nombre_carrera.ilike.%pedagogía%,nombre_carrera.ilike.%medicina%,nombre_carrera.ilike.%enfermería%,nombre_carrera.ilike.%social%",
      color: "from-emerald-500 to-teal-500",
      textClass: "text-emerald-500",
      keywordBuscador: "Salud"
    }
  };
  
  export const PREGUNTAS = [
    {
      id: 1,
      pregunta: "Cuando te enfrentas a un desafío complejo, tu enfoque natural es...",
      opciones: [
        { id: "a", texto: "Analizar datos y buscar patrones lógicos", icono: <Code className="w-8 h-8" /> },
        { id: "b", texto: "Imaginar soluciones visuales e innovadoras", icono: <Palette className="w-8 h-8" /> },
        { id: "c", texto: "Planificar la estrategia y organizar los recursos", icono: <Briefcase className="w-8 h-8" /> },
        { id: "d", texto: "Considerar el impacto en las personas involucradas", icono: <Heart className="w-8 h-8" /> }
      ]
    },
    {
      id: 2,
      pregunta: "¿Qué tipo de proyectos te motivan más a dar el 100%?",
      opciones: [
        { id: "a", texto: "Desarrollar nueva tecnología o investigar", icono: <Microscope className="w-8 h-8" /> },
        { id: "b", texto: "Crear campañas, marcas o productos estéticos", icono: <Zap className="w-8 h-8" /> },
        { id: "c", texto: "Liderar un equipo para superar metas de ventas", icono: <LineChart className="w-8 h-8" /> },
        { id: "d", texto: "Ayudar a una comunidad o enseñar algo nuevo", icono: <Users className="w-8 h-8" /> }
      ]
    },
    {
      id: 3,
      pregunta: "Elige el entorno laboral donde te ves brillando a futuro:",
      opciones: [
        { id: "a", texto: "Un laboratorio o centro tecnológico", icono: <BrainCircuit className="w-8 h-8" /> },
        { id: "b", texto: "Un estudio creativo, agencia o productora", icono: <Palette className="w-8 h-8" /> },
        { id: "c", texto: "Una corporación dinámica o tu propia startup", icono: <Building2 className="w-8 h-8" /> },
        { id: "d", texto: "Un hospital, colegio o fundación social", icono: <Heart className="w-8 h-8" /> }
      ]
    },
    {
      id: 4,
      pregunta: "Tus amigos o profesores suelen destacar tu habilidad para...",
      opciones: [
        { id: "a", texto: "Las matemáticas, la lógica o la informática", icono: <Calculator className="w-8 h-8" /> },
        { id: "b", texto: "Escribir, dibujar o tener ideas muy originales", icono: <Sparkles className="w-8 h-8" /> },
        { id: "c", texto: "Convencer a otros, negociar y tomar decisiones", icono: <Target className="w-8 h-8" /> },
        { id: "d", texto: "Escuchar, dar consejos y mediar en conflictos", icono: <Users className="w-8 h-8" /> }
      ]
    },
    {
      id: 5,
      pregunta: "¿Qué impacto final te gustaría dejar en el mundo?",
      opciones: [
        { id: "a", texto: "Avances científicos que optimicen el futuro", icono: <Code className="w-8 h-8" /> },
        { id: "b", texto: "Obras o ideas que inspiren emociones y cultura", icono: <Palette className="w-8 h-8" /> },
        { id: "c", texto: "Empresas sólidas que generen empleo y progreso", icono: <Briefcase className="w-8 h-8" /> },
        { id: "d", texto: "Personas más sanas, educadas y felices", icono: <Heart className="w-8 h-8" /> }
      ]
    }
  ];
  
  export const FRASES_ANALISIS = [
    "Cuantificando vectores de personalidad...",
    "Consultando nuestra base de datos nacional...",
    "Cruzando habilidades con mallas curriculares...",
    "Guardando tu perfil oficial..."
  ];