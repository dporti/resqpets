import { pool } from './pool';

const migration = `
-- ── SHELTER CONFIG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shelter_config (
  id                          SERIAL PRIMARY KEY,
  shelter_id                  INTEGER UNIQUE REFERENCES refugios(id) ON DELETE CASCADE,
  -- Adopciones
  adoption_fee                NUMERIC DEFAULT 0,
  requires_home_visit         BOOLEAN DEFAULT false,
  requires_interview          BOOLEAN DEFAULT true,
  max_response_days           INTEGER DEFAULT 7,
  email_confirmation_text     TEXT,
  email_rejection_text        TEXT,
  email_approval_text         TEXT,
  -- Acogidas
  requires_family_visit       BOOLEAN DEFAULT false,
  max_foster_days             INTEGER DEFAULT 90,
  follow_up_frequency         TEXT DEFAULT 'weekly',
  karma_points_per_week       INTEGER DEFAULT 1,
  karma_bonus_adoption        INTEGER DEFAULT 10,
  foster_welcome_text         TEXT,
  -- Objetivos
  goal_adoptions_monthly      INTEGER DEFAULT 0,
  goal_donations_monthly      NUMERIC DEFAULT 0,
  goal_foster_families_monthly INTEGER DEFAULT 0,
  goal_sos_resolved_monthly   INTEGER DEFAULT 0,
  max_capacity                INTEGER DEFAULT 50,
  -- Alertas
  alert_days_no_update        INTEGER DEFAULT 30,
  alert_capacity_percent      INTEGER DEFAULT 80,
  alert_donations_percent     INTEGER DEFAULT 30,
  -- Integraciones
  stripe_publishable_key      TEXT,
  stripe_secret_key           TEXT,
  stripe_account_id           TEXT,
  resend_api_key              TEXT,
  resend_from_email           TEXT,
  resend_from_name            TEXT,
  google_calendar_token       JSONB,
  donations_enabled           BOOLEAN DEFAULT false,
  donation_amounts            INTEGER[] DEFAULT '{5,10,25,50}',
  -- Apariencia
  primary_color               TEXT DEFAULT '#22c55e',
  crm_display_name            TEXT,
  interface_density           TEXT DEFAULT 'normal',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed config para refugios existentes
INSERT INTO shelter_config (shelter_id)
SELECT id FROM refugios
ON CONFLICT (shelter_id) DO NOTHING;

-- ── AUDIT LOG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id             SERIAL PRIMARY KEY,
  shelter_id     INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  user_nombre    VARCHAR(200),
  action         VARCHAR(100) NOT NULL,
  resource_type  VARCHAR(50),
  resource_id    INTEGER,
  resource_name  VARCHAR(200),
  details        JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_shelter ON audit_log(shelter_id, created_at DESC);

-- ── INVITATIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id          SERIAL PRIMARY KEY,
  shelter_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  email       VARCHAR(200) NOT NULL,
  rol         TEXT DEFAULT 'voluntario',
  token       VARCHAR(100) UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  message     TEXT,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v9: shelter_config + audit_log + invitations');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v9 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
