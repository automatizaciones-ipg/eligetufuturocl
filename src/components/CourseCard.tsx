// src/components/CourseCard.tsx
import { MapPin, Building, Calculator, Clock, ChevronRight } from "lucide-react";
import type { CarreraUI } from "../types";

interface CourseCardProps {
  carrera: CarreraUI;
  index: number;
  tieneErrorLogo: boolean;
  onLogoError: (id: string) => void;
}

export function CourseCard({ carrera, index, tieneErrorLogo, onLogoError }: CourseCardProps) {
  return (
    <a 
      href={`/carrera/${carrera.id}`}
      className="group relative block bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_20px_80px_-15px_rgba(101,68,255,0.2)] hover:-translate-y-2 transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in fill-mode-both overflow-hidden cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute -right-20 -top-40 w-[30rem] h-[30rem] bg-gradient-to-br ${carrera.color} rounded-full opacity-0 blur-[100px] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none`}></div>
      <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-l-[2.5rem] z-0" style={{ backgroundImage: `linear-gradient(to bottom, var(--tw-gradient-stops))` }}></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
        
        <div className={`relative w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-4 border-white bg-gradient-to-br ${carrera.color} transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500 overflow-hidden flex items-center justify-center font-black text-3xl`}>
          {tieneErrorLogo ? (
            <span className="text-white drop-shadow-md">{carrera.sigla}</span>
          ) : (
            <img 
              src={`/logos/${carrera.logoArchivo}`} 
              alt={`Logo ${carrera.institucion}`} 
              className="w-full h-full object-contain bg-white/95 p-3"
              onError={(e) => {
                e.preventDefault();
                onLogoError(carrera.id);
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 pointer-events-none"></div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-[#6544FF]/10 text-[#6544FF] text-xs font-black uppercase tracking-widest shadow-sm">
              {carrera.tipoInst}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-100/80 text-slate-500 text-xs font-bold uppercase tracking-widest border border-slate-200/50">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {carrera.region}
            </span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-6 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#6544FF] group-hover:to-cyan-500 transition-all duration-300">
            {carrera.nombre}
          </h3>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 group-hover:bg-[#6544FF]/5 rounded-2xl border border-slate-100 transition-colors duration-300 w-full sm:w-auto">
              <Building className="w-4 h-4 text-slate-400 group-hover:text-[#6544FF] transition-colors" />
              <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px]" title={carrera.institucion}>{carrera.institucion}</span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 group-hover:bg-[#6544FF]/5 rounded-2xl border border-slate-100 transition-colors duration-300 w-full sm:w-auto">
              <Calculator className="w-4 h-4 text-slate-400 group-hover:text-[#6544FF] transition-colors" />
              <span className="text-sm font-bold text-slate-800">{carrera.puntaje}</span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 group-hover:bg-[#6544FF]/5 rounded-2xl border border-slate-100 transition-colors duration-300 w-full sm:w-auto">
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-[#6544FF] transition-colors" />
              <span className="text-sm font-semibold text-slate-600">{carrera.duracion}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-none border-slate-100 flex flex-col items-center justify-center shrink-0">
          <div className="hidden md:block text-center mb-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <p className="text-[11px] uppercase font-black text-[#6544FF] tracking-widest">
              Ver Detalles
            </p>
          </div>
          
          <div className="w-full md:w-16 h-14 md:h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#6544FF] group-hover:to-cyan-400 group-hover:text-white transition-all duration-500 group-hover:shadow-[0_10px_40px_rgba(101,68,255,0.4)] group-hover:scale-110 relative overflow-hidden">
            <span className="md:hidden font-bold text-sm uppercase tracking-wider mr-2 text-slate-600 group-hover:text-white transition-colors relative z-10">Ver Carrera</span>
            <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
          </div>
        </div>

      </div>
    </a>
  );
}