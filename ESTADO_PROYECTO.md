# ResQPet — Estado del Proyecto

**CRM para protectoras de animales**  
Última actualización: junio 2026  
Repositorio: https://github.com/dporti/resqpets

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 18 + Express 4 + TypeScript 5 |
| Base de datos | PostgreSQL vía Supabase (pool Supavisor) |
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| Autenticación | JWT propio (bcryptjs + jsonwebtoken) |
| Almacenamiento | Supabase Storage |
| IA | Anthropic Claude API (`claude-sonnet-4-6`) |
| Mapas | Leaflet + OpenStreetMap (sin token requerido) |
| PDF | jsPDF + QRCode |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Confetti | canvas-confetti |

---

## Configuración de entorno

### `backend/.env`
```
DATABASE_URL=postgresql://postgres.hbqazfsvktxhzhqfkwht:...@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET=resqpet_jwt_super_secret_2024
JWT_EXPIRES_IN=8h
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://hbqazfsvktxhzhqfkwht.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

### Variables de entorno frontend (opcionales)
```
VITE_SUPABASE_URL=https://hbqazfsvktxhzhqfkwht.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  (necesario para upload fotos SOS desde form público)
```

### Arrancar el proyecto
```bash
# Backend (puerto 4000)
cd backend && npm run dev

# Frontend (puerto 5173)
cd frontend && npm run dev

# Ejecutar todas las migraciones (si BD nueva)
cd backend
npx ts-node --transpile-only src/db/migrate.ts
npx ts-node --transpile-only src/db/migrate-v2.ts
npx ts-node --transpile-only src/db/migrate-v3.ts
npx ts-node --transpile-only src/db/migrate-v4.ts
npx ts-node --transpile-only src/db/migrate-v5.ts
npx ts-node --transpile-only src/db/migrate-v6.ts
npm run seed

