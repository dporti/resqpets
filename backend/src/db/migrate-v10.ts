import { pool } from './pool';

const migration = `
-- ── DONATION CAMPAIGNS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donation_campaigns (
  id                      SERIAL PRIMARY KEY,
  shelter_id              INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  name                    VARCHAR(200) NOT NULL,
  slug                    VARCHAR(100),
  description_short       TEXT,
  description_long        TEXT,
  cover_image_url         TEXT,
  goal_amount             NUMERIC(10,2) DEFAULT 0,
  raised_amount           NUMERIC(10,2) DEFAULT 0,
  status                  TEXT DEFAULT 'draft',
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  is_public               BOOLEAN DEFAULT true,
  show_on_animal_profiles BOOLEAN DEFAULT false,
  related_animal_id       INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  primary_color           TEXT DEFAULT '#16a34a',
  created_by              INTEGER REFERENCES usuarios(id),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_shelter ON donation_campaigns(shelter_id);

-- ── DONATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id                       SERIAL PRIMARY KEY,
  shelter_id               INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  amount                   NUMERIC(10,2) NOT NULL,
  currency                 TEXT DEFAULT 'EUR',
  channel                  TEXT DEFAULT 'transfer',
  donation_type            TEXT DEFAULT 'one_time',
  recurrence_frequency     TEXT,
  next_donation_date       DATE,
  status                   TEXT DEFAULT 'confirmed',
  campaign_id              INTEGER REFERENCES donation_campaigns(id) ON DELETE SET NULL,
  is_anonymous             BOOLEAN DEFAULT false,
  donor_name               VARCHAR(200),
  donor_email              VARCHAR(200),
  donor_phone              VARCHAR(30),
  donor_nif                VARCHAR(20),
  concept                  TEXT,
  internal_reference       VARCHAR(100),
  stripe_session_id        TEXT,
  stripe_payment_intent_id TEXT,
  receipt_number           VARCHAR(50),
  receipt_sent_at          TIMESTAMPTZ,
  registered_by            INTEGER REFERENCES usuarios(id),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_shelter ON donations(shelter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_email);

-- ── DONORS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donors (
  id                SERIAL PRIMARY KEY,
  shelter_id        INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  name              VARCHAR(200),
  email             VARCHAR(200),
  phone             VARCHAR(30),
  nif               VARCHAR(20),
  total_donated     NUMERIC(10,2) DEFAULT 0,
  donations_count   INTEGER DEFAULT 0,
  is_recurring      BOOLEAN DEFAULT false,
  first_donation_at TIMESTAMPTZ,
  last_donation_at  TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shelter_id, email)
);

CREATE INDEX IF NOT EXISTS idx_donors_shelter ON donors(shelter_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v10: donations + donation_campaigns + donors');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v10 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
