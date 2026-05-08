// src/components/Hero.tsx
import { PenSquare, Search, Calendar, Calculator } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#fafafa] overflow-hidden min-h-[calc(100vh-5.5rem)] flex items-center relative py-10 lg:py-0">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LADO IZQUIERDO - TEXTOS Y BOTONES */}
          <div className="flex flex-col items-start w-full max-w-2xl mx-auto lg:mx-0">
            
            {/* Título Principal - Exactitud Figma */}
            <div className="flex flex-col items-start w-full">
              {/* Asumimos que Poppins es tu fuente global. Mantenemos el italic y mayúsculas */}
              <h1 className="uppercase tracking-tighter flex flex-col items-start w-full space-y-2">
                
                {/* Línea 1: DECISIÓN ACTIVA (Figma: Poppins ExtraBold, 64px, #1E003E) */}
                <span className="text-[#1E003E] font-extrabold italic text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[58px] leading-[1] lg:leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-sm">
                  DECISIÓN ACTIVA
                </span>
                
                {/* Línea 2: DESCUBRE TU FUTURO (Figma: Poppins ExtraBold, 64px, #8554E4) */}
                <span className="text-[#8554E4] font-extrabold italic text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[58px] leading-[1] lg:leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 drop-shadow-sm">
                  DESCUBRE TU FUTURO
                </span>
                
                {/* Línea 3: ELIGE TU CARRERA (Figma: Poppins Bold, 89px, #1E003E) 
                    Notar el font-bold (en vez de extrabold) y el tamaño text-[89px] */}
                <span className="text-[#1E003E] font-bold italic text-[3.25rem] sm:text-[4rem] md:text-[4.75rem] lg:text-[76px] leading-[0.95] lg:leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 drop-shadow-sm mt-1 lg:-mt-1 pt-2">
                  ELIGE TU CARRERA
                </span>

              </h1>

              {/* Subtítulo Figma */}
              <p className="text-[#1E003E]/80 text-lg md:text-xl lg:text-2xl font-medium mt-6 lg:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 max-w-2xl leading-relaxed">
                Todo lo que necesites para elegir tu futuro con confianza
              </p>
            </div>

            {/* Accesos Directos (Cards inferiores) - Diseño limpio como en Figma */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-10 md:mt-14 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[600ms]">
              {[
                // AQUÍ ESTÁ EL CAMBIO: Agregamos la propiedad 'href' a cada objeto
                { icon: PenSquare, label: "Test Vocacional", href: "herramientas/test-vocacional" },
                { icon: Search, label: "Carreras", href: "herramientas/buscador" },
                { icon: Calendar, label: "Calendario", href: "herramientas/calendario" },
                { icon: Calculator, label: "Calculadora", href: "herramientas/calculadora" },
              ].map((item) => (
                <a
                  key={item.label}
                  // AQUÍ ESTÁ EL SEGUNDO CAMBIO: Le pasamos el href del objeto a la etiqueta <a>
                  href={item.href} 
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

          {/* LADO DERECHO - IMAGEN PROFESIONAL ADAPTABLE */}
          <div className="hidden lg:flex justify-center items-center h-full relative animate-in fade-in zoom-in-95 duration-1000 delay-500 p-8">
            {/* Contenedor relativo para manejar el ajuste exacto */}
            <div className="relative w-full h-full max-w-[550px] max-h-[550px] flex items-center justify-center">
              
              {/* Decoración de fondo suave (Opcional, para coherencia con el diseño original) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6544FF]/10 to-[#947BFF]/5 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

              {/* LA IMAGEN */}
              <img 
                src="/imagenes/imagen_portada.png"
                alt="Ilustración profesional descubriendo el futuro ideal"
                className="w-full h-full object-contain object-center drop-shadow-2xl"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}