# Seeds de módulos
node scripts/seed-acogidas.js
node scripts/seed-voluntarios.js
node scripts/seed-sos.js
```

### Decisión técnica: conexión Supabase
La BD se conecta via **Supabase Supavisor Transaction Pooler** en lugar de conexión directa porque:
- Supabase free tier solo ofrece IPv6 para conexión directa
- La máquina de desarrollo no tiene conectividad IPv6 a internet
- El pooler usa `aws-1-eu-north-1` (prefijo `aws-1`, NO `aws-0`)
- Puerto 6543 (transaction mode)

---

## Módulos implementados

### ✅ 1. Dashboard (`/inicio`)
- Stats: total animales, en acogida, en adopción, avisos activos
- Tabla animales recientes (click → detalle)
- Gráfico donut distribución por estado
- Adopciones y donaciones del mes con sparkline
- Actividad reciente, próximos eventos
- Panel lateral: avisos activos, agenda

### ✅ 2. Animales (`/animales`)
- Listado con filtros por estado (tabs pill), especie, buscador debounced
- Paginación (20 por página)
- Tabla con chips sanitarios (Vac/Est/Chip)
- **Detalle animal** (`DetalleAnimalPage`):
  - Header sticky con prev/next (AnimalListContext)
  - Galería de fotos + upload a Supabase Storage (`animal-photos`)
  - 6 tabs: Información · Salud · Comportamiento · Documentos · Historia · Redes
  - Tab Salud: timeline health_events con modal registro
  - Tab Comportamiento: evaluaciones con sliders, sincroniza animal
  - Tab Documentos: grid + modal URL
  - Tab Historia: timeline actividad
  - Tab Redes: toggle web, métricas, generador Instagram (Claude API)
  - Panel derecho: actividad, notas con pin, difusión
- Formulario crear/editar (`AnimalForm`): slide-over con 5 tabs

### ✅ 3. Adopciones (`/adopciones`)
- **Vista Solicitudes** (tabla + kanban con drag & drop @dnd-kit)
- **Vista Expedientes** con seguimiento por fases
- Slide-over `SolicitudPanel`: score compatibilidad (0-100%), desglose criterios, entrevista modal, rechazar/aprobar
- Slide-over `ExpedientePanel`: checklist 4 fases (Documentación→Seguimiento), confetti al cerrar
- Score compatibilidad calculado en frontend: jardín+niños+experiencia+horas_solo+otros_animales

### ✅ 4. Acogidas (`/acogidas`)
- **Tab Familias**: grid 3 col, slots visuales ●●○, karma badge, filtros
- **Tab Acogidas activas**: días en color (verde<30/amarillo30-90/rojo>90), alerta >90 días
- **Tab Historial**: tabla con duración y valoración estrellas
- `FamiliaPanel`: perfil completo, edición, karma historial, pausar/activar
- `AsignarAcogidaModal`: 3 pasos con score compatibilidad animal↔familia
- `ContactoModal`: tipo, estado animal, requiere acción
- `FinalizarAcogidaModal`: 5 motivos, valoración estrellas, karma automático
- Sistema karma: +1pt/7días, +10 adoptado desde hogar, +20 especiales, +50 primera acogida

### ✅ 5. Voluntarios (`/voluntarios`)
- **Tab Voluntarios**: grid con indicador online, karma nivel/pts, especialidades, stats
- **Tab Tareas**:
  - Filtros: Todas/Pendientes/En progreso/Bloqueadas/Completadas/Vencidas
  - Vista Lista: checkbox → completa + karma automático (+2/+5/+10 según prioridad)
  - Vista Kanban: 4 columnas con drag & drop @dnd-kit
  - `TareaForm`: categoría pills coloreadas (7 categorías), prioridad, asignación múltiple
- **Tab Rankings**:
  - Podio CSS top-3 con coronas y podiums escalonados
  - Tabla por período (Este mes / Este año / Histórico)
  - Toggle Voluntarios / Familias de acogida
  - Beneficios por nivel (Bronce→Diamante)
- `VoluntarioPanel`: bio, especialidades, barra progreso karma, historial eventos
- Karma voluntarios: tareas +2/5/10, racha días, adopciones completadas

### ✅ 6. SOS Pet (`/avisos` + portal público `/sos`)
- **CRM `/avisos`**:
  - Vista Mapa: Leaflet + OpenStreetMap, marcadores 🔴🔵 coloreados por tipo/urgencia, pulsante si alta urgencia
  - Vista Lista: tabla filtrable
  - `SosAlertPanel`: datos animal, contacto encriptado (solo coordinadores), coincidencias IA texto (similitud 0-100%), historial actualizaciones, convertir en rescate
  - Acciones: cambiar estado, PDF cartel, WhatsApp share
- **Portal público `/sos`** (sin autenticación, mobile-first):
  - Detección `window.location.pathname === '/sos'` en main.tsx
  - Form 6 pasos con barra progreso + localStorage draft
  - Fotos con cámara nativa (`capture="environment"`)
  - MapPicker Leaflet con GPS automático y pin arrastrable
  - Confirmación con ref `SOS-XXXX-NNNN`, WhatsApp, PDF cartel (jsPDF + QR)
  - `PosterGenerator.ts`: A4 con foto, header coloreado, detalles, QR code

### ✅ 7. Usuarios (`/usuarios`)
- Tabla usuarios con roles (admin/coordinador/voluntario)
- Crear usuario con contraseña
- Editar rol y estado activo/inactivo
- (Nota: el sidebar "Voluntarios" ahora apunta a VoluntariosPage, no UsuariosPage)

---

## Módulos pendientes / placeholders

| Módulo | Sidebar | Estado |
|--------|---------|--------|
| Adopciones (acogidas) | `adopciones` | ✅ implementado |
| Donaciones | `donaciones` | 📋 Placeholder — tabla BD existe, endpoint GET existe |
| Reportes | `reportes` | 📋 Placeholder |
| Calendario | `calendario` | 📋 Placeholder |
| Mensajes | `mensajes` | 📋 Placeholder |
| Configuración | `configuracion` | 📋 Placeholder |

---

## Tablas de Supabase (PostgreSQL)

### Tablas core (`migrate.ts`)
| Tabla | Descripción |
|-------|-------------|
| `refugios` | Protectoras/organizaciones |
| `usuarios` | Usuarios del sistema (extendida en v5) |
| `animales` | Fichas de animales |
| `animal_fotos` | Fotos de animales |
| `acogidas` | Acogidas legacy (tabla original) |
| `adopciones` | Adopciones legacy |
| `animal_notas` | Notas internas de animales |
| `actividad` | Log de actividad/historial |
| `avisos` | Avisos legacy |
| `donaciones` | Registro de donaciones |
| `eventos` | Calendario de eventos |

### Tablas v2 (`migrate-v2.ts`) — Detalle animal
| Tabla | Descripción |
|-------|-------------|
| `health_events` | Eventos médicos por animal |
| `behavior_evaluations` | Evaluaciones de comportamiento |
| `animal_documents` | Documentos adjuntos |

### Tablas v3 (`migrate-v3.ts`) — Adopciones
| Tabla | Descripción |
|-------|-------------|
| `adoption_requests` | Solicitudes de adopción |
| `adoption_interviews` | Entrevistas programadas |
| `adoption_expedients` | Expedientes de adopción en proceso |
| `expedient_checklist` | Items de checklist por expediente |
| `adoption_timeline` | Timeline de eventos de adopción |

### Tablas v4 (`migrate-v4.ts`) — Acogidas
| Tabla | Descripción |
|-------|-------------|
| `foster_families` | Familias de acogida |
| `foster_assignments` | Asignaciones animal↔familia |
| `foster_contacts` | Contactos de seguimiento |
| `karma_events` | Eventos de puntos karma (familias Y voluntarios) |

### Tablas v5 (`migrate-v5.ts`) — Voluntarios y Tareas
| Tabla | Descripción |
|-------|-------------|
| `tasks` | Tareas del equipo |
| `usuarios` (extendida) | +karma_puntos, +especialidades[], +bio, +es_disponible, +ultima_actividad, +racha_dias |

### Tablas v6 (`migrate-v6.ts`) — SOS Pet
| Tabla | Descripción |
|-------|-------------|
| `sos_alerts` | Avisos de animales perdidos/encontrados |
| `sos_updates` | Actualizaciones de avisos |
| `pending_notifications` | Notificaciones pendientes de leer |

### Buckets Supabase Storage
| Bucket | Uso | Visibilidad |
|--------|-----|-------------|
| `animal-photos` | Fotos de fichas de animales | Público |
| `sos-photos` | Fotos de avisos SOS (crear manualmente) | Público |

---

## API REST — Endpoints (todos bajo `/api`)

### Autenticación
```
POST /auth/login          → JWT token
GET  /auth/me             → Usuario actual
PUT  /auth/password       → Cambiar contraseña
GET  /permisos            → Permisos del rol
```

### Animales
```
GET    /animales                          → Listado (filtros: estado, especie, search, page)
GET    /animales/:id                      → Detalle + fotos + notas + actividad
POST   /animales                          → Crear
PUT    /animales/:id                      → Actualizar
DELETE /animales/:id                      → Eliminar (solo admin)
POST   /animales/:id/notas                → Añadir nota
POST   /animales/:id/fotos                → Upload foto (multipart → Supabase Storage)
DELETE /animales/:id/fotos/:fotoId        → Eliminar foto
PUT    /animales/:id/fotos/:fotoId/principal → Marcar como principal
GET    /animales/:id/health               → Eventos médicos
POST   /animales/:id/health               → Crear evento médico
DELETE /animales/:id/health/:eventId      → Eliminar evento
GET    /animales/:id/behavior             → Evaluaciones comportamiento
POST   /animales/:id/behavior             → Crear evaluación
GET    /animales/:id/documents            → Documentos
POST   /animales/:id/documents            → Crear documento
DELETE /animales/:id/documents/:docId     → Eliminar documento
POST   /animales/:id/instagram            → Generar copy Instagram (Claude API)
```

### SOS Pet
```
GET  /sos/public          → Avisos activos públicos (SIN AUTH)
GET  /sos/public/:id      → Detalle aviso público (SIN AUTH)
POST /sos/public          → Crear aviso desde portal público (SIN AUTH)
GET  /sos                 → Todos los avisos (privado)
GET  /sos/:id             → Detalle con coincidencias IA
PUT  /sos/:id             → Actualizar estado/urgencia
POST /sos/:id/update      → Añadir actualización
POST /sos/:id/rescatar    → Convertir en ficha animal
```

### Voluntarios y Tareas
```
GET  /voluntarios         → Lista con stats de tareas y karma
GET  /voluntarios/:id     → Perfil + karma historial + tareas
PUT  /voluntarios/:id     → Actualizar bio/especialidades/disponibilidad
GET  /tareas              → Lista (filtros: estado, asignado_a, categoria)
POST /tareas              → Crear tarea
PUT  /tareas/:id          → Actualizar tarea
POST /tareas/:id/completar → Completar/descompletar + karma automático
DELETE /tareas/:id        → Eliminar
GET  /rankings            → Rankings voluntarios + familias (periodo: mes/año/total)
```

### Acogidas
```
GET  /acogidas/familias                      → Lista familias
POST /acogidas/familias                      → Crear familia
GET  /acogidas/familias/:id                  → Perfil + acogidas activas + karma
PUT  /acogidas/familias/:id                  → Actualizar
POST /acogidas/familias/:id/asignar          → Asignar animal
GET  /acogidas/activas                       → Asignaciones activas con días
GET  /acogidas/historial                     → Acogidas completadas
GET  /acogidas/assignments/:id/contactos     → Contactos de seguimiento
POST /acogidas/assignments/:id/contacto      → Registrar contacto
POST /acogidas/assignments/:id/finalizar     → Finalizar + karma
```

### Adopciones
```
GET  /adopciones/solicitudes                         → Lista
POST /adopciones/solicitudes                         → Crear
GET  /adopciones/solicitudes/:id                     → Detalle + timeline + entrevistas
PUT  /adopciones/solicitudes/:id                     → Actualizar notas/puntuación
POST /adopciones/solicitudes/:id/estado              → Cambiar estado
POST /adopciones/solicitudes/:id/entrevista          → Programar entrevista
POST /adopciones/solicitudes/:id/aprobar             → Aprobar → crea expediente
GET  /adopciones/expedientes                         → Lista activos
GET  /adopciones/expedientes/:id                     → Detalle + checklist + timeline
PUT  /adopciones/expedientes/:id/checklist/:itemKey  → Toggle item + auto-avance fase
POST /adopciones/expedientes/:id/cerrar              → Cerrar → confetti
```

### Otros
```
GET /dashboard      → Stats + animales recientes + actividad + eventos
GET /usuarios       → Lista usuarios
POST/PUT/DELETE /usuarios/:id
GET /avisos         → Avisos legacy
GET /donaciones     → Donaciones
GET /eventos        → Próximos eventos
```

---

## Estructura de carpetas

```
resqpet/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── acogidas.controller.ts
│   │   │   ├── adopciones.controller.ts
│   │   │   ├── animales.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── behavior.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── fotos.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── instagram.controller.ts
│   │   │   ├── sos.controller.ts
│   │   │   ├── usuarios.controller.ts
│   │   │   └── voluntarios.controller.ts
│   │   ├── db/
│   │   │   ├── migrate.ts     ← v1: tablas core
│   │   │   ├── migrate-v2.ts  ← health_events, behavior_evaluations, animal_documents
│   │   │   ├── migrate-v3.ts  ← adoption_*
│   │   │   ├── migrate-v4.ts  ← foster_*, karma_events
│   │   │   ├── migrate-v5.ts  ← tasks, extiende usuarios
│   │   │   ├── migrate-v6.ts  ← sos_alerts, sos_updates, pending_notifications
│   │   │   ├── pool.ts        ← Conexión Supabase (SSL, pooler)
│   │   │   └── seed.ts        ← Datos demo iniciales
│   │   ├── middleware/
│   │   │   └── auth.ts        ← JWT verify, requireRole, requirePermiso
│   │   ├── routes/
│   │   │   └── index.ts       ← ~155 líneas, todos los endpoints
│   │   ├── types/
│   │   │   └── index.ts       ← UserRole, JwtPayload, PERMISOS, canDo()
│   │   └── index.ts           ← Express app, helmet, cors, port 4000
│   ├── .env                   ← NO en git
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts      ← Todos los métodos API (~120 líneas)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── ui.tsx         ← Badge, AnimalAvatar, Spinner, Card, DotsBar, etc.
│   │   ├── context/
│   │   │   ├── AnimalListContext.tsx  ← prev/next navegación detalle
│   │   │   └── AuthContext.tsx        ← user, token, permisos, login/logout
│   │   ├── pages/
│   │   │   ├── AcogidasPage.tsx
│   │   │   ├── AdopcionesPage.tsx
│   │   │   ├── AnimalForm.tsx
│   │   │   ├── AnimalesPage.tsx
│   │   │   ├── AsignarAcogidaModal.tsx
│   │   │   ├── AvisosPage.tsx
│   │   │   ├── ContactoModal.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DetalleAnimalPage.tsx
│   │   │   ├── ExpedientePanel.tsx
│   │   │   ├── FamiliaPanel.tsx
│   │   │   ├── FinalizarAcogidaModal.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SolicitudPanel.tsx
│   │   │   ├── SosAlertPanel.tsx
│   │   │   ├── SosPublicPage.tsx    ← Portal público /sos
│   │   │   ├── TareaForm.tsx
│   │   │   ├── UsuariosPage.tsx
│   │   │   ├── VoluntarioPanel.tsx
│   │   │   └── VoluntariosPage.tsx
│   │   ├── types/
│   │   │   └── index.ts       ← Todos los tipos TypeScript
│   │   ├── utils/
│   │   │   └── PosterGenerator.ts  ← jsPDF + QRCode
│   │   ├── App.tsx            ← Router por estado (vista string)
│   │   ├── main.tsx           ← Detección /sos para portal público
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts         ← proxy /api → localhost:4000
│
├── scripts/
│   ├── seed-acogidas.js       ← 15 familias, 5 acogidas activas, 20 historial
│   ├── seed-sos.js            ← 20 avisos Madrid y área metropolitana
│   └── seed-voluntarios.js    ← 8 voluntarios, 25 tareas, karma events
│
└── ESTADO_PROYECTO.md         ← Este archivo
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
| multer | ^2.1.1 | Upload archivos (fotos animales) |
| @anthropic-ai/sdk | ^0.100.1 | Claude API (Instagram copy generator) |
| ts-node-dev | ^2.0.0 | Dev server con hot-reload |
| typescript | ^5.4.5 | Compilador TS |

