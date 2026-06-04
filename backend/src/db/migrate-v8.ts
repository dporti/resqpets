import { pool } from './pool';

const migration = `
-- ── CONVERSACIONES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                    SERIAL PRIMARY KEY,
  shelter_id            INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  type                  VARCHAR(20) DEFAULT 'internal',
  name                  VARCHAR(200),
  avatar_url            TEXT,
  contact_name          VARCHAR(200),
  contact_email         VARCHAR(200),
  related_animal_id     INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  related_request_id    INTEGER REFERENCES adoption_requests(id) ON DELETE SET NULL,
  related_assignment_id INTEGER REFERENCES foster_assignments(id) ON DELETE SET NULL,
  last_message_at       TIMESTAMPTZ,
  created_by            INTEGER REFERENCES usuarios(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_shelter ON conversations(shelter_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last ON conversations(last_message_at DESC);

-- ── PARTICIPANTES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_participants (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  is_admin        BOOLEAN DEFAULT FALSE,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversation_participants(user_id);

-- ── MENSAJES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  sender_name     VARCHAR(200),
  content         TEXT,
  message_type    VARCHAR(20) DEFAULT 'text',
  file_url        TEXT,
  file_name       VARCHAR(200),
  file_size       INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

-- ── EVENTOS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   SERIAL PRIMARY KEY,
  shelter_id           INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  title                VARCHAR(200) NOT NULL,
  event_type           VARCHAR(30) DEFAULT 'other',
  color                VARCHAR(20),
  start_at             TIMESTAMPTZ NOT NULL,
  end_at               TIMESTAMPTZ,
  all_day              BOOLEAN DEFAULT FALSE,
  location             VARCHAR(200),
  description          TEXT,
  animal_id            INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  assigned_to          INTEGER[],
  reminder_minutes     INTEGER,
  is_recurring         BOOLEAN DEFAULT FALSE,
  recurrence_rule      VARCHAR(50),
  recurrence_end_date  DATE,
  auto_generated       BOOLEAN DEFAULT FALSE,
  source_type          VARCHAR(30),
  source_id            INTEGER,
  created_by           INTEGER REFERENCES usuarios(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_shelter_start ON events(shelter_id, start_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('✅ migrate-v8: mensajes + calendario aplicado');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ migrate-v8 error:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
