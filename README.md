# 🐾 ResQPet — CRM para Protectoras de Animales

Stack: **Node.js + Express + TypeScript** · **PostgreSQL** · **React + Vite + TypeScript**

---

## 📋 Requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14 (local o remoto)
- npm ≥ 9

---

## 🚀 Instalación

### 1. Base de datos

```bash
# Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE resqpet;"
```

### 2. Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# ↑ Edita .env con tus credenciales de PostgreSQL

# Instalar dependencias
npm install

# Ejecutar migraciones (crea todas las tablas)
npm run migrate

# Cargar datos de demo
npm run seed

# Arrancar en desarrollo
npm run dev
# → API disponible en http://localhost:4000
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev
# → App disponible en http://localhost:5173
```

---

## 👤 Usuarios de demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@resqpet.com | Admin1234! | Admin |
| laura@huellaviva.org | Laura1234! | Coordinadora |
| marta@huellaviva.org | Marta1234! | Voluntaria |
| david@huellaviva.org | David1234! | Voluntario |

---

## 🔐 Roles y permisos

| Permiso | Admin | Coordinador | Voluntario |
|---------|:-----:|:-----------:|:----------:|
| Ver animales | ✅ | ✅ | ✅ |
| Crear/editar animales | ✅ | ✅ | ❌ |
| Eliminar animales | ✅ | ❌ | ❌ |
| Publicar en web | ✅ | ✅ | ❌ |
| Gestionar adopciones | ✅ | ✅ | ❌ |
| Ver donaciones | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

---

## 📁 Estructura del proyecto

```
resqpet/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── db/              # Pool, migrations, seed
│   │   ├── middleware/      # Auth JWT, permisos
│   │   ├── routes/          # Endpoints API
│   │   ├── types/           # Tipos TS + matriz de permisos
│   │   └── index.ts         # Entry point Express
│   ├── .env.example
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api/             # Cliente HTTP (fetch + auth token)
    │   ├── components/      # Sidebar, TopBar, UI components
    │   ├── context/         # AuthContext (user, permisos, login/logout)
    │   ├── pages/           # Dashboard, Detalle Animal, Usuarios, Login
    │   ├── types/           # Tipos TypeScript compartidos
    │   └── main.tsx
    └── vite.config.ts
```

---

## 🔌 API Endpoints

```
POST   /api/auth/login          → Login, devuelve JWT
GET    /api/auth/me             → Usuario actual
PUT    /api/auth/password       → Cambiar contraseña

GET    /api/dashboard           → Datos del dashboard
GET    /api/permisos            → Permisos del rol actual

GET    /api/animales            → Lista (filtros: estado, especie, search, page)
GET    /api/animales/:id        → Detalle completo (+ fotos, notas, actividad)
POST   /api/animales            → Crear animal
PUT    /api/animales/:id        → Actualizar animal
DELETE /api/animales/:id        → Eliminar (solo admin)
POST   /api/animales/:id/notas  → Añadir nota interna

GET    /api/avisos              → Lista de avisos activos
GET    /api/donaciones          → Lista de donaciones
GET    /api/eventos             → Próximos eventos

GET    /api/usuarios            → Lista de usuarios (admin/coordinador)
POST   /api/usuarios            → Crear usuario (admin)
PUT    /api/usuarios/:id        → Actualizar usuario (admin)
DELETE /api/usuarios/:id        → Desactivar usuario (admin)
```

---

## 🏗️ Producción

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# → dist/ listo para servir con nginx o similar
```

> Configura `CORS_ORIGIN` en `.env` con la URL de producción del frontend.
