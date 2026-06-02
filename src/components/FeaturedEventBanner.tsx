// src/components/FeaturedEventBanner.tsx
import React from "react";
import { AlertCircle } from "lucide-react";

export interface EventBannerData {
  id?: string;
  isFeatured?: boolean;
  featuredLabel?: string;
  mainTitle: string;
  subtitle: string;
  badgeText: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  imageAlt?: string;
}

interface Props {
  event: EventBannerData;
}

export default function FeaturedEventBanner({ event }: Props) {
  return (
    // pt-[120px] asegura que haya espacio arriba para que la imagen de 381px no se corte con la sección anterior
    <section className="w-full px-4 md:px-6 pt-[120px] pb-12 w-full flex justify-center">
      
      {/* CONTENEDOR PRINCIPAL
        Medida exacta de Figma: 1341px de ancho máximo. 
        Alto en PC: 260px (para que la imagen de 381px sobresalga 121px por arriba).
      */}
      <div className="relative w-full max-w-[1480px] bg-[#2A0056] rounded-[24px] flex flex-col lg:flex-row lg:h-[300px] shadow-[0_20px_50px_rgba(30,0,62,0.3)] mt-8 lg:mt-0">
        
        {/* --- LADO IZQUIERDO: IMAGEN Y BOTÓN --- */}
        {/* Reservamos un ancho fijo en PC (aprox 450px) para que la imagen no aplaste el texto */}
        <div className="relative w-full lg:w-[450px] h-[200px] lg:h-full shrink-0 flex justify-center lg:justify-start">
          
          {/* IMAGEN EXACTA: 442 x 381 */}
          {/* Anclada al fondo (bottom-0) para que se apoye en la base del banner */}
          <img
            src={event.imageUrl}
            alt={event.imageAlt || "Evento destacado"}
            className="absolute bottom-0 lg:left-[50px] h-[340px] lg:h-[381px] w-auto max-w-none object-contain pointer-events-none z-10"
          />
          
          {/* BOTÓN EXACTO: 212 x 45, Radio 5 */}
          {/* Posicionado exactamente como en Figma: sobre los chicos, alineado hacia la derecha */}
          <a
            href={event.buttonUrl}
            className="absolute z-20 bottom-[-20px] lg:bottom-[120px] lg:left-[170px] w-[212px] h-[45px] bg-[#6A04E4] hover:bg-[#5903b8] text-white font-['Poppins'] font-bold text-[16px] rounded-[5px] flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          >
            {event.buttonText}
          </a>
        </div>

        {/* --- LADO DERECHO: TEXTOS Y BADGES --- */}
        {/* Flex-1 toma todo el espacio restante. pr-[80px] da el margen derecho exacto. */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center lg:items-end text-center lg:text-right px-6 pt-[50px] pb-10 lg:p-0 lg:pr-[80px] z-20 relative">
          
          {/* ETIQUETA "Evento Destacado": Gap 10px exacto, Color #D27BFE */}
          {event.isFeatured && (
            <div className="flex items-center gap-[10px] mb-4 lg:mb-0 lg:absolute lg:top-[30px] lg:right-[80px]">
              <AlertCircle size={20} className="fill-[#D27BFE] text-[#1E003E]" />
              <span className="text-[#D27BFE] font-['Poppins'] font-bold text-[16px]">
                {event.featuredLabel || "Evento Destacado"}
              </span>
            </div>
          )}
          
          {/* TÍTULO PRINCIPAL: 487x60, Poppins 40px, ExtraBold, Italic */}
          <h2 className="font-['Poppins'] font-extrabold italic text-3xl sm:text-4xl lg:text-[40px] text-white leading-tight lg:leading-[60px] tracking-wide">
            {event.mainTitle}
          </h2>
          
          {/* CONTENEDOR SUBTÍTULO + ETIQUETA SIAD 2026 */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-[15px] w-full mt-2 lg:mt-0">
            
            {/* SUBTÍTULO: 456x50, Poppins 33px, SemiBold, Italic, 90% Opacidad */}
            <span className="font-['Poppins'] font-semibold italic text-2xl lg:text-[33px] text-white/90 leading-tight lg:leading-[50px]">
              {event.subtitle}
            </span>
            
            {/* ETIQUETA SIAD 2026: 172x45, Radio 5, Degradado lineal a morado */}
            <span className="flex items-center justify-center w-[172px] h-[45px] bg-gradient-to-r from-[#B461FF] to-[#8720FF] rounded-[5px] font-['Poppins'] font-bold text-[22px] text-[#1E003E] shadow-md">
              {event.badgeText}
            </span>
          </div>

          {/* DESCRIPCIÓN: 588x27, Montserrat 16px, Medium, 80% Opacidad, Line Height 146.4% */}
          <p className="font-['Montserrat'] font-medium text-[14px] lg:text-[16px] text-white/80 leading-[1.464] max-w-[588px] mt-[15px]">
            {event.description}
          </p>

        </div>
      </div>
    </section>
  );
}