import { pool } from './pool';

const migration = `
-- ── REFUGIOS: columnas portal público ─────────────────────────────────
ALTER TABLE refugios
  ADD COLUMN IF NOT EXISTS ciudad            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS slug              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description_public TEXT,
  ADD COLUMN IF NOT EXISTS cover_url         TEXT,
  ADD COLUMN IF NOT EXISTS website           VARCHAR(200),
  ADD COLUMN IF NOT EXISTS instagram         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_public         BOOLEAN DEFAULT true;

-- Índice único solo sobre filas con slug no nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_refugios_slug
  ON refugios(slug) WHERE slug IS NOT NULL;

-- Genera slugs automáticos para refugios que no tengan
UPDATE refugios
SET slug = LOWER(REGEXP_REPLACE(
  TRANSLATE(nombre,
    'áéíóúàèìòùäëïöüÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ',
    'aeiouaeiouaeiouAEIOUAEIOUAEIOUnn'),
  '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- ── ANIMAL_ANALYTICS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animal_analytics (
  id             SERIAL PRIMARY KEY,
  animal_id      INTEGER REFERENCES animales(id) ON DELETE CASCADE,
  unique_visits  INTEGER DEFAULT 0,
  shares         INTEGER DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_animal_analytics_animal
  ON animal_analytics(animal_id);

CREATE INDEX IF NOT EXISTS idx_animales_portal
  ON animales(web_publicado, estado);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v7: portal público aplicado');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v7 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
