# CLAUDE.md

Guía para agentes de IA (Claude Code) que trabajen en este repositorio. Resume
la arquitectura, convenciones y comandos del proyecto **Elige Tu Futuro**.

## Qué es este proyecto

Plataforma web de **orientación vocacional para estudiantes en Chile** (Admisión
2026). Incluye test vocacional (modelo RIASEC), buscador de carreras e
instituciones con datos del SIES/MINEDUC, calculadora de puntaje PAES/NEM,
calendario de admisión, guía de becas/FUAS, mercado laboral y noticias.

- **Producción:** https://eligetufuturo.cl
- **Idioma del producto y del código/comentarios:** español (es-CL).

## Stack tecnológico

- **Astro 6** (`output: 'server'`, adapter `@astrojs/node` standalone) — SSR + islas.
- **React 19** para componentes interactivos (islas hidratadas).
- **Tailwind CSS 4** (config inline en `src/styles/global.css`, sin `tailwind.config.js`) + **daisyUI 5** + `tailwindcss-animate`.
- **Supabase** (PostgreSQL) como base de datos.
- **Resend** para correos transaccionales.
- **lucide-react** (íconos), **react-markdown** (render de noticias).
- **TypeScript** estricto (`astro/tsconfigs/strict`).

## Comandos

| Comando | Acción |
| :-- | :-- |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción a `./dist/` (¡consulta Supabase en build!) |
| `npm run preview` | Previsualiza el build |
| `npm start` | Arranca el servidor Node de producción (`dist/server/entry.mjs`) |

> ⚠️ `npm run build` prerenderiza `/carrera/[id]` e `/institucion/[id]` para
> **todos** los registros, por lo que consulta Supabase y puede tardar. Requiere
> variables de entorno válidas (ver abajo).

## Estructura del proyecto

```
src/
├── pages/                    # Rutas (file-based routing de Astro)
│   ├── index.astro           # Home
│   ├── noticias.astro        # Listado de noticias
│   ├── noticia/[id].astro    # Detalle noticia (SSR, prerender:false)
│   ├── carrera/[id].astro    # Detalle carrera (SSG vía getStaticPaths)
│   ├── institucion/[id].astro# Detalle institución (SSG vía getStaticPaths)
│   ├── herramientas/*.astro  # Test, buscador, calculadora, calendario, fuas, etc.
│   ├── contacto/ · terminos-y-condiciones/
│   ├── sitemap.xml.ts        # Sitemap dinámico (prerender) desde Supabase
│   └── api/                  # Endpoints POST (contacto, leads, marketing)
├── components/               # Islas React (.tsx) + .astro (NavBar, Seo, Analytics)
├── layouts/Layout.astro      # Layout global: <head> + Header + Footer
├── lib/
│   ├── seo.ts                # Config central SEO/GEO + constructores JSON-LD
│   ├── resend.ts             # Cliente y config de Resend
│   ├── emails/               # brand.ts, layout.ts, templates/* (HTML de correos)
│   └── api/validators.ts     # Validación de formularios (email/teléfono)
├── services/vocacionalService.ts  # Consultas Supabase + guardado de leads
├── hooks/useTestVocacional.ts     # Lógica del test (algoritmo RIASEC)
├── data/vocacionalData.tsx        # Preguntas, perfiles RIASEC, frases
├── types/ · types.ts              # Modelos: CarreraDB, Noticia, vocacional...
├── utils/formatters.ts            # Siglas, tipos de institución, slugs de logo
├── datos_et/                      # Scripts Python ETL (SIES → Supabase). NO se despliega.
├── lib/admin/session.ts           # Cookie de sesión del panel admin (HMAC)
├── lib/scraper/                   # Motor de scraping de tendencias (ver sección propia)
└── styles/global.css              # Tailwind + daisyUI + Google Fonts

lib/                          # Clientes Supabase (¡en la RAÍZ, no en src/!)
├── supabase.ts               # Cliente anon (browser/SSG)
└── supabaseServer.ts         # Cliente service-role (APIs server)

public/                       # Assets estáticos: logos, robots.txt, sitemap, llms.txt, manifest
```

