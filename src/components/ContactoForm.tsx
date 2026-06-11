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
    if (!valido) return;

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
      }, 3500);
    } catch {
      setEstadoEnvio("error");
      setTimeout(() => setEstadoEnvio("idle"), 4000);
    }
  };

  // Clases CSS reutilizables
  const inputBase =
    "w-full px-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6544FF]/40 focus:border-[#6544FF] transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
  const inputError = "border-rose-300 focus:ring-rose-400/40";
  const inputSuccess = "border-emerald-300 focus:ring-emerald-400/40";

  const labelClases =
    "block text-xs font-black uppercase tracking-[0.15em] text-[#1A1528] mb-2 flex items-center gap-2";

  // Botón con gradiente personalizado y efectos mejorados
  const botonBase =
    "relative w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden";
  const botonGradiente =
    "bg-gradient-to-r from-[#5B21B6] via-[#9333EA] to-[#3B82F6] shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-[0.98]";
  const botonError = "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25";
  const botonDisabled = "opacity-70 cursor-not-allowed hover:translate-y-0 active:scale-100";

  return (
    <section className="w-full bg-[#F4F5F9] tracking-tight">
      {/* ========== HERO BANNER ========== */}
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
            Completa el formulario y te responderemos en menos de 24 horas hábiles.
          </p>
        </div>
      </div>

      {/* ========== FORMULARIO ========== */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 -mt-32 relative z-30 pb-24">
        <div className="relative bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.08)] border border-gray-100">
          {/* Overlay éxito */}
          {mostrarExito && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center z-50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg mb-6">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">¡Mensaje Enviado!</h3>
              <p className="text-gray-500">Te responderemos pronto.</p>
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Nombre */}
            <div>
              <label className={labelClases}>
                <User className="w-3.5 h-3.5 text-[#6544FF]" /> Nombre Completo
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                onBlur={() => handleBlur("nombre")}
                placeholder="Ej: María González"
                disabled={estadoEnvio === "enviando"}
                className={`${inputBase} ${touched.nombre && errores.nombre ? inputError : touched.nombre && !errores.nombre ? inputSuccess : ""}`}
              />
              {touched.nombre && errores.nombre && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.nombre}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className={labelClases}>
                <Mail className="w-3.5 h-3.5 text-[#6544FF]" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                onBlur={() => handleBlur("correo")}
                placeholder="Ej: maria@email.com"
                disabled={estadoEnvio === "enviando"}
                className={`${inputBase} ${touched.correo && errores.correo ? inputError : touched.correo && !errores.correo ? inputSuccess : ""}`}
              />
              {touched.correo && errores.correo && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.correo}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className={labelClases}>
                <Phone className="w-3.5 h-3.5 text-[#6544FF]" /> Teléfono
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                onBlur={() => handleBlur("telefono")}
                placeholder="Ej: 912345678"
                disabled={estadoEnvio === "enviando"}
                className={`${inputBase} ${touched.telefono && errores.telefono ? inputError : touched.telefono && !errores.telefono ? inputSuccess : ""}`}
              />
              {touched.telefono && errores.telefono && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.telefono}</p>
              )}
            </div>

            {/* COMBOBOX */}
            <div ref={comboRef} className="relative">
              <label className={labelClases}>
                <MessageSquare className="w-3.5 h-3.5 text-[#6544FF]" /> ¿De qué trata tu mensaje?
              </label>
              <button
                type="button"
                onClick={() => {
                  if (estadoEnvio !== "enviando") setComboAbierto(!comboAbierto);
                }}
                disabled={estadoEnvio === "enviando"}
                className={`${inputBase} text-left flex items-center justify-between ${
                  !form.tipoMensaje ? "text-gray-400" : "text-gray-800"
                } ${touched.tipoMensaje && errores.tipoMensaje ? inputError : touched.tipoMensaje && !errores.tipoMensaje ? inputSuccess : ""}`}
              >
                <span>{OPCIONES_TIPO.find((o) => o.value === form.tipoMensaje)?.label || "Selecciona una opción"}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${comboAbierto ? "rotate-180" : ""}`} />
              </button>
              {comboAbierto && (
                <div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 py-2 overflow-visible">
                  {OPCIONES_TIPO.map((opcion) => (
                    <div
                      key={opcion.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        seleccionarOpcion(opcion.value);
                      }}
                      className={`px-4 py-3 text-sm font-medium cursor-pointer flex items-center justify-between hover:bg-[#6544FF]/5 transition-colors ${
                        form.tipoMensaje === opcion.value ? "bg-[#6544FF]/10 text-[#6544FF] font-bold" : "text-gray-700"
                      }`}
                    >
                      {opcion.label}
                      {form.tipoMensaje === opcion.value && <Check className="w-4 h-4 text-[#6544FF]" />}
                    </div>
                  ))}
                </div>
              )}
              {touched.tipoMensaje && errores.tipoMensaje && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.tipoMensaje}</p>
              )}
            </div>

            {/* MENSAJE CON CONTADOR */}
            <div>
              <label className={labelClases}>
                <MessageSquare className="w-3.5 h-3.5 text-[#6544FF]" /> Tu Mensaje
              </label>
              <div className="relative">
                <textarea
                  value={form.mensaje}
                  onChange={(e) => handleChange("mensaje", e.target.value)}
                  onBlur={() => handleBlur("mensaje")}
                  placeholder="Escribe tu mensaje aquí... (mín. 10 caracteres)"
                  rows={5}
                  maxLength={1000}
                  disabled={estadoEnvio === "enviando"}
                  className={`${inputBase} resize-none ${
                    touched.mensaje && errores.mensaje ? inputError : touched.mensaje && !errores.mensaje ? inputSuccess : ""
                  }`}
                />
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-xs font-bold">
                  <span className={form.mensaje.length > 900 ? "text-rose-500" : form.mensaje.length > 700 ? "text-amber-500" : "text-gray-400"}>
                    {form.mensaje.length}
                  </span>
                  <span className="text-gray-300"> / 1000</span>
                </div>
              </div>
              {touched.mensaje && errores.mensaje && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errores.mensaje}</p>
              )}
            </div>

            {/* BOTÓN DE ENVIAR CON GRADIENTE Y EFECTOS MEJORADOS */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={estadoEnvio === "enviando" || estadoEnvio === "exito"}
                className={`${botonBase} ${
                  estadoEnvio === "error" ? botonError : botonGradiente
                } ${estadoEnvio !== "idle" ? botonDisabled : ""} text-white`}
              >
                {/* Efecto de brillo al hacer hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                
                {estadoEnvio === "idle" && (
                  <span className="relative z-10 flex items-center gap-2">
                    Enviar Mensaje
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
                {estadoEnvio === "enviando" && (
                  <span className="relative z-10 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </span>
                )}
                {estadoEnvio === "exito" && (
                  <span className="relative z-10 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    ¡Enviado!
                  </span>
                )}
                {estadoEnvio === "error" && (
                  <span className="relative z-10">Error - Reintentar</span>
                )}
              </button>
              {estadoEnvio === "error" && (
                <p className="text-center text-rose-600 text-xs mt-2">Error al enviar. Intenta de nuevo.</p>
              )}
            </div>
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