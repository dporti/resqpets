# ResQPet — Estado del Proyecto

**CRM para protectoras de animales + Portal Público**  
Última actualización: junio 2026  
Repositorio: https://github.com/dporti/resqpets

---

## URLs de acceso (desarrollo local)

| Servicio | URL | Puerto |
|----------|-----|--------|
| **CRM** (gestión interna) | http://localhost:5173 | 5173 |
| **Portal público** | http://localhost:5174 | 5174 |
| **API Backend** | http://localhost:4000 | 4000 |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 18 + Express 4 + TypeScript 5 |
| Base de datos | PostgreSQL vía Supabase (pool Supavisor) |
| CRM Frontend | React 18 + Vite 5 + TypeScript 5 (state-machine routing) |
| Portal Público | React 18 + Vite 5 + TypeScript 5 + React Router v6 |
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

### Decisión técnica: conexión Supabase
La BD se conecta via **Supabase Supavisor Transaction Pooler** en lugar de conexión directa porque:
- Supabase free tier solo ofrece IPv6 para conexión directa
- La máquina de desarrollo no tiene conectividad IPv6 a internet
- El pooler usa `aws-1-eu-north-1` (prefijo `aws-1`, NO `aws-0`)
- Puerto 6543 (transaction mode)

### Decisión técnica: caché Vite fuera de Dropbox
`vite.config.ts` del CRM tiene `cacheDir` apuntando a `%TEMP%/vite-resqpet-frontend` para evitar errores `EBUSY` causados por Dropbox bloqueando la carpeta `node_modules/.vite` durante la sincronización en Windows.

---

## Módulos CRM implementados (todos ✅)

### ✅ 1. Dashboard (`/inicio`)
- Stats: total animales, en acogida, en adopción, avisos activos
- Tabla animales recientes (click → detalle)
- Gráfico donut distribución por estado
- Adopciones y donaciones del mes con sparkline y progreso hacia objetivo
- Actividad reciente, próximos eventos del calendario
- Panel lateral: avisos activos, agenda

### ✅ 2. Animales (`/animales`)
- Listado con filtros por estado (tabs pill), especie, buscador debounced
- Paginación (20 por página), chips sanitarios (Vac/Est/Chip)
- **Detalle animal**: galería + upload Supabase Storage, 6 tabs (Info/Salud/Comportamiento/Documentos/Historia/Redes)
- Tab Redes: generador copy Instagram vía Claude API
- Formulario crear/editar: slide-over con 5 tabs

### ✅ 3. Adopciones (`/adopciones`)
- Vista Solicitudes: tabla + kanban drag & drop (@dnd-kit)
- Vista Expedientes: checklist 4 fases, confetti al cerrar
- Score compatibilidad 0-100% calculado en frontend
- Entrevistas, aprobación/rechazo con motivos

### ✅ 4. Acogidas (`/acogidas`)
- Grid familias con slots visuales, karma badge, filtros
- Acogidas activas con colores por días (verde/amarillo/rojo)
- Score compatibilidad animal↔familia en asignación
- Sistema karma automático (días, adopción, especiales)
- Contactos de seguimiento, finalización con valoración estrellas

### ✅ 5. Voluntarios (`/voluntarios`)
- Grid voluntarios con indicador online, karma nivel/pts, especialidades
- Tareas: lista + kanban con drag & drop, karma automático por prioridad
- Rankings por período con podio CSS, toggle voluntarios/familias
- Panel voluntario: bio, progreso karma, historial eventos

### ✅ 6. SOS Pet (`/avisos`)
- Vista Mapa: Leaflet, marcadores coloreados por urgencia, pulsante si urgente
- Vista Lista: tabla filtrable, panel detalle con coincidencias IA
- Convertir aviso en rescate → crea ficha animal

### ✅ 7. Usuarios (`/usuarios`)
- Tabla usuarios, crear/editar rol, activar/desactivar

### ✅ 8. Reportes (`/reportes`)
- **5 tabs**: Resumen / Animales / Adopciones / Acogidas / SOS Pet
- Selector de período global: 5 opciones + rango personalizado
- KPI cards con tendencia % vs período anterior
- Gráficos Recharts: líneas múltiples, barras, donuts, embudo de conversión
- Heatmap de actividad estilo GitHub (52 semanas)
- Exportar PDF: portada + datos + resumen ejecutivo IA (Claude)
- Exportar CSV: ZIP con un fichero por sección

