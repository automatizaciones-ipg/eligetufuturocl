// src/components/TestVocacional.tsx
import { 
  User, Mail, Smartphone, ChevronRight, Sparkles, BrainCircuit, 
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { useTestVocacional } from "../hooks/useTestVocacional";
import ResultadosTest from "./ResultadosTest";

export default function TestVocacional() {
  // Destructuramos la lógica de nuestro Controlador (Hook)
  const {
    paso, datos, setDatos, respuestas, seleccionarOpcion, avanzar,
    perfilResult, areaPredominante, carrerasDB,
    fraseIndex, progresoTest, preguntaActual, PREGUNTAS, FRASES_ANALISIS
  } = useTestVocacional();

  if (paso === 0) {
    return (
      <div key="paso-0" className="min-h-screen mx-auto animate-in fade-in zoom-in-95 duration-700 ease-out-quint">

        <div className="container mx-auto relative z-10 max-w-7xl">
        {/* Botón Volver */}
           <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-[#A78BFA] px-5 py-2.5 rounded-full border border-[#A78BFA] backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>
        
        <div className="max-w-3xl justify-center items-center mx-auto bg-white rounded-[3rem] p-12 md:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6544FF]/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#6544FF] to-[#947BFF] rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-[#6544FF]/20 animate-pulse">
            <BrainCircuit className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-black text-center italic uppercase text-4xl md:text-5xl text-[#1A1528] tracking-tight leading-[1.05] mb-6">
            Descubre tu <br/>
            <span className="text-[#6544FF]">Futuro Ideal</span> en 3 minutos
          </h2>
          <p className="text-gray-500 mb-12 text-xl max-w-xl mx-auto leading-relaxed font-medium">
            Nuestro algoritmo avanzado analiza tu perfil psicológico y consulta en tiempo real la base de datos nacional para encontrar tus carreras perfectas.
          </p>
          <button 
            onClick={avanzar}
            className="bg-[#1A1528] hover:bg-[#2a243d] text-white font-bold py-5 px-10 rounded-2xl text-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto group shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Iniciar Evaluación Inteligente
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (paso === 1) {
    return (
      <div key="paso-1" className="max-w-xl mx-auto animate-in slide-in-from-right-16 fade-in duration-500 ease-out-quint py-10">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 mx-auto bg-[#fafafa] rounded-2xl flex items-center justify-center mb-6 border border-gray-200 shadow-inner">
            <User className="w-8 h-8 text-[#6544FF]" />
          </div>
          <h3 className="font-black italic uppercase text-3xl text-[#1A1528] mb-2 tracking-tight">¡Hola! ¿Cómo te llamas?</h3>
          <p className="text-gray-500 mb-8 font-medium">Para personalizar tu análisis algorítmico.</p>
          <div className="space-y-4">
            <input
              type="text"
              value={datos.nombre}
              onChange={(e) => setDatos({...datos, nombre: e.target.value})}
              placeholder="Escribe tu nombre completo"
              className="w-full bg-[#fafafa] border-2 border-gray-100 focus:border-[#6544FF] focus:bg-white rounded-2xl px-6 py-5 text-xl font-semibold text-center text-[#1A1528] outline-none transition-all shadow-inner"
              autoFocus
            />
            <button 
              onClick={avanzar}
              disabled={datos.nombre.length < 3}
              className="w-full bg-[#6544FF] text-white font-bold py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paso === 2) {
    return (
      <div key="paso-2" className="max-w-xl mx-auto animate-in slide-in-from-right-16 fade-in duration-500 ease-out-quint py-10">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100">
          <h3 className="font-black italic uppercase text-2xl text-[#1A1528] mb-2 tracking-tight text-center">Un último paso, {datos.nombre.split(' ')[0]}</h3>
          <p className="text-gray-500 mb-10 text-center font-medium text-sm">Crea tu perfil para enviarte los resultados oficiales.</p>
          <div className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF]" />
              <input
                type="email"
                value={datos.email}
                onChange={(e) => setDatos({...datos, email: e.target.value})}
                placeholder="Correo electrónico"
                className="w-full bg-[#fafafa] border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-12 pr-4 py-4 font-medium text-[#1A1528] outline-none transition-all shadow-inner"
              />
            </div>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF]" />
              <input
                type="tel"
                value={datos.telefono}
                onChange={(e) => setDatos({...datos, telefono: e.target.value})}
                placeholder="Teléfono móvil (Ej: +569...)"
                className="w-full bg-[#fafafa] border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-12 pr-4 py-4 font-medium text-[#1A1528] outline-none transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={avanzar}
              disabled={datos.email.length < 5 || datos.telefono.length < 8}
              className="w-full bg-[#1A1528] text-white font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 mt-4 disabled:opacity-40 shadow-md"
            >
              Comenzar Test <Sparkles className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-gray-400 mt-5 font-medium">Tus datos están protegidos y son estrictamente confidenciales.</p>
          </div>
        </div>
      </div>
    );
  }

  if (paso === PREGUNTAS.length + 3) {
    return (
      <div key="cargando" className="max-w-2xl mx-auto text-center py-24 animate-in fade-in zoom-in-95 duration-700 ease-out-quint relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#6544FF]/10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="relative w-40 h-40 mx-auto mb-12">
          <div className="absolute inset-0 bg-[#6544FF]/20 rounded-full animate-ping opacity-75"></div>
          <div className="absolute inset-2 border-4 border-[#6544FF]/30 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-[#6544FF] rounded-full border-t-transparent animate-spin duration-1000"></div>
          <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-4 shadow-xl">
            <BrainCircuit className="w-14 h-14 text-[#6544FF] animate-pulse" />
          </div>
        </div>
        <h2 className="font-black italic uppercase text-3xl text-[#1A1528] mb-4 tracking-tight">
          Calculando, {datos.nombre.split(' ')[0]}...
        </h2>
        <div className="h-10 overflow-hidden relative">
          <p key={fraseIndex} className="text-[#6544FF] text-xl font-semibold animate-in slide-in-from-bottom-4 fade-in duration-400 absolute w-full left-0">
            {FRASES_ANALISIS[fraseIndex]}
          </p>
        </div>
      </div>
    );
  }

  if (paso === PREGUNTAS.length + 4 && perfilResult && areaPredominante) {
    return (
      <ResultadosTest
        areaPredominante={areaPredominante}
        perfilInfo={perfilResult}
        carrerasDB={carrerasDB}
        datosUsuario={datos}
        respuestas={respuestas}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative py-12">
      <div className="absolute top-0 left-0 w-full flex items-center justify-between text-sm font-bold text-gray-400 px-1">
        <span>Análisis en progreso</span>
        <span className="text-[#6544FF] bg-[#6544FF]/10 px-4 py-1.5 rounded-full font-extrabold">{Math.round(progresoTest)}%</span>
      </div>
      <div className="absolute top-10 left-0 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[#6544FF] to-[#947BFF] transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progresoTest}%` }}
        ></div>
      </div>

      <div key={preguntaActual?.id} className="animate-in slide-in-from-right-16 fade-in duration-600 ease-out-quint mt-16">
        <h3 className="font-black italic uppercase text-3xl md:text-4xl text-[#1A1528] mb-12 text-center leading-tight tracking-tight">
          {preguntaActual?.pregunta}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {preguntaActual?.opciones.map((opcion) => {
            const estaSeleccionada = respuestas[preguntaActual.id] === opcion.id;
            return (
              <button
                key={opcion.id}
                onClick={() => seleccionarOpcion(preguntaActual.id, opcion.id)}
                className={`group relative flex flex-col items-center text-center p-8 rounded-[2rem] border-2 transition-all duration-300 overflow-hidden shadow-sm
                  ${estaSeleccionada ? 'border-[#6544FF] bg-[#6544FF]/5 scale-95 shadow-inner' : 'border-gray-100 bg-white hover:border-[#6544FF]/30 hover:-translate-y-2'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#6544FF]/0 to-[#6544FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-inner
                  ${estaSeleccionada ? 'bg-[#6544FF] text-white' : 'bg-[#fafafa] text-[#6544FF] group-hover:bg-[#6544FF] group-hover:text-white group-hover:rotate-6'}`}>
                  {opcion.icono}
                </div>
                <span className={`relative z-10 font-bold text-xl md:text-2xl leading-snug transition-colors duration-300 ${estaSeleccionada ? 'text-[#6544FF]' : 'text-gray-700 group-hover:text-[#1A1528]'}`}>
                  {opcion.texto}
                </span>
                <div className={`absolute top-6 right-6 transition-all duration-300 ${estaSeleccionada ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <CheckCircle2 className="w-8 h-8 text-[#6544FF]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}