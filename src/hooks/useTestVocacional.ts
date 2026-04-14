// src/hooks/useTestVocacional.ts
import { useState, useEffect, useRef } from "react";
import { PERFILES_RIASEC, PREGUNTAS_REALES, FRASES_ANALISIS } from "../data/vocacionalData";
import { buscarCarrerasPorPerfil, guardarLead } from "../services/vocacionalService";
import type { AreaRIASEC, CarreraDB, DatosUsuario, PerfilVocacional } from "../types/vocacional";

type PerfilResultado = PerfilVocacional & {
  afinidad: number;
  keywordBuscador: string;
};

interface CarreraMatch {
  carrera: string;
  match: number;
}

interface InstitucionDestacada {
  nombre: string;
  logo: string;
  tipo?: string | null;
}

type RegistroCarreraCrudo = Omit<CarreraDB, "instituciones"> & {
  instituciones: CarreraDB["instituciones"] | { nombre?: string | null; tipo?: string | null } | null;
};

const PREGUNTAS = PREGUNTAS_REALES;

const KEYWORDS_POR_AREA: Record<AreaRIASEC, string> = {
  Realista: "ingenieria civil",
  Investigador: "ciencia de datos",
  Artistico: "diseno grafico",
  Social: "psicologia",
  Emprendedor: "ingenieria comercial",
  Convencional: "contabilidad",
};

const PALABRAS_CLAVE_AREA: Record<AreaRIASEC, string[]> = {
  Realista: ["ingenier", "mecanic", "constru", "electri", "industrial", "agronom", "logistic", "min"],
  Investigador: ["informat", "dato", "cient", "matemat", "fisic", "quimic", "biotec", "anal"],
  Artistico: ["diseno", "arquitect", "audiovis", "period", "arte", "publicidad", "animacion", "comunic"],
  Social: ["psicolog", "pedagog", "medicin", "enfermer", "kinesiolog", "terapia", "trabajo social", "educ"],
  Emprendedor: ["comercial", "negocio", "marketing", "derecho", "administracion", "empresa", "finanz", "relaciones"],
  Convencional: ["contab", "auditor", "gestion", "recursos humanos", "secret", "administrat", "control", "logistic"],
};

