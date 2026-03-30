// src/components/CarreraDetalle.tsx
import React from 'react';
import { MapPin, DollarSign, Clock, Briefcase, TrendingUp, Building, ArrowLeft, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

// Generador de Logo basado en la función del buscador
const normalizarNombreLogo = (nombre: string) => {
  if (!nombre) return 'default-logo.png';
  return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + '.png';
};

// Formateadores
const formatoDinero = (valor: number | null) => valor ? `$${valor.toLocaleString('es-CL')}` : 'No informado';
const formatoPorcentaje = (valor: number | null) => valor ? `${(valor * 100).toFixed(1)}%` : 'No informado';

export default function CarreraDetalle({ carrera }: { carrera: any }) {
  const institucionNombre = carrera.instituciones?.nombre || 'Institución Desconocida';
  const tipoInstitucion = carrera.instituciones?.tipo || 'N/A';
  const logoPath = `/logos/${normalizarNombreLogo(institucionNombre)}`;

  return (
    <div className="min-h-screen bg-[#F8F9FE] text-gray-800 font-sans pb-20 selection:bg-[#6544FF] selection:text-white">
      
      {/* 1. HERO SECTION ESPECTACULAR */}
      <div className="relative bg-[#1A1528] text-white pt-16 pb-32 px-6 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-br from-[#6544FF]/20 to-cyan-400/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <a href="http://localhost:4321/herramientas/buscador" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-10 group text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform" />
            Volver al Buscador
          </a>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Logo con Glassmorphism */}
            <div className="w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-4 flex-shrink-0 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white group-hover:bg-gray-50 transition-colors"></div>
              <img 
                src={logoPath} 
                alt={`Logo ${institucionNombre}`}
                className="max-w-full max-h-full object-contain relative z-10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  (e.target as HTMLElement).nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 z-20 flex items-center justify-center text-4xl font-black text-[#1A1528] bg-gradient-to-br from-gray-100 to-gray-300">
                {institucionNombre.substring(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Encabezado de la Carrera */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  {tipoInstitucion}
                </span>
                <span className="bg-[#6544FF]/20 backdrop-blur-md border border-[#6544FF]/30 text-[#A996FF] text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Datos Oficiales
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
                {carrera.nombre_carrera}
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-400 font-medium flex items-center gap-2">
                <Building className="w-5 h-5 text-[#6544FF]" /> {institucionNombre}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENTO BOX GRID (Contenido Principal) */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        
        {/* Grilla de Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Briefcase />} title="Empleabilidad (1er Año)" value={formatoPorcentaje(carrera.empleabilidad_1er_anio)} color="text-emerald-500" bg="bg-emerald-50" border="border-emerald-100" />
          <StatCard icon={<TrendingUp />} title="Ingreso Promedio (4to Año)" value={carrera.ingreso_promedio_4to_anio && carrera.ingreso_promedio_4to_anio !== "s/i" ? carrera.ingreso_promedio_4to_anio : "No informado"} color="text-blue-500" bg="bg-blue-50" border="border-blue-100" />
          <StatCard icon={<DollarSign />} title="Arancel Anual (2026)" value={formatoDinero(carrera.arancel_anual)} color="text-amber-500" bg="bg-amber-50" border="border-amber-100" />
          <StatCard icon={<Clock />} title="Duración Formal" value={carrera.duracion_semestres ? `${carrera.duracion_semestres} Semestres` : "No informada"} color="text-purple-500" bg="bg-purple-50" border="border-purple-100" />
        </div>

        {/* Detalles Profundos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Detalles Operativos */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
              <h3 className="text-2xl font-black text-[#1A1528] mb-6 flex items-center gap-3">
                <MapPin className="text-[#6544FF] w-7 h-7" /> Ubicación y Jornada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DataPoint label="Región" value={carrera.region || "No informada"} />
                <DataPoint label="Sede" value={carrera.sede || "No informada"} />
                <DataPoint label="Jornada" value={carrera.jornada || "No informada"} />
              </div>

              {/* Mapa Estético generado dinámicamente con Google Maps (Búsqueda por nombre) */}
              <div className="w-full h-64 bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative">
                 <iframe
                  title="Mapa de la Sede"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(institucionNombre + ' ' + (carrera.sede || carrera.region) + ' Chile')}&t=m&z=15&output=embed`}
                ></iframe>
              </div>
            </section>
          </div>

          {/* Columna Derecha: Call to Action y Resumen */}
          <div className="space-y-6">
            <section className="bg-gradient-to-b from-[#1A1528] to-[#2D2446] rounded-[2rem] p-8 shadow-xl text-white text-center border border-gray-800">
              <div className="w-16 h-16 bg-[#6544FF]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="w-8 h-8 text-[#A996FF]" />
              </div>
              <h3 className="text-xl font-black mb-2">{institucionNombre}</h3>
              <p className="text-gray-400 text-sm mb-8">Asegúrate de revisar la malla curricular y requisitos de admisión directamente en el sitio web de la institución.</p>
              
              <button 
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent('Admisión ' + carrera.nombre_carrera + ' ' + institucionNombre)}`, '_blank')}
                className="w-full bg-[#6544FF] hover:bg-[#5035E0] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#6544FF]/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Buscar en la Web <ChevronRight className="w-5 h-5" />
              </button>
            </section>

            {/* Tarjeta de Código Oficial */}
            <section className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Código Único (SIES)</p>
                <p className="font-mono text-lg font-bold text-[#1A1528]">{carrera.codigo_carrera}</p>
              </div>
              <Sparkles className="w-6 h-6 text-gray-300" />
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-componentes para mantener el código limpio
function StatCard({ icon, title, value, color, bg, border }: any) {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border ${border} hover:shadow-lg transition-all hover:-translate-y-1`}>
      <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-xl md:text-2xl font-black text-[#1A1528] leading-tight">{value}</p>
    </div>
  );
}

function DataPoint({ label, value }: any) {
  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
      <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-[#1A1528]">{value}</p>
    </div>
  );
}