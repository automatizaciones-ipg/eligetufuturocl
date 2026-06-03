import React, { useState } from "react";
import { User, Mail, Send, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

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

    // Seguridad: Si el bot cayó en la trampa y llenó el campo invisible, salimos silenciosamente
    if (honeypot.length > 0) {
      setStatus({ type: "success", message: "Mensaje procesado correctamente." });
      return;
    }

    // Validaciones de sanidad de datos
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
      // Apuntamos al futuro endpoint que procesará la lógica con Resend
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
        setStatus({ type: "success", message: "Tu mensaje ha sido enviado. Nos comunicaremos contigo muy pronto." });
        setNombre("");
        setCorreo("");
        setMensaje("");
      } else {
        throw new Error(data.message || "No se pudo procesar el envío.");
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error de conexión con el servidor. Inténtalo más tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-[0_10px_50px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(101,68,255,0.04)] relative overflow-hidden">
      
      {/* Sutil toque estético corporativo en el fondo */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#6544FF] rounded-full blur-[90px] opacity-10 pointer-events-none"></div>

      {status?.type === "success" ? (
        <div className="text-center py-10 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-[#1A1528] mb-3 uppercase italic tracking-tight">¡Mensaje Recibido!</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            {status.message}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Trampa Honeypot para Bots (Invisible para usuarios reales) */}
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

          {/* Campo: Nombre */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">Nombre Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#6544FF] transition-colors" />
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Sofía Benavides"
                className="w-full bg-gray-50/50 focus:bg-white border border-gray-100 focus:border-[#6544FF] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium outline-none transition-all"
              />
            </div>
          </div>

          {/* Campo: Correo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">Correo Electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#6544FF] transition-colors" />
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="sofia@correo.com"
                className="w-full bg-gray-50/50 focus:bg-white border border-gray-100 focus:border-[#6544FF] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium outline-none transition-all"
              />
            </div>
          </div>

          {/* Campo: Categoría/Asunto */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">¿Cuál es tu duda?</label>
            <div className="relative group">
              <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#6544FF] transition-colors pointer-events-none" />
              <select
                disabled={isSubmitting}
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full bg-gray-50/50 focus:bg-white border border-gray-100 focus:border-[#6544FF] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#1A1528] font-medium outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="consulta">Consulta General</option>
                <option value="instituciones">Información de Universidades/IP</option>
                <option value="soporte">Error técnico en el Test</option>
                <option value="comercial">Alianzas Institucionales</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 w-0 h-0"></div>
            </div>
          </div>

          {/* Campo: Mensaje */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">Detalle de tu mensaje</label>
            <div className="relative group">
              <textarea
                rows={4}
                required
                disabled={isSubmitting}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu mensaje con tranquilidad aquí..."
                className="w-full bg-gray-50/50 focus:bg-white border border-gray-200 focus:border-[#6544FF] rounded-2xl px-4 py-3.5 text-sm text-[#1A1528] font-medium outline-none transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Feedback dinámico en caso de error */}
          {status?.type === "error" && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3.5 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{status.message}</span>
            </div>
          )}

          {/* Botón de Envío Premium */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1A1528] hover:bg-[#6544FF] disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/5 active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              "Enviando solicitud..."
            ) : (
              <>
                Enviar Mensaje <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}