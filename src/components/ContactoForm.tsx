import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Loader2, 
  MessageSquare 
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactoForm() {
  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState("consulta");
  const [mensaje, setMensaje] = useState("");
  
  // Anti-Spam Seguridad (Honeypot)
  const [honeypot, setHoneypot] = useState("");

  // Estados de carga y feedback de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Honeypot trap
    if (honeypot.length > 0) {
      setStatus({ type: "success", message: "Mensaje procesado correctamente." });
      return;
    }

    // Validaciones
    if (!nombre.trim() || !correo.trim() || !mensaje.trim()) {
      setStatus({ type: "error", message: "Por favor, completa todos los campos requeridos." });
      return;
    }

    if (!EMAIL_REGEX.test(correo)) {
      setStatus({ type: "error", message: "El formato del correo electrónico no es válido." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulación o endpoint real
      const response = await fetch("/api/contacto-general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          asunto,
          mensaje: mensaje.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setStatus({ type: "success", message: "¡Tu mensaje ha despegado! Nos comunicaremos contigo muy pronto." });
        setNombre("");
        setCorreo("");
        setMensaje("");
        setAsunto("consulta");
      } else {
        throw new Error(data.message || "No se pudo procesar el envío.");
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error de conexión. Inténtalo de nuevo en unos segundos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Elementos decorativos de fondo (Glows) */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-[#6544FF] rounded-full blur-[120px] opacity-20 pointer-events-none mix-blend-multiply animate-pulse"></div>
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-400 rounded-full blur-[120px] opacity-20 pointer-events-none mix-blend-multiply"></div>

      {/* Contenedor Principal del Formulario */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 border border-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(101,68,255,0.15)] overflow-hidden">
        
        {/* Cabecera del Formulario */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1528] tracking-tight mb-3">
            Hablemos
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto">
            ¿Tienes alguna duda o propuesta? Escríbenos y nuestro equipo te responderá a la brevedad.
          </p>
        </div>

        {status?.type === "success" ? (
          <div className="text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-emerald-100/50 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1528] mb-3 tracking-tight">¡Mensaje Enviado!</h3>
            <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
              {status.message}
            </p>
            <button 
              onClick={() => setStatus(null)}
              className="mt-8 text-[#6544FF] font-semibold text-sm hover:underline underline-offset-4 transition-all"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Trampa Honeypot para Bots */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="b_email_confirmation"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Grid para Nombre y Correo en la misma línea en Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Campo: Nombre */}
              <div className="space-y-2 relative group">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Nombre</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Sofía Benavides"
                    className="w-full bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium placeholder:text-gray-400 placeholder:font-normal outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Campo: Correo */}
              <div className="space-y-2 relative group">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Correo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="sofia@correo.com"
                    className="w-full bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium placeholder:text-gray-400 placeholder:font-normal outline-none transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Campo: Categoría/Asunto */}
            <div className="space-y-2 relative group">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">¿De qué trata tu mensaje?</label>
              <div className="relative">
                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#6544FF] transition-colors pointer-events-none z-10" />
                <select
                  disabled={isSubmitting}
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-11 pr-10 py-3.5 text-sm text-[#1A1528] font-medium outline-none transition-all duration-300 appearance-none cursor-pointer relative"
                >
                  <option value="consulta">Consulta General</option>
                  <option value="instituciones">Información de Universidades/IP</option>
                  <option value="soporte">Error técnico en el Test</option>
                  <option value="comercial">Alianzas Institucionales</option>
                </select>
                {/* Flecha personalizada para el select */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#6544FF] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            {/* Campo: Mensaje */}
            <div className="space-y-2 relative group">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Tu Mensaje</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
                <textarea
                  rows={5}
                  required
                  disabled={isSubmitting}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos todos los detalles aquí..."
                  className="w-full bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium placeholder:text-gray-400 placeholder:font-normal outline-none transition-all duration-300 resize-y min-h-[120px]"
                />
              </div>
            </div>

            {/* Feedback dinámico en caso de error */}
            {status?.type === "error" && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{status.message}</span>
              </div>
            )}

            {/* Botón de Envío Premium */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group relative overflow-hidden bg-[#1A1528] hover:bg-[#2a2240] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_-10px_rgba(26,21,40,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(101,68,255,0.4)] active:scale-[0.98] cursor-pointer mt-4"
            >
              {/* Efecto de brillo al hacer hover (opcional pero espectacular) */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Enviar Mensaje 
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}