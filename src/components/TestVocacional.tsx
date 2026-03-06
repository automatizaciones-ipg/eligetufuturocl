// src/components/TestVocacional.tsx
import { useState, useEffect } from "react";
import { 
  User, Mail, Smartphone, ChevronRight, Sparkles, BrainCircuit, 
  Target, Heart, Palette, Microscope, Code, Briefcase, Zap, 
  CheckCircle2, GraduationCap, Building2, MapPin, ArrowRight 
} from "lucide-react";

// --- DATOS DEL TEST (Ejemplo Organizado por Áreas) ---
const PREGUNTAS = [
  {
    id: 1,
    pregunta: "Cuando te enfrentas a un desafío, tu enfoque natural es...",
    opciones: [
      { id: "a", texto: "Analizar datos y buscar patrones lógicos", icono: <Code className="w-8 h-8" /> },
      { id: "b", texto: "Imaginar soluciones visuales e innovadoras", icono: <Palette className="w-8 h-8" /> },
      { id: "c", texto: "Planificar la estrategia y organizar recursos", icono: <Briefcase className="w-8 h-8" /> },
      { id: "d", texto: "Considerar el impacto en las personas involved", icono: <Heart className="w-8 h-8" /> }
    ]
  },
  {
    id: 2,
    pregunta: "¿Qué tipo de proyectos te motivan más?",
    opciones: [
      { id: "a", texto: "Desarrollar nueva tecnología o software", icono: <BrainCircuit className="w-8 h-8" /> },
      { id: "b", texto: "Crear campañas de comunicación o diseño", icono: <Zap className="w-8 h-8" /> },
      { id: "c", texto: "Investigar fenómenos científicos o médicos", icono: <Microscope className="w-8 h-8" /> },
      { id: "d", texto: "Liderar equipos hacia una meta común", icono: <Target className="w-8 h-8" /> }
    ]
  },
  {
    id: 3,
    pregunta: "Elige el entorno donde te ves brillando:",
    opciones: [
      { id: "a", texto: "Un centro de innovación tecnológica", icono: <Code className="w-8 h-8" /> },
      { id: "b", texto: "Un estudio creativo o agencia de diseño", icono: <Palette className="w-8 h-8" /> },
      { id: "c", texto: "Una corporación dinámica o startup", icono: <Briefcase className="w-8 h-8" /> },
      { id: "d", texto: "Un hospital, colegio o fundación social", icono: <Heart className="w-8 h-8" /> }
    ]
  }
];

// Frases dinámicas para la pantalla de carga "Mágica"
const FRASES_ANALISIS = [
  "Sincronizando tus intereses...",
  "Mapeando tu ADN vocacional...",
  "Consultando nuestra base de datos inteligente...",
  "Generando tus matches perfectos..."
];

