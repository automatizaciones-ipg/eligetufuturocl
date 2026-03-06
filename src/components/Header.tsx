// src/components/Header.tsx
import { useState } from "react";
import { Search, Menu, X, ChevronDown } from "lucide-react";

const navItems = [
  {
    label: "Carreras", // Lo dejé corregido con 2 "R", por estética profesional
    children: ["Universidades", "Institutos Profesionales", "CFT", "Áreas de Conocimiento"],
  },
  {
    label: "Financiamiento",
    children: ["Gratuidad", "Becas", "Créditos", "FUAS"],
  },
  { label: "Eventos" },
  { label: "Mercado Laboral" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between h-[5.5rem] px-4 lg:px-8">
        
        {/* Logo (Usando exactamente tu archivo Logo.svg) */}
        <a href="/" className="flex items-center shrink-0 group py-2">
          <img 
            src="/Logo.svg" 
            alt="Elige Tu Futuro.cl" 
            className="h-16 md:h-24 w-auto object-contain"
          />
        </a>

        {/* Desktop Nav (Réplica exacta de espaciados y tipografía) */}
        <nav className="hidden lg:flex items-center justify-center gap-8 xl:gap-12 flex-1 px-8">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => item.children && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1.5 py-2 text-[14px] font-semibold uppercase tracking-wide text-gray-600 hover:text-[#6544FF] transition-colors duration-200">
                {item.label}
                {item.children && (
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openDropdown === item.label ? "rotate-180 text-[#6544FF]" : ""}`} />
                )}
              </button>
              
              {/* Dropdown Desktop (Animación fluida) */}
              {item.children && openDropdown === item.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-60 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-xl py-2 overflow-hidden">
                    {item.children.map((child) => (
                      <a
                        key={child}
                        href="#"
                        className="block px-5 py-3 text-sm font-medium text-gray-600 hover:text-[#6544FF] hover:bg-[#6544FF]/5 hover:pl-6 transition-all duration-200"
                      >
                        {child}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Desktop Right Action: Botón BUSCAR (Idéntico al Figma) */}
        <div className="hidden lg:flex items-center shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 bg-[#6544FF] hover:bg-[#5233E6] text-white px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide shadow-md shadow-[#6544FF]/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Search className="h-4 w-4 stroke-[2.5]" />
            Buscar
          </button>
        </div>

        {/* Mobile Actions (Responsividad Extrema) */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Botón Buscar Móvil */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-gray-600 hover:text-[#6544FF] bg-gray-50 hover:bg-[#6544FF]/10 rounded-lg transition-colors"
          >
            <Search className="h-6 w-6" />
          </button>
          {/* Menú Hamburguesa */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-gray-600 hover:text-[#6544FF] bg-gray-50 hover:bg-[#6544FF]/10 rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6 animate-in spin-in-90 duration-200" /> : <Menu className="h-6 w-6 animate-in spin-in-[-90deg] duration-200" />}
          </button>
        </div>
      </div>

      {/* Search Bar Dropdown (Se activa al presionar el botón morado) */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 p-6 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 z-40">
          <div className="container mx-auto">
            <div className="relative max-w-4xl mx-auto flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-[#6544FF]" />
                <input
                  type="text"
                  placeholder="¿Qué carrera o institución buscas?"
                  className="w-full pl-14 pr-6 py-4 text-lg bg-gray-50 rounded-xl border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 outline-none placeholder:text-gray-400 transition-all shadow-inner"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => setSearchOpen(false)}
                className="hidden md:flex p-4 text-gray-400 hover:text-[#6544FF] hover:bg-[#6544FF]/10 rounded-xl transition-colors"
              >
                <X className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in slide-in-from-top-4 fade-in duration-300 z-40">
          <div className="p-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <div key={item.label} className="flex flex-col">
                <button
                  className="flex items-center justify-between px-4 py-4 text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-[#6544FF] bg-white hover:bg-[#6544FF]/5 rounded-xl transition-colors"
                  onClick={() => item.children && setOpenDropdown(openDropdown === item.label ? null : item.label)}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openDropdown === item.label ? "rotate-180 text-[#6544FF]" : ""}`} />
                  )}
                </button>
                
                {/* Mobile Submenu */}
                {item.children && openDropdown === item.label && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-[#6544FF]/20 ml-6 mb-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    {item.children.map((child) => (
                      <a 
                        key={child} 
                        href="#" 
                        className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-[#6544FF] hover:bg-[#6544FF]/5 rounded-lg transition-colors"
                      >
                        {child}
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