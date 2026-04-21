import { 
  FileEdit, 
  Search, 
  CalendarDays, 
  Calculator, 
  PiggyBank, 
  Megaphone, 
  TrendingUp, 
  Building2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";

// Configuramos las URLs reales (slugs) a las que irán en el futuro
const tools = [
  { 
    icon: FileEdit, 
    title: "Test Vocacional", 
    description: "5 minutos y sabrás por dónde empezar",
    href: "/herramientas/test-vocacional"
  },
  { 
    icon: Search, 
    title: "Buscador de Carreras", 
    description: "Filtra por U, IP, CFT, gratuidad y región",
    href: "/herramientas/buscador"
  },
  { 
    icon: CalendarDays, 
    title: "Calendario PAES", 
    description: "Fechas clave, ensayos y más",
    href: "/herramientas/calendario",
    isNew: true // <--- QUIRÚRGICO: Agregamos esta propiedad
  },
  { 
    icon: Calculator, 
    title: "Calculadora de Puntaje", 
    description: "Simula NEM y Ranking",
    href: "/herramientas/calculadora"
  },
  { 
    icon: PiggyBank, 
    title: "Becas y Gratuidad", 
    description: "Guía paso a paso del FUAS",
    href: "/herramientas/fuas"
  },
  { 
    icon: Megaphone, 
    title: "Eventos y Charlas", 
    description: "Ferias virtuales y open days",
    href: "/herramientas/eventos"
  },
  { 
    icon: TrendingUp, 
    title: "Mercado Laboral", 
    description: "¿Cuánto ganan? Empleabilidad real",
    href: "/herramientas/mercado-laboral"
  },
  { 
    icon: Building2, 
    title: "Todas las Instituciones", 
    description: "Directorio completo por región",
    href: "/herramientas/instituciones"
  },
];

export default function ToolsSection() {
  return (
    // CONTENEDOR RAÍZ CON EL FONDO CLARO GLOBAL
    <section className="w-full bg-[#F4F5F9] pb-20">
      
      {/* =========================================================================
          1. HERO BANNER - EXACTAMENTE IGUAL AL RESTO DEL SITIO (CURVO)
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] pt-20 pb-40 px-6 overflow-hidden shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20 border-b border-white/5">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0 ">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>

        {/* Textos del Banner (Tipografía estandarizada) */}
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <Sparkles className="w-4 h-4" /> Explora y Decide
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Nuestras <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Herramientas</span>
          </h2>
          
          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Todo lo que necesites para elegir tu futuro con confianza
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. TARJETAS DE HERRAMIENTAS - SUPERPUESTAS CON MARGEN NEGATIVO
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-30">
        
        {/* Grilla de Herramientas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tools.map((tool, index) => (
            <a
              key={tool.title}
              href={tool.href}
              // CONTENEDORES BLANCOS SUPERPUESTOS
              className="group bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(101,68,255,0.15)] transition-all duration-300 hover:-translate-y-2 border border-gray-100 flex flex-col h-full relative overflow-hidden animate-in fade-in slide-in-from-bottom-8"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >

              {/* Contenedor del Ícono ORIGINAL (#6544FF) */}
              <div className="w-16 h-16 rounded-2xl bg-[#6544FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#6544FF] transition-colors duration-300">
                <tool.icon 
                  className="w-8 h-8 text-[#6544FF] group-hover:text-white transition-colors duration-300" 
                  strokeWidth={2} 
                />
              </div>
              
              {/* Textos ORIGINALES (#1A1528 y gris) */}
              <h3 className="font-bold text-xl text-[#1A1528] mb-3 leading-tight group-hover:text-[#6544FF] transition-colors duration-300">
                {tool.title}
              </h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                {tool.description}
              </p>

              {/* Botón sutil de "Ver más" */}
              <div className="flex items-center gap-2 text-[#6544FF] font-semibold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 mt-auto">
                Explorar <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* =========================================================================
          CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS DEL BACKGROUND
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

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </section>
  );
}