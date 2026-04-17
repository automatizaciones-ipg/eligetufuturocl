// src/components/CalendarioPaes.tsx
import { useState, useEffect } from "react";
import { 
  CalendarDays, Bell, BookOpen, PenTool, Award, 
  ChevronRight, Sparkles, Clock, AlertCircle, FileText,
  ArrowLeft
} from "lucide-react";

// --- DATOS DEL CALENDARIO ---
const EVENTOS = [
  {
    id: 1,
    mes: "JUN",
    dia: "02",
    titulo: "Inicio Inscripciones PAES Regular",
    descripcion: "Se abre el proceso de inscripción oficial. Recuerda revisar los temarios en demre.cl para organizar tu tiempo de estudio.",
    categoria: "inscripcion",
    icono: <PenTool className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    calendarDates: "20260602/20260603" // Formato Todo el día (Día inicio / Día fin exclusivo)
  },
  {
    id: 2,
    mes: "JUN",
    dia: "23",
    titulo: "Fin de Inscripción PAES Regular",
    descripcion: "Finaliza el plazo para inscribirte a la rendición de la prueba. ¡Asegura tu participación y no lo dejes para última hora!",
    categoria: "inscripcion",
    icono: <AlertCircle className="w-6 h-6" />,
    color: "from-orange-500 to-amber-400",
    calendarDates: "20260623/20260624"
  },
  {
    id: 3,
    mes: "SEP",
    dia: "25",
    titulo: "Oferta Definitiva de Carreras",
    descripcion: "Publicación de la oferta oficial de carreras, vacantes y ponderaciones para el proceso de Admisión 2026.",
    categoria: "publicaciones",
    icono: <BookOpen className="w-6 h-6" />,
    color: "from-[#15803d] to-emerald-400",
    calendarDates: "20260925/20260926"
  },
  {
    id: 4,
    mes: "NOV",
    dia: "20",
    titulo: "Servicios y Beneficios",
    descripcion: "Publicación oficial de los servicios y beneficios universitarios. Fundamental para planificar tu financiamiento.",
    categoria: "publicaciones",
    icono: <FileText className="w-6 h-6" />,
    color: "from-[#6544FF] to-[#947BFF]",
    calendarDates: "20261120/20261121"
  },
  {
    id: 5,
    mes: "DIC",
    dia: "1-3",
    titulo: "Rendición PAES Regular",
    descripcion: "Lunes 1, Martes 2 y Miércoles 3. Pon en práctica tus simulacros y todo tu esfuerzo. ¡Mucho éxito en tu preparación!",
    categoria: "rendicion",
    icono: <Award className="w-6 h-6" />,
    color: "from-blue-600 to-blue-400",
    calendarDates: "20261201/20261204" // Termina el 3, por lo que en Google se pone el 4
  }
];

const CATEGORIAS = [
  { id: "todo", label: "Todas las Fechas" },
  { id: "inscripcion", label: "Inscripciones" },
  { id: "publicaciones", label: "Publicaciones" },
  { id: "rendicion", label: "Rendición PAES" }
];

// Función Helper para parsear la fecha "YYYYMMDD/YYYYMMDD" a Objeto Date
const parseDateString = (dateStr: string) => {
  const startStr = dateStr.split('/')[0];
  const year = parseInt(startStr.substring(0, 4));
  const month = parseInt(startStr.substring(4, 6)) - 1; // Los meses en JS son 0-11
  const day = parseInt(startStr.substring(6, 8));
  // Asumimos que el evento inicia a las 00:00:00 del día estipulado (hora local)
  return new Date(year, month, day, 0, 0, 0);
};

