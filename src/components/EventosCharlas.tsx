// src/components/EventosCharlas.tsx
import { useState, useEffect } from "react";
import { 
  Video, MapPin, Users, Calendar, ArrowRight, 
  Star, MonitorPlay, Sparkles, Clock, ArrowLeft
} from "lucide-react";

// --- DATOS REALES DE EVENTOS Y FERIAS (CHILE) ---
const EVENTOS_DATA = [
  {
    id: 1,
    titulo: "Expo Futuro Novato y Novata UC",
    institucion: "Pontificia Universidad Católica de Chile",
    fecha: "10 al 12 de Octubre",
    hora: "09:00 - 17:30 hrs",
    modalidad: "presencial",
    tipo: "feria",
    ubicacion: "Campus San Joaquín, Macul",
    color: "from-[#15803d] to-emerald-400",
    cupos: "Inscripciones Abiertas",
    link: "https://www.uc.cl/agenda/actividad/expo-futuro-novato-y-novata-uc-2026"
  },
  {
    id: 2,
    titulo: "Charlas Oficiales: Proceso Admisión 2026",
    institucion: "DEMRE",
    fecha: "Miércoles de Mayo a Nov",
    hora: "16:00 hrs",
    modalidad: "online",
    tipo: "charla",
    ubicacion: "Canal YouTube DEMRE",
    color: "from-[#6544FF] to-[#947BFF]",
    cupos: "Abierto",
    link: "https://demre.cl/videos/176-charla-proceso-admision-2026#:~:text=A%20las%2015%20horas%20de%20este%20viernes,Proceso%20de%20Admisi%C3%B3n%202026.%20Tap%20to%20unmute."
  },
  {
    id: 3,
    titulo: "Semana del Postulante",
    institucion: "Universidad de Chile",
    fecha: "Enero (Post Resultados PAES)",
    hora: "09:00 - 18:00 hrs",
    modalidad: "presencial",
    tipo: "feria",
    ubicacion: "Facultad de Economía y Negocios",
    color: "from-blue-600 to-cyan-400",
    cupos: "Próximamente",
    link: "https://admision.uchile.cl/semana-del-postulante/"
  },
  {
    id: 4,
    titulo: "Open Day: Puertas Abiertas USM",
    institucion: "Universidad Técnica Federico Santa María",
    fecha: "25 y 26 de Agosto",
    hora: "09:00 - 14:00 hrs",
    modalidad: "presencial",
    tipo: "open-day",
    ubicacion: "Campus Casa Central (Valparaíso) / San Joaquín (Santiago)",
    color: "from-orange-500 to-amber-400",
    cupos: "Cupos Limitados",
    link: "https://difusion.usm.cl/index.php/puertasabiertas/index/sede_id/2.html"
  }
];

const FILTROS = [
  { id: "todo", label: "Todos los Eventos" },
  { id: "feria", label: "Ferias Universitarias" },
  { id: "open-day", label: "Open Days / Puertas Abiertas" },
  { id: "charla", label: "Charlas Oficiales" }
];