### Frontend
| Paquete | Versión | Uso |
|---------|---------|-----|
| react + react-dom | ^18.3.1 | UI framework |
| vite | ^5.2.12 | Bundler + dev server |
| @vitejs/plugin-react | ^4.3.1 | Plugin React para Vite |
| leaflet + react-leaflet | ^1.9.4 / ^5.0 | Mapas OpenStreetMap |
| @dnd-kit/core + sortable + utilities | ^6.3 / ^10 / ^3.2 | Drag & drop (kanban tareas, kanban adopciones) |
| canvas-confetti | ^1.9.4 | Animación cierre expediente adopción |
| jspdf | ^4.2.1 | Generación PDF carteles SOS |
| qrcode | ^1.5.4 | QR codes en carteles PDF |

---

## Sistema de roles y permisos

```
admin       → acceso total
coordinador → todo excepto: eliminar animales, gestionar usuarios
voluntario  → solo lectura + completar sus propias tareas + añadir notas
```

Matriz de permisos (`backend/src/types/index.ts`):
```
animales:read/create/update/delete/publish
adopciones:read/manage
donaciones:read
reportes:read
avisos:read
usuarios:read/manage
config:manage
```

---

## Sistema de karma

Puntos otorgados automáticamente:

**Voluntarios** (entidad `voluntario` en karma_events):
- Tarea prioridad baja completada: +2 pts
- Tarea prioridad media completada: +5 pts
- Tarea prioridad alta completada: +10 pts

