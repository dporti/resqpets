import { pool } from './pool';

const schema = `
CREATE TABLE IF NOT EXISTS health_events (
  id          SERIAL PRIMARY KEY,
  animal_id   INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  tipo        VARCHAR(50) NOT NULL DEFAULT 'otro',
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo      VARCHAR(300) NOT NULL,
  descripcion TEXT,
  created_by  INTEGER REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavior_evaluations (
  id                 SERIAL PRIMARY KEY,
  animal_id          INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  refugio_id         INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  fecha              DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluador          VARCHAR(200),
  nivel_actividad    SMALLINT DEFAULT 0 CHECK (nivel_actividad BETWEEN 0 AND 5),
  soc_perros         SMALLINT DEFAULT 0 CHECK (soc_perros BETWEEN 0 AND 5),
  soc_gatos          SMALLINT DEFAULT 0 CHECK (soc_gatos BETWEEN 0 AND 5),
  soc_niños          SMALLINT DEFAULT 0 CHECK (soc_niños BETWEEN 0 AND 5),
  hogar_ideal        VARCHAR(100),
  experiencia_previa VARCHAR(100),
  notas              TEXT,
  created_by         INTEGER REFERENCES usuarios(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_documents (
  id         SERIAL PRIMARY KEY,
  animal_id  INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  refugio_id INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  tipo       VARCHAR(100) DEFAULT 'otro',
  nombre     VARCHAR(300) NOT NULL,
  file_url   TEXT NOT NULL,
  subido_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_events_animal  ON health_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_behavior_evals_animal ON behavior_evaluations(animal_id);
CREATE INDEX IF NOT EXISTS idx_documents_animal      ON animal_documents(animal_id);
`;

async function migrateV2() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running v2 migrations...');
    await client.query(schema);
    console.log('✅ V2 migrations completed (health_events, behavior_evaluations, animal_documents)');
  } catch (err) {
    console.error('❌ Migration v2 error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV2();
