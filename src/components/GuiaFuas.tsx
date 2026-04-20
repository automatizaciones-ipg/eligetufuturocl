// src/components/GuiaFuas.tsx
import { useState } from "react";
import { 
  FileText, AlertCircle, CheckCircle2, Info, 
  GraduationCap, DollarSign, Landmark, ArrowRight,
  ShieldCheck, Calculator, Users, FileSignature, ArrowLeft
} from "lucide-react";

// --- DATOS REALES MINEDUC (ACTUALIZADOS) ---
const PASOS_FUAS = [
  {
    id: "01",
    titulo: "Registro Social de Hogares",
    descripcion: "Es requisito indispensable contar con RSH. Mineduc utiliza esta calificación para validar tu nivel socioeconómico y determinar si calificas para Gratuidad.",
    icono: <Users className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    bgIcon: "bg-blue-500"
  },
  {
    id: "02",
    titulo: "Inscripción en FUAS.cl",
    descripcion: "Completa el formulario en los periodos oficiales. Debes declarar a todos los integrantes de tu hogar y sus ingresos promedio de los últimos dos años.",
    icono: <FileSignature className="w-6 h-6" />,
    color: "from-[#6544FF] to-[#947BFF]",
    bgIcon: "bg-[#6544FF]"
  },
  {
    id: "03",
    titulo: "Nivel Socioeconómico",
    descripcion: "Tras postular, Mineduc publica si tus ingresos te permiten acceder a Gratuidad (hasta el decil 6) o a Becas y Créditos (deciles superiores).",
    icono: <Calculator className="w-6 h-6" />,
    color: "from-orange-500 to-amber-400",
    bgIcon: "bg-orange-500"
  },
  {
    id: "04",
    titulo: "Matrícula y Asignación",
    descripcion: "Debes matricularte en una institución adscrita a beneficios. Luego de esto, se liberarán los resultados definitivos de tu asignación de beneficio.",
    icono: <ShieldCheck className="w-6 h-6" />,
    color: "from-emerald-600 to-emerald-400",
    bgIcon: "bg-emerald-600"
  }
];

const BENEFICIOS = [
  {
    id: 1,
    nombre: "Gratuidad",
    cobertura: "100% Matrícula y Arancel Real",
    requisito: "Pertenecer al 60% de menores ingresos (Deciles 1 al 6)",
    tipo: "Financiamiento Total",
    icono: <GraduationCap className="w-8 h-8" />,
    color: "from-[#15803d] to-emerald-400",
    bgIcon: "bg-[#15803d]",
    url: "https://portal.beneficiosestudiantiles.cl/gratuidad",
  },
  {
    id: 2,
    nombre: "Becas de Arancel",
    cobertura: "Arancel de Referencia (Total o Parcial)",
    requisito: "Desde el 70% al 80% de menores ingresos + Mérito Académico",
    tipo: "Subsidio del Estado",
    icono: <Landmark className="w-8 h-8" />,
    color: "from-[#6544FF] to-[#947BFF]",
    bgIcon: "bg-[#6544FF]",
    url: "https://portal.beneficiosestudiantiles.cl/becas/becas-de-arancel",
  },
  {
    id: 3,
    nombre: "Créditos (CAE y FSCU)",
    cobertura: "Hasta el 100% del Arancel de Referencia",
    requisito: "Apoyo estatal para financiar estudios con copago",
    tipo: "Préstamo Universitario",
    icono: <DollarSign className="w-8 h-8" />,
    color: "from-blue-600 to-cyan-400",
    bgIcon: "bg-blue-600",
    url: "https://portal.beneficiosestudiantiles.cl/becas/creditos-de-educacion-superior",
  }
];

export default function GuiaFuas() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="w-full bg-[#F4F5F9] pb-20">
      
      {/* =========================================================================
          1. HERO BANNER - EXACTAMENTE IGUAL AL RESTO DEL SITIO
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] pt-20 pb-40 px-6 overflow-hidden shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20 border-b border-white/5">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-7xl">
          {/* Botón Volver */}
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        {/* Textos del Banner */}
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <FileText className="w-4 h-4" /> Guía Oficial de Beneficios
          </div>
          
          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Financia tu Carrera <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Proceso FUAS</span>
          </h2>
          
          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Información oficial basada en el Portal de Beneficios Estudiantiles del Mineduc para que accedas a Gratuidad, Becas y Créditos del Estado.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO RESTRINGIDO (Superpuesto con margen negativo)
      ========================================================================= */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-24 relative z-30">

        {/* WIDGET DE ALERTA FUAS (Premium Dark) */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-20 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#6544FF] rounded-full blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                <AlertCircle className="w-10 h-10 text-[#C1AFFF]" />
              </div>
              <div>
                <p className="text-[#C1AFFF] font-bold text-sm uppercase tracking-widest mb-1">Dato Clave Mineduc</p>
                <h3 className="font-black italic uppercase text-3xl text-white leading-tight">Postulación <br className="hidden md:block"/> Centralizada</h3>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm w-full md:max-w-md">
              <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed mb-4">
                A través del <strong className="text-white">FUAS</strong> postulas a más de <strong className="text-white">19 beneficios</strong> de forma simultánea. No necesitas llenar un formulario por cada beca.
              </p>
              <div className="flex items-center gap-2 text-[#C1AFFF] text-sm font-bold uppercase tracking-wider">
                <Info className="w-4 h-4" /> Solo necesitas tu RUT y datos familiares
              </div>
            </div>
          </div>
        </div>

        {/* TÍTULO SECCIÓN PASO A PASO */}
        <div className="mb-12 text-center md:text-left">
          <h3 className="font-black text-3xl md:text-4xl text-[#1A1528] mb-4">El Camino a la Gratuidad</h3>
          <p className="text-gray-500 font-medium text-lg">Las 4 etapas fundamentales del proceso de postulación.</p>
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
          <h3 className="font-black text-3xl md:text-4xl text-[#1A1528] mb-4">Financiamiento Estudiantil</h3>
          <p className="text-gray-500 font-medium text-lg">Principales ayudas estatales a las que puedes optar.</p>
        </div>

        {/* GRID DE BENEFICIOS */}
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

              {/* BLOQUE DE REQUISITOS */}
              <div className="flex flex-col gap-3 p-5 bg-[#FAFAFA] rounded-[1.5rem] border border-gray-100 mb-6 relative z-10 group-hover:bg-white group-hover:border-gray-200 transition-colors duration-300">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cobertura Máxima
                  </span>
                  <span className="font-black text-[#1A1528]">{beneficio.cobertura}</span>
                </div>
                <div className="w-full h-px bg-gray-200/60 my-1"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Requisito Socioeconómico
                  </span>
                  <span className="font-semibold text-gray-600 text-sm">{beneficio.requisito}</span>
                </div>
              </div>

              {/* BOTÓN FOOTER CON ENLACE DINÁMICO */}
              <a 
                href={beneficio.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-[#6544FF] group-hover:text-white transition-all duration-300 relative z-10 shadow-sm"
              >
                Más Información <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

            </div>
          ))}
        </div>

      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS
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