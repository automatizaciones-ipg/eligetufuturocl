// src/components/BuscadorCarreras.tsx
import { useState, useEffect } from "react";
import { 
  Search, Building2, Briefcase, Clock, 
  ArrowRight, Sparkles, Stethoscope, Code, 
  Scale, Calculator, Microscope, MapPin, CheckCircle2
} from "lucide-react";

// --- DATOS DEL BUSCADOR (Mockup realista) ---
const CARRERAS = [
  {
    id: 1,
    nombre: "Medicina Cirujano",
    universidad: "Universidad de Chile",
    region: "Región Metropolitana",
    area: "salud",
    duracion: "14 semestres",
    empleabilidad: "99%",
    arancel: "$6.5M",
    gratuidad: true,
    icono: <Stethoscope className="w-7 h-7" />,
    color: "from-blue-500 to-cyan-400",
    bgIcon: "bg-blue-500"
  },
  {
    id: 2,
    nombre: "Ingeniería Civil Informática",
    universidad: "Pontificia Univ. Católica",
    region: "Región Metropolitana",
    area: "ingenieria",
    duracion: "11 semestres",
    empleabilidad: "95%",
    arancel: "$5.8M",
    gratuidad: true,
    icono: <Code className="w-7 h-7" />,
    color: "from-[#6544FF] to-[#947BFF]",
    bgIcon: "bg-[#6544FF]"
  },
  {
    id: 3,
    nombre: "Derecho",
    universidad: "Universidad de Concepción",
    region: "Región del Biobío",
    area: "humanidades",
    duracion: "10 semestres",
    empleabilidad: "82%",
    arancel: "$4.2M",
    gratuidad: true,
    icono: <Scale className="w-7 h-7" />,
    color: "from-orange-500 to-amber-400",
    bgIcon: "bg-orange-500"
  },
  {
    id: 4,
    nombre: "Ingeniería Comercial",
    universidad: "Universidad Adolfo Ibáñez",
    region: "Región de Valparaíso",
    area: "negocios",
    duracion: "10 semestres",
    empleabilidad: "88%",
    arancel: "$6.1M",
    gratuidad: false,
    icono: <Calculator className="w-7 h-7" />,
    color: "from-emerald-600 to-emerald-400",
    bgIcon: "bg-emerald-600"
  },
  {
    id: 5,
    nombre: "Bioquímica",
    universidad: "Universidad Austral",
    region: "Región de Los Ríos",
    area: "ciencias",
    duracion: "10 semestres",
    empleabilidad: "78%",
    arancel: "$3.9M",
    gratuidad: true,
    icono: <Microscope className="w-7 h-7" />,
    color: "from-purple-600 to-pink-500",
    bgIcon: "bg-purple-600"
  },
  {
    id: 6,
    nombre: "Enfermería",
    universidad: "Universidad Mayor",
    region: "Región de La Araucanía",
    area: "salud",
    duracion: "10 semestres",
    empleabilidad: "92%",
    arancel: "$4.5M",
    gratuidad: false,
    icono: <Stethoscope className="w-7 h-7" />,
    color: "from-blue-500 to-cyan-400",
    bgIcon: "bg-blue-500"
  }
];

const CATEGORIAS = [
  { id: "todo", label: "Todas las áreas" },
  { id: "salud", label: "Salud" },
  { id: "ingenieria", label: "Ingeniería" },
  { id: "negocios", label: "Negocios" },
  { id: "ciencias", label: "Ciencias" },
  { id: "humanidades", label: "Humanidades" }
];

