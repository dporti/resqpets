import { pool } from './pool';

const schema = `
CREATE TABLE IF NOT EXISTS adoption_requests (
  id                SERIAL PRIMARY KEY,
  refugio_id        INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  animal_id         INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  -- Solicitante
  nombre            VARCHAR(200) NOT NULL,
  email             VARCHAR(200),
  telefono          VARCHAR(30),
  tipo_vivienda     VARCHAR(50) DEFAULT 'piso',
  tiene_terraza     BOOLEAN DEFAULT FALSE,
  horas_solo        INTEGER DEFAULT 0,
  experiencia_previa TEXT,
  otros_animales    TEXT,
  ninos             BOOLEAN DEFAULT FALSE,
  edades_ninos      VARCHAR(100),
  motivacion        TEXT,
  -- Estado
  estado            VARCHAR(50) DEFAULT 'pendiente',
  canal             VARCHAR(50) DEFAULT 'web',
  puntuacion        INTEGER DEFAULT 0,
  notas_internas    TEXT,
  motivo_rechazo    TEXT,
  creado_por        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adoption_interviews (
  id          SERIAL PRIMARY KEY,
  refugio_id  INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  request_id  INTEGER REFERENCES adoption_requests(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL,
  tipo        VARCHAR(50) DEFAULT 'presencial',
  notas       TEXT,
  creado_por  INTEGER REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adoption_expedients (
  id                SERIAL PRIMARY KEY,
  refugio_id        INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  request_id        INTEGER REFERENCES adoption_requests(id),
  animal_id         INTEGER REFERENCES animales(id) ON DELETE SET NULL,
  adoptante_nombre  VARCHAR(200),
  adoptante_email   VARCHAR(200),
  adoptante_telefono VARCHAR(30),
  fase_actual       INTEGER DEFAULT 1,
  creado_por        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS expedient_checklist (
  id            SERIAL PRIMARY KEY,
  expedient_id  INTEGER REFERENCES adoption_expedients(id) ON DELETE CASCADE,
  fase          INTEGER NOT NULL,
  item_key      VARCHAR(100) NOT NULL,
  completado    BOOLEAN DEFAULT FALSE,
  completado_por INTEGER REFERENCES usuarios(id),
  completado_at  TIMESTAMPTZ,
  notas         TEXT,
  file_url      TEXT,
  UNIQUE (expedient_id, item_key)
);

CREATE TABLE IF NOT EXISTS adoption_timeline (
  id            SERIAL PRIMARY KEY,
  refugio_id    INTEGER REFERENCES refugios(id) ON DELETE CASCADE,
  request_id    INTEGER REFERENCES adoption_requests(id) ON DELETE CASCADE,
  expedient_id  INTEGER REFERENCES adoption_expedients(id) ON DELETE SET NULL,
  tipo          VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  usuario_id    INTEGER REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adoption_requests_refugio  ON adoption_requests(refugio_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_animal   ON adoption_requests(animal_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_estado   ON adoption_requests(estado);
CREATE INDEX IF NOT EXISTS idx_adoption_expedients_refugio ON adoption_expedients(refugio_id);
CREATE INDEX IF NOT EXISTS idx_expedient_checklist_exp    ON expedient_checklist(expedient_id);

CREATE OR REPLACE TRIGGER trg_requests_updated
  BEFORE UPDATE ON adoption_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_expedients_updated
  BEFORE UPDATE ON adoption_expedients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

const CHECKLIST_ITEMS = [
  { fase: 1, item_key: 'contrato_firmado' },
  { fase: 1, item_key: 'dni_recibido' },
  { fase: 1, item_key: 'cuota_pagada' },
  { fase: 2, item_key: 'visita_hogar' },
  { fase: 2, item_key: 'entrega_cartilla' },
  { fase: 2, item_key: 'entrega_pasaporte' },
  { fase: 2, item_key: 'charla_bienvenida' },
  { fase: 3, item_key: 'fecha_entrega' },
  { fase: 3, item_key: 'foto_entrega' },
  { fase: 3, item_key: 'baja_crm' },
  { fase: 3, item_key: 'aviso_registro' },
  { fase: 4, item_key: 'llamada_1semana' },
  { fase: 4, item_key: 'llamada_1mes' },
  { fase: 4, item_key: 'llamada_3meses' },
  { fase: 4, item_key: 'caso_cerrado' },
];

export { CHECKLIST_ITEMS };

async function migrateV3() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running v3 migrations...');
    await client.query(schema);
    console.log('✅ V3 migrations completed (adoption_requests, adoption_interviews, adoption_expedients, expedient_checklist, adoption_timeline)');
  } catch (err) {
    console.error('❌ Migration v3 error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateV3();
