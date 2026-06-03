import { pool } from './pool';

const schema = `
CREATE TABLE IF NOT EXISTS sos_alerts (
  id                      SERIAL PRIMARY KEY,
  refugio_id              INTEGER REFERENCES refugios(id) ON DELETE SET NULL,
  tipo                    VARCHAR(10) NOT NULL DEFAULT 'lost',
  urgencia                VARCHAR(10) NOT NULL DEFAULT 'medium',
  estado                  VARCHAR(20) NOT NULL DEFAULT 'active',
  especie                 VARCHAR(50),
  raza                    VARCHAR(100),
  color                   VARCHAR(100),
  tamaño                  VARCHAR(20),
  lleva_collar            BOOLEAN DEFAULT FALSE,
  señas_particulares      TEXT,
  nombre_animal           VARCHAR(100),
  descripcion             TEXT,
  fotos                   TEXT[] DEFAULT '{}',
  latitud                 DECIMAL(10,7),
  longitud                DECIMAL(10,7),
  ubicacion_descripcion   VARCHAR(300),
  visto_en                TIMESTAMPTZ DEFAULT NOW(),
  reportero_nombre        VARCHAR(200),
  reportero_telefono      VARCHAR(30),
  reportero_email         VARCHAR(200),
  quiere_notificaciones   BOOLEAN DEFAULT FALSE,
  codigo_referencia       VARCHAR(30) UNIQUE,
  es_publico              BOOLEAN DEFAULT TRUE,
  convertido_a_animal_id  INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_updates (
  id            SERIAL PRIMARY KEY,
  sos_alert_id  INTEGER REFERENCES sos_alerts(id) ON DELETE CASCADE,
  contenido     TEXT NOT NULL,
  creado_por    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_notifications (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(50),
  titulo      VARCHAR(200),
  mensaje     TEXT,
  datos       JSONB,
  leida       BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_refugio  ON sos_alerts(refugio_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_estado   ON sos_alerts(estado);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_tipo     ON sos_alerts(tipo);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_coords   ON sos_alerts(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_sos_updates_alert   ON sos_updates(sos_alert_id);

CREATE OR REPLACE TRIGGER trg_sos_alerts_updated
  BEFORE UPDATE ON sos_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

async function migrateV6() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running v6 migrations...');
    await client.query(schema);
    console.log('✅ V6 done (sos_alerts, sos_updates, pending_notifications)');
  } catch (err) {
    console.error('❌ Migration v6 error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV6();
