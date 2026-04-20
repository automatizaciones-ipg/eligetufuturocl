// src/components/CarreraDetalle.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, DollarSign, Clock, Briefcase, TrendingUp, Building, 
  ArrowLeft, CheckCircle2, Sparkles, ChevronRight, 
  User, Mail, Phone, Loader2, Send, ChevronDown, Check, Edit3, Award 
} from 'lucide-react';

// Generador de Logo
const normalizarNombreLogo = (nombre: string) => {
  if (!nombre) return 'default-logo.png';
  return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + '.png';
};

// Formateadores
const formatoDinero = (valor: number | null) => valor ? `$${valor.toLocaleString('es-CL')}` : 'No informado';
const formatoPorcentaje = (valor: number | null) => valor ? `${(valor * 100).toFixed(1)}%` : 'No informado';

// Opciones del Combobox
const TIPOS_PREGUNTAS = [
  "Información General",
  "Documentación Requerida",
  "Aranceles y Financiamiento",
  "Malla Curricular y Ramos",
  "Empleabilidad y Campo Laboral",
  "Requisitos de Admisión",
  "Otro"
];

export default function CarreraDetalle({ carrera }: { carrera: any }) {
  const institucionNombre = carrera.instituciones?.nombre || 'Institución Desconocida';
  const tipoInstitucion = carrera.instituciones?.tipo || 'Educación Superior';
  const logoPath = `/logos/${normalizarNombreLogo(institucionNombre)}`;

  // --- ESTADOS DEL FORMULARIO LEAD 3.0 ---
  const [formState, setFormState] = useState({
    nombre: '', email: '', telefono: '', profesion: '', tiposPregunta: [] as string[], mensajeOtro: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setIsSuccess(true);
      setFormState({ nombre: '', email: '', telefono: '', profesion: '', tiposPregunta: [], mensajeOtro: '' });
    } catch (error) {
      console.error("Error al enviar", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const togglePregunta = (pregunta: string) => {
    setFormState(prev => {
      const isSelected = prev.tiposPregunta.includes(pregunta);
      const nuevasPreguntas = isSelected 
        ? prev.tiposPregunta.filter(p => p !== pregunta)
        : [...prev.tiposPregunta, pregunta];
      
      return { 
        ...prev, 
        tiposPregunta: nuevasPreguntas,
        mensajeOtro: (!isSelected && pregunta === "Otro") ? prev.mensajeOtro : (!nuevasPreguntas.includes("Otro") ? '' : prev.mensajeOtro)
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-gray-800 font-sans pb-20 selection:bg-[#7C3AED] selection:text-white">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER) - BRUTAL Y FLUIDO (SIN CUADRÍCULA)
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          {/* Overlay de ruido/textura muy sutil para darle aspecto premium */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          {/* SE HA ELIMINADO LA GRUDA TECH AQUÍ */}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Botón Volver */}
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 animate-fade-in-up">
            
            {/* Contenedor del Logo (Glassmorphism Avanzado + Fallback Elegante) */}
            <div className="relative group animate-float w-40 h-40 md:w-52 md:h-52 shrink-0">
              {/* Brillo dinámico detrás del logo */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6] rounded-[2.5rem] blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
              
              {/* Contenedor exactamente BLANCO */}
              <div className="relative w-full h-full bg-white rounded-[2.5rem] p-6 flex items-center justify-center overflow-hidden shadow-2xl">
                
                <img 
                  src={logoPath} 
                  alt={`Logo ${institucionNombre}`}
                  className="w-full h-full object-contain relative z-10 drop-shadow-sm transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-logo')?.classList.remove('hidden');
                  }}
                />
                
                {/* Fallback en caso de que no exista la imagen (se mantiene oscuro para contraste de las letras) */}
                <div className="fallback-logo hidden absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-[#2E1065] to-[#170F2E]">
                  <Building className="w-10 h-10 text-white/20 mb-2" />
                  <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tighter">
                    {institucionNombre.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Encabezado e Info de la Carrera */}
            <div className="flex-1 text-center md:text-left flex flex-col justify-center md:pt-4">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <span className="bg-white/5 backdrop-blur-md border border-white/10 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-inner">
                  {tipoInstitucion}
                </span>
                <span className="bg-[#7C3AED]/20 backdrop-blur-md border border-[#8B5CF6]/40 text-[#E0E7FF] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                  <Award className="w-3.5 h-3.5 text-[#A78BFA]" /> Datos Oficiales
                </span>
              </div>
              
              {/* Título Brutal */}
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight mb-4 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2E8F0] to-[#94A3B8] drop-shadow-lg">
                {carrera.nombre_carrera}
              </h1>
              
              {/* Subtítulo / Institución */}
              <h2 className="text-xl md:text-3xl text-[#A78BFA] font-medium flex items-center justify-center md:justify-start gap-3">
                {institucionNombre}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BENTO BOX GRID (Contenido Principal)
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-30">
        
        {/* Grilla de Métricas Rápidas (Glassmorphism mixto para cruzar el hero y el body) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard delay="0s" icon={<Briefcase />} title="Empleabilidad (1er Año)" value={formatoPorcentaje(carrera.empleabilidad_1er_anio)} color="text-emerald-500" bg="bg-emerald-50" border="border-emerald-100" />
          <StatCard delay="0.1s" icon={<TrendingUp />} title="Ingreso (4to Año)" value={carrera.ingreso_promedio_4to_anio && carrera.ingreso_promedio_4to_anio !== "s/i" ? carrera.ingreso_promedio_4to_anio : "No informado"} color="text-blue-500" bg="bg-blue-50" border="border-blue-100" />
          <StatCard delay="0.2s" icon={<DollarSign />} title="Arancel Anual (2026)" value={formatoDinero(carrera.arancel_anual)} color="text-amber-500" bg="bg-amber-50" border="border-amber-100" />
          <StatCard delay="0.3s" icon={<Clock />} title="Duración Formal" value={carrera.duracion_semestres ? `${carrera.duracion_semestres} Semestres` : "No informada"} color="text-violet-500" bg="bg-violet-50" border="border-violet-100" />
        </div>

        {/* Detalles Profundos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Detalles Operativos */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100/80">
              <h3 className="text-2xl font-black text-[#0A0518] mb-8 flex items-center gap-3">
                <div className="p-2 bg-[#7C3AED]/10 rounded-xl"><MapPin className="text-[#7C3AED] w-6 h-6" /></div>
                Ubicación y Jornada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DataPoint label="Región" value={carrera.region || "No informada"} />
                <DataPoint label="Sede" value={carrera.sede || "No informada"} />
                <DataPoint label="Jornada" value={carrera.jornada || "No informada"} />
              </div>

              {/* Mapa */}
              <div className="w-full h-72 bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 relative shadow-inner group">
                 <iframe
                  title="Mapa de la Sede"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'contrast(1.1) saturation(0.8)' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(institucionNombre + ' ' + (carrera.sede || carrera.region) + ' Chile')}&t=m&z=15&output=embed`}
                ></iframe>
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-3xl"></div>
              </div>
            </section>
          </div>

          {/* Columna Derecha: LEAD FORM 3.0 */}
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-visible relative flex flex-col">
              {/* Deco Header Form */}
              <div className="bg-[#0A0518] p-8 text-center relative overflow-hidden rounded-t-[2rem]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7C3AED] rounded-full blur-[60px] opacity-60"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D946EF] rounded-full blur-[60px] opacity-40"></div>
                <h3 className="text-2xl font-black text-white mb-2 relative z-10">¿Te interesa?</h3>
                <p className="text-gray-300 text-sm relative z-10 leading-relaxed">
                  Solicita información directa sobre esta carrera de <span className="text-white font-bold">{institucionNombre}</span>.
                </p>
              </div>

              {/* Formulario / Estado de Éxito */}
              <div className="p-8">
                {isSuccess ? (
                  <div className="text-center py-10 animate-fade-in-up">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                    </div>
                    <h4 className="text-3xl font-black text-[#0A0518] mb-3">¡Enviado!</h4>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed px-4">
                      Tus datos han sido registrados con éxito. Te contactaremos pronto con toda la información.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="text-[#7C3AED] font-bold text-sm hover:text-[#5B21B6] transition-colors bg-[#7C3AED]/10 py-3 px-6 rounded-xl w-full"
                    >
                      Enviar nueva consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Inputs de texto (simplificados visualmente para integrarse al diseño UIX) */}
                    <InputField label="Nombre Completo" icon={<User />} type="text" name="nombre" value={formState.nombre} onChange={handleChange} placeholder="Ej. Camila Valdés" required />
                    
                    <div className="grid grid-cols-1 gap-5">
                      <InputField label="Correo Electrónico" icon={<Mail />} type="email" name="email" value={formState.email} onChange={handleChange} placeholder="tu@correo.cl" required />
                      <InputField label="Teléfono / WhatsApp" icon={<Phone />} type="tel" name="telefono" value={formState.telefono} onChange={handleChange} placeholder="+56 9 1234 5678" required />
                    </div>

                    <InputField label="Profesión (Opcional)" icon={<Briefcase />} type="text" name="profesion" value={formState.profesion} onChange={handleChange} placeholder="Ej. Estudiante" required={false} />

                    {/* Custom Combobox */}
                    <div className="relative" ref={dropdownRef}>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">¿Qué información necesitas? <span className="text-[#7C3AED]">*</span></label>
                      <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full bg-[#F8FAFC] border ${isDropdownOpen ? 'border-[#7C3AED] ring-4 ring-[#7C3AED]/10' : 'border-gray-200'} text-gray-800 text-sm rounded-xl py-3.5 px-4 flex items-center justify-between cursor-pointer transition-all hover:border-[#7C3AED]/50 select-none`}
                      >
                        <div className="flex-1 truncate pr-2">
                          {formState.tiposPregunta.length === 0 ? (
                            <span className="text-gray-400 font-medium">Selecciona los temas...</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {formState.tiposPregunta.length <= 2 ? (
                                formState.tiposPregunta.map(t => (
                                  <span key={t} className="bg-[#7C3AED] text-white px-2.5 py-1 rounded-lg text-xs font-bold truncate max-w-[120px] shadow-sm">{t}</span>
                                ))
                              ) : (
                                <span className="bg-[#7C3AED] text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                                  {formState.tiposPregunta.length} temas seleccionados
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180 text-[#7C3AED]' : ''}`} />
                      </div>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto py-2 custom-scrollbar animate-fade-in-up">
                          {TIPOS_PREGUNTAS.map((opcion) => {
                            const isSelected = formState.tiposPregunta.includes(opcion);
                            return (
                              <div 
                                key={opcion}
                                onClick={() => togglePregunta(opcion)}
                                className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-[#7C3AED]/5' : 'hover:bg-gray-50'}`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${isSelected ? 'bg-[#7C3AED] border-[#7C3AED]' : 'border-gray-300'}`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className={`text-sm ${isSelected ? 'font-bold text-[#0A0518]' : 'font-medium text-gray-600'}`}>
                                  {opcion}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Textarea Condicional para "Otro" */}
                    {formState.tiposPregunta.includes("Otro") && (
                      <div className="relative animate-fade-in-up">
                        <label className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider mb-1.5 block">Detalla tu consulta</label>
                        <div className="relative">
                          <Edit3 className="absolute left-4 top-4 w-5 h-5 text-[#7C3AED]" />
                          <textarea 
                            name="mensajeOtro"
                            required
                            value={formState.mensajeOtro}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-[#7C3AED]/5 border border-[#7C3AED]/30 text-gray-800 text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all resize-none placeholder-gray-400/70 font-medium"
                            placeholder="Escribe aquí..."
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Checkbox */}
                    <div className="flex items-start gap-3 pt-4">
                      <input 
                        type="checkbox" 
                        required
                        id="privacidad"
                        className="mt-0.5 w-4 h-4 text-[#7C3AED] bg-gray-100 border-gray-300 rounded focus:ring-[#7C3AED] cursor-pointer"
                      />
                      <label htmlFor="privacidad" className="text-xs text-gray-500 leading-relaxed cursor-pointer font-medium">
                        Acepto los <a href="#" className="text-[#7C3AED] hover:underline font-bold">términos de privacidad</a> para el tratamiento de mis datos de admisión.
                      </label>
                    </div>

                    {/* Botón Submit Brutal */}
                    <button 
                      type="submit"
                      disabled={isSubmitting || (formState.tiposPregunta.length === 0)}
                      className="w-full mt-4 relative group overflow-hidden bg-[#0A0518] text-white font-black py-4 px-6 rounded-xl shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                      {/* Hover effect para el botón */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#7C3AED] to-[#D946EF] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center justify-center gap-2 z-10">
                        {isSubmitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                        ) : (
                          <>Solicitar Información <Send className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </div>
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
        
        /* Flote de las esferas del Hero (Blob) */
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

        /* Flote suave del Logo */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Fade in subiendo */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}

// Sub-componentes para limpiar el JSX

// Componente input reutilizable para el form
function InputField({ label, icon, type, name, value, onChange, placeholder, required }: any) {
  return (
    <div className="relative">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex justify-between">
        <span>{label} {required && <span className="text-[#7C3AED]">*</span>}</span>
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-4 w-5 h-5 text-gray-400 flex items-center justify-center">
          {React.cloneElement(icon, { className: "w-full h-full" })}
        </div>
        <input 
          type={type} 
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          className="w-full bg-[#F8FAFC] border border-gray-200 text-gray-800 font-medium text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all placeholder-gray-400/70"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, bg, border, delay }: any) {
  return (
    <div 
      className={`bg-white/80 backdrop-blur-xl p-6 rounded-[1.5rem] shadow-xl shadow-gray-200/30 border border-white hover:border-${border.split('-')[1]}-200 transition-all duration-300 hover:-translate-y-2 group animate-fade-in-up`} 
      style={{ animationDelay: delay, animationFillMode: 'both' }}
    >
      <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
      <p className="text-2xl font-black text-[#0A0518] leading-tight tracking-tight">{value}</p>
    </div>
  );
}

function DataPoint({ label, value }: any) {
  return (
    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100/80">
      <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-[#0A0518]">{value}</p>
    </div>
  );
}