export default function EventosCharlas() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [eventos, setEventos] = useState(EVENTOS_DATA);

  // Animación de filtrado
  useEffect(() => {
    setEventos([]); 
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setEventos(EVENTOS_DATA);
      } else {
        setEventos(EVENTOS_DATA.filter(e => e.tipo === filtroActivo));
      }
    }, 50); 
  }, [filtroActivo]);

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER) - FULL WIDTH, CURVO Y TOP ABSOLUTO
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl">
          {/* Botón Volver */}
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <MonitorPlay className="w-4 h-4" /> Conecta con tu futuro
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Ferias, Charlas y <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Open Days</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Explora los campus, asiste a ferias vocacionales y resuelve tus dudas conversando directamente con estudiantes, instituciones y el DEMRE.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Layout con margen negativo)
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* EVENTO DESTACADO REAL (SIAD) - Hero Card */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.2)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          {/* Efecto de luz de fondo */}
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-[#6544FF]/40 to-cyan-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs mb-4 border border-orange-500/20 uppercase tracking-widest">
                <Star className="w-3 h-3 fill-current" /> Evento Destacado Nacional
              </div>
              <h3 className="font-black italic uppercase text-4xl md:text-5xl text-white mb-4 leading-none">
                Salón de Orientación <br /> SIAD 2025
              </h3>
              <p className="text-[#C1AFFF] text-lg font-medium max-w-md mb-6">
                La feria vocacional presencial más grande de Chile. Reúne a las principales Universidades, CFTs, IPs e Instituciones Militares en un solo lugar.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-300">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-[#947BFF]" /> Octubre (Fechas por confirmar)
                </span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-cyan-400" /> Centro Cultural Estación Mapocho
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6544FF] to-cyan-400 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <Users className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-black text-2xl mb-1">+25.000</span>
              <span className="text-[#C1AFFF] text-xs font-bold uppercase tracking-wider mb-6">Asistentes Anuales</span>
              
              <a 
                href="https://siad.cl/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-[#1A1528] hover:bg-gray-100 rounded-2xl py-3 px-8 font-black uppercase tracking-wider text-center transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] block"
              >
                Ver Sitio Oficial
              </a>
            </div>
          </div>
        </div>

        {/* TABS DE FILTRADO */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-in fade-in duration-500 delay-300">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.id}
              onClick={() => setFiltroActivo(filtro.id)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm
                ${filtroActivo === filtro.id 
                  ? "bg-[#1A1528] text-white scale-105 shadow-lg" 
                  : "bg-white text-gray-500 hover:text-[#1A1528] hover:bg-gray-50 border border-gray-100"
                }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        {/* GRID DE EVENTOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {eventos.map((evento, i) => (
            <div 
              key={evento.id}
              className="group bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col justify-between animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Esquina superior color decorativa */}
              <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${evento.color} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 blur-xl pointer-events-none`}></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r ${evento.color} text-white bg-opacity-10`}>
                    {FILTROS.find(f => f.id === evento.tipo)?.label}
                  </span>
                  
                  {evento.modalidad === "online" ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-cyan-500 bg-cyan-50 px-2 py-1 rounded-lg">
                      <Video className="w-3 h-3" /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                      <MapPin className="w-3 h-3" /> Presencial
                    </span>
                  )}
                </div>

                <h3 className="font-black text-2xl text-[#1A1528] mb-2 leading-tight group-hover:text-[#6544FF] transition-colors">
                  {evento.titulo}
                </h3>
                <p className="text-gray-500 font-medium mb-6">
                  {evento.institucion}
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <Calendar className="w-4 h-4 text-[#6544FF]" />
                    </div>
                    {evento.fecha} • {evento.hora}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      {evento.modalidad === "online" ? <MonitorPlay className="w-4 h-4 text-[#6544FF]" /> : <MapPin className="w-4 h-4 text-[#6544FF]" />}
                    </div>
                    {evento.ubicacion}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10">
                <span className={`text-xs font-bold uppercase ${evento.cupos.includes('Últimos') || evento.cupos.includes('Agotándose') ? 'text-orange-500 flex items-center gap-1' : 'text-gray-400'}`}>
                  {evento.cupos.includes('Últimos') && <Clock className="w-3 h-3" />}
                  {evento.cupos}
                </span>
                
                {/* Botón convertido en link real (redirige) */}
                <a 
                  href={evento.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#6544FF] group-hover:gap-3 transition-all"
                >
                  Más Info <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {eventos.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300 mt-6">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-xl text-gray-400">Pronto anunciaremos más eventos oficiales</h3>
          </div>
        )}

      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS DEL BANNER
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Flote de las esferas del Hero (Blob) */
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

        /* Fade in subiendo */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}