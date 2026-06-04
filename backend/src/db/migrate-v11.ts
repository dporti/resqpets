import { pool } from './pool';

const migration = `
ALTER TABLE refugios
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free'
    CHECK (plan_id IN ('free','starter','pro','enterprise')),
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Inicializar plan_started_at para refugios existentes
UPDATE refugios SET plan_started_at = NOW() WHERE plan_started_at IS NULL;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v11: billing columns en refugios');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v11 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
