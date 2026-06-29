// src/components/GenerandoLoader.tsx
import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, Briefcase, Building2, Sparkles } from "lucide-react";

type Tipo = "carreras" | "noticias" | "instituciones" | "mercado" | "default";

interface Props {
  mensajes?: string[];
  tipo?: Tipo;
  className?: string;
}

const MENSAJES_DEFECTO = ["Procesando datos...", "Preparando resultados...", "Casi listo..."];

const ICONOS: Record<Tipo, React.ReactNode> = {
  carreras:      <GraduationCap className="w-11 h-11 text-[#6544FF] animate-pulse" />,
  noticias:      <BookOpen      className="w-11 h-11 text-[#6544FF] animate-pulse" />,
  instituciones: <Building2     className="w-11 h-11 text-[#6544FF] animate-pulse" />,
  mercado:       <Briefcase     className="w-11 h-11 text-[#6544FF] animate-pulse" />,
  default:       <Sparkles      className="w-11 h-11 text-[#6544FF] animate-pulse" />,
};

export default function GenerandoLoader({
  mensajes = MENSAJES_DEFECTO,
  tipo = "default",
  className = "",
}: Props) {
  const [fraseIdx, setFraseIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFraseIdx(i => (i + 1) % mensajes.length), 2000);
    return () => clearInterval(t);
  }, [mensajes.length]);

  return (
    <div
      className={`w-full flex flex-col items-center justify-center bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative ${className}`}
      role="status"
      aria-label={mensajes[fraseIdx] || "Cargando"}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#6544FF]/5 blur-[80px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center py-14 px-6">

        {/* Anillo — mismo patrón que TestVocacional */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 bg-[#6544FF]/15 rounded-full animate-ping opacity-60" />
          <div className="absolute inset-2 border-[3px] border-[#6544FF]/20 rounded-full" />
          <div
            className="absolute inset-2 border-[3px] border-[#6544FF] rounded-full border-t-transparent border-r-transparent animate-spin"
            style={{ animationDuration: "1.1s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-[18px] shadow-lg">
            {ICONOS[tipo]}
          </div>
        </div>

        {/* Frase rotativa */}
        <div className="h-6 overflow-hidden relative w-full max-w-xs">
          <p
            key={fraseIdx}
            className="text-[#6544FF] font-semibold text-sm animate-in slide-in-from-bottom-3 fade-in duration-500 absolute w-full left-0 text-center"
          >
            {mensajes[fraseIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}
