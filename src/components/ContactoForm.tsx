import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mail,
  User,
  Phone,
  MessageSquare,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  Star,
  CheckCircle2,
} from "lucide-react";

const OPCIONES_TIPO = [
  { value: "consulta-general", label: "Consulta General" },
  { value: "consulta-carreras", label: "Consulta sobre Carreras" },
  { value: "otro-motivo", label: "Otro motivo" },
] as const;

export default function FormularioContacto() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipoMensaje: "",
    mensaje: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "enviando" | "exito" | "error">("idle");
  const [comboAbierto, setComboAbierto] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);

  const comboRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Cerrar combo al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Validaciones
  const validarCampo = (campo: string, valor: string): string | undefined => {
    switch (campo) {
      case "nombre":
        if (!valor.trim()) return "Nombre obligatorio";
        if (valor.trim().length < 2 || !/^[a-zA-ZáéíóúñÑüÜ\s'-]+$/.test(valor.trim()))
          return "Nombre inválido";
        return undefined;
      case "correo":
        if (!valor.trim()) return "Correo obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "Correo inválido";
        return undefined;
      case "telefono":
        if (!valor.trim()) return "Teléfono obligatorio";
        if (!/^(\+?56)?9\d{8}$/.test(valor.replace(/[\s()\-+]/g, "")))
          return "Teléfono inválido (9 dígitos)";
        return undefined;
      case "tipoMensaje":
        if (!valor) return "Selecciona una opción";
        return undefined;
      case "mensaje":
        if (!valor.trim()) return "Mensaje obligatorio";
        if (valor.trim().length < 10) return "Mínimo 10 caracteres";
        if (valor.length > 1000) return "Máximo 1000 caracteres";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (touched[campo]) {
      const error = validarCampo(campo, valor);
      setErrores((prev) => ({ ...prev, [campo]: error || "" }));
    }
  };

  const handleBlur = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
    const error = validarCampo(campo, form[campo as keyof typeof form]);
    setErrores((prev) => ({ ...prev, [campo]: error || "" }));
  };

  const seleccionarOpcion = (valor: string) => {
    setForm((prev) => ({ ...prev, tipoMensaje: valor }));
    setComboAbierto(false);
    setTouched((prev) => ({ ...prev, tipoMensaje: true }));
    setErrores((prev) => ({ ...prev, tipoMensaje: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores: Record<string, string> = {};
    let valido = true;
    for (const campo of ["nombre", "correo", "telefono", "tipoMensaje", "mensaje"]) {
      const error = validarCampo(campo, form[campo as keyof typeof form]);
      if (error) {
        nuevosErrores[campo] = error;
        valido = false;
      }
    }
    setErrores(nuevosErrores);
    setTouched({ nombre: true, correo: true, telefono: true, tipoMensaje: true, mensaje: true });
    if (!valido || !consentimiento) return;

    setEstadoEnvio("enviando");
    try {
      const respuesta = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        throw new Error(resultado.message || "Error al enviar el mensaje.");
      }
      setEstadoEnvio("exito");
      setMostrarExito(true);
      setTimeout(() => {
        setForm({ nombre: "", correo: "", telefono: "", tipoMensaje: "", mensaje: "" });
        setErrores({});
        setTouched({});
        setEstadoEnvio("idle");
        setMostrarExito(false);
        setConsentimiento(false);
      }, 3500);
    } catch {
      setEstadoEnvio("error");
      setTimeout(() => setEstadoEnvio("idle"), 4000);
    }
  };

  // Clases base iguales al formulario del test vocacional
  const inputBase =
    "w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-700 font-medium outline-none focus:border-[#6544FF] focus:bg-white transition-all placeholder:text-gray-300";
  const inputError = "border-rose-300";
  const inputSuccess = "border-emerald-300";

  return (
    <section className="w-full bg-[#F4F5F9] tracking-tight">
      {/* ========== HERO BANNER (SIN CAMBIOS) ========== */}
      <div className="relative w-full bg-[#0A0518] pt-24 pb-48 px-6 overflow-hidden z-20 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob" />
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#15803d]/15 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-emerald-300 font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md">
            <Star className="w-4 h-4 fill-emerald-300/20" />
            Contacto Directo
          </div>
          <h2 className="font-black uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-none">
            Envíanos <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#3B82F6] to-[#6544FF]">
              Tu Mensaje
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
            Completa el formulario y te responderemos.
          </p>
        </div>
      </div>

      {/* ========== FORMULARIO (DISEÑO ACTUALIZADO) ========== */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 -mt-32 relative z-30 pb-24">
        <div className="relative bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 overflow-hidden">
          {/* Overlay éxito (igual al del test vocacional) */}
          {mostrarExito && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-[2rem] flex flex-col items-center justify-center z-50 animate-in zoom-in-95 duration-500">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-[#1A1528] mb-1">¡Mensaje Enviado!</h4>
              <p className="text-gray-500 text-xs px-2 leading-relaxed">
                Muchas gracias pr tu consulta, te contactaremos pronto.
              </p>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Título del formulario */}
            <div className="mb-2">
              <h4 className="text-lg font-black text-[#1A1528] mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#6544FF]" /> Escríbenos
              </h4>
              <p className="text-gray-400 text-xs">Completa el formulario y te contactaremos pronto.</p>
            </div>

            {/* Campos con iconos dentro, mismo estilo */}
            <div className="space-y-2.5">
              {/* Nombre */}
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  onBlur={() => handleBlur("nombre")}
                  placeholder="Tu nombre completo"
                  disabled={estadoEnvio === "enviando"}
                  className={`${inputBase} ${touched.nombre && errores.nombre ? inputError : touched.nombre && !errores.nombre ? inputSuccess : ""}`}
                />
                {touched.nombre && errores.nombre && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.nombre}</p>
                )}
              </div>

              {/* Correo */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  onBlur={() => handleBlur("correo")}
                  placeholder="correo@ejemplo.com"
                  disabled={estadoEnvio === "enviando"}
                  className={`${inputBase} ${touched.correo && errores.correo ? inputError : touched.correo && !errores.correo ? inputSuccess : ""}`}
                />
                {touched.correo && errores.correo && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.correo}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  onBlur={() => handleBlur("telefono")}
                  placeholder="912345678"
                  disabled={estadoEnvio === "enviando"}
                  className={`${inputBase} ${touched.telefono && errores.telefono ? inputError : touched.telefono && !errores.telefono ? inputSuccess : ""}`}
                />
                {touched.telefono && errores.telefono && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.telefono}</p>
                )}
              </div>

              {/* Tipo de mensaje (combobox) */}
              <div ref={comboRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (estadoEnvio !== "enviando") setComboAbierto(!comboAbierto);
                  }}
                  disabled={estadoEnvio === "enviando"}
                  className={`${inputBase} text-left flex items-center justify-between ${
                    !form.tipoMensaje ? "text-gray-300" : "text-gray-700"
                  } ${touched.tipoMensaje && errores.tipoMensaje ? inputError : touched.tipoMensaje && !errores.tipoMensaje ? inputSuccess : ""}`}
                >
                  <span>{OPCIONES_TIPO.find((o) => o.value === form.tipoMensaje)?.label || "Selecciona una opción"}</span>
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </button>
                {comboAbierto && (
                  <div className="absolute z-[100] w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                    {OPCIONES_TIPO.map((opcion) => (
                      <div
                        key={opcion.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarOpcion(opcion.value);
                        }}
                        className={`px-4 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between hover:bg-[#6544FF]/5 transition-colors ${
                          form.tipoMensaje === opcion.value ? "bg-[#6544FF]/10 text-[#6544FF] font-bold" : "text-gray-600"
                        }`}
                      >
                        {opcion.label}
                        {form.tipoMensaje === opcion.value && <Check className="w-3.5 h-3.5 text-[#6544FF]" />}
                      </div>
                    ))}
                  </div>
                )}
                {touched.tipoMensaje && errores.tipoMensaje && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.tipoMensaje}</p>
                )}
              </div>

              {/* Mensaje */}
              <div className="relative">
                <textarea
                  value={form.mensaje}
                  onChange={(e) => handleChange("mensaje", e.target.value)}
                  onBlur={() => handleBlur("mensaje")}
                  placeholder="Escribe tu mensaje aquí... (mín. 10 caracteres)"
                  rows={3}
                  maxLength={1000}
                  disabled={estadoEnvio === "enviando"}
                  className={`w-full bg-white border border-gray-200 focus:border-[#6544FF] rounded-xl px-4 py-3 text-xs text-[#1A1528] font-medium outline-none transition-all placeholder:text-gray-300 resize-none shadow-inner ${
                    touched.mensaje && errores.mensaje ? inputError : touched.mensaje && !errores.mensaje ? inputSuccess : ""
                  }`}
                />
                {/* Contador de caracteres discreto */}
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-bold">
                  {form.mensaje.length}/1000
                </div>
                {touched.mensaje && errores.mensaje && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.mensaje}</p>
                )}
              </div>
            </div>

            {/* Consentimiento */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentimiento}
                onChange={(e) => setConsentimiento(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#6544FF] focus:ring-[#6544FF]"
              />
              <span className="text-[10px] text-gray-500 leading-relaxed">
                Acepto los{" "}
                <a href="/terminos-y-condiciones" target="_blank" className="text-[#6544FF] font-semibold underline">
                  Términos y Condiciones
                </a>{" "}
                y la{" "}
                <a href="/politica-de-privacidad" target="_blank" className="text-[#6544FF] font-semibold underline">
                  Política de Privacidad
                </a>{" "}
                de EligeTuFuturo.
              </span>
            </label>

            {/* Botón de envío (estilo test vocacional) */}
            <button
              type="submit"
              disabled={estadoEnvio === "enviando" || estadoEnvio === "exito" || !consentimiento}
              className={`w-full bg-[#6544FF] hover:bg-[#5233e8] disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#6544FF]/10 ${
                estadoEnvio === "error" ? "!bg-rose-500 hover:!bg-rose-600" : ""
              }`}
            >
              {estadoEnvio === "idle" && (
                <>
                  Enviar Mensaje <Send className="w-3.5 h-3.5" />
                </>
              )}
              {estadoEnvio === "enviando" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              )}
              {estadoEnvio === "exito" && (
                <>
                  <Check className="w-4 h-4" /> ¡Enviado!
                </>
              )}
              {estadoEnvio === "error" && "Error - Reintentar"}
            </button>
            {estadoEnvio === "error" && (
              <p className="text-center text-rose-600 text-xs mt-2">Error al enviar. Intenta de nuevo.</p>
            )}
          </form>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">También puedes escribirnos a</p>
          <a href="mailto:contacto@eligetufuturo.cl" className="text-[#6544FF] font-bold text-sm hover:underline">
            contacto@eligetufuturo.cl
          </a>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-40px) scale(1.08); }
          66% { transform: translate(-20px,20px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
        .animate-blob { animation: blob 14s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </section>
  );
}