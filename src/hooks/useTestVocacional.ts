// src/hooks/useTestVocacional.ts
import { useState, useEffect } from "react";
import { PERFILES_VOCACIONALES, PREGUNTAS, FRASES_ANALISIS } from "../data/vocacionalData";
import { buscarCarrerasPorPerfil, guardarLead } from "../services/vocacionalService";

export const useTestVocacional = () => {
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState({ nombre: "", email: "", telefono: "" });
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [fraseIndex, setFraseIndex] = useState(0);
  
  const [perfilResult, setPerfilResult] = useState<any>(null);
  const [carrerasMatch, setCarrerasMatch] = useState<any[]>([]);
  const [institucionesDestacadas, setInstitucionesDestacadas] = useState<any[]>([]);

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
          // 1. Algoritmo de Puntuación
          const conteo: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
          Object.values(respuestas).forEach(res => { conteo[res] += 1; });
          
          const ganador = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
          const maxPuntos = conteo[ganador];
          const porcentajeAfinidad = Math.floor((maxPuntos / PREGUNTAS.length) * 30 + 68); 
          const perfilDefinitivo = { ...PERFILES_VOCACIONALES[ganador as keyof typeof PERFILES_VOCACIONALES], afinidad: porcentajeAfinidad };
          
          setPerfilResult(perfilDefinitivo);

          // 2. Fetch de datos usando el Servicio
          const data = await buscarCarrerasPorPerfil(perfilDefinitivo.queryOr);

          let carrerasUnicas: any[] = [];
          let instUnicas: any[] = [];

          if (data) {
            const nombresVistos = new Set();
            const instVistas = new Set();

            data.forEach((item: any) => {
              if (!nombresVistos.has(item.nombre_carrera) && carrerasUnicas.length < 3) {
                nombresVistos.add(item.nombre_carrera);
                carrerasUnicas.push({
                  carrera: item.nombre_carrera,
                  match: Math.max(80, perfilDefinitivo.afinidad - carrerasUnicas.length * 3)
                });
              }
              const instName = item.instituciones?.nombre;
              if (instName && !instVistas.has(instName) && instUnicas.length < 4) {
                instVistas.add(instName);
                instUnicas.push({ nombre: instName, logo: instName.substring(0, 2).toUpperCase() });
              }
            });

            setCarrerasMatch(carrerasUnicas);
            setInstitucionesDestacadas(instUnicas);
            
            // 3. Guardar el Lead
            await guardarLead({
              nombre: datos.nombre,
              correo: datos.email,
              telefono: datos.telefono,
              respuestas,
              perfil_asignado: perfilDefinitivo.titulo,
              carreras_sugeridas: carrerasUnicas.map(c => c.carrera)
            });
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
    setTimeout(() => setPaso(paso + 1), 350); 
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
    carrerasMatch,
    institucionesDestacadas,
    fraseIndex,
    progresoTest,
    preguntaActual,
    PREGUNTAS, // Exportamos constantes útiles para la UI
    FRASES_ANALISIS
  };
};