export const useTestVocacional = () => {
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<DatosUsuario>({ nombre: "", email: "", telefono: "" });
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [fraseIndex, setFraseIndex] = useState(0);
  
  const [perfilResult, setPerfilResult] = useState<PerfilResultado | null>(null);
  const [areaPredominante, setAreaPredominante] = useState<AreaRIASEC | null>(null);
  const [carrerasMatch, setCarrerasMatch] = useState<CarreraMatch[]>([]);
  const [carrerasDB, setCarrerasDB] = useState<CarreraDB[]>([]);
  const [institucionesDestacadas, setInstitucionesDestacadas] = useState<InstitucionDestacada[]>([]);
  const leadRegistradoRef = useRef(false);

  const preguntaActualIndex = paso - 3;
  const progresoTest = preguntaActualIndex >= 0 && preguntaActualIndex < PREGUNTAS.length 
    ? (preguntaActualIndex / PREGUNTAS.length) * 100 
    : 0;
  const preguntaActual = PREGUNTAS[preguntaActualIndex];

  useEffect(() => {
    if (paso === PREGUNTAS.length + 3) {
      const interval = setInterval(() => {
        setFraseIndex((prev) => (prev + 1) % FRASES_ANALISIS.length);
      }, 1500);

      const procesarAlgoritmoYBuscar = async () => {
        try {
          // 1. Algoritmo RIASEC real: mapear respuestas a su area de afinidad.
          const conteo: Record<AreaRIASEC, number> = {
            Realista: 0,
            Investigador: 0,
            Artistico: 0,
            Social: 0,
            Emprendedor: 0,
            Convencional: 0,
          };

          PREGUNTAS.forEach((pregunta) => {
            const opcionSeleccionadaId = respuestas[pregunta.id];
            if (!opcionSeleccionadaId) return;
            const opcion = pregunta.opciones.find((opt) => opt.id === opcionSeleccionadaId);
            if (opcion) conteo[opcion.areaAfinidad] += 1;
          });

          const ganador = (Object.keys(conteo) as AreaRIASEC[]).reduce((areaActual, areaNueva) =>
            conteo[areaNueva] > conteo[areaActual] ? areaNueva : areaActual
          );
          setAreaPredominante(ganador);

          const maxPuntos = conteo[ganador];
          const porcentajeAfinidad = Math.floor((maxPuntos / PREGUNTAS.length) * 30 + 68);
          const perfilDefinitivo: PerfilResultado = {
            ...PERFILES_RIASEC[ganador],
            afinidad: porcentajeAfinidad,
            keywordBuscador: KEYWORDS_POR_AREA[ganador],
          };
          
          setPerfilResult(perfilDefinitivo);

          const areasOrdenadas = (Object.keys(conteo) as AreaRIASEC[])
            .sort((a, b) => conteo[b] - conteo[a])
            .slice(0, 3);
          const queryDinamico = areasOrdenadas
            .map((area) => PERFILES_RIASEC[area].queryOr)
            .join(",");

          // 2. Fetch de datos usando el Servicio
          const data = await buscarCarrerasPorPerfil(queryDinamico);

          const carrerasUnicas: CarreraMatch[] = [];
          const instUnicas: InstitucionDestacada[] = [];

          if (data) {
            const dataNormalizada = (data as unknown as RegistroCarreraCrudo[]).map((item) => {
              const institucionesNormalizadas = Array.isArray(item.instituciones)
                ? item.instituciones
                : item.instituciones?.nombre
                  ? [{ nombre: item.instituciones.nombre, tipo: item.instituciones.tipo ?? null }]
                  : [];

              return {
                ...item,
                instituciones: institucionesNormalizadas,
              } as CarreraDB;
            });

            const nombresVistos = new Set<string>();
            const instVistas = new Set<string>();
            const ponderacionArea = (area: AreaRIASEC) => {
              if (areasOrdenadas[0] === area) return 1.15;
              if (areasOrdenadas[1] === area) return 1.06;
              if (areasOrdenadas[2] === area) return 1.02;
              return 1;
            };

            const carrerasRankeadas = dataNormalizada
              .map((item) => {
                const nombre = item.nombre_carrera.toLowerCase();
                let puntaje = 55;

                (Object.keys(PALABRAS_CLAVE_AREA) as AreaRIASEC[]).forEach((area) => {
                  const hits = PALABRAS_CLAVE_AREA[area].filter((kw) => nombre.includes(kw)).length;
                  if (hits > 0) {
                    puntaje += hits * 6 * ponderacionArea(area);
                  }
                });

                if (item.empleabilidad_1er_anio && item.empleabilidad_1er_anio > 0) {
                  puntaje += Math.min(item.empleabilidad_1er_anio / 4, 10);
                }

                return { ...item, match: Math.min(99, Math.max(65, Math.round(puntaje))) };
              })
              .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

            carrerasRankeadas.forEach((item) => {
              if (!nombresVistos.has(item.nombre_carrera) && carrerasUnicas.length < 3) {
                nombresVistos.add(item.nombre_carrera);
                carrerasUnicas.push({
                  carrera: item.nombre_carrera,
                  match: item.match ?? 75,
                });
              }
              const instName = item.instituciones?.[0]?.nombre;
              if (instName && !instVistas.has(instName) && instUnicas.length < 4) {
                instVistas.add(instName);
                instUnicas.push({
                  nombre: instName,
                  logo: instName.substring(0, 2).toUpperCase(),
                  tipo: item.instituciones?.[0]?.tipo,
                });
              }
            });

            setCarrerasMatch(carrerasUnicas);
            setCarrerasDB(carrerasRankeadas.slice(0, 12));
            setInstitucionesDestacadas(instUnicas);
            
            // 3. Guardar el Lead
            if (!leadRegistradoRef.current) {
              await guardarLead({
                datos,
                respuestas,
                perfil_asignado: ganador,
                carreras_sugeridas: carrerasRankeadas.slice(0, 5).map((c) => c.nombre_carrera),
              });
              leadRegistradoRef.current = true;
            }
          }
        } catch (error) {
          console.error("Error general procesando resultados:", error);
        } finally {
          setTimeout(() => {
            clearInterval(interval);
            setPaso(PREGUNTAS.length + 4);
          }, 3000); 
        }
      };

      procesarAlgoritmoYBuscar();
      return () => clearInterval(interval);
    }
  }, [paso, respuestas, datos]);

  const seleccionarOpcion = (idPregunta: number, idOpcion: string) => {
    setRespuestas(prev => ({ ...prev, [idPregunta]: idOpcion }));
    setTimeout(() => setPaso(prev => prev + 1), 350); 
  };

  const avanzar = () => setPaso(prev => prev + 1);

  return {
    paso,
    datos,
    setDatos,
    respuestas,
    seleccionarOpcion,
    avanzar,
    perfilResult,
    areaPredominante,
    carrerasMatch,
    carrerasDB,
    institucionesDestacadas,
    fraseIndex,
    progresoTest,
    preguntaActual,
    PREGUNTAS, // Exportamos constantes útiles para la UI
    FRASES_ANALISIS
  };
};