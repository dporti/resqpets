import { pool } from './pool';

const schema = `
-- ───────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'coordinador', 'voluntario');
CREATE TYPE animal_estado AS ENUM (
  'en_acogida', 'en_residencia', 'en_adopcion',
  'en_proceso', 'en_evaluacion', 'fallecido'
);
CREATE TYPE animal_especie AS ENUM ('perro', 'gato', 'otro');
CREATE TYPE animal_sexo AS ENUM ('macho', 'hembra');
CREATE TYPE animal_tamaño AS ENUM ('pequeño', 'mediano', 'grande');
CREATE TYPE aviso_tipo AS ENUM ('perdido', 'encontrado', 'urgente');
CREATE TYPE aviso_estado AS ENUM ('activo', 'resuelto', 'archivado');
CREATE TYPE actividad_tipo AS ENUM (
  'acogida', 'vacunacion', 'desparasitacion',
  'veterinario', 'adopcion', 'rescate', 'nota', 'otro'
);

-- ───────────────────────────────────────────────
-- REFUGIOS / PROTECTORAS
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refugios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  direccion   TEXT,
  telefono    VARCHAR(20),
  email       VARCHAR(200),
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- USUARIOS
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  refugio_id    INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  nombre        VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol           user_role NOT NULL DEFAULT 'voluntario',
  avatar_url    TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_refugio ON usuarios(refugio_id);

-- ───────────────────────────────────────────────
-- ANIMALES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animales (
  id                  SERIAL PRIMARY KEY,
  refugio_id          INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  id_interno          VARCHAR(50) UNIQUE,
  nombre              VARCHAR(100) NOT NULL,
  especie             animal_especie NOT NULL DEFAULT 'perro',
  raza                VARCHAR(100),
  sexo                animal_sexo,
  fecha_nacimiento    DATE,
  peso_kg             DECIMAL(5,2),
  estado              animal_estado NOT NULL DEFAULT 'en_evaluacion',
  ubicacion_texto     VARCHAR(200),
  -- Salud
  estado_salud        VARCHAR(100) DEFAULT 'Saludable',
  esterilizado        BOOLEAN DEFAULT FALSE,
  vacunado            BOOLEAN DEFAULT FALSE,
  desparasitado       BOOLEAN DEFAULT FALSE,
  microchip           BOOLEAN DEFAULT FALSE,
  num_microchip       VARCHAR(50),
  pasaporte           BOOLEAN DEFAULT FALSE,
  -- Procedencia
  procedencia         TEXT,
  fecha_entrada       DATE DEFAULT CURRENT_DATE,
  -- Físico
  color               VARCHAR(100),
  tipo_pelo           VARCHAR(50),
  ojos                VARCHAR(50),
  tamaño              animal_tamaño,
  señas_particulares  TEXT,
  -- Comportamiento (1-5, 0 = no testado)
  nivel_actividad     SMALLINT DEFAULT 0 CHECK (nivel_actividad BETWEEN 0 AND 5),
  soc_perros          SMALLINT DEFAULT 0 CHECK (soc_perros BETWEEN 0 AND 5),
  soc_gatos           SMALLINT DEFAULT 0 CHECK (soc_gatos BETWEEN 0 AND 5),
  soc_niños           SMALLINT DEFAULT 0 CHECK (soc_niños BETWEEN 0 AND 5),
  hogar_ideal         VARCHAR(100),
  experiencia_previa  VARCHAR(100),
  -- Descripción y notas
  descripcion         TEXT,
  -- Difusión
  web_publicado       BOOLEAN DEFAULT FALSE,
  veces_compartido    INTEGER DEFAULT 0,
  veces_visto         INTEGER DEFAULT 0,
  contactos_recibidos INTEGER DEFAULT 0,
  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animales_refugio ON animales(refugio_id);
CREATE INDEX IF NOT EXISTS idx_animales_estado ON animales(estado);

-- ───────────────────────────────────────────────
-- FOTOS DE ANIMALES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animal_fotos (
  id          SERIAL PRIMARY KEY,
  animal_id   INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  es_principal BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ACOGIDAS
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acogidas (
  id              SERIAL PRIMARY KEY,
  animal_id       INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  acogedor_nombre VARCHAR(200) NOT NULL,
  acogedor_email  VARCHAR(200),
  acogedor_tel    VARCHAR(30),
  direccion       TEXT,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE,
  activa          BOOLEAN DEFAULT TRUE,
  notas           TEXT,
  created_by      INTEGER REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ADOPCIONES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adopciones (
  id                SERIAL PRIMARY KEY,
  animal_id         INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  adoptante_nombre  VARCHAR(200) NOT NULL,
  adoptante_email   VARCHAR(200),
  adoptante_tel     VARCHAR(30),
  fecha_solicitud   DATE DEFAULT CURRENT_DATE,
  fecha_adopcion    DATE,
  estado            VARCHAR(50) DEFAULT 'pendiente',
  notas             TEXT,
  contrato_url      TEXT,
  created_by        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- NOTAS INTERNAS DE ANIMALES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animal_notas (
  id          SERIAL PRIMARY KEY,
  animal_id   INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  autor_id    INTEGER REFERENCES usuarios(id),
  texto       TEXT NOT NULL,
  pinned      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ACTIVIDAD / HISTORIAL
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actividad (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  animal_id   INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo        actividad_tipo NOT NULL DEFAULT 'otro',
  titulo      VARCHAR(300) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actividad_refugio ON actividad(refugio_id);
CREATE INDEX IF NOT EXISTS idx_actividad_animal ON actividad(animal_id);

-- ───────────────────────────────────────────────
-- AVISOS Y RESCATES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avisos (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  titulo      VARCHAR(300) NOT NULL,
  descripcion TEXT,
  tipo        aviso_tipo NOT NULL DEFAULT 'perdido',
  estado      aviso_estado NOT NULL DEFAULT 'activo',
  ubicacion   VARCHAR(300),
  lat         DECIMAL(9,6),
  lng         DECIMAL(9,6),
  foto_url    TEXT,
  creado_por  INTEGER REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avisos_refugio ON avisos(refugio_id);

-- ───────────────────────────────────────────────
-- DONACIONES
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donaciones (
  id              SERIAL PRIMARY KEY,
  refugio_id      INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  donante_nombre  VARCHAR(200),
  donante_email   VARCHAR(200),
  importe         DECIMAL(10,2) NOT NULL,
  fecha           DATE DEFAULT CURRENT_DATE,
  metodo          VARCHAR(50),
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- EVENTOS / CALENDARIO
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  titulo      VARCHAR(300) NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin    TIMESTAMPTZ,
  lugar        VARCHAR(300),
  creado_por   INTEGER REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- FUNCIÓN updated_at automático
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_animales_updated
  BEFORE UPDATE ON animales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_avisos_updated
  BEFORE UPDATE ON avisos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    await client.query(schema);
    console.log('✅ Migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
