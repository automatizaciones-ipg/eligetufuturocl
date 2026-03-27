// src/components/EventosCharlas.tsx
import { useState, useEffect } from "react";
import { 
  Video, MapPin, Users, Calendar, ArrowRight, 
  Star, MonitorPlay, Sparkles, Clock
} from "lucide-react";

// --- DATOS DE EVENTOS Y FERIAS ---
const EVENTOS_DATA = [
  {
    id: 1,
    titulo: "Open Day: Ingeniería y Tecnología",
    institucion: "Universidad Técnica Federico Santa María",
    fecha: "12 de Mayo",
    hora: "10:00 - 14:00 hrs",
    modalidad: "presencial",
    tipo: "open-day",
    ubicacion: "Campus San Joaquín",
    color: "from-[#15803d] to-emerald-400",
    cupos: "Últimos cupos"
  },
  {
    id: 2,
    titulo: "Feria de Orientación Vocacional Sur",
    institucion: "Múltiples Universidades",
    fecha: "20 de Mayo",
    hora: "09:00 - 18:00 hrs",
    modalidad: "online",
    tipo: "feria",
    ubicacion: "Plataforma Virtual 3D",
    color: "from-[#6544FF] to-[#947BFF]",
    cupos: "Abierto"
  },
  {
    id: 3,
    titulo: "Charla: ¿Cómo financiar tu carrera?",
    institucion: "Ministerio de Educación",
    fecha: "05 de Junio",
    hora: "18:30 hrs",
    modalidad: "online",
    tipo: "charla",
    ubicacion: "Vía Zoom",
    color: "from-orange-500 to-amber-400",
    cupos: "Abierto"
  },
  {
    id: 4,
    titulo: "Experiencia Medicina y Salud",
    institucion: "Universidad Católica",
    fecha: "15 de Junio",
    hora: "09:30 - 13:00 hrs",
    modalidad: "presencial",
    tipo: "open-day",
    ubicacion: "Campus Casa Central",
    color: "from-blue-500 to-cyan-400",
    cupos: "Agotándose"
  }
];

const FILTROS = [
  { id: "todo", label: "Todos los Eventos" },
  { id: "feria", label: "Ferias Virtuales" },
  { id: "open-day", label: "Open Days" },
  { id: "charla", label: "Charlas" }
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
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      
      {/* HEADER ESPECTACULAR */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-6 border border-[#6544FF]/20 uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
          <MonitorPlay className="w-4 h-4" /> Conecta con tu futuro
        </div>
        
        <h2 className="font-black italic uppercase text-5xl md:text-6xl text-[#1A1528] tracking-tight mb-6 leading-[1.05] animate-in fade-in zoom-in-95 duration-700">
          Ferias, Charlas y <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-[#947BFF]">Open Days</span>
        </h2>
        
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Explora los campus, asiste a ferias virtuales y resuelve todas tus dudas conversando directamente con estudiantes y académicos.
        </p>
      </div>

      {/* EVENTO DESTACADO (Hero Card) */}
      <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.2)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        {/* Efecto de luz de fondo */}
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-[#6544FF]/40 to-cyan-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 group-hover:opacity-80 transition-opacity duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs mb-4 border border-orange-500/20 uppercase tracking-widest">
              <Star className="w-3 h-3 fill-current" /> Evento Imperdible
            </div>
            <h3 className="font-black italic uppercase text-4xl md:text-5xl text-white mb-4 leading-none">
              Gran Feria <br /> Nacional 2026
            </h3>
            <p className="text-[#C1AFFF] text-lg font-medium max-w-md mb-6">
              Más de 50 universidades reunidas en un entorno virtual 3D interactivo. Descubre mallas curriculares y becas exclusivas.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-300">
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-[#947BFF]" /> 28 y 29 de Abril
              </span>
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Video className="w-4 h-4 text-cyan-400" /> 100% Online
              </span>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6544FF] to-cyan-400 flex items-center justify-center mb-4 shadow-lg animate-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-black text-2xl mb-1">+10.000</span>
            <span className="text-[#C1AFFF] text-xs font-bold uppercase tracking-wider mb-6">Inscritos</span>
            <button className="w-full bg-white text-[#1A1528] hover:bg-gray-100 rounded-2xl py-3 px-8 font-black uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Asegurar Cupo
            </button>
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
            <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${evento.color} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 blur-xl`}></div>

            <div>
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
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                    <Calendar className="w-4 h-4 text-[#6544FF]" />
                  </div>
                  {evento.fecha} • {evento.hora}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                    {evento.modalidad === "online" ? <MonitorPlay className="w-4 h-4 text-[#6544FF]" /> : <MapPin className="w-4 h-4 text-[#6544FF]" />}
                  </div>
                  {evento.ubicacion}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className={`text-xs font-bold uppercase ${evento.cupos.includes('Últimos') || evento.cupos.includes('Agotándose') ? 'text-orange-500 flex items-center gap-1' : 'text-gray-400'}`}>
                {evento.cupos.includes('Últimos') && <Clock className="w-3 h-3" />}
                {evento.cupos}
              </span>
              <button className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#6544FF] group-hover:gap-3 transition-all">
                Me interesa <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {eventos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300 mt-6">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-xl text-gray-400">Pronto anunciaremos más eventos</h3>
        </div>
      )}

    </div>
  );
}