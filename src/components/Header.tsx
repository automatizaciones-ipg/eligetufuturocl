// src/components/Header.tsx
import { useState } from "react";
import { 
  Search, Menu, X, ChevronDown, Sparkles, Compass, 
  Building2, CalendarDays, Calculator, GraduationCap, ArrowRight 
} from "lucide-react";

// 1. DATA LAYER (Menú de Navegación Actualizado)
const NAV_ITEMS = [
  {
    label: "Herramientas",
    icon: <Sparkles className="w-4 h-4" />,
    children: [
      { name: "Test Vocacional", href: "/herramientas/test-vocacional", desc: "Descubre tu perfil ideal" },
      { name: "Calculadora de Puntaje", href: "/herramientas/calculadora", desc: "Simula tu ponderación PAES" },
    ],
  },
  {
    label: "Instituciones",
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { name: "Buscador de Carreras", href: "/herramientas/buscador", desc: "Filtra por arancel, malla y más" },
      { name: "Todas las Instituciones", href: "/herramientas/instituciones", desc: "Universidades, IPs y CFTs" },
    ],
  },
  {
    label: "Proceso de Admisión",
    icon: <CalendarDays className="w-4 h-4" />,
    children: [
      { name: "Calendario PAES", href: "/herramientas/calendario", desc: "Fechas clave y plazos oficiales" },
      { name: "Becas y Gratuidad", href: "/herramientas/fuas", desc: "Beneficios estatales y requisitos" },
    ],
  },
  {
    label: "Comunidad & Futuro",
    icon: <Compass className="w-4 h-4" />,
    children: [
      { name: "Eventos y Charlas", href: "/herramientas/eventos", desc: "Ferias vocacionales y ensayos" },
      { name: "Mercado Laboral", href: "/herramientas/mercado-laboral", desc: "Sueldos y empleabilidad" },
      { name: "Explora tu futuro", href: "/noticias", desc: "Noticias de interés diarias" },
    ],
  }
];