> ⚠️ **Ojo con los dos `lib/`:** el cliente de Supabase vive en `lib/` de la
> **raíz** (`import { supabase } from "../../lib/supabase"`), mientras que la
> lógica de la app (SEO, emails, validators) vive en `src/lib/`.

## Datos y modelo (Supabase)

Tablas principales:

- **`carreras`** — `codigo_carrera`, `codigo_institucion`, `nombre_carrera`,
  `region`, `jornada`, `sede`, `arancel_anual`, `duracion_semestres`,
  `empleabilidad_1er_anio`, `ingreso_promedio_4to_anio`, `descripcion`,
  `acreditacion_carrera`. FK a `instituciones`.
- **`instituciones`** — `codigo_institucion`, `nombre`, `tipo`, `logo_url`,
  `descripcion`, acreditación, gratuidad.
- **`noticias`** — campos en **snake_case** en BD (`imagen_principal`,
  `cuerpo_markdown`, `created_at`...), mapeados a camelCase en el front
  (ver `src/types/noticia.ts`).
- **`leads_vocacional`** — INSERT de resultados del test.

Los datos se cargan con los scripts Python de `src/datos_et/` (procesan excels
SIES/MINEDUC y los inyectan a Supabase). No forman parte del runtime web.

- **Códigos como segmento de URL:** la ingesta SIES a veces cuela datos basura
  en `codigo_carrera`/`codigo_institucion` (p.ej. notas al pie tipo "FUENTE:
  Portal mifuturo.cl..."), que rompen el build en Windows (`:` ilegal en
  carpetas) y generan URLs basura en producción/sitemap. `esCodigoRutaValido()`
  (`src/utils/formatters.ts`) filtra estos códigos antes de generar rutas —se
  usa en `src/pages/carrera/[id].astro`, `src/pages/institucion/[id].astro` y
  `src/pages/sitemap.xml.ts`. Si tocas cualquiera de esos tres archivos,
  revisa que sigan llamando al validador.

## Simulador de Admisión (`/herramientas/calculadora`)

`src/components/CalculadoraNem.tsx` (isla React, `client:visible`) es el
simulador: el alumno ingresa notas (obligatorio) + PAES (dos secciones
opcionales con switch — obligatorias CL/M1 y electivas M2/Historia/Ciencias),
y por cada carrera ve su **puntaje ponderado real** y un **veredicto "¿te
alcanza?"**. Todo el recálculo es client-side (las notas/PAES nunca disparan
consultas; sólo búsqueda/filtro/paginación pegan a Supabase).

**Tres capas de datos, todas como JSON estático en `public/data/` (stopgap
mientras no viven en Supabase), cargadas con `fetch` una vez y resueltas por
fila con degradado con gracia:**

1. **Ponderaciones** (`ponderaciones_carreras.json`) — fórmula oficial SIES por
   carrera. Genera: `exportar_ponderaciones_json.py` (+ `generar_claves_necesarias.py`).
   Match difuso de 2 niveles (institución+carrera+jornada+sede / respaldo
   institución+carrera) vía `limpiarTextoMatch` — **debe dar EXACTO el mismo
   resultado que el `limpiar_texto` de los scripts Python**.
2. **Referencia de ingreso** (`referencia_ingreso.json`) — *promedio* PAES/NEM de
   los admitidos 2025 (SIES/MINEDUC). Genera: `exportar_referencia_ingreso_json.py`
   desde `clean/carreras_bd_lista.json`, **join DIRECTO por `codigo_carrera`**
   (sin fuzzy). Alimenta el veredicto v1 "sobre/bajo el promedio" (verde/ámbar) —
   es un promedio, NO un corte, por eso **nunca** marca rojo "no alcanzas".
