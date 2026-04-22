// src/components/CalculadoraNem.tsx
import { useState, useEffect } from "react";
import { Calculator, GraduationCap, Award, BookOpen, ChevronDown, Info, ArrowLeft } from "lucide-react";

export default function CalculadoraNem() {
  // Estado de las notas
  const [notas, setNotas] = useState({ n1: "", n2: "", n3: "", n4: "" });
  
  // Estado para el cálculo de Ranking (Avanzado)
  const [avanzado, setAvanzado] = useState(false);
  const [colegio, setColegio] = useState({ historico: "5.3", maximo: "6.8" });

  // Resultados
  const [resultados, setResultados] = useState({ promedio: 0, nem: 0, ranking: 0 });

  // Función para limpiar y parsear notas (acepta comas y puntos)
  const parseNota = (val: string) => {
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  // Efecto que calcula todo en tiempo real cada vez que cambia un input
  useEffect(() => {
    const n1 = parseNota(notas.n1);
    const n2 = parseNota(notas.n2);
    const n3 = parseNota(notas.n3);
    const n4 = parseNota(notas.n4);

    let promediosValidos = [n1, n2, n3, n4].filter(n => n >= 1 && n <= 7);
    
    if (promediosValidos.length > 0) {
      // 1. Calcular Promedio (truncado a 2 decimales para precisión)
      const suma = promediosValidos.reduce((a, b) => a + b, 0);
      const promedioExacto = Math.floor((suma / promediosValidos.length) * 100) / 100;

      // 2. Calcular Puntaje NEM (Aproximación lineal estándar HC: 4.0 = 100, 7.0 = 1000)
      let puntajeNem = 0;
      if (promedioExacto >= 4.0) {
        puntajeNem = Math.round((promedioExacto - 4.0) * 300 + 100);
      }
      
      // Asegurar topes del NEM
      puntajeNem = Math.min(Math.max(puntajeNem, 0), 1000);

      // 3. Calcular Puntaje Ranking
      let puntajeRanking = puntajeNem; // Por defecto es igual al NEM
      
      if (avanzado) {
        const ph = parseNota(colegio.historico);
        const pmh = parseNota(colegio.maximo);
        
        if (promedioExacto > ph && pmh > ph) {
          // Fórmula estándar de bonificación de Ranking
          const nemPH = Math.round((ph - 4.0) * 300 + 100);
          const bono = ((promedioExacto - ph) / (pmh - ph)) * (1000 - nemPH);
          puntajeRanking = Math.round(nemPH + bono);
        }
      }

      puntajeRanking = Math.min(Math.max(puntajeRanking, puntajeNem), 1000);

      setResultados({
        promedio: promedioExacto,
        nem: puntajeNem,
        ranking: puntajeRanking
      });
    } else {
      setResultados({ promedio: 0, nem: 0, ranking: 0 });
    }
  }, [notas, avanzado, colegio]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    let val = e.target.value;
    // Solo permitir números y un separador decimal
    if (/^(\d*[.,]?\d{0,1})$/.test(val) || val === "") {
      setNotas(prev => ({ ...prev, [key]: val }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-gray-800 font-sans selection:bg-[#7C3AED] selection:text-white ">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER) - EXACTAMENTE EL MISMO COLOR QUE EL BUSCADOR
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient Brutal EXACTO al buscador */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
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
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-6 animate-fade-in-up">
            <Calculator className="w-4 h-4 text-[#A78BFA]" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Herramienta Oficial</span>
          </div>

          {/* === APLICAMOS LAS LETRAS EXACTAS AQUÍ === */}
          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Calcula tu <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">NEM y Ranking</span>
          </h2>
          
          <p className="text-gray-300 max-w-2xl text-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Ingresa tus promedios de enseñanza media para simular tus puntajes y proyectar tus opciones universitarias con precisión.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Layout con margen negativo)
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* Aquí vuelve EXACTAMENTE tu grid original */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-700 delay-300">
          
          {/* COLUMNA IZQUIERDA - FORMULARIO */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#6544FF]/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#6544FF]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1528]">Tus Notas de Media</h2>
                  <p className="text-sm text-gray-500">Ingresa tus promedios anuales finales.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "n1", label: "1º Medio", placeholder: "Ej: 6.2" },
                  { id: "n2", label: "2º Medio", placeholder: "Ej: 6.5" },
                  { id: "n3", label: "3º Medio", placeholder: "Ej: 6.8" },
                  { id: "n4", label: "4º Medio", placeholder: "Ej: 6.7" }
                ].map((curso) => (
                  <div key={curso.id} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">{curso.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notas[curso.id as keyof typeof notas]}
                      onChange={(e) => handleInput(e, curso.id)}
                      placeholder={curso.placeholder}
                      className="w-full bg-[#fafafa] border border-gray-200 rounded-2xl px-4 py-3 text-lg font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50 focus:border-[#6544FF] transition-all placeholder:font-normal placeholder:text-gray-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Acordeón de Configuración Avanzada de Ranking */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setAvanzado(!avanzado)}
                className="w-full p-6 flex items-center justify-between bg-white hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Award className={`w-5 h-5 ${avanzado ? 'text-[#6544FF]' : 'text-gray-400'}`} />
                  <span className="font-bold text-[#1A1528]">Simular Ranking Avanzado</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${avanzado ? 'rotate-180' : ''}`} />
              </button>
              
              {avanzado && (
                <div className="p-6 pt-0 border-t border-gray-100 bg-[#fafafa]/50 animate-in slide-in-from-top-4 duration-300">
                  <p className="text-sm text-gray-500 mb-4 mt-4">
                    El Ranking premia tu esfuerzo relativo. Ingresa los datos históricos de tu colegio para una simulación más precisa.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Promedio Histórico (PH)</label>
                      <input
                        type="text"
                        value={colegio.historico}
                        onChange={(e) => setColegio({...colegio, historico: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Promedio Máximo (PMH)</label>
                      <input
                        type="text"
                        value={colegio.maximo}
                        onChange={(e) => setColegio({...colegio, maximo: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA - RESULTADOS FIJOS (STICKY) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-[#130E24] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
              {/* Arte de fondo sutil */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6544FF] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
              
              <h3 className="text-white font-bold text-xl mb-8 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#6544FF]" />
                Tus Resultados
              </h3>

              <div className="space-y-8">
                {/* Promedio General */}
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Promedio de Media</p>
                    <div className="text-5xl font-black text-white tracking-tighter">
                      {resultados.promedio > 0 ? resultados.promedio.toFixed(2) : "-.--"}
                    </div>
                  </div>
                </div>

                {/* Puntajes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Puntaje NEM</p>
                    <div className="text-3xl font-black text-[#947BFF]">
                      {resultados.nem > 0 ? resultados.nem : "---"}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6544FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Ranking</p>
                    <div className="text-3xl font-black text-[#C1AFFF]">
                      {resultados.ranking > 0 ? resultados.ranking : "---"}
                    </div>
                  </div>
                </div>

                <div className="bg-[#6544FF]/10 rounded-xl p-4 flex gap-3 items-start border border-[#6544FF]/20">
                  <Info className="w-5 h-5 text-[#947BFF] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Esta es una simulación basada en la escala de transformación lineal DEMRE. Los puntajes oficiales pueden variar ligeramente según la tabla específica de tu rama educacional (HC, TP).
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS DEL BANNER
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
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