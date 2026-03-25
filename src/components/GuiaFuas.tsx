// src/components/GuiaFuas.tsx
import { useState } from "react";
import { 
  FileText, AlertCircle, CheckCircle2, Info, 
  GraduationCap, DollarSign, Landmark, ArrowRight,
  ShieldCheck, Calculator, Users, FileSignature
} from "lucide-react";

// --- DATOS MOCKUP ---
const PASOS_FUAS = [
  {
    id: "01",
    titulo: "Registro Social de Hogares",
    descripcion: "Antes de cualquier cosa, asegúrate de que tu familia esté inscrita y actualizada en el RSH. Es la base para medir tu nivel socioeconómico.",
    icono: <Users className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    bgIcon: "bg-blue-500"
  },
  {
    id: "02",
    titulo: "Crea tu cuenta en FUAS",
    descripcion: "Ingresa a fuas.cl con tu RUT y contraseña. Si es tu primera vez, deberás registrarte llenando tus datos personales básicos.",
    icono: <FileSignature className="w-6 h-6" />,
    color: "from-[#6544FF] to-[#947BFF]",
    bgIcon: "bg-[#6544FF]"
  },
  {
    id: "03",
    titulo: "Ingresos Familiares",
    descripcion: "Deberás declarar los ingresos de tu grupo familiar del año anterior y el actual. Ten a mano liquidaciones de sueldo o boletas de honorarios.",
    icono: <Calculator className="w-6 h-6" />,
    color: "from-orange-500 to-amber-400",
    bgIcon: "bg-orange-500"
  },
  {
    id: "04",
    titulo: "Guarda el Comprobante",
    descripcion: "Una vez envíes el formulario, se generará un comprobante en PDF. Guárdalo bien, te lo pedirán al momento de matricularte en la Universidad.",
    icono: <ShieldCheck className="w-6 h-6" />,
    color: "from-emerald-600 to-emerald-400",
    bgIcon: "bg-emerald-600"
  }
];

const BENEFICIOS = [
  {
    id: 1,
    nombre: "Gratuidad",
    cobertura: "100% Matrícula y Arancel",
    requisito: "Pertenecer al 60% de menores ingresos",
    tipo: "Financiamiento Total",
    icono: <GraduationCap className="w-8 h-8" />,
    color: "from-[#15803d] to-emerald-400",
    bgIcon: "bg-[#15803d]"
  },
  {
    id: 2,
    nombre: "Beca Bicentenario",
    cobertura: "Arancel de Referencia",
    requisito: "70% de menores ingresos + Puntaje PAES",
    tipo: "Beca de Arancel",
    icono: <Landmark className="w-8 h-8" />,
    color: "from-[#6544FF] to-[#947BFF]",
    bgIcon: "bg-[#6544FF]"
  },
  {
    id: 3,
    nombre: "Fondo Solidario (FSCU)",
    cobertura: "Hasta 100% Arancel Referencia",
    requisito: "80% de menores ingresos (Crédito)",
    tipo: "Crédito Universitario",
    icono: <DollarSign className="w-8 h-8" />,
    color: "from-blue-600 to-cyan-400",
    bgIcon: "bg-blue-600"
  }
];