**Familias de acogida** (entidad `foster_family`):
- Por cada 7 días de acogida activa: +1 pt
- Animal adoptado desde el hogar: +10 pts bonus
- Animal con necesidades especiales: +20 pts
- Animal cachorro (<6 meses): +10 pts
- Animal senior (>8 años): +15 pts
- Primera acogida completada: +50 pts
- Valoración 5 estrellas recibida: +10 pts

**Niveles karma**:
| Nivel | Puntos | Beneficio |
|-------|--------|-----------|
| Bronce | 0-99 | Acceso básico CRM |
| Plata | 100-299 | Pienso bonificado 5kg/mes |
| Oro | 300-599 | Descuento 20% veterinario partner |
| Platino | 600-999 | Merchandising ResQPet |
| Diamante | 1000+ | Invitación eventos exclusivos |

---

## Decisiones técnicas importantes

### 1. Autenticación propia vs Supabase Auth
Se usa JWT propio en lugar de Supabase Auth porque:
- El proyecto usa `pg` directo, no el cliente de Supabase JS
- Mayor control sobre el payload del token (incluye `refugioId`)
- No requiere Supabase anon key para operaciones autenticadas

### 2. Routing sin React Router
El CRM usa un state machine (`vista: string`) en lugar de React Router porque:
- App más simple sin dependencia de router
- No requiere configuración de rutas en Vite
- Excepción: `/sos` se detecta por `window.location.pathname` en `main.tsx` para servir la página pública sin autenticación

