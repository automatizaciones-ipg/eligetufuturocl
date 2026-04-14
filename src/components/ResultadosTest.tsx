import { ArrowUpRight, Building2, Briefcase, GraduationCap, MapPin, Trophy } from "lucide-react";
import type { AreaRIASEC, CarreraDB, DatosUsuario, PerfilVocacional } from "../types/vocacional";

interface ResultadosProps {
  areaPredominante: AreaRIASEC;
  perfilInfo: PerfilVocacional;
  carrerasDB: CarreraDB[];
  datosUsuario: DatosUsuario;
  respuestas: Record<number, string>;
}

export default function ResultadosTest({ areaPredominante, perfilInfo, carrerasDB, datosUsuario, respuestas }: ResultadosProps) {
  const totalRespuestas = Object.keys(respuestas).length;
  const formatCurrency = (value?: number | null) => {
    if (!value || value <= 0) return "No informado";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  };

  const tipoInstitucion = (tipo?: string | null) => {
    if (!tipo) return "Institución";
    if (tipo.includes("Universidades")) return "Universidad";
    if (tipo.includes("Institutos")) return "Instituto Profesional";
    if (tipo.includes("Centros")) return "CFT";
    return tipo;
  };
  const normalizarInstituciones = (instituciones: CarreraDB["instituciones"] | unknown): CarreraDB["instituciones"] => {
    if (Array.isArray(instituciones)) {
      return instituciones.filter((inst) => inst && typeof inst.nombre === "string");
    }
    if (instituciones && typeof instituciones === "object" && "nombre" in (instituciones as Record<string, unknown>)) {
      const inst = instituciones as { nombre?: string; tipo?: string | null };
      return inst.nombre ? [{ nombre: inst.nombre, tipo: inst.tipo ?? null }] : [];
    }
    return [];
  };

  const carrerasSeguras = carrerasDB.map((carrera) => ({
    ...carrera,
    instituciones: normalizarInstituciones(carrera.instituciones),
  }));

  const topCarreras = carrerasSeguras.slice(0, 8);
  const institucionesUnicas = Array.from(
    new Map(
      carrerasSeguras
        .flatMap((c) => c.instituciones)
        .map((inst) => [inst.nombre, inst])
    ).values()
  ).slice(0, 6);

  const carrerasSugeridasTexto = topCarreras.map((c) => c.nombre_carrera).join(", ");
  const enlaceSolicitud = `/herramientas/solicitar-informacion?nombre=${encodeURIComponent(datosUsuario.nombre)}&correo=${encodeURIComponent(datosUsuario.email)}&telefono=${encodeURIComponent(datosUsuario.telefono)}&perfil=${encodeURIComponent(areaPredominante)}&carreras=${encodeURIComponent(carrerasSugeridasTexto)}`;

  return (
    <div className="max-w-6xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="text-center mb-16 relative py-10">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-gradient-to-r ${perfilInfo.color} opacity-10 blur-[120px] -z-10 rounded-full`}></div>
        <span className="inline-block py-1.5 px-4 rounded-full bg-[#15803d]/10 text-[#15803d] font-bold text-sm mb-6 border border-[#15803d]/20 uppercase tracking-widest">
          Resultado validado con BD
        </span>
        <h2 className="font-black italic uppercase text-4xl md:text-5xl text-[#1A1528] tracking-tight mb-5 leading-[1.05]">
          Tu Perfil Vocacional es <br/>
          <span className={perfilInfo.textClass}>{perfilInfo.titulo}</span>
        </h2>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          {perfilInfo.descripcion}
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="flex items-center gap-5 mb-8 border-b border-gray-100 pb-6">
            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${perfilInfo.color} flex items-center justify-center shadow-lg`}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#1A1528]">Carreras Compatibles</h3>
              <p className="text-gray-500 text-sm font-medium">Sugeridas según tu perfil y afinidad académica</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topCarreras.length > 0 ? (
              topCarreras.map((item, i) => (
                <a
                  key={`${item.nombre_carrera}-${i}`}
                  href={item.codigo_carrera ? `/carrera/${item.codigo_carrera}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-5 rounded-2xl border border-gray-100 bg-[#fafafa] hover:bg-white hover:border-[#6544FF]/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h4 className="font-black text-lg text-[#1A1528] leading-tight group-hover:text-[#6544FF] transition-colors">
                      {item.nombre_carrera}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black uppercase tracking-wide text-[#6544FF] bg-[#6544FF]/10 px-3 py-1 rounded-lg">
                        Match {item.match ?? 70}%
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-[#1A1528] text-white flex items-center justify-center group-hover:bg-[#6544FF] transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="text-xs rounded-xl bg-white border border-gray-200 px-3 py-2">
                      <p className="text-gray-400 uppercase font-bold tracking-wide mb-1">Arancel anual</p>
                      <p className="text-[#1A1528] font-bold">{formatCurrency(item.arancel_anual)}</p>
                    </div>
                    <div className="text-xs rounded-xl bg-white border border-gray-200 px-3 py-2">
                      <p className="text-gray-400 uppercase font-bold tracking-wide mb-1">Duración</p>
                      <p className="text-[#1A1528] font-bold">{item.duracion_semestres ? `${item.duracion_semestres} semestres` : "No informada"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.instituciones.slice(0, 2).map((inst) => (
                      <span key={inst.nombre} className="text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-lg">
                        {inst.nombre}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    {item.region && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.region}</span>}
                    {item.jornada && <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {item.jornada}</span>}
                    {item.empleabilidad_1er_anio ? <span>Empleabilidad: {Math.round(item.empleabilidad_1er_anio)}%</span> : null}
                  </div>
                </a>
              ))
            ) : (
              <p className="text-gray-500 text-center py-10">Procesando coincidencias con tu perfil...</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 lg:self-start h-fit bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-800">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-[#facc15]" />
              </div>
              <div>
                <p className="text-white text-xl font-extrabold leading-tight">Resumen de tu resultado</p>
                <p className="text-gray-400 text-sm">Perfil principal: {areaPredominante}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Preguntas respondidas</p>
                <p className="text-white text-2xl font-black">{totalRespuestas}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-gray-400 text-xs uppercase font-bold">Carreras sugeridas</p>
                <p className="text-white text-2xl font-black">{topCarreras.length}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <p className="text-white font-bold mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Instituciones recomendadas
              </p>
              <p className="text-gray-400 text-xs mb-4">
                Seleccionadas en base a tus carreras con mayor compatibilidad.
              </p>
              <div className="space-y-2">
                {institucionesUnicas.map((inst) => (
                  <div key={inst.nombre} className="flex items-center justify-between text-sm rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#6544FF] shrink-0"></span>
                      <span className="text-gray-200 truncate">{inst.nombre}</span>
                    </div>
                    <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-wide">{tipoInstitucion(inst.tipo)}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={enlaceSolicitud}
              className="w-full inline-flex justify-center items-center gap-2 bg-[#6544FF] hover:bg-[#5233e8] text-white font-bold py-4 rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Solicitar más información
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}