// 2. MOCK DE DATOS PARA EL BUSCADOR PREDICTIVO (Simula tu Base de Datos)
const MOCK_DATOS_BUSQUEDA = [
  // Herramientas destacadas
  { id: 'h1', tipo: 'herramienta', titulo: 'Test Vocacional Interactivo', subtitulo: 'Descubre tu camino profesional', url: '/herramientas/test-vocacional', icono: <Sparkles className="w-5 h-5" /> },
  { id: 'h2', tipo: 'herramienta', titulo: 'Calculadora de Puntaje PAES', subtitulo: 'Simulador oficial', url: '/herramientas/calculadora', icono: <Calculator className="w-5 h-5" /> },
  { id: 'h3', tipo: 'herramienta', titulo: 'Buscador de Carreras', subtitulo: 'Filtra mallas y aranceles', url: '/buscador/carreras', icono: <Search className="w-5 h-5" /> },
  // Carreras de ejemplo
  { id: 'c1', tipo: 'carrera', titulo: 'Ingeniería Civil Informática', subtitulo: 'Universidad de Chile', url: '/carrera/informatica-uchile', icono: <GraduationCap className="w-5 h-5" /> },
  { id: 'c2', tipo: 'carrera', titulo: 'Medicina', subtitulo: 'Pontificia Universidad Católica', url: '/carrera/medicina-puc', icono: <GraduationCap className="w-5 h-5" /> },
  { id: 'c3', tipo: 'carrera', titulo: 'Ingeniería Comercial', subtitulo: 'Universidad Adolfo Ibáñez', url: '/carrera/comercial-uai', icono: <GraduationCap className="w-5 h-5" /> },
  { id: 'c4', tipo: 'carrera', titulo: 'Enfermería', subtitulo: 'Universidad San Sebastián', url: '/carrera/enfermeria-uss', icono: <GraduationCap className="w-5 h-5" /> },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtramos resultados de búsqueda dinámicamente
  const resultadosBusqueda = MOCK_DATOS_BUSQUEDA.filter(item => 
    item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.subtitulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const herramientasEncontradas = resultadosBusqueda.filter(r => r.tipo === 'herramienta');
  const carrerasEncontradas = resultadosBusqueda.filter(r => r.tipo === 'carrera');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/buscador/carreras?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between h-[5.5rem] px-4 lg:px-8">
        
        {/* Logo */}
        <a href="/" className="flex items-center shrink-0 group py-2 outline-none focus-visible:ring-2 focus-visible:ring-[#6544FF] rounded-lg">
          <img 
            src="/Logo.svg" 
            alt="Elige Tu Futuro" 
            className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300 origin-left"
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center justify-center gap-8 xl:gap-10 flex-1 px-8">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative group h-[5.5rem] flex items-center">
              <button className="flex items-center gap-1.5 py-2 text-[14px] font-bold uppercase tracking-wide text-gray-600 hover:text-[#6544FF] transition-colors duration-200 outline-none">
                {item.label}
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180 group-hover:text-[#6544FF]" />
              </button>
              
              {/* Dropdown Desktop */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 z-50 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.08)] py-3 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6544FF] to-[#947BFF]"></div>
                  
                  {item.children.map((child) => (
                    <a
                      key={child.name}
                      href={child.href}
                      className="flex flex-col px-6 py-3 hover:bg-[#6544FF]/5 transition-colors duration-200 group/link"
                    >
                      <span className="text-sm font-bold text-gray-800 group-hover/link:text-[#6544FF] transition-colors">
                        {child.name}
                      </span>
                      <span className="text-xs text-gray-400 font-medium mt-0.5">
                        {child.desc}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Desktop Right Action: Botón BUSCAR */}
        <div className="hidden lg:flex items-center shrink-0">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
            className="flex items-center gap-2 bg-[#1A1528] hover:bg-[#6544FF] text-white px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg hover:shadow-[0_10px_30px_rgba(101,68,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-[#6544FF]/30"
          >
            <Search className="h-4 w-4 stroke-[2.5]" />
            Explorar
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
            className="p-2.5 text-gray-600 hover:text-[#6544FF] bg-gray-50 hover:bg-[#6544FF]/10 rounded-xl transition-colors"
          >
            <Search className="h-6 w-6" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-gray-600 hover:text-[#6544FF] bg-gray-50 hover:bg-[#6544FF]/10 rounded-xl transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 animate-in spin-in-90 duration-200" /> : <Menu className="h-6 w-6 animate-in spin-in-[-90deg] duration-200" />}
          </button>
        </div>
      </div>

      {/* SEARCH BAR GLOBAL CON RESULTADOS PREDICTIVOS */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-40 animate-in slide-in-from-top-4 fade-in duration-300 pb-8 pt-4">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            
            {/* Input Wrapper */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-4 z-50">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busca carreras, instituciones o herramientas..."
                  className="w-full pl-16 pr-6 py-5 md:py-6 text-xl md:text-2xl font-black text-[#1A1528] bg-gray-50/50 rounded-3xl border-2 border-transparent focus:border-[#6544FF]/20 focus:bg-white focus:shadow-[0_0_0_4px_rgba(101,68,255,0.1)] outline-none placeholder:text-gray-300 placeholder:font-medium transition-all"
                  autoFocus
                />
              </div>
              <button 
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors hidden md:block"
              >
                <X className="h-8 w-8" />
              </button>
            </form>

            {/* Menú Flotante de Resultados (Aparece al escribir) */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col md:flex-row max-h-[60vh] overflow-y-auto">
                  
                  {/* SECCIÓN 1: HERRAMIENTAS (ESPECTACULAR) */}
                  {(herramientasEncontradas.length > 0) && (
                    <div className="w-full md:w-1/3 bg-[#FAFAFA] p-6 border-b md:border-b-0 md:border-r border-gray-100">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Herramientas Rápidas
                      </h3>
                      <div className="space-y-3">
                        {herramientasEncontradas.map(herr => (
                          <a 
                            key={herr.id} 
                            href={herr.url}
                            className="group flex flex-col p-4 bg-white rounded-2xl border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_10px_30px_rgba(101,68,255,0.1)] transition-all duration-300"
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6544FF] to-[#947BFF] flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                                {herr.icono}
                              </div>
                              <span className="text-[10px] font-bold text-[#6544FF] bg-[#6544FF]/10 px-2 py-0.5 rounded-md uppercase tracking-wide">Plataforma</span>
                            </div>
                            <h4 className="font-bold text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#6544FF] group-hover:to-[#947BFF] transition-all">
                              {herr.titulo}
                            </h4>
                            <p className="text-xs text-gray-400 font-medium mt-1">{herr.subtitulo}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECCIÓN 2: CARRERAS E INSTITUCIONES */}
                  <div className="flex-1 p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-3 h-3" /> Resultados de Carreras
                    </h3>
                    
                    {carrerasEncontradas.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {carrerasEncontradas.map(carrera => (
                          <a 
                            key={carrera.id} 
                            href={carrera.url}
                            className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border-2 border-transparent hover:border-gray-100 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#1A1528] group-hover:shadow-sm transition-all">
                                {carrera.icono}
                              </div>
                              <div>
                                <h4 className="font-bold text-[#1A1528] group-hover:text-[#6544FF] transition-colors">
                                  {carrera.titulo}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">{carrera.subtitulo}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#6544FF] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-400 font-medium text-sm">No encontramos carreras exactas. Presiona "Enter" para hacer una búsqueda completa.</p>
                      </div>
                    )}
                  </div>

                </div>
                
                {/* Botón Explorar Todo inferior */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                  <button 
                    onClick={handleSearchSubmit}
                    className="text-sm font-bold text-[#6544FF] hover:text-[#5233E6] flex items-center justify-center gap-2 w-full transition-colors"
                  >
                    Ver todos los resultados para "{searchQuery}" <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown (Mantiene tu diseño intacto) */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in slide-in-from-top-4 fade-in duration-300 z-40">
          <div className="p-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="flex flex-col bg-gray-50/50 rounded-2xl overflow-hidden border border-gray-100">
                <button
                  className={`flex items-center justify-between px-5 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${mobileExpandedItem === item.label ? 'text-[#6544FF] bg-[#6544FF]/5' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setMobileExpandedItem(mobileExpandedItem === item.label ? null : item.label)}
                >
                  <span className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${mobileExpandedItem === item.label ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'bg-white shadow-sm text-gray-500'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${mobileExpandedItem === item.label ? "rotate-180 text-[#6544FF]" : "text-gray-400"}`} />
                </button>
                
                {mobileExpandedItem === item.label && (
                  <div className="flex flex-col gap-1 px-4 pb-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {item.children.map((child) => (
                      <a 
                        key={child.name} 
                        href={child.href} 
                        className="flex flex-col px-4 py-3 bg-white hover:bg-[#6544FF]/5 rounded-xl border border-transparent hover:border-[#6544FF]/10 transition-all shadow-sm hover:shadow-md group"
                      >
                        <span className="text-sm font-bold text-gray-800 group-hover:text-[#6544FF] transition-colors">{child.name}</span>
                        <span className="text-xs text-gray-400 font-medium mt-0.5">{child.desc}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}