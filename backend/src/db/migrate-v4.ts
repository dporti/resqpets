import { pool } from './pool';

const schema = `
CREATE TABLE IF NOT EXISTS foster_families (
  id                        SERIAL PRIMARY KEY,
  refugio_id                INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  nombre                    VARCHAR(200) NOT NULL,
  email                     VARCHAR(200),
  telefono                  VARCHAR(30),
  direccion                 TEXT,
  ciudad                    VARCHAR(100),
  zona                      VARCHAR(100),
  max_animales              INTEGER DEFAULT 1,
  animales_actuales         INTEGER DEFAULT 0,
  acepta_perros             BOOLEAN DEFAULT TRUE,
  acepta_gatos              BOOLEAN DEFAULT FALSE,
  acepta_otros              BOOLEAN DEFAULT FALSE,
  acepta_pequeño            BOOLEAN DEFAULT TRUE,
  acepta_mediano            BOOLEAN DEFAULT TRUE,
  acepta_grande             BOOLEAN DEFAULT FALSE,
  acepta_necesidades_especiales BOOLEAN DEFAULT FALSE,
  acepta_cachorros          BOOLEAN DEFAULT TRUE,
  acepta_seniors            BOOLEAN DEFAULT FALSE,
  tiene_jardin              BOOLEAN DEFAULT FALSE,
  otros_animales_casa       TEXT,
  ninos_casa                BOOLEAN DEFAULT FALSE,
  edades_ninos              VARCHAR(100),
  notas                     TEXT,
  estado                    VARCHAR(20) DEFAULT 'available',
  karma_puntos              INTEGER DEFAULT 0,
  avatar_url                TEXT,
  fecha_alta                DATE DEFAULT CURRENT_DATE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foster_assignments (
  id                SERIAL PRIMARY KEY,
  refugio_id        INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  animal_id         INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  familia_id        INTEGER REFERENCES foster_families(id) ON DELETE SET NULL,
  iniciada_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  fin_estimado_at   DATE,
  finalizada_at     DATE,
  estado            VARCHAR(20) DEFAULT 'active',
  motivo_fin        VARCHAR(100),
  valoracion        SMALLINT CHECK (valoracion BETWEEN 1 AND 5),
  notas_valoracion  TEXT,
  notas_coordinador TEXT,
  creado_por        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foster_contacts (
  id                SERIAL PRIMARY KEY,
  refugio_id        INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  assignment_id     INTEGER REFERENCES foster_assignments(id) ON DELETE CASCADE,
  tipo              VARCHAR(50) DEFAULT 'llamada',
  contactado_at     TIMESTAMPTZ DEFAULT NOW(),
  estado_animal     VARCHAR(50) DEFAULT 'bien',
  notas             TEXT,
  requiere_accion   BOOLEAN DEFAULT FALSE,
  descripcion_accion TEXT,
  creado_por        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS karma_events (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) DEFAULT 'foster_family',
  entity_id   INTEGER NOT NULL,
  puntos      INTEGER NOT NULL,
  razon       VARCHAR(300),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foster_families_refugio  ON foster_families(refugio_id);
CREATE INDEX IF NOT EXISTS idx_foster_families_estado   ON foster_families(estado);
CREATE INDEX IF NOT EXISTS idx_foster_assignments_animal ON foster_assignments(animal_id);
CREATE INDEX IF NOT EXISTS idx_foster_assignments_familia ON foster_assignments(familia_id);
CREATE INDEX IF NOT EXISTS idx_foster_assignments_estado ON foster_assignments(estado);
CREATE INDEX IF NOT EXISTS idx_foster_contacts_assignment ON foster_contacts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_karma_events_entity      ON karma_events(entity_type, entity_id);

CREATE OR REPLACE TRIGGER trg_foster_families_updated
  BEFORE UPDATE ON foster_families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_foster_assignments_updated
  BEFORE UPDATE ON foster_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function migrateV4() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running v4 migrations...');
    await client.query(schema);
    console.log('✅ V4 done (foster_families, foster_assignments, foster_contacts, karma_events)');
  } catch (err) {
    console.error('❌ Migration v4 error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV4();