### ✅ 9. Mensajes (`/mensajes`)
- Layout dos columnas estilo app de mensajería
- Conversaciones internas (1:1 y grupos), con adoptantes y familias
- Polling cada 3s para mensajes en tiempo real
- Badge no leídos en sidebar (actualización cada 30s)
- Filtros: todos / internos / adoptantes / acogidas / no leídos
- Modal nueva conversación multi-paso
- Emoji picker, Enter envía, Shift+Enter nueva línea
- Agrupación mensajes por fecha, estado ✓✓

### ✅ 10. Calendario (`/calendario`)
- FullCalendar con 4 vistas: Mes / Semana / Día / Agenda
- 6 tipos de evento con colores: adopción, veterinario, acogida, voluntarios, urgente, campaña
- Drag & drop y resize de eventos (coordinadores/admin)
- Modal crear/editar: animal, asignados, recordatorio, recurrencia
- Sidebar: próximos 7 días + filtros toggle por tipo
- Flag `auto_generated` para eventos creados por el sistema

### ✅ 11. Configuración (`/configuracion`) — Solo admin
Sub-sidebar con 10 secciones:
1. **Perfil**: nombre, slug, logo/portada (upload), RRSS, geocodificación Nominatim, preview portal
2. **Equipo**: tabla miembros, cambio rol inline, activar/desactivar, invitaciones con link, matriz permisos
3. **Notificaciones**: toggles app/email por tipo, umbrales de alerta
4. **Adopciones**: cuota, visita hogar, entrevista, textos email con variables `{{nombre_animal}}`
5. **Acogidas**: visita previa, duración máx, frecuencia seguimiento, karma, email bienvenida
6. **Objetivos**: 4 KPIs mensuales + capacidad máxima refugio
7. **Integraciones**: Stripe (keys + widget donación), Resend (email propio), Google Calendar, WhatsApp
8. **Apariencia**: color picker (12 presets + hex), preview tiempo real, densidad interfaz — aplica CSS var `--color-primary`
9. **Datos**: export ZIP, política retención, audit log + CSV, zona de peligro con doble confirmación
10. **Plan**: barras de uso, tabla comparativa planes, historial facturas

### ✅ 12. Donaciones (`/donaciones`)
- **Tab Resumen**: 4 KPIs con trend %, barra objetivo (semáforo), gráfico 12 meses, 2 donuts, confetti al 100%
- **Tab Donaciones**: tabla filtrable (canal/tipo/campaña/estado), paginación, export CSV, directorio donantes, detalle por click
- **Tab Campañas**: grid con portada, progreso, estado badge, acciones inline
- Registro manual (transferencia, efectivo, Bizum) con NIF para recibos
- Generador recibos PDF: importe en palabras español, texto legal IRPF
- Directorio donantes con historial completo

---

## Portal Público implementado (`portal/`)

Aplicación Vite separada en puerto 5174 con React Router v6.

| Ruta | Descripción |
|------|-------------|
| `/` | Home: hero animado, contadores impacto, grid animales, cómo funciona, SOS, protectoras, CTA |
| `/adoptar` | Buscador con filtros (especie, tamaño, sexo, chips), paginación, favoritos localStorage |
| `/adoptar/:id` | Ficha: galería, personalidad, compatibilidad, formulario adopción 5 pasos multi-step |
| `/sos` | Listado avisos activos con modal detalle y compartir WhatsApp |
| `/protectoras` | Directorio con buscador |
| `/protectoras/:slug` | Perfil público con grid de animales |
| `/como-funciona` | Proceso paso a paso + FAQ con acordeón |
| `/sobre-nosotros` | Historia, valores, CTA |

**API pública** (sin autenticación, bajo `/api/public/*`):
- `GET /public/animals` — animales filtrados (especie, tamaño, búsqueda…)
- `GET /public/animals/:id` — ficha pública + animales similares + tracking vistas
- `GET /public/shelters` — directorio protectoras
- `GET /public/shelters/:slug` — perfil protectora
- `GET /public/stats` — estadísticas globales
- `POST /public/adoption-request` — solicitud adopción desde portal
- `POST /public/animals/:id/share` — tracking compartidos

**Características SEO**:
- `react-helmet-async`: meta title/description únicos por página
- Open Graph + Twitter Card para preview al compartir en WhatsApp/redes
- Skeleton loaders, lazy loading imágenes
- Favoritos en localStorage (sin login)

---

