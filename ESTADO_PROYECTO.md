# ResQPet — Estado del Proyecto

**CRM para protectoras de animales + Portal Público + Landing Page**  
Última actualización: junio 2026  
Repositorio: https://github.com/dporti/resqpets

---

## URLs de acceso (desarrollo local)

| Servicio | URL | Puerto |
|----------|-----|--------|
| **CRM** (gestión interna) | http://localhost:5173 | 5173 |
| **Portal público** | http://localhost:5174 | 5174 |
| **Landing page** | http://localhost:3000 | 3000 |
| **API Backend** | http://localhost:4000 | 4000 |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 18 + Express 4 + TypeScript 5 |
| Base de datos | PostgreSQL vía Supabase (pool Supavisor) |
| CRM Frontend | React 18 + Vite 5 + TypeScript 5 (state-machine routing) |
| Portal Público | React 18 + Vite 5 + TypeScript 5 + React Router v6 |
| Landing Page | Next.js 14 + Tailwind CSS + TypeScript 5 (App Router) |
| Autenticación | JWT propio (bcryptjs + jsonwebtoken) |
| Almacenamiento | Supabase Storage |
| IA | Anthropic Claude API (`claude-sonnet-4-6`) |
| Mapas | Leaflet + OpenStreetMap (sin token requerido) |
| PDF | jsPDF + QRCode |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Confetti | canvas-confetti |
| Gráficos | Recharts (CRM) |
| Calendario | @fullcalendar/react + plugins |
| SEO | react-helmet-async (portal) |
| Exportación | JSZip + html2canvas |
| Donaciones | Stripe.js (opcional, si hay claves configuradas) |
| Design System | ui-ux-pro-max skill (67 estilos, 96 paletas, 57 font pairings) |

---

## Configuración de entorno

### `backend/.env`
```
DATABASE_URL=postgresql://postgres.hbqazfsvktxhzhqfkwht:PASSWORD@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET=resqpet_jwt_super_secret_2024
JWT_EXPIRES_IN=8h
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://hbqazfsvktxhzhqfkwht.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### Arrancar el proyecto
```bash
# Backend (puerto 4000)
cd backend && npm run dev

# CRM frontend (puerto 5173)
cd frontend && npm run dev

# Portal público (puerto 5174)
cd portal && npm run dev