### 3. Estilos inline
Todos los estilos son CSS-in-JS inline (sin Tailwind, sin CSS Modules) porque:
- Decidido en el diseño inicial para prototipado rápido
- Colores y espaciados coherentes: verde primario `#16a34a`, Inter como tipografía

### 4. Mapa: Leaflet sobre Mapbox
Leaflet + OpenStreetMap elegido sobre Mapbox porque:
- No requiere token ni cuenta de pago
- Mismo resultado visual para el caso de uso
- `react-leaflet` v5 con importación dinámica para evitar problemas con Vite/SSR

### 5. Multer para uploads
Las fotos de animales se suben vía backend (Express + Multer → Supabase Storage REST API) en lugar de desde el frontend directamente porque:
- El service_role key no debe exponerse al cliente
- El backend controla el path: `{refugio_id}/{animal_id}/{timestamp}.ext`

### 6. Portal SOS público sin autenticación
El endpoint `POST /api/sos/public` no requiere JWT para que cualquier ciudadano pueda reportar animales desde el portal público sin crear cuenta.

### 7. Score compatibilidad calculado en frontend
El algoritmo de compatibilidad animal↔familia (adopciones) y animal↔aviso SOS (matchmaking) se calcula en el cliente para evitar llamadas extra al API en cada cambio de filtro.

