# ResQPet — Estado completo del proyecto
> Documento generado para continuar el desarrollo en cualquier conversación futura.
> Para detalle exhaustivo de endpoints, estructura de carpetas y tablas, ver `ESTADO_PROYECTO.md` en la raíz del repo.

---

## Repositorio
https://github.com/dporti/resqpets

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 18 + Express 4 + TypeScript 5 |
| Base de datos | PostgreSQL vía Supabase (pool Supavisor, driver `pg`) |
| Autenticación | JWT propio (bcryptjs + jsonwebtoken) — **no Supabase Auth** |
| CRM Frontend | React 18 + Vite 5 + TypeScript 5 (puerto 5173) |
| Portal Público | React 18 + Vite 5 + TypeScript 5 + React Router v6 (puerto 5174) |
| Landing Page | Next.js 14 + Tailwind CSS + TypeScript 5, App Router (puerto 3000) |
| Almacenamiento | Supabase Storage |
| IA | Anthropic Claude API (`claude-sonnet-4-6`) |
| Mapas | Leaflet + OpenStreetMap (sin token) |
| PDF | jsPDF + html2canvas + QRCode |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Calendario | @fullcalendar/react + plugins |
| Confetti | canvas-confetti |
| Gráficos | Recharts |
| Exportación | JSZip + html2canvas |
| Donaciones | Stripe.js (modo test, claves opcionales en Config) |
| Design System | ui-ux-pro-max skill (67 estilos, 96 paletas, 57 font pairings) |

> Nota arquitectónica: la versión inicial de este documento (junio 2026, primeras horas) preveía Supabase Auth + RLS directo desde frontend. Se descartó: el backend Express centraliza toda la lógica con JWT propio y aislamiento multi-tenant por `refugio_id`/`shelter_id` a nivel de controller. RLS de Supabase queda como fase 2 (ver sección Multi-tenancy).

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

### Arrancar el proyecto (4 servidores)
```bash
cd backend && npm run dev    # API — puerto 4000
cd frontend && npm run dev   # CRM — puerto 5173
cd portal && npm run dev     # Portal público — puerto 5174
cd landing && npm run dev    # Landing — puerto 3000
```

### Migraciones (BD nueva)
```bash
cd backend
npx ts-node --transpile-only src/db/migrate.ts
# ... migrate-v2.ts a migrate-v11.ts en orden
npm run seed
```

### Seeds disponibles
```
node scripts/seed-acogidas.js      — 15 familias + acogidas activas/historial
node scripts/seed-voluntarios.js   — 8 voluntarios + 25 tareas + karma
node scripts/seed-sos.js           — 20 avisos en Madrid
node scripts/seed-reportes.js      — 63 animales + 38 adopciones + 30 acogidas + 86 SOS (12 meses)
node scripts/seed-mensajes.js      — 9 conversaciones + 75 mensajes
node scripts/seed-calendario.js    — 31 eventos (-30d a +60d)
node scripts/seed-donaciones.js    — 3 campañas + 50 donaciones + 14 donantes
node scripts/seed-multitenancy.js  — 2º refugio "Patitas Felices" (Barcelona) para verificar aislamiento
```

### Decisiones técnicas
- Conexión Supabase: pooler `aws-1-eu-north-1` puerto 6543 (IPv6 no disponible en dev)
- Caché Vite del CRM en `%TEMP%/vite-resqpet-frontend` (evita `EBUSY` con Dropbox)
- Plan demo: todos los refugios en plan `enterprise` → `UPDATE refugios SET plan_id='enterprise'`

### Supabase Storage buckets (crear manualmente)
- `animal-photos` — fotos de animales (público)
- `animal-documents` — documentos clínicos y contratos
- `sos-photos` — fotos de avisos SOS (público)
- `shelter-assets` — logos y portadas de protectoras

---

## Módulos CRM implementados (todos ✅) — `frontend/`, puerto 5173

### ✅ 1. Dashboard (`/inicio`)
KPIs (animales al cuidado, en acogida, en adopción, avisos activos, rescates hoy), tabla animales recientes, donut por estado, adopciones/donaciones del mes con sparkline, actividad reciente, próximos eventos.

### ✅ 2. Animales (`/animales` y `/animales/:id`)
Listado con filtros/paginación/chips sanitarios. Ficha con galería + upload Storage, 6 tabs (Información, Salud, Comportamiento, Documentos, Historia, Redes y difusión con generador Instagram vía IA), panel lateral notas+actividad, navegación anterior/siguiente, "Convertir en rescate" desde SOS.

### ✅ 3. Adopciones (`/adopciones`)
Tabla + kanban drag&drop (6 estados), score compatibilidad 0-100, entrevistas, expedientes con 4 fases (documentación → preparación → entrega → seguimiento post-adopción), confetti al cerrar.