3. **Cortes** (`cortes_carreras.json`) — *último seleccionado/matriculado*
   ponderado por año (histórico 2024/2025/2026). Alimenta el veredicto duro
   **rojo "te faltan X pts" / verde "te alcanza" + histórico**
   (`resolverCorte`/`computarVeredictoCorte`), match difuso igual que
   ponderaciones. Dos generadores:
   - `scrape_cortes_universidades.py` (**el que se usa**): cosecha el "puntaje
     último matriculado/seleccionado" de las páginas OFICIALES de cada
     universidad (registro `UNIVERSIDADES`, soporta tabla multi-año o páginas
     por-año) y matchea a nuestras carreras. La fuente comprehensiva (bases
     DEMRE) está tras **reCAPTCHA** → no scrapeable; por eso se va universidad
     por universidad → **cobertura parcial** (solo universidades que publican;
     IP/CFT y admisión propia quedan sin corte → caen al veredicto SIES).
   - `exportar_cortes_json.py` (alternativo): si se consigue una base DEMRE de
     Postulación/Matrícula (descarga manual, pasa el reCAPTCHA), la ingesta a
     cortes completos. Listo pero requiere el archivo en `raw/`.
   Ojo UX: la búsqueda del simulador trae ~30 carreras por nombre, así que
   carreras de universidades con corte pueden no surfacear — mejorar el ranking
   para que los cortes sean visibles es pendiente.

Prioridad del veredicto por tarjeta: **corte DEMRE** (si existe) → **promedio
SIES** → "sin referencia". Los tres JSON degradan a nulo si faltan (la carrera
igual carga, sólo sin ese dato). El `puntaje_corte_referencial`/`_anio`/`_fuente`
de `migracion_ponderaciones_carreras.sql` es el destino "definitivo" para cuando
esto migre a columnas de Supabase.

**Paginación de resultados:** siempre 9 tarjetas por página con barra numerada
(no hay "Cargar más" acumulativo). La página visible es un slice cliente-side
de la lista filtrada/ordenada; `limite` (ventana cruda de Supabase) crece solo
hasta llenar la página actual, con la guarda `ventanaCompleta` para no re-actuar
durante la ventana del debounce (300ms) en que el fetch aún no marca `cargando`
— sin ella, la autocarga se dispara al tope y el snap-back devuelve falsamente
a la página 1. El comparador destaca el mejor valor por fila (solo sin empate)
y agrega fila de veredicto y link a ficha.

## Convenciones

- **Islas React:** usa directivas de hidratación según la necesidad:
  `client:load` (crítico/above-the-fold), `client:visible` (below-the-fold),
  `client:only="react"` (cuando el componente solo se renderiza en cliente).
- **Estilos:** Tailwind con *arbitrary values* y la paleta de marca por color
  literal. No hay tokens en un `tailwind.config.js`. Colores de marca:
  - Primario `#6544FF` · Primario claro `#947BFF` · Texto `#1A1528`
  - Fondos claros `#F4F5F9` / `#FAFAFA` · Footer `#130E24`
- **Validación de formularios:** reutiliza `src/lib/api/validators.ts`
  (`EMAIL_REGEX`, `PHONE_REGEX`, `validarEmail`, `validarTelefono`, `jsonResponse`).
- **Correos:** todo HTML de email se construye con los helpers de
  `src/lib/emails/layout.ts` y la marca de `brand.ts`; no inserts HTML ad-hoc.
- **APIs:** endpoints en `src/pages/api/*` son POST y devuelven `jsonResponse`.
  Para acceso server a Supabase usa `getSupabaseServerClient()` (service-role).

## SEO / GEO

- **Toda página** debe renderizarse con `Layout.astro`, que incluye
  `components/Seo.astro`. Pasa props de SEO al Layout:
  `title` (obligatorio), `description`, `image`, `canonical`, `type`,
  `noindex`, `jsonLd` (array de objetos Schema.org), `article`.
- **Config central:** `src/lib/seo.ts` (marca, defaults, helpers de JSON-LD:
  `organizationSchema`, `webSiteSchema`, `breadcrumbSchema`, `faqSchema`,
  `courseSchema`, `educationalOrgSchema`, `newsArticleSchema`).
