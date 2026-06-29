# Enriquecimiento de instituciones (ubicación + detalles)

Pipeline ETL que llena, para cada institución, su **ubicación real** (mapa) y sus
**detalles destacados** (fundación, sedes, modalidades, contacto, redes), que se
muestran en `/institucion/[id]` arriba del mapa y antes de la descripción.

No scrapeamos Google Maps (ToS/frágil): geocodificamos la **dirección real** del
SIES y extraemos detalles del **sitio oficial** con Firecrawl. Legal, preciso y
reproducible.

## Requisitos (una sola vez)

```bash
pip install pandas python-dotenv supabase requests openpyxl
```

Credenciales en el `.env` de la **raíz del repo** (los scripts lo cargan solos):

- Supabase: usan `SUPABASE_URL`/`SUPABASE_KEY` y, si no existen, caen a
  `PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (lo que ya tienes).
- Firecrawl: agrega `FIRECRAWL_API_KEY=fc-...` (crea la key en
  https://www.firecrawl.dev → API Keys).

## Paso 1 — Migraciones (SQL Editor de Supabase)

Pega y ejecuta, en orden, el contenido de:

1. `migracion_geocoding_instituciones.sql` → columnas `latitud`, `longitud`, `direccion`
2. `migracion_detalles_firecrawl.sql` → columnas `detalles` (jsonb), `sitio_web`, `detalles_actualizado`

> La página hace `SELECT *`, así que estas columnas llegan solas al frontend.

## Paso 2 — Detalles del sitio oficial (Firecrawl)

```bash
cd src/datos_et
python enriquecer_instituciones_firecrawl.py --limite 5     # prueba; revisa en Supabase
python enriquecer_instituciones_firecrawl.py                # todas las que faltan (modo rápido)
# Máxima precisión (rastrea todo el sitio; +créditos, más lento):
python enriquecer_instituciones_firecrawl.py --profundo
```

Extrae: `anio_fundacion`, `numero_sedes`, `ciudades`, `direccion_exacta`,
`modalidades`, `telefono_admision`, `email_admision`, redes
(`instagram`/`facebook`/`linkedin`/`youtube`/`twitter`), `eslogan`.

## Paso 3 — Geocodificar (ubicación del mapa)

```bash
python geocodificar_instituciones.py        # solo las que faltan
python geocodificar_instituciones.py --refrescar   # recalcular todas
```

Prioriza `direccion_exacta` (si Firecrawl ya la obtuvo) sobre la dirección SIES,
valida que la coordenada caiga dentro de Chile y respeta el límite de Nominatim
(1 req/seg). Por eso **conviene correr el Paso 2 antes del 3**: la dirección del
sitio suele ser más precisa que la del Excel.

## Notas

- **Idempotente y reanudable**: ambos scripts procesan solo lo que falta; si los
  cortas, los retomas sin repetir trabajo. Usa `--refrescar` para rehacer todo.
- **Costos**: Firecrawl cobra créditos por página + extracción LLM. Controla el
  gasto con `--limite`. El modo `--profundo` consume bastante más.
- **Render resiliente**: cada campo es opcional. Si una institución solo tiene
  Instagram y teléfono, se muestra solo eso; si no hay nada, el bloque no aparece.
- **Si la extracción vuelve vacía** en muchas instituciones, prueba `--profundo`;
  si persiste, puede ser un cambio de versión de la API de Firecrawl: avísame y
  ajusto el endpoint (`/v1/scrape` ↔ `/v2` `json`/`jsonOptions`).