## Tablas de Supabase (PostgreSQL)

### Core (`migrate.ts`)
| Tabla | Descripción |
|-------|-------------|
| `refugios` | Protectoras (ampliada en v7 con slug, ciudad, redes sociales) |
| `usuarios` | Usuarios del sistema (ampliada en v5 con karma, especialidades) |
| `animales` | Fichas de animales |
| `animal_fotos` | Fotos de animales |
| `acogidas` | Acogidas legacy |
| `adopciones` | Adopciones legacy |
| `animal_notas` | Notas internas |
| `actividad` | Log de actividad |
| `avisos` | Avisos legacy |
| `donaciones` | Donaciones legacy |
| `eventos` | Eventos legacy |

### v2 — Detalle animal
| Tabla | Descripción |
|-------|-------------|
| `health_events` | Eventos médicos por animal |
| `behavior_evaluations` | Evaluaciones de comportamiento |
| `animal_documents` | Documentos adjuntos |

### v3 — Adopciones
| Tabla | Descripción |
|-------|-------------|
| `adoption_requests` | Solicitudes de adopción |
| `adoption_interviews` | Entrevistas programadas |
| `adoption_expedients` | Expedientes en proceso |
| `expedient_checklist` | Checklist por expediente |
| `adoption_timeline` | Timeline de eventos |

### v4 — Acogidas
| Tabla | Descripción |
|-------|-------------|
| `foster_families` | Familias de acogida |
| `foster_assignments` | Asignaciones animal↔familia |
| `foster_contacts` | Contactos de seguimiento |
| `karma_events` | Puntos karma (familias + voluntarios) |

### v5 — Voluntarios y Tareas
| Tabla | Descripción |
|-------|-------------|
| `tasks` | Tareas del equipo |
| `usuarios` (ext.) | +karma_puntos, +especialidades[], +bio, +es_disponible, +racha_dias |

### v6 — SOS Pet
| Tabla | Descripción |
|-------|-------------|
| `sos_alerts` | Avisos de animales perdidos/encontrados |
| `sos_updates` | Actualizaciones de avisos |
| `pending_notifications` | Notificaciones pendientes |

### v7 — Portal Público
| Tabla / Cambio | Descripción |
|----------------|-------------|
| `refugios` (ext.) | +slug, +ciudad, +description_public, +cover_url, +website, +instagram, +facebook, +is_public |
| `animal_analytics` | Seguimiento de vistas y compartidos por animal |

### v8 — Mensajes y Calendario
| Tabla | Descripción |
|-------|-------------|
| `conversations` | Conversaciones (internas, con adoptantes, con familias) |
| `conversation_participants` | Participantes por conversación |
| `messages` | Mensajes de cada conversación |
| `events` | Eventos del calendario |

### v9 — Configuración
| Tabla | Descripción |
|-------|-------------|
| `shelter_config` | Configuración completa de la protectora (adopciones, acogidas, objetivos, integraciones, apariencia) |
| `audit_log` | Registro de cambios importantes en el sistema |
| `invitations` | Invitaciones pendientes de nuevos miembros |

### v10 — Donaciones
| Tabla | Descripción |
|-------|-------------|
| `donations` | Donaciones con canal, tipo, donante, recibo, campaña |
| `donation_campaigns` | Campañas de captación de fondos |
| `donors` | Directorio de donantes con totales históricos |

### Buckets Supabase Storage
| Bucket | Uso | Visibilidad |
|--------|-----|-------------|
| `animal-photos` | Fotos de fichas de animales | Público |
| `sos-photos` | Fotos de avisos SOS | Público |
| `shelter-assets` | Logos y portadas de protectoras | Público |

---

## API REST — Endpoints completos (bajo `/api`)

### Autenticación
```
POST /auth/login          → JWT token
GET  /auth/me             → Usuario actual
PUT  /auth/password       → Cambiar contraseña
GET  /permisos            → Permisos del rol
```

### Animales
```
GET/POST/PUT/DELETE /animales, /animales/:id
POST /animales/:id/notas
POST/DELETE/PUT     /animales/:id/fotos, /fotos/:fotoId
GET/POST/DELETE     /animales/:id/health, /health/:eventId
GET/POST            /animales/:id/behavior
GET/POST/DELETE     /animales/:id/documents, /documents/:docId
POST                /animales/:id/instagram  ← Claude API
```