- Al crear páginas nuevas: añade `description` única (~155 car.), `jsonLd`
  relevante (FAQ/Breadcrumb como mínimo) y, si aplica, súmala a
  `STATIC_ROUTES` en `src/pages/sitemap.xml.ts`.
- Archivos GEO/SEO en `public/`: `robots.txt`, `site.webmanifest`, `llms.txt`.
  Mantén `llms.txt` y el sitemap al día cuando cambien secciones del sitio.

## Analítica

`components/Analytics.astro` (incluido en el Layout) carga **GA4** y
**Microsoft Clarity** (heatmaps + grabaciones). Se activan solo si existen las
variables `PUBLIC_GA_MEASUREMENT_ID` y `PUBLIC_CLARITY_PROJECT_ID`. Los
page_views SPA se reenvían en `astro:page-load`.

## Middleware (`src/middleware.ts`)

Corre en **todas** las requests y agrupa tres responsabilidades sin relación
entre sí — no asumas que solo hace una cosa al tocarlo:

1. **Gate del panel admin:** ver sección propia abajo.
2. **Rate limiting:** 10 peticiones `POST` a `/api/*` por IP por ventana de 1
   minuto, en un `Map` en memoria (`rlStore`) purgado cada 5 min. Igual que el
   `jobRunner` del scraper, asume **una sola instancia Node** — no sobrevive a
   despliegues multi-proceso ni horizontal scaling. Responde `429` con headers
   `Retry-After` / `X-RateLimit-*`.
3. **Headers de seguridad + CSP:** aplica `X-Frame-Options`,
   `Strict-Transport-Security`, `Permissions-Policy` y una Content-Security-Policy
   a toda respuesta. La CSP tiene un allowlist explícito de orígenes externos
   (GA4, Clarity, Supabase, Google Fonts, OpenStreetMap/Nominatim para el mapa
   de la ficha de institución). **Si agregas un script, fuente o API externa
   nueva, súmala aquí o el navegador la bloqueará en silencio.**

## Panel admin oculto de tendencias (`/admin/tendencias`)

Herramienta interna (un solo operador) que corre el scraper de demanda de
búsqueda de carreras (Google Autocomplete + Google Trends, Chile) y alimenta
la página pública `/tendencias`. **No es parte del producto orientado a
estudiantes** — es un panel de decisión de negocio, oculto y autenticado.

- **Auth:** cookie HMAC firmada (`src/lib/admin/session.ts`), sin usuarios ni
  roles — una sola `ADMIN_PASSWORD`. Gate centralizado en `src/middleware.ts`
  para `/admin/**` y `/api/admin/**` (`/admin/login` queda abierta). Defensa
  adicional: `noindex` en las páginas admin + `Disallow: /admin/` en
  `robots.txt` (la auth real es la cookie, no la ocultación).
- **Motor de scraping:** `src/lib/scraper/*.ts` (autocomplete, trends,
  normalize, build, pipeline) — puerto TypeScript sin dependencias nuevas
  (usa `fetch` nativo). `pipeline.ts` persiste cada corrida en Supabase
  (tablas `scraping_runs`, `scraping_careers`, `scraping_intenciones`,
  `scraping_preguntas`, `scraping_respuestas_bank`, `tendencias_config`) —
  ver `supabase/migrations/0001_scraping_tendencias.sql` para el esquema y
  las políticas RLS.
- **Job runner:** `src/lib/scraper/jobRunner.ts` mantiene el estado del
  scraping en curso en memoria (asume una sola instancia Node, igual que el
  rate-limiter de `src/middleware.ts`). El botón "Iniciar scraping" dispara
  `POST /api/admin/tendencias/scrape/start` y hace polling a `.../scrape/status`.
- **Publicación:** `/tendencias` (público) lee con el cliente **anon** la
  corrida marcada en `tendencias_config.published_run_id`, protegida por RLS
  (solo expone la corrida publicada, y solo preguntas con `respuesta` +
  `aprobada = true`). Publicar una corrida nueva es mover ese puntero — nunca
  se borran corridas anteriores (histórico completo para futuro momentum
  año-contra-año).