# Landing page (puerto 3000)
cd landing && npm run dev
```

### Ejecutar todas las migraciones (BD nueva)
```bash
cd backend
npx ts-node --transpile-only src/db/migrate.ts
npx ts-node --transpile-only src/db/migrate-v2.ts
npx ts-node --transpile-only src/db/migrate-v3.ts
npx ts-node --transpile-only src/db/migrate-v4.ts
npx ts-node --transpile-only src/db/migrate-v5.ts
npx ts-node --transpile-only src/db/migrate-v6.ts
npx ts-node --transpile-only src/db/migrate-v7.ts
npx ts-node --transpile-only src/db/migrate-v8.ts
npx ts-node --transpile-only src/db/migrate-v9.ts
npx ts-node --transpile-only src/db/migrate-v10.ts
npx ts-node --transpile-only src/db/migrate-v11.ts
npm run seed
```

### Ejecutar todos los seeds de datos
```bash
node scripts/seed-acogidas.js
node scripts/seed-voluntarios.js
node scripts/seed-sos.js
node scripts/seed-reportes.js
node scripts/seed-mensajes.js
node scripts/seed-calendario.js
node scripts/seed-donaciones.js
```

### Decisiones técnicas
- **Conexión Supabase**: pooler `aws-1-eu-north-1` puerto 6543 (IPv6 no disponible en dev)
- **Caché Vite**: `cacheDir` en `%TEMP%` fuera de Dropbox para evitar `EBUSY` en Windows
- **Plan demo**: todos los refugios están en plan `enterprise` para development
  (`UPDATE refugios SET plan_id='enterprise'`)

---

## Módulos CRM implementados (todos ✅)

### ✅ 1. Dashboard (`/inicio`)
- Stats: total animales, en acogida, en adopción, avisos activos
- Tabla animales recientes, gráfico donut distribución por estado
- Adopciones y donaciones del mes con sparkline y progreso hacia objetivo
- Actividad reciente, próximos eventos del calendario

### ✅ 2. Animales (`/animales`)
- Listado con filtros, paginación (20/página), chips sanitarios
- Detalle animal: galería + upload Supabase Storage, 6 tabs
- Tab Redes: generador copy Instagram vía Claude API
- Formulario crear/editar: slide-over con 5 tabs

### ✅ 3. Adopciones (`/adopciones`)
- Vista Solicitudes: tabla + kanban drag & drop
- Vista Expedientes: checklist 4 fases, confetti al cerrar
- Score compatibilidad 0-100%, entrevistas, aprobación/rechazo

### ✅ 4. Acogidas (`/acogidas`)
- Grid familias con karma badge, score compatibilidad animal↔familia
- Sistema karma automático, contactos de seguimiento, valoración estrellas

### ✅ 5. Voluntarios (`/voluntarios`)
- Grid con karma nivel/pts, tareas lista+kanban, rankings con podio CSS

### ✅ 6. SOS Pet (`/avisos`)
- Mapa Leaflet con marcadores, panel coincidencias IA, convertir en rescate

### ✅ 7. Usuarios (`/usuarios`)
- Tabla usuarios, crear/editar rol, activar/desactivar

### ✅ 8. Reportes (`/reportes`)
- 5 tabs: Resumen / Animales / Adopciones / Acogidas / SOS Pet
- Selector período global (6 opciones + rango personalizado)
- KPI cards con tendencia %, gráficos Recharts (líneas, barras, donuts, embudo)
- Heatmap actividad estilo GitHub (52 semanas)
- Exportar PDF (jsPDF + resumen ejecutivo IA Claude) y CSV ZIP (jszip)

### ✅ 9. Mensajes (`/mensajes`)
- Layout dos columnas estilo app de mensajería
- Conversaciones: internas (1:1 y grupos), con adoptantes, con familias
- Polling 3s para mensajes en tiempo real
- Badge no leídos en sidebar (actualización 30s)
- Filtros, modal nueva conversación, emoji picker

### ✅ 10. Calendario (`/calendario`)
- FullCalendar: 4 vistas (Mes/Semana/Día/Agenda)
- 6 tipos evento con colores, drag & drop, resize
- Modal crear/editar: animal, asignados, recordatorio, recurrencia
- Sidebar próximos 7 días + filtros toggle

### ✅ 11. Configuración (`/configuracion`) — Solo admin
Sub-sidebar con 10 secciones:
1. **Perfil**: nombre, slug, logo/portada (upload), geocodificación Nominatim
2. **Equipo**: tabla miembros, roles, invitaciones con link, matriz permisos
3. **Notificaciones**: toggles app/email, umbrales de alerta
4. **Adopciones**: cuota, visita hogar, textos email con variables
5. **Acogidas**: visita previa, duración, frecuencia, karma, email bienvenida
6. **Objetivos**: 4 KPIs mensuales + capacidad máxima
7. **Integraciones**: Stripe, Resend, Google Calendar, WhatsApp (próximo)
8. **Apariencia**: color picker, densidad interfaz → aplica CSS `--color-primary`
9. **Datos**: export ZIP, audit log, zona de peligro
10. **Plan y Facturación**: → ver módulo Billing

### ✅ 12. Donaciones (`/donaciones`)
- Tab Resumen: 4 KPIs, barra objetivo semáforo, gráfico 12 meses, confetti al 100%
- Tab Donaciones: tabla filtrable, export CSV, directorio donantes
- Tab Campañas: grid con portada, progreso, estado badge, acciones inline
- Registro manual (transferencia, efectivo, Bizum) con NIF
- Generador recibos PDF: importe en palabras español, texto legal IRPF

### ✅ 13. Asistente IA (`Ctrl+K` o botón flotante ✨)
- Panel flotante centrado 640px, activado con `Ctrl+K` / `Cmd+K`
- Streaming token a token via SSE (backend proxea a Claude API)
- Contexto adaptativo: 7 categorías de intención (animals, adoptions, foster, tasks, volunteers, sos, stats)
- SQL queries relevantes según palabras clave de la pregunta
- Sistema de acciones en la respuesta:
  - `ACTION:NAVIGATE` → navega a sección del CRM
  - `ACTION:CREATE_TASK` → crea tarea en Supabase con confirmación
  - `ACTION:COPY_EMAIL` → copia email al portapapeles
- 6 sugerencias iniciales clickables
- Historial multi-turn (últimos 6 mensajes)
- Markdown renderizado inline (tablas, negrita, listas, código)
- Muestra error amigable si Anthropic no tiene créditos

### ✅ 14. Sistema de Planes y Feature Gates (`/configuracion` → Plan y Facturación)
- 4 planes: `free` (0€) · `starter` (29,95€) · `pro` (59,95€) · `enterprise` (99,95€)
- `src/lib/billing/plans.ts`: única fuente de verdad con 26 features y 5 límites
- `PlanContext.tsx`: React Context + `usePlan()` hook: `can()`, `withinLimit()`, `requiredPlanFor()`
- `FeatureGate.tsx`: 3 modos: `hide`, `blur` (CSS), `upgrade-prompt` (card con CTA)
- Sidebar: items bloqueados muestran 🔒 y navegan a Config si el plan no los incluye
- Pantalla billing: barras de uso, toggle anual/mensual, grid 4 planes, tabla comparativa
- Modales upgrade/downgrade con diff de features desbloqueadas/perdidas
- `migrate-v11.ts`: `plan_id`, `plan_started_at`, `plan_expires_at`, Stripe fields en `refugios`

---

## Portal Público implementado (`portal/`, puerto 5174)

Vite + React + React Router v6. Rutas:

| Ruta | Descripción |
|------|-------------|
| `/` | Home: hero, contadores animados, grid animales, cómo funciona, SOS, protectoras |
| `/adoptar` | Buscador con filtros, paginación, favoritos localStorage |
| `/adoptar/:id` | Ficha: galería, personalidad, formulario adopción 5 pasos |
| `/sos` | Listado avisos activos con modal detalle |
| `/protectoras` | Directorio con buscador |
| `/protectoras/:slug` | Perfil público con grid de animales |
| `/como-funciona` | Proceso paso a paso + FAQ |
| `/sobre-nosotros` | Historia y valores |

API pública bajo `/api/public/*` (sin autenticación): animals, shelters, stats, adoption-request, share.

---

## Landing Page (`landing/`, puerto 3000)

Next.js 14 + Tailwind CSS. Design system generado con skill **ui-ux-pro-max**:
- Estilo: Dark Mode OLED + Exaggerated Minimalism (inspiración Linear/Vercel/Raycast)
- Tipografía: Instrument Serif (headings editoriales) + DM Sans (body/UI)
- Paleta: `#0a0a0a` fondo, `#1D9E75` brand, `#a1a1a1` muted

**11 secciones:**

| Sección | Highlights |
|---------|-----------|
| Navbar | Floating + backdrop-blur scroll, dropdown Producto con 6 sub-links |
| Hero | H1 72px Instrument Serif + mini-dashboard CRM en HTML/CSS + notificación iOS flotante delay 1.6s + dot grid + glow verde |
| LogoBar | Marquee CSS infinito 28s, pausa hover, 8 protectoras |
| Problem | Hard cut blanco (contraste = efecto), Lucide SVG icons, pull quote editorial |
| ProductTour | 6 tabs sidebar → 6 mockups CSS únicos (Dashboard, Ficha animal, Kanban adopciones, Chat IA, Mapa SOS, Padrinos) con fade 200ms |
| AISection | Dark gradient, pulsating badge, 4 cards con visuals inline |
| AdoptionFlow | Timeline 5 pasos + 4 impact numbers serif 40px |
| Pricing | Pro plan dark #0a0a0a borde verde, toggle anual/mensual |
| Testimonials | Bento: 1 grande dark + 2 pequeñas blancas |
| FAQ | Accordion con Plus/Minus Lucide |
| CTA | H1 72px + dot grid + glow + trust indicators SVG |

---

## Tablas de Supabase (PostgreSQL) — v1 a v11

### Core (v1-v6) — ya documentadas anteriormente
`refugios` · `usuarios` · `animales` · `animal_fotos` · `health_events` · `behavior_evaluations` · `animal_documents` · `adoption_requests` · `adoption_expedients` · `foster_families` · `foster_assignments` · `foster_contacts` · `karma_events` · `tasks` · `sos_alerts` · `sos_updates`

### v7 — Portal Público
`animal_analytics` · columnas nuevas en `refugios`: slug, ciudad, description_public, cover_url, website, instagram, facebook, is_public

### v8 — Mensajes y Calendario
`conversations` · `conversation_participants` · `messages` · `events`

### v9 — Configuración
`shelter_config` · `audit_log` · `invitations`

### v10 — Donaciones
`donations` · `donation_campaigns` · `donors`

### v11 — Billing
Columnas nuevas en `refugios`: plan_id · plan_started_at · plan_expires_at · stripe_customer_id · stripe_subscription_id

### Buckets Supabase Storage
| Bucket | Uso |
|--------|-----|
| `animal-photos` | Fotos de fichas |
| `sos-photos` | Fotos de avisos SOS |
| `shelter-assets` | Logos y portadas de protectoras |

---

## API REST — Endpoints completos (bajo `/api`)

```
POST /auth/login · GET /auth/me · PUT /auth/password · GET /permisos

GET/POST/PUT/DELETE /animales, /animales/:id + health/behavior/documents/fotos/instagram

GET/POST/PUT/POST   /sos/public*, /sos, /sos/:id + update/rescatar

GET/PUT             /voluntarios, /voluntarios/:id
GET/POST/PUT/DELETE /tareas, /tareas/:id + completar
GET                 /rankings

GET/POST/PUT + actions  /acogidas/familias, activas, historial, assignments

GET/POST/PUT + actions  /adopciones/solicitudes, expedientes + checklist/cerrar

GET                 /reportes/resumen, /animales, /adopciones, /acogidas, /sos, /export
POST                /reportes/ai-summary

GET/POST            /mensajes/conversations, /conversations/:id/messages
PUT                 /mensajes/conversations/:id/read
GET                 /mensajes/unread, /mensajes/users

GET/POST/PUT/DELETE /calendario/events, /events/:id
GET                 /calendario/events/upcoming

GET/PUT             /config
GET/PUT/DELETE      /config/team, /config/invitations
GET                 /config/audit-log
POST                /config/upload-asset · GET /config/geocode

GET/POST/PUT        /donations/summary, /donations, /donations/:id
GET/POST/PUT        /donations/campaigns, /campaigns/:id
GET                 /donations/donors, /donors/:id

GET/POST            /billing/plan

POST                /assistant/chat · POST /assistant/create-task

GET                 /public/animals*, /public/shelters*, /public/stats
POST                /public/adoption-request · POST /public/animals/:id/share
```

---

## Estructura de carpetas

```
resqpets/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── [original: acogidas, adopciones, animales, auth, behavior,
│   │   │   │    dashboard, documents, fotos, health, instagram, sos, usuarios, voluntarios]
│   │   │   ├── assistant.controller.ts    ← Asistente IA (streaming SSE)
│   │   │   ├── billing.controller.ts      ← Planes y uso
│   │   │   ├── calendario.controller.ts   ← Eventos
│   │   │   ├── config.controller.ts       ← Configuración protectora
│   │   │   ├── donaciones.controller.ts   ← Donaciones y campañas
│   │   │   ├── mensajes.controller.ts     ← Chat interno
│   │   │   ├── public.controller.ts       ← API pública portal
│   │   │   └── reportes.controller.ts     ← Estadísticas
│   │   ├── db/
│   │   │   ├── migrate.ts → migrate-v11.ts
│   │   │   ├── pool.ts
│   │   │   └── seed.ts
│   │   ├── middleware/auth.ts
│   │   ├── routes/index.ts              ← ~300 líneas
│   │   ├── types/index.ts
│   │   └── index.ts
│   ├── .env                             ← NO en git
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            ← CRM (puerto 5173)
│   ├── src/
│   │   ├── api/client.ts                ← get/post/put/delete
│   │   ├── components/
│   │   │   ├── Sidebar.tsx              ← con feature gates + badge mensajes
│   │   │   ├── TopBar.tsx
│   │   │   ├── ui.tsx
│   │   │   └── assistant/
│   │   │       └── FloatingAssistant.tsx ← Ctrl+K chat IA streaming
│   │   ├── context/
│   │   │   ├── AnimalListContext.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── assistant/actions.ts     ← Markdown renderer + action parser
│   │   │   └── billing/
│   │   │       ├── plans.ts             ← Única fuente de verdad de planes
│   │   │       ├── PlanContext.tsx      ← React Context + usePlan() hook
│   │   │       └── FeatureGate.tsx      ← hide/blur/upgrade-prompt
│   │   ├── pages/
│   │   │   ├── [originales: Acogidas, Adopciones, Animales, Avisos, Dashboard,
│   │   │   │    Detalle, Login, SOS, Usuarios, Voluntarios]
│   │   │   ├── CalendarioPage.tsx
│   │   │   ├── ConfiguracionPage.tsx
│   │   │   ├── DonacionesPage.tsx
│   │   │   ├── MensajesPage.tsx
│   │   │   ├── ReportesPage.tsx
│   │   │   ├── config/                  ← 10 secciones + shared
│   │   │   ├── donaciones/              ← 3 tabs + modales + ReceiptGenerator
│   │   │   └── reportes/                ← 5 tabs + shared charts
│   │   ├── types/index.ts
│   │   ├── App.tsx                      ← PlanProvider + AssistantFull
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts                   ← cacheDir fuera de Dropbox
│
├── portal/                              ← Portal público (puerto 5174)
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── components/landing/          ← Header, Footer, AnimalCard, SEOHead
│   │   ├── forms/AdoptionForm.tsx        ← 5 pasos, draft localStorage
│   │   ├── pages/                       ← 8 rutas públicas
│   │   ├── types/index.ts
│   │   ├── App.tsx                      ← React Router v6
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts                   ← puerto 5174, proxy /api
│
├── landing/                             ← Landing page (puerto 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css              ← Tailwind + animations (prefers-reduced-motion)
│   │   │   ├── layout.tsx               ← Instrument Serif + DM Sans + SEO meta
│   │   │   └── page.tsx                 ← Importa las 11 secciones
│   │   └── components/landing/
│   │       ├── Navbar.tsx               ← Floating + blur + dropdown
│   │       ├── Hero.tsx                 ← 2-col + CRM mockup CSS + notif iOS
│   │       ├── LogoBar.tsx              ← Marquee CSS infinito
│   │       ├── ProblemSection.tsx       ← White hard cut
│   │       ├── ProductTour.tsx          ← 6 tabs + 6 mockups CSS interactivos
│   │       ├── AISection.tsx            ← 4 feature cards IA
│   │       ├── AdoptionFlow.tsx         ← Timeline 5 pasos
│   │       ├── PricingSection.tsx       ← 4 planes toggle anual
│   │       ├── TestimonialsSection.tsx  ← Bento layout
│   │       ├── FAQSection.tsx           ← Accordion
│   │       ├── CtaSection.tsx           ← Dark con glow
│   │       ├── Footer.tsx
│   │       └── useReveal.ts             ← Intersection Observer hook
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── scripts/
│   ├── seed-acogidas.js, seed-voluntarios.js, seed-sos.js
│   ├── seed-reportes.js    ← 63 animales + 38 adopciones + 30 acogidas + 86 SOS (12 meses)
│   ├── seed-mensajes.js    ← 9 conversaciones + 75 mensajes (7 días)
│   ├── seed-calendario.js  ← 31 eventos (-30d a +60d, incluye hoy)
│   └── seed-donaciones.js  ← 3 campañas + 50 donaciones + 14 donantes
│
└── ESTADO_PROYECTO.md
```

---

## Datos de demo cargados

| Seed | Registros |
|------|-----------|
| `npm run seed` | 1 refugio, 4 usuarios base, 5 animales, 3 avisos, 3 donaciones legacy |
| `seed-acogidas.js` | 15 familias, 5 acogidas activas, 20 historial, 184 karma events |
| `seed-voluntarios.js` | 8 voluntarios, 25 tareas, 363 karma events |
| `seed-sos.js` | 20 avisos Madrid área metropolitana |
| `seed-reportes.js` | 63 animales históricos, 38 adopciones, 30 acogidas, 86 SOS (12 meses) |
| `seed-mensajes.js` | 9 conversaciones (internas + adoptantes + familias), 75 mensajes |
| `seed-calendario.js` | 31 eventos distribuidos -30d a +60d |
| `seed-donaciones.js` | 3 campañas, 50 donaciones (6 meses), 14 donantes |

---

## Usuarios de demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@resqpet.com | Admin1234! | Admin |
| laura@huellaviva.org | Laura1234! | Coordinador |
| marta@huellaviva.org | Marta1234! | Voluntario |
| david@huellaviva.org | David1234! | Voluntario |
| isabel.gomez@huellaviva.org | Voluntario1! | Coordinador |
| lucia.herrero@huellaviva.org | Voluntario1! | Voluntario |
| (+ 6 voluntarios más del seed) | Voluntario1! | Voluntario |

---

## Sistema de roles y permisos

```
admin       → acceso total + Configuración + cambio de planes
coordinador → todo excepto: eliminar animales, gestionar usuarios, Config
voluntario  → solo lectura + completar propias tareas + añadir notas
```

Feature gates por plan (`src/lib/billing/plans.ts`):
- `free`: animales, adopciones, portal, SOS, donaciones básicas
- `starter`: + acogidas, voluntarios, calendario, test compatibilidad, IA 50/mes
- `pro`: + IA completa, reconocimiento facial, asistente Cmd+K, padrinos, WhatsApp
- `enterprise`: + multi-sede, API veterinaria, mapa nacional, soporte dedicado

---

## Skills instaladas (Claude Code)

| Skill | Uso |
|-------|-----|
| **caveman** | Comprime output de Claude ~65%. Activa con `caveman mode` o `/caveman` |
| **ui-ux-pro-max** | Design intelligence: 67 estilos, 96 paletas, 57 font pairings. Uso: `py .claude\skills\ui-ux-pro-max\scripts\search.py "query" --design-system` |

---

## Notas de operación

- **4 servidores** en desarrollo: backend (4000), CRM (5173), portal (5174), landing (3000)
- El backend carga `.env` al arrancar; cambios en `.env` requieren reinicio
- `ts-node-dev` hace hot-reload de código TypeScript pero NO de `.env`
- **Anthropic API key**: necesaria para asistente IA, generador Instagram y resumen PDF en Reportes. Sin créditos devuelve error amigable en el asistente.
- El portal solo muestra animales con `web_publicado=true` y `estado='en_adopcion'`
- Para demo: todos los refugios en plan `enterprise` → `UPDATE refugios SET plan_id='enterprise'`
- El color del CRM se personaliza en Config → Apariencia (CSS var `--color-primary`)
- La caché de Vite del CRM está en `%TEMP%/vite-resqpet-frontend` (evita conflictos Dropbox)
- Los buckets `sos-photos` y `shelter-assets` deben crearse manualmente en Supabase Storage