### SOS Pet
```
GET/POST            /sos/public, /sos/public/:id   ← SIN AUTH
GET/PUT/POST        /sos, /sos/:id, /sos/:id/update, /sos/:id/rescatar
```

### Voluntarios y Tareas
```
GET/PUT             /voluntarios, /voluntarios/:id
GET/POST/PUT/DELETE /tareas, /tareas/:id
POST                /tareas/:id/completar
GET                 /rankings
```

### Acogidas
```
GET/POST/PUT        /acogidas/familias, /acogidas/familias/:id
POST                /acogidas/familias/:id/asignar
GET                 /acogidas/activas, /acogidas/historial
GET/POST            /acogidas/assignments/:id/contactos, /contacto
POST                /acogidas/assignments/:id/finalizar
```

### Adopciones
```
GET/POST/PUT/POST   /adopciones/solicitudes, /:id, /:id/estado, /:id/entrevista, /:id/aprobar
GET/PUT/POST        /adopciones/expedientes, /:id, /:id/checklist/:itemKey, /:id/cerrar
```

### Reportes
```
GET /reportes/resumen, /animales, /adopciones, /acogidas, /sos
GET /reportes/export
POST /reportes/ai-summary   ← Claude API
```

### Mensajes
```
GET/POST            /mensajes/conversations, /conversations/:id/messages
POST                /mensajes/conversations/:id/messages
PUT                 /mensajes/conversations/:id/read
GET                 /mensajes/unread, /mensajes/users
```

### Calendario
```
GET/POST/PUT/DELETE /calendario/events, /events/:id
GET                 /calendario/events/upcoming
```

### Configuración
```
GET/PUT             /config
GET/PUT/DELETE      /config/team, /team/:memberId/role, /team/:memberId/status, /team/:memberId
GET/POST/DELETE     /config/invitations, /invitations/:id
GET                 /config/audit-log
POST                /config/upload-asset
GET                 /config/geocode
```

### Donaciones
```
GET                 /donations/summary
GET/POST/PUT        /donations, /donations/:id
GET/POST/PUT        /donations/campaigns, /campaigns/:id
GET                 /donations/donors, /donors/:id
```

### Portal Público (sin auth)
```
GET                 /public/animals, /animals/:id
GET                 /public/shelters, /shelters/:slug
GET                 /public/stats
POST                /public/adoption-request
POST                /public/animals/:id/share
```

---

## Estructura de carpetas

