// src/components/CalendarioPaes.tsx
import { useState, useEffect } from "react";
import { 
  CalendarDays, Bell, BookOpen, PenTool, Award, 
  ChevronRight, Sparkles, Clock, AlertCircle, FileText
} from "lucide-react";

// --- DATOS DEL CALENDARIO (Ajustados al ciclo PAES) ---
const EVENTOS = [
  {
    id: 1,
    mes: "ABR",
    dia: "15",
    titulo: "Inicio Inscripción PAES de Invierno",
    descripcion: "Se abre el portal del DEMRE para inscribirte a la prueba de invierno. ¡Cupos limitados por sede!",
    categoria: "inscripcion",
    icono: <PenTool className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    mes: "MAY",
    dia: "24",
    titulo: "Gran Ensayo Nacional Universitario",
    descripcion: "Mide tus conocimientos a nivel nacional con nuestro ensayo gratuito. Modalidad presencial y online.",
    categoria: "ensayos",
    icono: <BookOpen className="w-6 h-6" />,
    color: "from-[#15803d] to-emerald-400"
  },
  {
    id: 3,
    mes: "JUN",
    dia: "17",
    titulo: "Rendición PAES de Invierno (Día 1)",
    descripcion: "Competencia Matemática 2 (M2) y Competencia Lectora.",
    categoria: "rendicion",
    icono: <AlertCircle className="w-6 h-6" />,
    color: "from-[#6544FF] to-[#947BFF]"
  },
  {
    id: 4,
    mes: "JUN",
    dia: "18",
    titulo: "Rendición PAES de Invierno (Día 2)",
    descripcion: "Competencia Matemática 1 (M1) y Ciencias / Historia.",
    categoria: "rendicion",
    icono: <AlertCircle className="w-6 h-6" />,
    color: "from-[#6544FF] to-[#947BFF]"
  },
  {
    id: 5,
    mes: "JUL",
    dia: "19",
    titulo: "Resultados PAES de Invierno",
    descripcion: "Publicación de puntajes oficiales en el portal de acceso mineduc.",
    categoria: "resultados",
    icono: <Award className="w-6 h-6" />,
    color: "from-orange-500 to-amber-400"
  },
  {
    id: 6,
    mes: "AGO",
    dia: "05",
    titulo: "Apertura Inscripción PAES Regular",
    descripcion: "Inscripción para la prueba de fin de año. Revisa si calificas para la Beca PAES.",
    categoria: "inscripcion",
    icono: <FileText className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400"
  }
];

const CATEGORIAS = [
  { id: "todo", label: "Todas las Fechas" },
  { id: "inscripcion", label: "Inscripciones" },
  { id: "ensayos", label: "Ensayos" },
  { id: "rendicion", label: "Rendición PAES" },
  { id: "resultados", label: "Resultados" }
];

export default function CalendarioPaes() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [eventosFiltrados, setEventosFiltrados] = useState(EVENTOS);

  // Animación suave al filtrar
  useEffect(() => {
    setEventosFiltrados([]); // Vaciamos para forzar la re-animación
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setEventosFiltrados(EVENTOS);
      } else {
        setEventosFiltrados(EVENTOS.filter(e => e.categoria === filtroActivo));
      }
    }, 50); // Pequeño delay para que React vuelva a renderizar la animación de entrada
  }, [filtroActivo]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* HEADER ESPECTACULAR */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-6 border border-[#6544FF]/20 uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
          <CalendarDays className="w-4 h-4" /> Ciclo Admisión 2026-2027
        </div>
        
        <h2 className="font-black italic uppercase text-5xl md:text-6xl text-[#1A1528] tracking-tight mb-6 leading-[1.05] animate-in fade-in zoom-in-95 duration-700">
          Tu Ruta hacia <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-[#947BFF]">La Universidad</span>
        </h2>
        
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          No dejes que las fechas se te pasen. Aquí tienes el calendario oficial, ensayos nacionales y plazos clave para asegurar tu cupo.
        </p>
      </div>

      {/* WIDGET CUENTA REGRESIVA PREMIUM (Opcional, pero suma mucha UX) */}
      <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#6544FF] rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
              <Clock className="w-10 h-10 text-[#C1AFFF] animate-pulse" />
            </div>
            <div>
              <p className="text-[#C1AFFF] font-bold text-sm uppercase tracking-widest mb-1">Próximo Gran Hito</p>
              <h3 className="font-black italic uppercase text-3xl text-white">PAES de Invierno</h3>
            </div>
          </div>
          
          <div className="flex gap-4 text-center">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-24 backdrop-blur-sm">
              <span className="block font-black text-4xl text-white mb-1">92</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Días</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-24 backdrop-blur-sm hidden sm:block">
              <span className="block font-black text-4xl text-white mb-1">14</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horas</span>
            </div>
            <button className="bg-[#6544FF] hover:bg-[#5236CC] text-white rounded-2xl px-6 font-bold transition-all flex flex-col items-center justify-center shadow-lg hover:shadow-[#6544FF]/40 gap-1 group/btn">
              <Bell className="w-6 h-6 group-hover/btn:-rotate-12 transition-transform" />
              <span className="text-xs uppercase tracking-wider">Avisarme</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABS DE FILTRADO */}
      <div className="flex flex-wrap justify-center gap-3 mb-12 animate-in fade-in duration-500 delay-300">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltroActivo(cat.id)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm
              ${filtroActivo === cat.id 
                ? "bg-[#1A1528] text-white scale-105 shadow-lg" 
                : "bg-white text-gray-500 hover:text-[#1A1528] hover:bg-gray-50 border border-gray-100"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* TIMELINE / LISTA DE TARJETAS */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-12 md:before:ml-[4.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-gray-100 before:via-[#6544FF]/20 before:to-gray-100">
        
        {eventosFiltrados.map((evento, i) => (
          <div 
            key={evento.id} 
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            
            {/* Ícono central en la línea de tiempo */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#FAFAFA] bg-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:scale-110 transition-transform duration-300">
              <div className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${evento.color} text-white scale-90`}>
                {evento.icono}
              </div>
            </div>

            {/* Tarjeta del Evento */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              
              {/* Bloque de Fecha */}
              <div className="bg-[#fafafa] rounded-2xl w-full sm:w-24 shrink-0 aspect-square flex flex-col items-center justify-center border border-gray-100 group-hover:bg-[#6544FF] transition-colors duration-500 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="font-black text-4xl text-[#1A1528] group-hover:text-white leading-none relative z-10 transition-colors">{evento.dia}</span>
                <span className="font-bold text-sm text-gray-400 group-hover:text-white/80 uppercase tracking-wider relative z-10 transition-colors mt-1">{evento.mes}</span>
              </div>

              {/* Contenido */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r ${evento.color} text-white bg-opacity-10`}>
                    {CATEGORIAS.find(c => c.id === evento.categoria)?.label}
                  </span>
                </div>
                <h3 className="font-black text-xl text-[#1A1528] mb-2 leading-tight group-hover:text-[#6544FF] transition-colors">{evento.titulo}</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">{evento.descripcion}</p>
                
                {/* Botón Acción (Aparece en hover) */}
                <button className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#6544FF] opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <Bell className="w-4 h-4" /> Agregar a Google Calendar <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}

        {eventosFiltrados.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-xl text-gray-400">No hay eventos en esta categoría</h3>
          </div>
        )}
      </div>

    </div>
  );
}