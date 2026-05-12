// src/components/Hero.tsx
import { PenSquare, Search, Calendar, Calculator } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#fafafa] overflow-hidden min-h-[calc(100vh-5.5rem)] flex items-center relative py-12 lg:py-0">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Cambiamos el gap en móvil a gap-16 para dar un "respiro" perfecto entre las cards y la imagen */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* LADO IZQUIERDO - TEXTOS Y BOTONES */}
          <div className="flex flex-col items-start w-full max-w-2xl mx-auto lg:mx-0">
            
            <div className="flex flex-col items-start w-full">
              <h1 className="uppercase tracking-tighter flex flex-col items-start w-full space-y-2">
                <span className="text-[#1E003E] font-extrabold italic text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[58px] leading-[1] lg:leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-sm">
                  DECISIÓN ACTIVA
                </span>
                
                <span className="text-[#8554E4] font-extrabold italic text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[58px] leading-[1] lg:leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 drop-shadow-sm">
                  DESCUBRE TU FUTURO
                </span>
                
                <span className="text-[#1E003E] font-bold italic text-[3.25rem] sm:text-[4rem] md:text-[4.75rem] lg:text-[76px] leading-[0.95] lg:leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 drop-shadow-sm mt-1 lg:-mt-1 pt-2">
                  ELIGE TU CARRERA
                </span>
              </h1>

              <p className="text-[#1E003E]/80 text-lg md:text-xl lg:text-2xl font-medium mt-6 lg:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 max-w-2xl leading-relaxed">
                Todo lo que necesites para elegir tu futuro con confianza
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-10 md:mt-14 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[600ms]">
              {[
                { icon: PenSquare, label: "Test Vocacional", href: "herramientas/test-vocacional" },
                { icon: Search, label: "Carreras", href: "herramientas/buscador" },
                { icon: Calendar, label: "Calendario", href: "herramientas/calendario" },
                { icon: Calculator, label: "Calculadora", href: "herramientas/calculadora" },
              ].map((item) => (
                <a
                  key={item.label}
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

          {/* LADO DERECHO - IMAGEN PROFESIONAL ADAPTABLE (UI/UX Mejorado) */}
          {/* Se eliminó el "hidden". Ahora es visible en todas las pantallas. */}
          <div className="flex justify-center items-center w-full relative animate-in fade-in zoom-in-95 duration-1000 delay-500 lg:p-8">
            
            {/* Contenedor relativo con anchos máximos controlados (Mobile First) 
                Esto asegura que en celular no se vea gigante y en PC mantenga su tamaño original */}
            <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[380px] md:max-w-[450px] lg:max-w-[550px] lg:max-h-[550px] flex items-center justify-center">
              
              {/* Decoración de fondo suave: Ajustamos el blur según el tamaño de la pantalla */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6544FF]/20 to-[#947BFF]/10 rounded-full blur-2xl lg:blur-3xl -z-10 animate-pulse-slow"></div>

              {/* LA IMAGEN */}
              <img 
                src="/imagenes/imagen_portada.png"
                alt="Ilustración profesional descubriendo el futuro ideal"
                className="w-full h-full object-contain object-center drop-shadow-xl lg:drop-shadow-2xl transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}