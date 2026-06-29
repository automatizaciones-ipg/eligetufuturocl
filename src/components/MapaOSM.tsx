import { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface MapaOSMProps {
  /** Coordenadas reales almacenadas (preferidas). Si existen, no se geocodifica. */
  lat?: number | string | null;
  lng?: number | string | null;
  /** Nombre de la institución (etiquetas y enlace a Google Maps). */
  nombre: string;
  /** Dirección real (SIES "Dirección Sede Central") para mostrar en la vista previa. */
  direccion?: string | null;
  /** Búsqueda de respaldo cuando NO hay coordenadas almacenadas. */
  query?: string;
  altura?: string;
}

/**
 * Mapa con patrón "facade": muestra una vista previa ligera (sin cargar mapa) y
 * monta el mapa interactivo de OpenStreetMap SOLO al hacer clic. Prioriza las
 * coordenadas reales almacenadas en Supabase (geocodificadas desde la dirección
 * SIES); si no existen, geocodifica por nombre como último recurso, también
 * diferido hasta el clic.
 */
export default function MapaOSM({ lat, lng, nombre, direccion, query, altura = 'h-72' }: MapaOSMProps) {
  // Coordenadas almacenadas, parseadas de forma segura (Supabase puede devolver string).
  const coordsAlmacenadas = useMemo(() => {
    const la = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lo = typeof lng === 'string' ? parseFloat(lng) : lng;
    if (typeof la === 'number' && typeof lo === 'number' && !Number.isNaN(la) && !Number.isNaN(lo)) {
      return { lat: la, lng: lo };
    }
    return null;
  }, [lat, lng]);

  const [activo, setActivo] = useState(false);                 // mapa interactivo montado
  const [resuelto, setResuelto] = useState(coordsAlmacenadas); // coords finales a usar
  const [geocodando, setGeocodando] = useState(false);
  const [geoError, setGeoError] = useState(false);

  // Respaldo: si no hay coords almacenadas, geocodificar por nombre SOLO al activar.
  useEffect(() => {
    if (coordsAlmacenadas || !activo || resuelto || !query) return;
    let cancel = false;
    setGeocodando(true);
    setGeoError(false);

    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=cl`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await res.json();
        if (cancel) return;
        if (data?.[0]) setResuelto({ lat: +data[0].lat, lng: +data[0].lon });
        else setGeoError(true);
      } catch {
        if (!cancel) setGeoError(true);
      } finally {
        if (!cancel) setGeocodando(false);
      }
    })();

    return () => { cancel = true; };
  }, [activo, coordsAlmacenadas, resuelto, query]);

  const destino = resuelto || coordsAlmacenadas;

  const googleUrl = destino
    ? `https://www.google.com/maps/search/?api=1&query=${destino.lat},${destino.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || nombre)}`;

  const embedSrc = useMemo(() => {
    if (!destino) return null;
    const d = 0.006; // ~650 m de radio visible
    const bbox = `${destino.lng - d},${destino.lat - d},${destino.lng + d},${destino.lat + d}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${destino.lat},${destino.lng}`;
  }, [destino]);

  // ── ESTADO A: mapa interactivo cargado ──────────────────────────────────────
  if (activo && embedSrc) {
    return (
      <div className={`w-full ${altura} rounded-3xl overflow-hidden border border-gray-200 relative shadow-inner bg-gray-50`}>
        <iframe
          title={`Mapa de ${nombre}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={embedSrc}
        />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-3xl" />
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#6544FF] px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors inline-flex items-center gap-1"
        >
          Google Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // ── ESTADO B: clic hecho, geocodificando el respaldo ─────────────────────────
  if (activo && geocodando) {
    return (
      <div className={`w-full ${altura} bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center gap-2`}>
        <MapPin className="w-8 h-8 text-[#6544FF]/40 animate-pulse" />
        <p className="text-xs text-gray-400">Ubicando institución…</p>
      </div>
    );
  }

  // ── ESTADO C: sin ubicación posible → enlace a Google Maps ───────────────────
  if (activo && (geoError || !embedSrc)) {
    return (
      <div className={`w-full ${altura} bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center justify-center gap-3 px-4 text-center`}>
        <MapPin className="w-8 h-8 text-[#6544FF]/50" />
        <p className="text-xs text-gray-400 max-w-xs">No pudimos cargar el mapa embebido para esta institución.</p>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#6544FF] hover:underline inline-flex items-center gap-1"
        >
          Ver en Google Maps <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // ── ESTADO 0: FACADE — vista previa ligera (no carga el mapa hasta el clic) ───
  return (
    <button
      type="button"
      onClick={() => setActivo(true)}
      aria-label={`Cargar mapa interactivo de ${nombre}`}
      className={`group w-full ${altura} rounded-3xl border border-gray-200 relative overflow-hidden text-left bg-[#F4F5F9] transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6544FF]/50`}
    >
      {/* Textura tipo mapa (CSS puro, cero peticiones de red) */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        aria-hidden="true"
        style={{
          backgroundColor: '#EDEBFF',
          backgroundImage:
            'linear-gradient(#d9d4ff 1px, transparent 1px), linear-gradient(90deg, #d9d4ff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        className="absolute -inset-10 opacity-40"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 30% 40%, rgba(101,68,255,0.18), transparent 45%), radial-gradient(circle at 75% 70%, rgba(148,123,255,0.16), transparent 45%)',
        }}
      />

      {/* Pin central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <span className="relative flex items-center justify-center">
          <span className="absolute w-12 h-12 rounded-full bg-[#6544FF]/15 animate-ping" />
          <span className="relative w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-[#6544FF]/20">
            <MapPin className="w-6 h-6 text-[#6544FF]" />
          </span>
        </span>
      </div>

      {/* CTA inferior + dirección */}
      <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3 bg-gradient-to-t from-white/95 via-white/70 to-transparent">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#6544FF]/70">Ubicación</p>
          <p className="text-xs font-semibold text-[#1A1528] truncate" title={direccion || nombre}>
            {direccion || nombre}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 bg-[#6544FF] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md group-hover:bg-[#5436e0] transition-colors">
          <Navigation className="w-3.5 h-3.5" />
          Ver mapa
        </span>
      </div>
    </button>
  );
}