### 8. Generación PDF en cliente
`PosterGenerator.ts` usa jsPDF en el browser (no en servidor) para evitar dependencias pesadas en el backend y permitir que la generación funcione incluso offline.

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
| (+ 6 voluntarios más) | Voluntario1! | Voluntario |

---

## Datos de demo cargados

| Seed | Registros |
|------|-----------|
| `npm run seed` | 1 refugio, 4 usuarios, 5 animales, 3 avisos, 3 donaciones, 3 eventos |
| `seed-acogidas.js` | 15 familias, 5 acogidas activas, 20 historial, 20 contactos, 184 karma events |
| `seed-voluntarios.js` | 8 voluntarios, 25 tareas (6 vencidas, 1 hoy), 363 karma events |
| `seed-sos.js` | 20 avisos Madrid área metropolitana (10 perdidos + 10 avistados) |

---

## Notas de operación

- **Backend y frontend** deben correr en ventanas de PowerShell separadas con `-NoExit`
- Matar todos los procesos `node.exe` también mata Vite — reiniciar ambos
- El backend carga el `.env` al arrancar; cambios en `.env` requieren reinicio
- La cuenta de Anthropic necesita créditos para el generador Instagram — sin créditos devuelve error 400 (el resto de la app funciona normalmente)
- El bucket `sos-photos` debe crearse manualmente en Supabase Storage si se usa el form público con upload de fotos