### ✅ 4. Acogidas (`/acogidas`)
Tabs Familias / Activas / Historial. Asignación animal↔familia con score compatibilidad, sistema karma (Bronce→Diamante), contactos de seguimiento, finalización con valoración por estrellas.

### ✅ 5. Voluntarios (`/voluntarios`)
Directorio con karma, tareas (lista+kanban, categorías/prioridades/recurrencia), rankings con podio.

### ✅ 6. SOS Pet (`/avisos` interno + `/sos` público)
Mapa Leaflet con marcadores por urgencia, formulario público 6 pasos, generador de carteles PDF + QR, "Convertir en rescate", matchmaking básico, Realtime.

### ✅ 7. Usuarios (`/usuarios`)
Tabla usuarios, crear/editar rol, activar/desactivar (solo admin).

### ✅ 8. Reportes (`/reportes`)
5 tabs (Resumen, Animales, Adopciones, Acogidas, SOS Pet), selector de período global, heatmap estilo GitHub, exportación PDF (con resumen ejecutivo IA) y CSV ZIP.

### ✅ 9. Mensajes (`/mensajes`)
Layout dos columnas, conversaciones internas/adoptantes/familias, polling 3s, badge no leídos, adjuntos.

### ✅ 10. Calendario (`/calendario`)
FullCalendar (Mes/Semana/Día/Agenda), 6 tipos de evento con colores, drag&drop+resize, eventos automáticos desde otros módulos.

### ✅ 11. Configuración (`/configuracion`) — solo admin
10 secciones: Perfil, Equipo (roles, invitaciones), Notificaciones, Adopciones, Acogidas, Objetivos, Integraciones, Apariencia (CSS `--color-primary`), Datos y privacidad, Plan y Facturación.

### ✅ 12. Donaciones (`/donaciones`)
Tabs Resumen (KPIs, gráfico 12 meses, confetti al 100%), Donaciones (registro manual, recibos PDF), Campañas (progreso, padrinos vinculados a animal).

### ✅ 13. Asistente IA (`Ctrl+K` / botón flotante ✨)
Chat streaming SSE sobre Claude API, contexto adaptativo por intención (animales/adopciones/acogidas/tareas/voluntarios/sos/stats), acciones `NAVIGATE`/`CREATE_TASK`/`COPY_EMAIL`, historial multi-turn, error amigable sin créditos Anthropic.

### ✅ 14. Sistema de Planes y Feature Gates
4 planes (free/starter/pro/enterprise), `plans.ts` como fuente de verdad (26 features, 5 límites), `PlanContext`/`usePlan()`, `FeatureGate` (hide/blur/upgrade-prompt), sidebar con 🔒 en items bloqueados.

---

## Portal Público (`portal/`, puerto 5174)

| Ruta | Descripción |
|------|-------------|
| `/` | Home: hero, contadores animados, grid animales, cómo funciona, SOS, protectoras |
| `/adoptar` | Buscador con filtros, paginación, favoritos localStorage |
| `/adoptar/:id` | Ficha: galería, personalidad, formulario adopción 5 pasos, animales similares |
| `/sos` | Listado avisos activos |
| `/protectoras`, `/protectoras/:slug` | Directorio y perfil público |
| `/como-funciona`, `/sobre-nosotros` | Estáticas |

API pública bajo `/api/public/*` (sin auth): animals, shelters, stats, adoption-request, share.

---

## Landing Page (`landing/`, puerto 3000)

Next.js 14 + Tailwind, design system **ui-ux-pro-max** (Dark Mode OLED + Exaggerated Minimalism, inspiración Linear/Vercel/Raycast). Instrument Serif + DM Sans, paleta `#0a0a0a` / `#1D9E75` / `#a1a1a1`. 11 secciones: Navbar, Hero, LogoBar, Problem, ProductTour, AISection, AdoptionFlow, Pricing, Testimonials, FAQ, CTA.

---

## Base de datos — tablas principales (v1-v11)

```
refugios (+ slug, ciudad, plan_id, plan_started_at, stripe_*), usuarios, shelter_config
animales, animal_fotos, animal_documents, animal_notas, animal_analytics
health_events, behavior_evaluations
adoption_requests, adoption_interviews, adoption_expedients, expedient_checklist, adoption_timeline
foster_families, foster_assignments, foster_contacts
karma_events, tasks
sos_alerts, sos_updates
conversations, conversation_participants, messages
events (calendario)
donations, donation_campaigns, donors
audit_log, invitations
```

Aislamiento multi-tenant por `refugio_id` (la mayoría) / `shelter_id` (donaciones, mensajería, eventos).

---

## Multi-tenancy — Estado de seguridad

Arquitectura: JWT propio → aislamiento por `refugio_id`/`shelter_id` a nivel de controller. **NO** RLS de Supabase activo (fase 2, pendiente de migrar a Supabase Auth).

Auditoría 2026-06 — revisados los 21 controllers de `backend/src/controllers/`. Hallazgos corregidos en dos pasadas:

**Pasada 1**: `sos.controller.ts` (convertirARescate), `behavior.controller.ts` (createBehaviorEvaluation), `animales/health/documents.controller.ts` (child-INSERT sin validar ownership del animal), `donaciones.controller.ts` (createDonation sin shelter_id en UPDATE), `mensajes.controller.ts` (getMessages/sendMessage/markRead/createConversation sin validar shelter_id/participantes), `public.controller.ts` (trackAnimalShare sin check web_publicado).

**Pasada 2**: `acogidas.controller.ts` (asignarAnimal — animal_id sin validar refugio), `adopciones.controller.ts` (createSolicitud — animal_id sin validar refugio; aprobarSolicitud/cerrarExpediente sin refugio_id en UPDATE animales), `config.controller.ts` (toggleMemberStatus/removeMember sin refugio_id en UPDATE), `voluntarios.controller.ts` (completeTask sin refugio_id en UPDATE), `calendario.controller.ts` (createEvent/updateEvent — animal_id/assigned_to sin validar refugio).

Todo corregido. Helper nuevo: `backend/src/lib/tenant.ts` (`getRefugioId`, `assertRefugioOwnership`). Seed de verificación: `scripts/seed-multitenancy.js`.

Pendiente / fuera de alcance:
- `usuarios.refugio_id NOT NULL` — bajo riesgo, pendiente de migración futura.
- RLS de Supabase — fase 2 (migración a Supabase Auth).

---

## Funcionalidades diferenciadoras pendientes (próximos pasos)

> Actualizado: el Asistente IA interno (Ctrl+K) y el generador de descripción/copy con IA (Instagram) **ya están implementados** (módulos 13 y 2). Se retiran de esta lista.

### 🔥 Alta prioridad (gancho de venta)

#### 1. Reconocimiento facial de animales (IA)
Al subir foto de un animal rescatado, comparar contra avisos SOS "Perdido" de los últimos 30 días y animales ya registrados, usando Claude vision. Ningún CRM del sector lo tiene.

#### 2. Test de compatibilidad gamificado (portal público)
Quiz de 5 preguntas → top 3 animales con % compatibilidad y explicación. Aumenta conversión de visitas a solicitudes.

#### 3. Padrinos virtuales
Donación recurrente 5-15€/mes vinculada a un animal concreto, actualizaciones mensuales automáticas (foto+novedad), oferta de "adoptar" otro animal si el apadrinado es adoptado. Ya hay base en el módulo Donaciones (campañas/padrinos parcial) — falta automatizar las actualizaciones.

### 🚀 Media prioridad (diferenciación)

#### 4. WhatsApp Business integrado
Notificaciones automáticas a familias de acogida y adoptantes vía Twilio/Meta Business API. Ya listado como "próximamente" en Config → Integraciones.

#### 5. Muro de adopciones exitosas (portal público)
Feed público con fotos de animales en su nuevo hogar, subida por adoptantes, generador de "tarjeta de felicitación" descargable.

#### 6. Informe de impacto anual automático
PDF generado automáticamente con métricas anuales, diseño para subvenciones (extensión del módulo Reportes existente).

#### 7. Command Palette global (Cmd+K)
Distinto del Asistente IA: búsqueda rápida de animales/voluntarios/adopciones + acciones rápidas ("Nuevo ingreso", "Registrar gasto", "Nueva tarea") sin IA, navegación 100% teclado.

### 💡 Largo plazo

#### 8. API pública para clínicas veterinarias
Consulta de historial médico por número de microchip. Modelo B2B.

#### 9. Marketplace de servicios
Veterinarias/peluquerías/tiendas pagan por aparecer recomendadas en fichas del portal público.

#### 10. Mapa nacional de abandono
Dashboard público con datos agregados/anonimizados de todas las protectoras.

#### 11. Seguro de acogida integrado
Cobertura automática para familias de acogida vía partnership con aseguradora.

#### 12. Stripe Checkout real
`BillingTab.tsx` está en modo demo (cambio de plan inmediato sin cobro). Falta integrar Stripe Checkout/portal de cliente real.

---

## Cómo continuar en una nueva conversación

1. Clona el repo: `git clone https://github.com/dporti/resqpets.git`
2. `cd backend && npm install && cd ../frontend && npm install` (repetir para `portal` y `landing` si aplica)
3. Configura `backend/.env` (ver sección Configuración de entorno)
4. Arranca los 4 servidores (ver arriba)
5. Lee este documento y `ESTADO_PROYECTO.md` (detalle de endpoints, estructura de carpetas, tablas)
6. Elige la siguiente funcionalidad de "Funcionalidades diferenciadoras pendientes"

---

## Próxima sesión recomendada
**Reconocimiento facial de animales** o **Test de compatibilidad gamificado** — los dos ganchos de venta más potentes y diferenciadores pendientes.