- Antes de esta migración, `/tendencias` leía un JSON estático a mano
  (`src/data/tendencias_busqueda.json`); ya no se usa.

## Cron semanal de noticias IA (`/api/cron/noticias`)

Publica automáticamente, cada viernes 16:00 (hora Chile), un artículo de tips
para estudiantes ("new age": lectura rápida, técnicas de estudio modernas,
herramientas de IA, productividad) en la tabla `noticias` — sin intervención
manual, `estado = 'activado'` desde el momento en que se inserta.

- **Disparo:** `.github/workflows/cron-noticias.yml` (schedule + `workflow_dispatch`
  para pruebas manuales) hace un `POST` autenticado con secreto compartido
  (`Authorization: Bearer $NOTICIAS_CRON_SECRET`) a `/api/cron/noticias`. Vive
  fuera de `/api/admin/**` a propósito: ese árbol lo protege el middleware con
  cookie de sesión HMAC, que un workflow de GitHub Actions no puede sostener.
- **Motor:** `src/lib/noticiasIA/*.ts` — puerto TypeScript sin dependencias
  nuevas (usa `fetch` nativo, igual que `src/lib/scraper/*`). `pipeline.ts`
  orquesta: generación del artículo con Claude (`anthropic.ts`, Anthropic
  Messages API con `output_config.format` para forzar JSON estricto) → imágenes
  vía Unsplash Search API (`unsplash.ts`) → `enlaces_referencia` armados desde
  un banco curado (`enlaces.ts`, **nunca** URLs inventadas por el LLM) →
  `color` resuelto por una allow-list fija (`categorias.ts`, nunca una clase
  CSS generada por el modelo) → `tiempo_lectura` calculado por conteo de
  palabras (`readingTime.ts`, no se confía en el número que devuelva el LLM).
- **Idempotencia:** `noticias_ia_runs` (ver
  `supabase/migrations/0002_noticias_ia.sql`) tiene `iso_week` `unique` — si el
  workflow se dispara dos veces la misma semana, la segunda corrida detecta el
  conflicto y aborta antes de gastar llamadas a Anthropic/Unsplash.
- Requiere `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY` y `NOTICIAS_CRON_SECRET`
  configuradas tanto en Hostinger (el servidor que corre el endpoint) como en
  los secrets de GitHub Actions del repo (el workflow que lo dispara).

## Leads → n8n → Bitrix24 + Google Sheets

Todo lead o consulta que entra por los endpoints públicos se notifica a un
**Webhook de n8n** (`N8N_LEADS_WEBHOOK_URL`, autenticado con
`Authorization: Bearer <N8N_LEADS_WEBHOOK_SECRET>`); es n8n quien centraliza,
en su propio workflow (fuera de este repo), la escritura tanto en la hoja
`Leads` de la planilla de CRM como en el funnel de Bitrix24. **Las
credenciales de Google Sheets y de Bitrix24 nunca están en este repo** —
viven enteramente en el credential store de n8n; el sitio solo conoce la URL
del webhook y el secreto compartido.

- **Módulo:** `src/lib/leads/` — `n8nWebhook.ts` (cliente mínimo `fetch` para
  el webhook, sin dependencias nuevas) + `registrarLead.ts` (esquema
  unificado `LeadParaCRM`, sanitización y registro vía
  `registrarLeadEnCRM`).
- **Puntos de captura (server-side, todos):** `/api/contacto`
  (`contacto_web`), `/api/solicitar-informacion` (`test_vocacional` si
  tipo=auto, `asesoria_test` si tipo=contacto) y `/api/solicitud-lead`
  (`solicitud_carrera` / `solicitud_institucion`). Se llama **después de
  validar y antes de enviar correos**: si Resend falla, el lead igual queda
  capturado. Si agregas un endpoint nuevo que reciba leads, llama a
  `registrarLeadEnCRM` ahí también.
