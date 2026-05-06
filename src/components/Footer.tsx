// src/components/Footer.tsx
import { Mail, Smartphone, Instagram, Users, AtSign } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#130E24] pt-16 pb-8 border-t border-[#6544FF]/20">
      <div className="container mx-auto px-6 lg:px-8">
        
        {/* Grilla principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Columna 1: Logo y Descripción */}
          <div className="flex flex-col items-start max-w-sm">
            {/* Aquí mandamos a llamar el icono.svg desde la carpeta public */}
            <img 
              src="/public/logos_web/logo_3_blanco.webp" 
              alt="Elige Tu Futuro" 
              className="h-14 mb-6 hover:scale-105 transition-transform duration-300"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              La plataforma gratuita que te ayuda a elegir tu carrera ideal
            </p>
          </div>

          {/* Columna 2: Herramientas */}
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">
              Herramientas
            </h5>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/herramientas/test-vocacional" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Test Vocacional</a></li>
              <li><a href="/herramientas/buscador" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Buscador de Carreras</a></li>
              <li><a href="/herramientas/calculadora" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Calculadora PAES</a></li>
              <li><a href="/herramientas/mercado-laboral" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Mercado Laboral</a></li>
            </ul>
          </div>

          {/* Columna 3: Información */}
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">
              Información
            </h5>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/informacion/becas" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Becas y Gratuidad</a></li>
              <li><a href="/informacion/calendario" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Calendario PAES</a></li>
              <li><a href="/instituciones" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Instituciones</a></li>
              <li><a href="/informacion/eventos" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">Eventos y Charlas</a></li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h5 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">
              Contacto
            </h5>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>
                <a href="/nosotros" className="group flex items-center gap-3 hover:text-white transition-colors duration-200">
                  <Users className="w-4 h-4 text-[#6544FF] group-hover:text-white transition-colors" />
                  <span>Sobre nosotros</span>
                </a>
              </li>
              <li>
                <a href="mailto:EligeTuFuturo@ipg.cl" className="group flex items-center gap-3 hover:text-white transition-colors duration-200">
                  <Mail className="w-4 h-4 text-[#6544FF] group-hover:text-white transition-colors" />
                  <span>EligeTuFuturo@ipg.cl</span>
                </a>
              </li>
              <li>
                <a href="tel:+569000000" className="group flex items-center gap-3 hover:text-white transition-colors duration-200">
                  <Smartphone className="w-4 h-4 text-[#6544FF] group-hover:text-white transition-colors" />
                  <span>+569 000 000</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-3 hover:text-white transition-colors duration-200">
                  <AtSign className="w-4 h-4 text-[#6544FF] group-hover:text-white transition-colors" />
                  <span>@EligeTuFuturo.cl</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center gap-3 hover:text-white transition-colors duration-200">
                  <Instagram className="w-4 h-4 text-[#6544FF] group-hover:text-white transition-colors" />
                  <span>@EligeTuFuturo.cl</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-center text-xs text-gray-500">
          <p>2026 EligeTuFuturo.cl - Hecho en Chile</p>
        </div>
        
      </div>
    </footer>
  );
}