export default function CalendarioPaes() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [eventosFiltrados, setEventosFiltrados] = useState(EVENTOS);

  // Estados para el widget inteligente de tiempo real
  const [proximoEvento, setProximoEvento] = useState<typeof EVENTOS[0] | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [isClient, setIsClient] = useState(false); // Previene hidratación incorrecta en Next.js/React SSR

  // Efecto principal del Countdown (Se actualiza cada segundo)
  useEffect(() => {
    setIsClient(true);
    
    const calcularTiempo = () => {
      const ahora = new Date();
      
      // 1. Encontrar el primer evento cuya fecha sea mayor a la actual
      const eventoFuturo = EVENTOS.find(evento => {
        const fechaEvento = parseDateString(evento.calendarDates);
        return fechaEvento.getTime() > ahora.getTime();
      });

      // 2. Calcular matemática exacta
      if (eventoFuturo) {
        setProximoEvento(eventoFuturo);
        const fechaEvento = parseDateString(eventoFuturo.calendarDates);
        const diferenciaMs = fechaEvento.getTime() - ahora.getTime();

        const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenciaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferenciaMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenciaMs % (1000 * 60)) / 1000);

        setTiempoRestante({ dias, horas, minutos, segundos });
      } else {
        setProximoEvento(null);
        setTiempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
      }
    };

    calcularTiempo(); // Llamada inmediata
    const intervalo = setInterval(calcularTiempo, 1000); // 1000ms = 1 segundo de precisión

    return () => clearInterval(intervalo);
  }, []);

  // Animación suave al filtrar
  useEffect(() => {
    setEventosFiltrados([]); 
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setEventosFiltrados(EVENTOS);
      } else {
        setEventosFiltrados(EVENTOS.filter(e => e.categoria === filtroActivo));
      }
    }, 50); 
  }, [filtroActivo]);

  const abrirGoogleCalendar = (titulo: string, descripcion: string, dates: string) => {
    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent(titulo);
    const details = encodeURIComponent(descripcion);
    const url = `${baseUrl}&text=${text}&dates=${dates}&details=${details}`;
    window.open(url, '_blank');
  };

  // Helper para mantener siempre 2 dígitos en los contadores (09 en vez de 9)
  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <section className="w-full bg-[#F4F5F9] pb-20">
      
      {/* =========================================================================
          1. HERO BANNER - EXACTAMENTE IGUAL AL RESTO DEL SITIO (CURVO)
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] pt-20 pb-40 px-6 overflow-hidden shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-7xl">
        {/* Botón Volver */}
           <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-6 border border-white/20 uppercase tracking-widest backdrop-blur-md">
            <CalendarDays className="w-4 h-4" /> Ciclo Admisión 2026
          </div>
          
          <h2 className="font-black italic uppercase text-5xl md:text-6xl text-white tracking-tight mb-6 leading-[1.05]">
            Tu Ruta hacia <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">La Universidad</span>
          </h2>
          
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Revisa los temarios, organiza tu tiempo y no dejes que las fechas se te pasen. Aquí tienes el calendario oficial para asegurar tu éxito.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. CONTENIDO PRINCIPAL - SUPERPUESTO CON MARGEN NEGATIVO
      ========================================================================= */}
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-30">
        
        {/* WIDGET CUENTA REGRESIVA PREMIUM E INTELIGENTE */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#6544FF]/30 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.25)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#6544FF] rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
            
            {/* INFO DEL EVENTO PRÓXIMO */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 w-full lg:w-auto">
              <div className="w-20 h-20 shrink-0 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                <Clock className="w-10 h-10 text-[#C1AFFF] animate-pulse" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[#C1AFFF] font-bold text-sm uppercase tracking-widest mb-1">
                  {proximoEvento ? "Próximo Gran Hito" : "Proceso Finalizado"}
                </p>
                <h3 className="font-black italic uppercase text-2xl md:text-3xl text-white leading-tight">
                  {proximoEvento ? proximoEvento.titulo : "¡Éxito en tus resultados!"}
                </h3>
              </div>
            </div>
            
            {/* RELOJ EN TIEMPO REAL */}
            {isClient && proximoEvento && (
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <div className="flex gap-2 sm:gap-3">
                  {/* DÍAS */}
                  <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-16 sm:w-20 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="block font-black text-2xl sm:text-4xl text-white mb-0.5 tabular-nums">{formatTime(tiempoRestante.dias)}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Días</span>
                  </div>
                  {/* HORAS */}
                  <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-16 sm:w-20 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="block font-black text-2xl sm:text-4xl text-white mb-0.5 tabular-nums">{formatTime(tiempoRestante.horas)}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Hrs</span>
                  </div>
                  {/* MINUTOS */}
                  <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-16 sm:w-20 backdrop-blur-sm flex flex-col items-center justify-center">
                    <span className="block font-black text-2xl sm:text-4xl text-white mb-0.5 tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-[#D8B4FE]">{formatTime(tiempoRestante.minutos)}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#A78BFA] uppercase tracking-wider">Min</span>
                  </div>
                  {/* SEGUNDOS */}
                  <div className="bg-white/5 border border-[#6544FF]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-16 sm:w-20 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_15px_rgba(101,68,255,0.2)]">
                    <span className="block font-black text-2xl sm:text-4xl text-white mb-0.5 tabular-nums animate-pulse text-transparent bg-clip-text bg-gradient-to-b from-white to-[#6544FF]">{formatTime(tiempoRestante.segundos)}</span>
                    <span className="text-[10px] sm:text-xs font-bold text-[#6544FF] uppercase tracking-wider">Seg</span>
                  </div>
                </div>

                {/* BOTÓN ALERTA CALENDARIO */}
                <button 
                  onClick={() => abrirGoogleCalendar(proximoEvento.titulo, proximoEvento.descripcion, proximoEvento.calendarDates)}
                  className="w-full sm:w-auto h-full sm:h-auto min-h-[4rem] bg-[#6544FF] hover:bg-[#5236CC] text-white rounded-xl sm:rounded-2xl px-6 py-8 font-bold transition-all flex flex-row sm:flex-col items-center justify-center shadow-lg hover:shadow-[#6544FF]/40 gap-2 sm:gap-1 group/btn"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:-rotate-12 transition-transform" />
                  <span className="text-xs uppercase tracking-wider">Avisarme</span>
                </button>
              </div>
            )}
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
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-12 md:before:ml-[4.5rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-gray-200 before:via-[#6544FF]/30 before:to-gray-200">
          
          {eventosFiltrados.map((evento, i) => {
            const fechaEvento = parseDateString(evento.calendarDates);
            const yaPaso = fechaEvento.getTime() < new Date().getTime();

            return (
              <div 
                key={evento.id} 
                className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-8 fade-in fill-mode-both ${yaPaso ? 'opacity-70 hover:opacity-100' : ''}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                
                {/* Ícono central en la línea de tiempo */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#F4F5F9] bg-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:scale-110 transition-transform duration-300">
                  <div className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${evento.color} text-white scale-90 ${yaPaso ? 'grayscale' : ''} group-hover:grayscale-0 transition-all`}>
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
                      {yaPaso && <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Completado</span>}
                    </div>
                    <h3 className="font-black text-xl text-[#1A1528] mb-2 leading-tight group-hover:text-[#6544FF] transition-colors">{evento.titulo}</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">{evento.descripcion}</p>
                    
                    {/* Botón Acción Google Calendar */}
                    {!yaPaso && (
                      <button 
                        onClick={() => abrirGoogleCalendar(evento.titulo, evento.descripcion, evento.calendarDates)}
                        className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#6544FF] opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:text-[#1A1528]"
                      >
                        <Bell className="w-4 h-4" /> Agregar a Google Calendar <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}

          {eventosFiltrados.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-gray-400">No hay eventos en esta categoría</h3>
            </div>
          )}
        </div>

      </div>

      {/* =========================================================================
          3. CSS CUSTOM
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 12s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}} />
    </section>
  );
}