// src/components/Hero.tsx
import { PenSquare, Search, Calendar, Calculator } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#fafafa] overflow-hidden min-h-[calc(100vh-5.5rem)] flex items-center relative py-10 lg:py-0">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LADO IZQUIERDO - TEXTOS Y BOTONES */}
          <div className="flex flex-col items-start w-full max-w-2xl mx-auto lg:mx-0">
            
            {/* Título Principal - Tamaños ajustados y alineación estricta */}
            <h1 className="font-black italic text-[#1A1528] uppercase tracking-tight leading-[1.1] flex flex-col items-start w-full">
              
              <span className="text-4xl md:text-5xl lg:text-[4rem] animate-in fade-in slide-in-from-bottom-4 duration-700">
                Descubre tu
              </span>
              
              {/* Caja Futuro */}
              <span className="text-4xl md:text-5xl lg:text-[3.8rem] bg-[#C1AFFF] text-[#1A1528] px-4 md:px-6 py-0 md:py-1 rounded-xl md:rounded-2xl mt-1 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 shadow-sm">
                Futuro
              </span>
              
              <span className="text-4xl md:text-5xl lg:text-[4rem] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 mt-1">
                Aclara tus
              </span>
              
              <span className="text-4xl md:text-5xl lg:text-[4rem] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[250ms]">
                Dudas
              </span>
              
              {/* Línea ELIGE TU CARRERA (En línea en desktop, apilado en móvil si no cabe) */}
              <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 mt-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 w-full">
                <span className="text-4xl md:text-5xl lg:text-[4rem]">
                  Elige tu
                </span>
                <span className="text-4xl md:text-5xl lg:text-[3.8rem] bg-[#8B75FF] text-[#1A1528] px-4 md:px-6 py-0 md:py-1 rounded-xl md:rounded-2xl shadow-sm">
                  Carrera
                </span>
              </div>
              
              <span className="text-4xl md:text-5xl lg:text-[4rem] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 mt-1 w-full max-w-[90%] md:max-w-full">
                Calcula tu puntaje
              </span>
            </h1>

            {/* Accesos Directos (Cards inferiores) - Diseño limpio como en Figma */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-10 md:mt-14 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[600ms]">
              {[
                { icon: PenSquare, label: "Test Vocacional" },
                { icon: Search, label: "Carreras" },
                { icon: Calendar, label: "Calendario" },
                { icon: Calculator, label: "Calculadora" },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className="group flex items-center gap-3 bg-white hover:bg-[#F3F0FF] rounded-2xl p-3 md:p-4 transition-all duration-200 shadow-sm border border-gray-100 hover:border-[#8B75FF]/30 hover:shadow-md"
                >
                  <div className="text-[#6544FF] group-hover:scale-110 transition-transform duration-200 shrink-0">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-800 group-hover:text-[#6544FF] transition-colors leading-tight">
                    {item.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* LADO DERECHO - ARTE CSS */}
          <div className="hidden -scale-x-100 lg:flex justify-center items-center h-full relative animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="relative w-[500px] h-[500px] rotate-[-45deg]">
              <div className="absolute top-0 left-12 w-32 h-80 bg-[#947BFF] rounded-full shadow-2xl animate-[pulse_4s_ease-in-out_infinite]"></div>
              <div className="absolute top-24 left-48 w-32 h-80 bg-[#6544FF] rounded-full shadow-2xl animate-[pulse_5s_ease-in-out_infinite_reverse]"></div>
              <div className="absolute top-48 left-84 w-32 h-80 bg-[#2B239A] rounded-full shadow-2xl animate-[pulse_6s_ease-in-out_infinite]"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}