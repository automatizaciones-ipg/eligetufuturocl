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

## Variables de entorno

Ver `.env.example`. Claves: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`RESEND_TO_EMAIL`, `PUBLIC_SITE_URL`, `MARKETING_API_SECRET`,
`PUBLIC_GA_MEASUREMENT_ID`, `PUBLIC_CLARITY_PROJECT_ID`. **Nunca** subas `.env`.

## Despliegue

GitHub Actions (`.github/workflows/deploy.yml`): en push a `main` hace
`npm ci && npm run build` y sube `./dist/` por **FTP a Hostinger**.

> ⚠️ **Inconsistencia conocida de target:** el repo tiene `output: 'server'`
> (adapter Node) y a la vez un `wrangler.jsonc` (Cloudflare), pero el deploy
> real es **FTP estático a Hostinger**. Las páginas SSR (p. ej. `/api/*` y
> `/noticia/[id]` con `prerender:false`) **no se ejecutan** en hosting estático.
> Si una tarea toca el despliegue, aclara el target con el responsable antes de
> asumir SSR.

## Notas / deuda técnica conocida

- Enlaces rotos en `Footer.tsx`: apuntan a `/informacion/*` e `/instituciones`
  que **no existen** como rutas (lo correcto es `/herramientas/*`).
- No hay tests automatizados ni linter configurado.