```
resqpets/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── acogidas.controller.ts
│   │   │   ├── adopciones.controller.ts
│   │   │   ├── animales.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── behavior.controller.ts
│   │   │   ├── calendario.controller.ts      ← nuevo
│   │   │   ├── config.controller.ts          ← nuevo
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── donaciones.controller.ts      ← nuevo
│   │   │   ├── fotos.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── instagram.controller.ts
│   │   │   ├── mensajes.controller.ts        ← nuevo
│   │   │   ├── public.controller.ts          ← nuevo
│   │   │   ├── reportes.controller.ts        ← nuevo
│   │   │   ├── sos.controller.ts
│   │   │   ├── usuarios.controller.ts
│   │   │   └── voluntarios.controller.ts
│   │   ├── db/
│   │   │   ├── migrate.ts       ← v1: tablas core
│   │   │   ├── migrate-v2.ts    ← health_events, behavior, documents
│   │   │   ├── migrate-v3.ts    ← adoption_*
│   │   │   ├── migrate-v4.ts    ← foster_*, karma_events
│   │   │   ├── migrate-v5.ts    ← tasks, extiende usuarios
│   │   │   ├── migrate-v6.ts    ← sos_alerts, sos_updates
│   │   │   ├── migrate-v7.ts    ← portal público (slug, animal_analytics)
│   │   │   ├── migrate-v8.ts    ← conversations, messages, events
│   │   │   ├── migrate-v9.ts    ← shelter_config, audit_log, invitations
│   │   │   ├── migrate-v10.ts   ← donations, donation_campaigns, donors
│   │   │   ├── pool.ts          ← Conexión Supabase
│   │   │   └── seed.ts          ← Datos demo base
│   │   ├── middleware/auth.ts
│   │   ├── routes/index.ts      ← ~300 líneas, todos los endpoints
│   │   ├── types/index.ts
│   │   └── index.ts
│   ├── .env                     ← NO en git
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    ← CRM (puerto 5173)
│   ├── src/
│   │   ├── api/client.ts        ← get/post/put/delete + métodos específicos
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      ← con badge no leídos mensajes
│   │   │   ├── TopBar.tsx
│   │   │   └── ui.tsx
│   │   ├── context/
│   │   │   ├── AnimalListContext.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── [páginas originales: Acogidas, Adopciones, Animales, Avisos, Dashboard, Detalle, Login, SOS, Usuarios, Voluntarios...]
│   │   │   ├── CalendarioPage.tsx           ← nuevo
│   │   │   ├── ConfiguracionPage.tsx        ← nuevo
│   │   │   ├── DonacionesPage.tsx           ← nuevo
│   │   │   ├── MensajesPage.tsx             ← nuevo
│   │   │   ├── ReportesPage.tsx             ← nuevo
│   │   │   ├── config/                      ← nuevo (10 secciones)
│   │   │   │   ├── shared.tsx
│   │   │   │   ├── PerfilSection.tsx
│   │   │   │   ├── EquipoSection.tsx
│   │   │   │   ├── NotificacionesSection.tsx
│   │   │   │   ├── AdopcionesConfigSection.tsx
│   │   │   │   ├── AcogidasConfigSection.tsx
│   │   │   │   ├── ObjetivosSection.tsx
│   │   │   │   ├── IntegracionesSection.tsx
│   │   │   │   ├── AparienciaSection.tsx
│   │   │   │   ├── DatosSection.tsx
│   │   │   │   └── PlanSection.tsx
│   │   │   ├── donaciones/                  ← nuevo
│   │   │   │   ├── ResumenTab.tsx
│   │   │   │   ├── HistorialTab.tsx
│   │   │   │   ├── CampanasTab.tsx
│   │   │   │   ├── DonacionModal.tsx
│   │   │   │   ├── CampanaModal.tsx
│   │   │   │   └── ReceiptGenerator.ts
│   │   │   └── reportes/                    ← nuevo
│   │   │       ├── shared.tsx
│   │   │       ├── SummaryTab.tsx
│   │   │       ├── AnimalesTab.tsx
│   │   │       ├── AdopcionesTab.tsx
│   │   │       ├── AcogidasTab.tsx
│   │   │       └── SosPetTab.tsx
│   │   ├── types/index.ts
│   │   ├── utils/PosterGenerator.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts           ← cacheDir fuera de Dropbox
│
├── portal/                      ← Portal público (puerto 5174)
│   ├── src/
│   │   ├── api/client.ts
│   │   ├── components/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── AnimalCard.tsx   ← con favoritos localStorage
│   │   │   ├── AnimatedCounter.tsx
│   │   │   └── SEOHead.tsx
│   │   ├── forms/AdoptionForm.tsx ← 5 pasos, guarda draft localStorage
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── AdoptarPage.tsx
│   │   │   ├── AnimalDetailPage.tsx
│   │   │   ├── SosPage.tsx
│   │   │   ├── ProtectorasPage.tsx
│   │   │   ├── ProtectoraDetailPage.tsx
│   │   │   ├── ComoFuncionaPage.tsx
│   │   │   └── SobreNosotrosPage.tsx
│   │   ├── types/index.ts
│   │   ├── App.tsx              ← React Router v6
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts           ← puerto 5174, proxy /api
│
├── scripts/
│   ├── seed-acogidas.js         ← 15 familias, acogidas, karma events
│   ├── seed-voluntarios.js      ← 8 voluntarios, 25 tareas, karma events
│   ├── seed-sos.js              ← 20 avisos Madrid área metropolitana
│   ├── seed-reportes.js         ← 63 animales + 38 adopciones + 30 acogidas + 86 SOS históricos
│   ├── seed-mensajes.js         ← 9 conversaciones + 75 mensajes (7 días)
│   ├── seed-calendario.js       ← 31 eventos (-30d a +60d, incluye hoy)
│   └── seed-donaciones.js       ← 3 campañas + 50 donaciones + 14 donantes
│
└── ESTADO_PROYECTO.md
```

---

## Dependencias instaladas

### Backend
| Paquete | Versión | Uso |
|---------|---------|-----|
| express | ^4.19.2 | Framework web |
| pg | ^8.11.5 | Driver PostgreSQL |
| jsonwebtoken | ^9.0.2 | JWT auth |
| bcryptjs | ^2.4.3 | Hash contraseñas |
| dotenv | ^16.4.5 | Variables de entorno |
| helmet | ^7.1.0 | Cabeceras seguridad HTTP |
| cors | ^2.8.5 | CORS |
| multer | ^2.1.1 | Upload archivos |
| @anthropic-ai/sdk | ^0.100.1 | Claude API (Instagram + resumen IA) |
| ts-node-dev | ^2.0.0 | Dev server con hot-reload |
| typescript | ^5.4.5 | Compilador TS |