export default function TestVocacional() {
  // Flujo: 0: Intro -> 1: Nombre -> 2: Contacto (Lead) -> 3 a N+2: Test -> N+3: Carga -> N+4: Resultados
  const [paso, setPaso] = useState(0); 
  const [datos, setDatos] = useState({ nombre: "", email: "", telefono: "" });
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [fraseIndex, setFraseIndex] = useState(0);

  // Índice real de la pregunta en el array PREGUNTAS
  const preguntaActualIndex = paso - 3;
  const progresoTest = preguntaActualIndex >= 0 && preguntaActualIndex < PREGUNTAS.length 
    ? (preguntaActualIndex / PREGUNTAS.length) * 100 
    : 0;

  // Efecto para cambiar las frases de carga dinámicamente
  useEffect(() => {
    if (paso === PREGUNTAS.length + 3) {
      const interval = setInterval(() => {
        setFraseIndex((prev) => (prev + 1) % FRASES_ANALISIS.length);
      }, 1400); // Cambia cada 1.4s
      
      // Auto avanzar a resultados después de 5.6 segundos
      const timeout = setTimeout(() => {
        setPaso(PREGUNTAS.length + 4);
      }, 5600);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [paso]);

  // Manejar selección de opción con una transición rápida pero suave
  const seleccionarOpcion = (idPregunta: number, idOpcion: string) => {
    setRespuestas(prev => ({ ...prev, [idPregunta]: idOpcion }));
    setTimeout(() => {
      setPaso(paso + 1);
    }, 350); // Delay ligero para feedback visual del click
  };

  // --- RENDERIZADO DE PASOS INDIVIDUALES ---

  // PASO 0: INTRODUCCIÓN ESPECTACULAR
  if (paso === 0) {
    return (
      <div key="paso-0" className="max-w-3xl mx-auto text-center animate-in fade-in zoom-in-95 duration-700 ease-out-quint">
        <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          {/* Orbe de luz violeta sutil de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6544FF]/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#6544FF] to-[#947BFF] rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-[#6544FF]/20 animate-pulse">
            <BrainCircuit className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="font-black italic uppercase text-4xl md:text-5xl text-[#1A1528] tracking-tight leading-[1.05] mb-6">
            Descubre tu <br/>
            <span className="text-[#6544FF]">Futuro Ideal</span> en 3 minutos
          </h2>
          <p className="text-gray-500 mb-12 text-xl max-w-xl mx-auto leading-relaxed font-medium">
            Nuestro algoritmo avanzado conecta tu personalidad única con las carreras y universidades donde realmente brillarás.
          </p>

          <button 
            onClick={() => setPaso(1)}
            className="bg-[#1A1528] hover:bg-[#2a243d] text-white font-bold py-5 px-10 rounded-2xl text-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto group shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Iniciar Evaluación Gratuita
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // PASO 1: CAPTURA DE NOMBRE
  if (paso === 1) {
    return (
      <div key="paso-1" className="max-w-xl mx-auto animate-in slide-in-from-right-16 fade-in duration-500 ease-out-quint">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 mx-auto bg-[#fafafa] rounded-2xl flex items-center justify-center mb-6 border border-gray-200 shadow-inner">
            <User className="w-8 h-8 text-[#6544FF]" />
          </div>
          <h3 className="font-black italic uppercase text-3xl text-[#1A1528] mb-2 tracking-tight">¡Hola! ¿Cómo te llamas?</h3>
          <p className="text-gray-500 mb-8 font-medium">Para personalizar tu experiencia inmersiva.</p>
          
          <div className="space-y-4">
            <input
              type="text"
              value={datos.nombre}
              onChange={(e) => setDatos({...datos, nombre: e.target.value})}
              placeholder="Escribe tu nombre completo"
              className="w-full bg-[#fafafa] border-2 border-gray-100 focus:border-[#6544FF] focus:bg-white rounded-2xl px-6 py-5 text-xl font-semibold text-center text-[#1A1528] outline-none transition-all placeholder:font-normal placeholder:text-gray-300 shadow-inner"
              autoFocus
            />
            <button 
              onClick={() => setPaso(2)}
              disabled={datos.nombre.length < 3}
              className="w-full bg-[#6544FF] text-white font-bold py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5236CC] shadow-md hover:shadow-lg"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 2: CAPTURA DE LEAD (EMAIL / TELÉFONO)
  if (paso === 2) {
    return (
      <div key="paso-2" className="max-w-xl mx-auto animate-in slide-in-from-right-16 fade-in duration-500 ease-out-quint">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100">
          <h3 className="font-black italic uppercase text-2xl text-[#1A1528] mb-2 tracking-tight text-center">Un último paso, {datos.nombre.split(' ')[0]}</h3>
          <p className="text-gray-500 mb-10 text-center font-medium text-sm">Crea tu perfil para guardar tus resultados y enviarte becas exclusivas.</p>
          
          <div className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
              <input
                type="email"
                value={datos.email}
                onChange={(e) => setDatos({...datos, email: e.target.value})}
                placeholder="Correo electrónico institucional o personal"
                className="w-full bg-[#fafafa] border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-12 pr-4 py-4 font-medium text-[#1A1528] outline-none transition-all shadow-inner"
              />
            </div>
            <div className="relative group">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
              <input
                type="tel"
                value={datos.telefono}
                onChange={(e) => setDatos({...datos, telefono: e.target.value})}
                placeholder="Teléfono móvil (Ej: +56912345678)"
                className="w-full bg-[#fafafa] border border-gray-200 focus:border-[#6544FF] focus:ring-4 focus:ring-[#6544FF]/10 rounded-xl pl-12 pr-4 py-4 font-medium text-[#1A1528] outline-none transition-all shadow-inner"
              />
            </div>
            
            <button 
              onClick={() => setPaso(3)}
              disabled={datos.email.length < 5 || datos.telefono.length < 8}
              className="w-full bg-[#1A1528] hover:bg-[#2a243d] text-white font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 mt-4 disabled:opacity-40 shadow-md hover:shadow-lg"
            >
              Comenzar Test <Sparkles className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-gray-400 mt-5 font-medium">Tus datos están protegidos y son estrictamente confidenciales.</p>
          </div>
        </div>
      </div>
    );
  }

  // PASO 4: PANTALLA DE CARGA MÁGICA
  if (paso === PREGUNTAS.length + 3) {
    return (
      <div key="cargando" className="max-w-2xl mx-auto text-center py-24 animate-in fade-in zoom-in-95 duration-700 ease-out-quint relative overflow-hidden">
        {/* Orbes de fondo dinámicos */}
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
          Espera un momento, {datos.nombre.split(' ')[0]}...
        </h2>
        <div className="h-10 overflow-hidden relative">
          <p key={fraseIndex} className="text-[#6544FF] text-xl font-semibold animate-in slide-in-from-bottom-4 fade-in duration-400 absolute w-full left-0">
            {FRASES_ANALISIS[fraseIndex]}
          </p>
        </div>
      </div>
    );
  }

  // PASO 5: RESULTADOS ESPECTACULARES
  if (paso === PREGUNTAS.length + 4) {
    return (
      <div key="resultados" className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out-quint">
        {/* Header Resultados */}
        <div className="text-center mb-16 relative py-10">
          {/* Fondo de resplandor Premium */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-gradient-to-r from-[#6544FF]/20 to-[#947BFF]/20 blur-[120px] -z-10 rounded-full"></div>
          
          <span className="inline-block py-1.5 px-4 rounded-full bg-[#15803d]/10 text-[#15803d] font-bold text-sm mb-6 border border-[#15803d]/20 uppercase tracking-widest animate-pulse">
            Análisis Exitoso
          </span>
          <h2 className="font-black italic uppercase text-5xl md:text-6xl text-[#1A1528] tracking-tight mb-5 leading-[1.05]">
            Tu Perfil Vocacional <br/>
            es <span className="text-[#6544FF]">Innovador & Analítico</span>
          </h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leadin-relaxed">
            Basado en tus respuestas, posees una mente curiosa, enfocada en resolver problemas complejos mediante tecnología y lógica.
          </p>
        </div>

        {/* Grilla de Resultados Premium */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          
          {/* Tarjeta de Carreras Match (Ocupa 7/12 columnas) */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#6544FF]/5 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="flex items-center gap-5 mb-10 border-b border-gray-100 pb-8">
              <div className="w-16 h-16 rounded-3xl bg-[#6544FF] flex items-center justify-center shadow-lg shadow-[#6544FF]/30">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#1A1528]">Carreras con Mayor Compatibilidad</h3>
                <p className="text-gray-500 text-sm font-medium">Tus mejores opciones académicas en Chile</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {[
                { carrera: "Ingeniería en Software", facultad: "Ingeniería y Tecnología", match: 98 },
                { carrera: "Ciencia de Datos (Data Science)", facultad: "Matemáticas y Ciencias", match: 95 },
                { carrera: "Ingeniería Comercial (Mención Economía)", facultad: "Economía y Negocios", match: 88 }
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-gray-100 hover:border-[#6544FF]/30 bg-white hover:bg-[#fafafa] transition-all duration-300 hover:shadow-md cursor-pointer gap-4 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 150}ms` }}>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1528] leading-tight mb-1">{item.carrera}</h4>
                    <p className="text-sm text-gray-500 font-medium">{item.facultad}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                      <div className="h-full bg-gradient-to-r from-[#6544FF] to-[#947BFF] rounded-full" style={{ width: `${item.match}%` }}></div>
                    </div>
                    <span className="font-black text-2xl text-[#6544FF] tabular-nums">{item.match}%</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#1A1528] font-bold transition-colors flex items-center justify-center gap-2 group shadow-inner">
              Explorar mallas curriculares de estas carreras
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Tarjeta de Instituciones Recomendadas (Ocupa 5/12 columnas) */}
          <div className="lg:col-span-5 bg-[#1A1528] rounded-[2.5rem] p-10 shadow-2xl border border-[#6544FF]/20 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500">
            {/* Arte neón de fondo sutil */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#6544FF] rounded-full blur-[90px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <div className="relative z-10 flex items-center gap-5 mb-10 border-b border-white/10 pb-8 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Building2 className="w-8 h-8 text-[#C1AFFF]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Instituciones Destacadas</h3>
                <p className="text-gray-400 text-sm font-medium">Líderes en las áreas recomendadas</p>
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              {[
                { nombre: "Universidad de Chile", sede: "Sedes RM", logo: "U" },
                { nombre: "Pontificia Univ. Católica (UC)", sede: "Sedes RM", logo: "UC" },
                { nombre: "Duoc UC", sede: "Varias Regiones", logo: "D" },
                { nombre: "Univ. Técnica Federico Santa María", sede: "Sedes RM y V Región", logo: "USM" }
              ].map((inst, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer animate-in slide-in-from-right-8" style={{ animationDelay: `${(i + 3) * 150}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-black text-[#C1AFFF] border border-white/10 shadow-inner">
                    {inst.logo}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-tight mb-1">{inst.nombre}</h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> {inst.sede}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-5 bg-[#6544FF] hover:bg-[#5236CC] rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-[#6544FF]/30">
              Contactar Directamente Instituciones
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pequeño Footer de Resultados */}
        <p className="text-center text-gray-400 text-sm mt-12 font-medium">
          Hemos enviado un reporte detallado con becas exclusivas al correo: <span className="font-semibold text-gray-500">{datos.email}</span>
        </p>
      </div>
    );
  }

  // PASOS 3 a N+2: EL TEST PROPIAMENTE TAL
  const preguntaActual = PREGUNTAS[preguntaActualIndex];

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Barra de progreso superior elegante */}
      <div className="absolute -top-16 left-0 w-full flex items-center justify-between text-sm font-bold text-gray-400 px-1">
        <span>Progreso</span>
        <span className="text-[#6544FF] bg-[#6544FF]/10 px-4 py-1.5 rounded-full font-extrabold">{Math.round(progresoTest)}%</span>
      </div>
      <div className="absolute -top-6 left-0 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-[#6544FF] to-[#947BFF] transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progresoTest}%` }}
        ></div>
      </div>

      <div key={preguntaActual.id} className="animate-in slide-in-from-right-16 fade-in duration-600 ease-out-quint">
        <h3 className="font-black italic uppercase text-3xl md:text-4xl text-[#1A1528] mb-12 text-center leading-tight tracking-tight">
          {preguntaActual.pregunta}
        </h3>

        {/* Grilla de Tarjetas de Opciones (UI/UX Espectacular) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {preguntaActual.opciones.map((opcion) => {
            const estaSeleccionada = respuestas[preguntaActual.id] === opcion.id;
            return (
              <button
                key={opcion.id}
                onClick={() => seleccionarOpcion(preguntaActual.id, opcion.id)}
                className={`group relative flex flex-col items-center text-center p-8 rounded-[2rem] border-2 transition-all duration-300 overflow-hidden shadow-sm
                  ${estaSeleccionada 
                    ? 'border-[#6544FF] bg-[#6544FF]/5 scale-95 shadow-inner' 
                    : 'border-gray-100 bg-white hover:border-[#6544FF]/30 hover:shadow-[0_8px_30px_rgba(101,68,255,0.08)] hover:-translate-y-2'
                  }
                `}
              >
                {/* Degradado de fondo sutil al hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#6544FF]/0 to-[#6544FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icono animado */}
                <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-inner
                  ${estaSeleccionada 
                    ? 'bg-[#6544FF] text-white' 
                    : 'bg-[#fafafa] text-[#6544FF] group-hover:bg-[#6544FF] group-hover:text-white group-hover:rotate-6'
                  }
                `}>
                  {opcion.icono}
                </div>
                
                {/* Texto de opción */}
                <span className={`relative z-10 font-bold text-xl md:text-2xl leading-snug transition-colors duration-300
                  ${estaSeleccionada ? 'text-[#6544FF]' : 'text-gray-700 group-hover:text-[#1A1528]'}
                `}>
                  {opcion.texto}
                </span>

                {/* Check de selección (Aparece suavemente) */}
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