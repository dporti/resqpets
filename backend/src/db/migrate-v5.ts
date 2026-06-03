import { pool } from './pool';

const schema = `
-- Extender tabla usuarios con campos de voluntariado
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS karma_puntos INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_disponible BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS racha_dias INTEGER DEFAULT 0;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id            SERIAL PRIMARY KEY,
  refugio_id    INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  titulo        VARCHAR(300) NOT NULL,
  descripcion   TEXT,
  categoria     VARCHAR(50) DEFAULT 'administrativa',
  prioridad     VARCHAR(20) DEFAULT 'media',
  estado        VARCHAR(30) DEFAULT 'pending',
  animal_id     INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  asignado_a    INTEGER[] DEFAULT '{}',
  creado_por    INTEGER REFERENCES usuarios(id),
  fecha_limite  DATE,
  es_recurrente BOOLEAN DEFAULT FALSE,
  frecuencia    VARCHAR(20),
  fin_recurrencia DATE,
  completada_at TIMESTAMPTZ,
  completada_por INTEGER REFERENCES usuarios(id),
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_refugio   ON tasks(refugio_id);
CREATE INDEX IF NOT EXISTS idx_tasks_estado    ON tasks(estado);
CREATE INDEX IF NOT EXISTS idx_tasks_asignado  ON tasks USING GIN(asignado_a);

CREATE OR REPLACE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function migrateV5() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running v5 migrations...');
    await client.query(schema);
    console.log('✅ V5 done (tasks table + usuarios extended)');
  } catch (err) {
    console.error('❌ Migration v5 error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV5();