### CRM Frontend
| Paquete | Versión | Uso |
|---------|---------|-----|
| react + react-dom | ^18.3.1 | UI framework |
| vite | ^5.2.12 | Bundler + dev server |
| leaflet + react-leaflet | ^1.9.4 / ^5.0 | Mapas OpenStreetMap |
| @dnd-kit/core + sortable | ^6.3 / ^10 | Drag & drop |
| canvas-confetti | ^1.9.4 | Animaciones celebración |
| jspdf | ^4.2.1 | Generación PDFs (recibos, carteles SOS) |
| qrcode | ^1.5.4 | QR codes en carteles |
| recharts | latest | Gráficos (Reportes, Donaciones) |
| react-is | latest | Dependencia de recharts |
| html2canvas | latest | Capturas para PDF |
| jszip | latest | Exportación ZIP |
| @fullcalendar/react + plugins | latest | Módulo Calendario |

### Portal Público
| Paquete | Versión | Uso |
|---------|---------|-----|
| react + react-dom | ^18.3.1 | UI framework |
| react-router-dom | ^6.26.1 | Routing (URL-based) |
| react-helmet-async | ^2.0.5 | SEO meta tags |
| leaflet + react-leaflet | ^4.2.1 | Mapa SOS |

---

## Sistema de roles y permisos

```
admin       → acceso total a todo el CRM incluyendo Configuración
coordinador → todo excepto: eliminar animales, gestionar usuarios, acceder a Config
voluntario  → solo lectura + completar sus propias tareas + añadir notas
```

---

## Sistema de karma

**Voluntarios**: tareas +2/+5/+10 según prioridad baja/media/alta

**Familias de acogida**:
- +1pt cada 7 días de acogida activa
- +10 animal adoptado desde el hogar
- +20 necesidades especiales / +10 cachorro / +15 senior
- +50 primera acogida completada
- +10 valoración 5 estrellas

**Niveles**: Bronce (0-99) → Plata (100-299) → Oro (300-599) → Platino (600-999) → Diamante (1000+)

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
| (+ 6 voluntarios más del seed-voluntarios) | Voluntario1! | Voluntario |

---

## Datos de demo cargados

| Seed | Registros |
|------|-----------|
| `npm run seed` | 1 refugio, 4 usuarios base, 5 animales, 3 avisos, 3 donaciones legacy, 3 eventos |
| `seed-acogidas.js` | 15 familias, 5 acogidas activas, 20 historial, 20 contactos, 184 karma events |
| `seed-voluntarios.js` | 8 voluntarios, 25 tareas (6 vencidas, 1 hoy), 363 karma events |
| `seed-sos.js` | 20 avisos Madrid área metropolitana (10 perdidos + 10 avistados) |
| `seed-reportes.js` | 63 animales históricos, 38 adopciones completadas, 30 acogidas, 86 avisos SOS |
| `seed-mensajes.js` | 9 conversaciones (internas + adoptantes + familias), 75 mensajes |
| `seed-calendario.js` | 31 eventos distribuidos -30d a +60d (incluye evento para hoy) |
| `seed-donaciones.js` | 3 campañas, 50 donaciones (6 meses), 14 donantes en directorio |

---

## Notas de operación

- **3 servidores** deben estar corriendo: backend (4000), CRM (5173), portal (5174)
- El backend carga el `.env` al arrancar; cambios en `.env` requieren reinicio
- `ts-node-dev` hace hot-reload de cambios en código TypeScript pero NO en `.env`
- La cuenta de Anthropic necesita créditos para: generador Instagram, resumen IA en Reportes
- El bucket `sos-photos` y `shelter-assets` deben crearse manualmente en Supabase Storage
- El portal público (`/adoptar`) solo muestra animales con `web_publicado=true` y `estado='en_adopcion'`
- Para que aparezcan animales en el portal: activar `web_publicado=true` desde la ficha del animal en el CRM
- El color principal del CRM se puede personalizar en Config → Apariencia (aplica CSS var `--color-primary`)
- La caché de Vite del CRM está en `%TEMP%/vite-resqpet-frontend` para evitar conflictos con Dropbox