export default function BuscadorCarreras() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState(CARRERAS);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    setResultados([]); // Efecto visual de reseteo

    const timer = setTimeout(() => {
      let filtradas = CARRERAS;

      if (filtroActivo !== "todo") {
        filtradas = filtradas.filter(c => c.area === filtroActivo);
      }

      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase();
        filtradas = filtradas.filter(c => 
          c.nombre.toLowerCase().includes(query) || 
          c.universidad.toLowerCase().includes(query) ||
          c.region.toLowerCase().includes(query)
        );
      }

      setResultados(filtradas);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [filtroActivo, busqueda]);

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-6 border border-[#6544FF]/20 uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
          <Search className="w-4 h-4" /> Directorio Oficial 2026
        </div>
        
        <h2 className="font-black italic uppercase text-5xl md:text-6xl text-[#1A1528] tracking-tight mb-6 leading-[1.05] animate-in fade-in zoom-in-95 duration-700">
          Encuentra tu <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-[#947BFF]">Carrera Ideal</span>
        </h2>
        
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Explora aranceles, duración y empleabilidad. Toda la información que necesitas para tomar la mejor decisión sobre tu futuro.
        </p>
      </div>

      {/* BARRA DE BÚSQUEDA REDISEÑADA (Ultra Clean) */}
      <div className="bg-white rounded-full p-2.5 md:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 mb-10 flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8">
        <div className="flex-1 flex items-center w-full pl-4 md:pl-6">
          <Search className="w-6 h-6 text-[#6544FF] shrink-0" />
          <input
            type="text"
            placeholder="Ej: Enfermería, Universidad de Chile, Biobío..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent border-none text-gray-800 placeholder-gray-400 font-medium text-lg focus:outline-none focus:ring-0 py-4 px-4"
          />
        </div>
        
        <div className="w-full md:w-auto bg-[#1A1528] text-white rounded-[2rem] py-4 px-8 font-black flex items-center justify-center gap-2 shadow-lg shrink-0">
          {isSearching ? (
            <Sparkles className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="text-2xl leading-none">{resultados.length}</span>
              <span className="text-xs text-white/70 uppercase tracking-widest leading-none mt-1">Resultados</span>
            </>
          )}
        </div>
      </div>

      {/* TABS DE FILTRADO */}
      <div className="flex flex-wrap justify-center gap-3 mb-16 animate-in fade-in duration-500 delay-300">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltroActivo(cat.id)}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-2 border
              ${filtroActivo === cat.id 
                ? "bg-[#6544FF] text-white border-[#6544FF] shadow-[0_8px_20px_rgba(101,68,255,0.25)] scale-105" 
                : "bg-white text-gray-500 border-gray-200 hover:text-[#1A1528] hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* GRID DE RESULTADOS (DISEÑO VERTICAL PREMIUM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
        {resultados.map((carrera, i) => (
          <div 
            key={carrera.id} 
            className="group bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-[#6544FF]/30 hover:shadow-[0_20px_50px_rgba(101,68,255,0.12)] transition-all duration-500 flex flex-col h-full relative overflow-hidden animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Brillo de fondo en Hover */}
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${carrera.color} rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}></div>

            {/* HEADER DE LA TARJETA (Ícono + Tags) */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${carrera.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                {carrera.icono}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${carrera.bgIcon} text-white shadow-sm`}>
                  {CATEGORIAS.find(c => c.id === carrera.area)?.label}
                </span>
                {carrera.gratuidad && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Gratuidad
                  </span>
                )}
              </div>
            </div>

            {/* CUERPO DE LA TARJETA (Títulos) */}
            <div className="mb-6 relative z-10 flex-1">
              <h3 className="font-black text-2xl text-[#1A1528] mb-3 leading-tight group-hover:text-[#6544FF] transition-colors">
                {carrera.nombre}
              </h3>
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="line-clamp-1">{carrera.universidad}</span>
              </div>
            </div>

            {/* GRID DE ESTADÍSTICAS (Bloque interior gris) */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAFAFA] rounded-[1.5rem] border border-gray-100 mb-6 relative z-10 group-hover:bg-white group-hover:border-gray-200 transition-colors duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Empleo
                </span>
                <span className="font-black text-[#1A1528] text-lg">{carrera.empleabilidad}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duración
                </span>
                <span className="font-black text-[#1A1528] text-lg">{carrera.duracion}</span>
              </div>
              <div className="flex flex-col col-span-2 pt-2 border-t border-gray-200/60 mt-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Ubicación
                </span>
                <span className="font-semibold text-gray-600 text-sm">{carrera.region}</span>
              </div>
            </div>

            {/* BOTÓN FOOTER DE LA TARJETA */}
            <button className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-[#6544FF] group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
              Ver Detalle Completo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        ))}

        {/* ESTADO VACÍO (Cuando la búsqueda no arroja resultados) */}
        {resultados.length === 0 && !isSearching && (
          <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-300 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="font-black text-3xl text-[#1A1528] mb-3">Sin resultados</h3>
            <p className="text-gray-500 font-medium text-lg max-w-md mx-auto">No encontramos carreras que coincidan con tu búsqueda. Intenta usar otros términos.</p>
            <button 
              onClick={() => {setBusqueda(""); setFiltroActivo("todo");}}
              className="mt-8 px-8 py-3 rounded-full bg-[#1A1528] text-white font-bold hover:bg-[#6544FF] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Limpiar Búsqueda
            </button>
          </div>
        )}
      </div>

    </div>
  );
}