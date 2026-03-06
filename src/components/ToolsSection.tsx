
import { 
  FileEdit, 
  Search, 
  CalendarDays, 
  Calculator, 
  PiggyBank, 
  Megaphone, 
  TrendingUp, 
  Building2,
  ArrowRight
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
    href: "/herramientas/becas"
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
    href: "/instituciones"
  },
];

export default function ToolsSection() {
  return (
    <section className="py-20 md:py-28 bg-[#fafafa]">
      <div className="container mx-auto px-6 lg:px-8">
        
        {/* Encabezado de la Sección */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="font-black text-4xl md:text-5xl text-[#1A1528] tracking-tight">
            Nuestras <span className="italic text-[#6544FF]">Herramientas</span>
          </h2>
          <p className="text-gray-500 text-lg md:text-xl mt-4 max-w-2xl mx-auto font-medium">
            Todo lo que necesites para elegir tu futuro con confianza
          </p>
        </div>

        {/* Grilla de Herramientas */}
        {/* En móviles pequeños (1 col), móviles grandes/tablets (2 cols), desktop (4 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-[1200px] mx-auto">
          {tools.map((tool, index) => (
            <a
              key={tool.title}
              href={tool.href}
              // Retraso escalonado para que aparezcan una por una (staggered animation)
              className="group bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(101,68,255,0.12)] transition-all duration-300 hover:-translate-y-2 border border-gray-100 flex flex-col h-full relative overflow-hidden animate-in fade-in slide-in-from-bottom-8"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              {/* --- INICIO INTERVENCIÓN QUIRÚRGICA --- */}
              {tool.isNew && (
                <div className="absolute top-6 right-6">
                  <span className="relative flex h-full w-full items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6544FF] opacity-20"></span>
                    <span className="relative inline-flex rounded-full bg-gradient-to-r from-[#6544FF] to-[#947BFF] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-[#6544FF]/20">
                      Nuevo
                    </span>
                  </span>
                </div>
              )}
              {/* --- FIN INTERVENCIÓN QUIRÚRGICA --- */}

              {/* Contenedor del Ícono */}
              <div className="w-16 h-16 rounded-2xl bg-[#6544FF]/10 flex items-center justify-center mb-6 group-hover:bg-[#6544FF] transition-colors duration-300">
                <tool.icon 
                  className="w-8 h-8 text-[#6544FF] group-hover:text-white transition-colors duration-300" 
                  strokeWidth={2} 
                />
              </div>
              
              {/* Textos */}
              <h3 className="font-bold text-xl text-[#1A1528] mb-3 leading-tight group-hover:text-[#6544FF] transition-colors duration-300">
                {tool.title}
              </h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                {tool.description}
              </p>

              {/* Botón sutil de "Ver más" que aparece al hacer hover */}
              <div className="flex items-center gap-2 text-[#6544FF] font-semibold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 mt-auto">
                Explorar <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
        
      </div>
    </section>
  );
}