export default function GuiaFuas() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      
      {/* HEADER ESPECTACULAR */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-6 border border-[#6544FF]/20 uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
          <FileText className="w-4 h-4" /> Beneficios Estudiantiles
        </div>
        
        <h2 className="font-black italic uppercase text-5xl md:text-6xl text-[#1A1528] tracking-tight mb-6 leading-[1.05] animate-in fade-in zoom-in-95 duration-700">
          Domina el <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-[#947BFF]">FUAS 2026</span>
        </h2>
        
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Tu puerta de entrada a la Gratuidad, Becas y Créditos. Sigue este paso a paso para asegurar tu financiamiento sin cometer errores.
        </p>
      </div>

      {/* WIDGET DE ALERTA FUAS (Premium Dark) */}
      <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-20 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#6544FF] rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner shrink-0">
              <AlertCircle className="w-10 h-10 text-[#C1AFFF]" />
            </div>
            <div>
              <p className="text-[#C1AFFF] font-bold text-sm uppercase tracking-widest mb-1">Estado Actual</p>
              <h3 className="font-black italic uppercase text-3xl text-white leading-tight">Preparación <br className="hidden md:block"/> de Antecedentes</h3>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm w-full md:max-w-md">
            <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed mb-4">
              Las postulaciones oficiales suelen abrir entre <strong className="text-white">Octubre y Noviembre</strong>. Este es el momento perfecto para actualizar tu Registro Social de Hogares.
            </p>
            <div className="flex items-center gap-2 text-[#C1AFFF] text-sm font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" /> Recomendado: Hacerlo antes de Septiembre
            </div>
          </div>
        </div>
      </div>

      {/* TÍTULO SECCIÓN PASO A PASO */}
      <div className="mb-12 text-center md:text-left">
        <h3 className="font-black text-3xl md:text-4xl text-[#1A1528] mb-4">Guía Paso a Paso</h3>
        <p className="text-gray-500 font-medium text-lg">Cómo completar tu formulario con éxito.</p>
      </div>

      {/* TIMELINE INTERACTIVA PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {PASOS_FUAS.map((paso, i) => (
          <div 
            key={paso.id}
            onMouseEnter={() => setActiveStep(i)}
            className={`relative p-8 rounded-[2.5rem] bg-white border-2 transition-all duration-500 overflow-hidden group hover:-translate-y-2
              ${activeStep === i 
                ? "border-[#6544FF]/40 shadow-[0_20px_50px_rgba(101,68,255,0.12)]" 
                : "border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              }`}
          >
            {/* Número Gigante de Fondo */}
            <span className="absolute -top-6 -right-4 font-black text-9xl text-gray-50/80 pointer-events-none transition-all duration-500 group-hover:text-[#6544FF]/5 z-0">
              {paso.id}
            </span>

            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${paso.color} text-white flex items-center justify-center shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-500`}>
                {paso.icono}
              </div>
              
              <h4 className="font-black text-xl text-[#1A1528] mb-4 group-hover:text-[#6544FF] transition-colors">
                {paso.titulo}
              </h4>
              
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                {paso.descripcion}
              </p>
            </div>

            {/* Línea de conexión decorativa para desktop */}
            {i !== PASOS_FUAS.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gray-200 z-20"></div>
            )}
          </div>
        ))}
      </div>

      {/* TÍTULO SECCIÓN BENEFICIOS */}
      <div className="mb-12 text-center md:text-left">
        <h3 className="font-black text-3xl md:text-4xl text-[#1A1528] mb-4">Principales Beneficios</h3>
        <p className="text-gray-500 font-medium text-lg">Lo que puedes obtener al completar el FUAS.</p>
      </div>

      {/* GRID DE BENEFICIOS (Reutilizando la lógica premium del buscador) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {BENEFICIOS.map((beneficio, i) => (
          <div 
            key={beneficio.id} 
            className="group bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-[#6544FF]/30 hover:shadow-[0_20px_50px_rgba(101,68,255,0.12)] transition-all duration-500 flex flex-col h-full relative overflow-hidden animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
            style={{ animationDelay: `${(i + 4) * 100}ms` }}
          >
            {/* Brillo de fondo en Hover */}
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br ${beneficio.color} rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}></div>

            {/* HEADER DE LA TARJETA */}
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${beneficio.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                {beneficio.icono}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${beneficio.bgIcon} text-white shadow-sm`}>
                {beneficio.tipo}
              </span>
            </div>

            {/* CUERPO DE LA TARJETA */}
            <div className="mb-6 relative z-10 flex-1">
              <h3 className="font-black text-2xl text-[#1A1528] mb-3 leading-tight group-hover:text-[#6544FF] transition-colors">
                {beneficio.nombre}
              </h3>
            </div>

            {/* BLOQUE DE REQUISITOS (Bloque interior gris) */}
            <div className="flex flex-col gap-3 p-5 bg-[#FAFAFA] rounded-[1.5rem] border border-gray-100 mb-6 relative z-10 group-hover:bg-white group-hover:border-gray-200 transition-colors duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Cobertura
                </span>
                <span className="font-black text-[#1A1528]">{beneficio.cobertura}</span>
              </div>
              <div className="w-full h-px bg-gray-200/60 my-1"></div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Requisito Principal
                </span>
                <span className="font-semibold text-gray-600 text-sm">{beneficio.requisito}</span>
              </div>
            </div>

            {/* BOTÓN FOOTER */}
            <button className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-[#6544FF] group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
              Ver Detalles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}