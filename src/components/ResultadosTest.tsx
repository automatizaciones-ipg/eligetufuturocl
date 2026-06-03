import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, Building2, GraduationCap, 
  Trophy, Mail, Phone, User, CheckCircle2, Send, MessageSquare
} from "lucide-react";
import type { AreaRIASEC, CarreraDB, DatosUsuario, PerfilVocacional } from "../types/vocacional";

interface ResultadosProps {
  areaPredominante: AreaRIASEC;
  perfilInfo: PerfilVocacional;
  carrerasDB: CarreraDB[];
  datosUsuario: DatosUsuario;
  respuestas: Record<number, string>;
}

export default function ResultadosTest({ areaPredominante, perfilInfo, carrerasDB, datosUsuario, respuestas }: ResultadosProps) {
  const [autoEnviado, setAutoEnviado] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensajeUsuario, setMensajeUsuario] = useState("");

  const topCarreras = carrerasDB.slice(0, 8);
  const carrerasSugeridasTexto = topCarreras.map((c) => c.nombre_carrera).join(", ");

  // 1. DISPARADOR AUTOMÁTICO AL CARGAR LOS RESULTADOS (Envía correo al Alumno)
  useEffect(() => {
    const dispararGuardadoYCorreoAutomatico = async () => {
      if (sessionStorage.getItem(`test_auto_enviado_${datosUsuario.email}`)) {
        setAutoEnviado(true);
        return;
      }
      
      try {
        const respuesta = await fetch('/api/solicitar-informacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: "auto", // Acción automática
            nombre: datosUsuario.nombre,
            correo: datosUsuario.email,
            telefono: datosUsuario.telefono,
            perfil: perfilInfo.titulo,
            carreras: carrerasSugeridasTexto
          })
        });

        if (respuesta.ok) {
          sessionStorage.setItem(`test_auto_enviado_${datosUsuario.email}`, 'true');
          setAutoEnviado(true);
        }
      } catch (error) {
        console.error("Error en el envío automático inicial:", error);
      }
    };

    dispararGuardadoYCorreoAutomatico();
  }, [datosUsuario, perfilInfo, carrerasSugeridasTexto]);

  // 2. FORMULARIO EXTRA DE CONTACTO (Envía alerta al Admin)
  const handleSolicitarMasInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeUsuario.trim()) return;

    setIsSubmitting(true);
    try {
      const respuesta = await fetch('/api/solicitud-vocacional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "contacto", // Acción manual desde el formulario
          nombre: datosUsuario.nombre,
          correo: datosUsuario.email,
          telefono: datosUsuario.telefono,
          perfil: perfilInfo.titulo,
          carreras: carrerasSugeridasTexto,
          mensaje: mensajeUsuario
        })
      });

      if (respuesta.ok) {
        setSolicitudEnviada(true);
      }
    } catch (error) {
      console.error("Error al enviar el mensaje de contacto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // formateadores de apoyo visual
  const formatCurrency = (value?: number | null) => {
    if (!value || value <= 0) return "No informado";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  };

  const normalizarInstituciones = (instituciones: unknown): any[] => {
    if (Array.isArray(instituciones)) return instituciones.filter((i) => i && i.nombre);
    return [];
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      
      {/* SECCIÓN SUPERIOR: HERO DEL PERFIL */}
      <div className="text-center mb-16 relative py-10">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-gradient-to-r ${perfilInfo.color} opacity-15 blur-[100px] -z-10 rounded-full`}></div>
        
        {autoEnviado && (
          <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs sm:text-sm mb-6 border border-emerald-500/20 tracking-wide uppercase animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resultados guardados y enviados a tu correo
          </div>
        )}

        <h2 className="font-black italic uppercase text-4xl md:text-6xl text-[#1A1528] tracking-tight mb-5 leading-[1.05]">
          Tu Perfil Vocacional es <br/>
          <span className={perfilInfo.textClass}>{perfilInfo.titulo}</span>
        </h2>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxedA">
          {perfilInfo.descripcion}
        </p>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid xl:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: DISEÑO DE CARDS DE CARRERAS PREMIUM */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center gap-4 mb-2 pl-2">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${perfilInfo.color} flex items-center justify-center shadow-lg`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1528] uppercase italic tracking-tight">Carreras Recomendadas</h3>
              <p className="text-gray-500 text-sm font-medium">Mayor compatibilidad según tus respuestas y mercado actual.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {topCarreras.map((item, i) => {
              const instSeguras = normalizarInstituciones(item.instituciones);
              return (
                <div key={`${item.nombre_carrera}-${i}`} className="group relative bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(101,68,255,0.08)] hover:border-[#6544FF]/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
                  
                  {/* Badge de Match */}
                  <div className="absolute top-6 right-6 bg-[#6544FF]/10 text-[#6544FF] font-black text-xs px-3 py-1.5 rounded-xl border border-[#6544FF]/20 backdrop-blur-sm">
                    {item.match ?? 85 + Math.floor(Math.random() * 14)}% Match
                  </div>

                  <div className="mb-6 pr-24">
                    <h4 className="font-black text-xl text-[#1A1528] leading-tight group-hover:text-[#6544FF] transition-colors line-clamp-2">
                      {item.nombre_carrera}
                    </h4>
                  </div>

                  {/* Datos del Arancel y Duración */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#fafafa] rounded-2xl p-3.5 border border-gray-50 group-hover:bg-white transition-colors">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Arancel Anual</p>
                      <p className="text-[#1A1528] font-black text-sm">{formatCurrency(item.arancel_anual)}</p>
                    </div>
                    <div className="bg-[#fafafa] rounded-2xl p-3.5 border border-gray-50 group-hover:bg-white transition-colors">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Duración</p>
                      <p className="text-[#1A1528] font-black text-sm">{item.duracion_semestres ? `${item.duracion_semestres} semestres` : "No info"}</p>
                    </div>
                  </div>

                  {/* Dónde estudiarla */}
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Instituciones Disponibles:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {instSeguras.slice(0, 2).map((inst, index) => (
                        <span key={index} className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg truncate max-w-[180px]">
                          {inst.nombre}
                        </span>
                      ))}
                      {instSeguras.length > 2 && (
                        <span className="text-xs font-bold bg-[#6544FF]/5 text-[#6544FF] px-2 py-1 rounded-lg">
                          +{instSeguras.length - 2}
                        </span>
                      )}
                    </div>
                    
                    <a
                      href={item.codigo_carrera ? `/carrera/${item.codigo_carrera}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1528] text-white font-bold py-3 rounded-xl text-xs group-hover:bg-[#6544FF] transition-colors shadow-sm"
                    >
                      Analizar Carrera <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN FIJO Y FORMULARIO POSTERIOR INTEGRADO */}
        <div className="xl:col-span-4 sticky top-8 space-y-6">
          
          {/* Card Resumen de Datos */}
          <div className="bg-[#1A1528] rounded-[2rem] p-7 shadow-2xl border border-gray-800 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#6544FF] rounded-full blur-[80px] opacity-25"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#facc15]" />
              </div>
              <div>
                <p className="text-white text-md font-black leading-tight">Resumen Evaluado</p>
                <p className="text-gray-400 text-xs">Postulante: {datosUsuario.nombre.split(' ')[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Respondidas</p>
                <p className="text-white text-lg font-black">{Object.keys(respuestas).length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Recomendadas</p>
                <p className="text-white text-lg font-black">{topCarreras.length}</p>
              </div>
            </div>
          </div>

          {/* Formulario de información extendido (No destruye ni recarga la página) */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 relative">
            {solicitudEnviada ? (
              <div className="text-center py-8 animate-in zoom-in-95 duration-500">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="text-lg font-black text-[#1A1528] mb-1">¡Solicitud Enviada!</h4>
                <p className="text-gray-500 text-xs px-2 leading-relaxed">
                  Tu mensaje fue enlazado a tu perfil. Un asesor revisará tus carreras afines y te contactará a la brevedad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolicitarMasInfo} className="space-y-4">
                <div>
                  <h4 className="text-lg font-black text-[#1A1528] mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#6544FF]" /> ¿Necesitas más ayuda?
                  </h4>
                  <p className="text-gray-400 text-xs">Escríbenos si tienes dudas sobre becas, puntajes o postulaciones.</p>
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" readOnly value={datosUsuario.nombre} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-400 font-medium outline-none cursor-not-allowed" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="email" readOnly value={datosUsuario.email} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-400 font-medium outline-none cursor-not-allowed" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="tel" readOnly value={datosUsuario.telefono} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-400 font-medium outline-none cursor-not-allowed" />
                  </div>
                  
                  <div className="relative">
                    <textarea
                      rows={3}
                      required
                      value={mensajeUsuario}
                      onChange={(e) => setMensajeUsuario(e.target.value)}
                      placeholder="Ej: Hola, me gustaría saber qué universidades tienen convenios de becas para la carrera de..."
                      className="w-full bg-white border border-gray-200 focus:border-[#6544FF] rounded-xl px-4 py-3 text-xs text-[#1A1528] font-medium outline-none transition-all placeholder:text-gray-300 resize-none shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !mensajeUsuario.trim()}
                  className="w-full bg-[#6544FF] hover:bg-[#5233e8] disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#6544FF]/10 cursor-pointer"
                >
                  {isSubmitting ? 'Procesando...' : 'Solicitar Asesoría Personalizada'} <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}