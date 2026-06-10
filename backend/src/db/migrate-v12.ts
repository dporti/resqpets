import { pool } from './pool';

const migration = `
-- ── ANIMAL EXPENSES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS animal_expenses (
  id            SERIAL PRIMARY KEY,
  shelter_id    INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  animal_id     INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  category      TEXT NOT NULL DEFAULT 'otros'
                  CHECK (category IN ('veterinario','alimentacion','medicacion','alojamiento','transporte','esterilizacion','otros')),
  description   TEXT,
  amount        NUMERIC(10,2) NOT NULL,
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url   TEXT,
  created_by    INTEGER REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_shelter ON animal_expenses(shelter_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_animal ON animal_expenses(animal_id);

-- ── DONATIONS: link directly to an animal (independent of campaigns) ──
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS animal_id INTEGER REFERENCES animales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donations_animal ON donations(animal_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v12: animal_expenses + donations.animal_id');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v12 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