- **Nunca bloquea:** `registrarLeadEnCRM` es fire-and-forget, jamás lanza;
  con las env sin configurar solo avisa una vez por `console.warn` y sigue.
  Un reintento con backoff de 2 s; el error final se loguea **sin PII**.
- **Seguridad:** secreto solo server-side (sin `PUBLIC_`), auth por header
  `Authorization: Bearer` (misma convención que `NOTICIAS_CRON_SECRET`,
  validado en n8n con su credencial nativa "Header Auth"); caracteres de
  control eliminados y campos truncados a 1500 chars; teléfono normalizado a
  `+569XXXXXXXX`; `idEvento` UUID por notificación para dedup en n8n/Bitrix;
  el rate limiting del middleware ya cubre estos endpoints. El escape
  anti-inyección-de-fórmulas (apóstrofo ante `= + - @`) **no** se aplica en
  el sitio — se haría en el propio workflow de n8n, justo antes del nodo que
  escribe a Google Sheets (aplicarlo aquí ensuciaría el mismo valor que
  también llega a Bitrix).
- El insert client-side a `leads_vocacional` (`guardarLead`) no toca el
  webhook: el mismo lead del test entra por `/api/solicitar-informacion`
  tipo=auto, que dispara `ResultadosTest.tsx` al mostrar resultados.

## Variables de entorno

Ver `.env.example`. Claves: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`RESEND_TO_EMAIL`, `PUBLIC_SITE_URL`, `MARKETING_API_SECRET`,
`PUBLIC_GA_MEASUREMENT_ID`, `PUBLIC_CLARITY_PROJECT_ID`, `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET` (estas dos últimas para `/admin/tendencias`),
`ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `NOTICIAS_CRON_SECRET` (estas tres
para el cron de noticias IA, ver sección propia arriba),
`N8N_LEADS_WEBHOOK_URL` y `N8N_LEADS_WEBHOOK_SECRET` para la notificación de
leads a n8n (ver sección propia arriba). **Nunca** subas `.env`.

## Despliegue

**Hostinger conectado al repo:** al hacer `git push` a `main`, Hostinger
ejecuta el build y publica automáticamente. No hay `wrangler.jsonc` en el
repo. Sí existe `.github/workflows/cron-noticias.yml`, pero **no** hace build
ni deploy — solo dispara un `POST` HTTP semanal contra el servidor ya
desplegado (ver "Cron semanal de noticias IA" arriba); el pipeline de
despliegue real sigue siendo exclusivamente Hostinger.

> ⚠️ **Variables de entorno:** las `PUBLIC_*` (GA, Clarity, Supabase URL/anon)
> se incrustan **en tiempo de build**. Deben estar configuradas en el panel de
> Hostinger, no solo en el `.env` local, o no llegarán a producción. Verificado
> (jun 2026): GA `G-HF4EB7BF87` carga 200 OK; el tag de Clarity `xabvto7lvq`
> devuelve **503** desde `clarity.ms` → revisar el Project ID en el dashboard de
> Clarity (no es un bug de código).

## Notas / deuda técnica conocida

- No hay tests automatizados ni linter configurado. El "test" antes de
  fusionar es `npm run build` (si pasa, no se rompió nada grave) + revisión
  manual en `npm run dev`.
- `supabase/migrations/0001_scraping_tendencias.sql` debe correrse a mano en
  el SQL Editor del proyecto Supabase de producción (el conector MCP de
  Supabase disponible en este entorno no apunta al proyecto de
  eligetufuturo.cl). Hasta que se corra, `/tendencias` y `/admin/tendencias`
  muestran estado vacío ("Estamos calculando tendencias" / sin corridas).
- El momentum de Google Trends usa un endpoint no oficial (`src/lib/scraper/trends.ts`);
  puede devolver 429 o cambiar de formato sin aviso — el pipeline ya degrada
  con gracia (`estado: 'sin dato'`) si Trends falla, la demanda de Autocomplete
  sigue funcionando igual.
