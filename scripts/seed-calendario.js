const path = require('path');
const fs = require('fs');
const envFile = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
  });
}
const { Pool } = require(path.join(__dirname, '../backend/node_modules/pg'));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function setHour(date, h, m = 0) { const d = new Date(date); d.setHours(h, m, 0, 0); return d; }

const TIPOS = ['adoption', 'veterinary', 'foster', 'volunteer', 'urgent', 'campaign'];
const COLORS = {
  adoption: '#16a34a', veterinary: '#3b82f6', foster: '#f97316',
  volunteer: '#8b5cf6', urgent: '#ef4444', campaign: '#f59e0b',
};

const EVENTS_TEMPLATES = [
  { title: 'Entrega en adopción — Luna', type: 'adoption', duration: 1 },
  { title: 'Firma contrato adopción — Tobi', type: 'adoption', duration: 1 },
  { title: 'Revisión veterinaria — Max', type: 'veterinary', duration: 1.5 },
  { title: 'Vacunación anual — Mochi', type: 'veterinary', duration: 0.5 },
  { title: 'Esterilización — Nala', type: 'veterinary', duration: 3 },
  { title: 'Inicio acogida — Familia García', type: 'foster', duration: 1 },
  { title: 'Visita seguimiento acogida', type: 'foster', duration: 1 },
  { title: 'Fin acogida programado — Buddy', type: 'foster', duration: 0.5 },
  { title: 'Reunión de voluntarios', type: 'volunteer', duration: 1.5 },
  { title: 'Turno de mañana — Voluntarios', type: 'volunteer', duration: 3 },
  { title: 'Formación nuevos voluntarios', type: 'volunteer', duration: 2 },
  { title: '🚨 SOS urgente — Labrador extraviado', type: 'urgent', duration: 0.5 },
  { title: 'Jornada de adopción — Centro Comercial', type: 'campaign', duration: 8, allDay: false },
  { title: 'Campaña redes sociales', type: 'campaign', duration: 0, allDay: true },
  { title: 'Recogida de donaciones', type: 'campaign', duration: 4 },
  { title: 'Entrevista adoptante — Carlos R.', type: 'adoption', duration: 0.5 },
  { title: 'Chequeo salud — Kira', type: 'veterinary', duration: 1 },
  { title: 'Desparasitación grupo gatos', type: 'veterinary', duration: 2 },
  { title: 'Contacto familia acogida — Pérez', type: 'foster', duration: 0.5 },
  { title: 'Taller fotografía animales', type: 'volunteer', duration: 3 },
];

async function run() {
  const client = await pool.connect();
  try {
    const refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    if (!refugioRes.rows.length) { console.log('No hay refugio'); return; }
    const refugioId = refugioRes.rows[0].id;

    const usersRes = await client.query('SELECT id FROM usuarios WHERE refugio_id=$1', [refugioId]);
    const userIds = usersRes.rows.map(r => r.id);
    const createdBy = userIds[0];

    const animalesRes = await client.query('SELECT id FROM animales WHERE refugio_id=$1 LIMIT 10', [refugioId]);
    const animalIds = animalesRes.rows.map(r => r.id);

    let eventosCreados = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Distribuye 30 eventos entre -30 días y +60 días
    const offsets = [];
    // Pasados (hace 1-30 días): 10 eventos
    for (let i = 0; i < 10; i++) offsets.push(-rnd(1, 30));
    // Esta semana (hoy + 7 días): 8 eventos obligatorios
    for (let i = 0; i < 8; i++) offsets.push(rnd(0, 7));
    // Próximas 3 semanas: 7 eventos
    for (let i = 0; i < 7; i++) offsets.push(rnd(8, 21));
    // Próximos 2 meses: 5 eventos
    for (let i = 0; i < 5; i++) offsets.push(rnd(22, 60));

    for (let i = 0; i < offsets.length; i++) {
      const tpl = EVENTS_TEMPLATES[i % EVENTS_TEMPLATES.length];
      const baseDate = addDays(today, offsets[i]);
      const hour = rnd(8, 17);
      const startAt = setHour(baseDate, hour, rnd(0, 1) ? 0 : 30);
      const endAt = tpl.allDay ? null : new Date(startAt.getTime() + tpl.duration * 3600000);
      const allDay = tpl.allDay === true;

      const assigned = userIds.length > 0
        ? [userIds[rnd(0, userIds.length - 1)]]
        : null;
      const animalId = animalIds.length > 0 && rnd(0, 1)
        ? animalIds[rnd(0, animalIds.length - 1)]
        : null;

      await client.query(`
        INSERT INTO events (shelter_id, title, event_type, color, start_at, end_at, all_day,
          assigned_to, animal_id, created_by, auto_generated)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)
      `, [
        refugioId, tpl.title, tpl.type, COLORS[tpl.type],
        startAt, endAt, allDay,
        assigned, animalId, createdBy,
      ]);
      eventosCreados++;
    }

    // Evento para HOY (asegura que el calendario no aparece vacío)
    await client.query(`
      INSERT INTO events (shelter_id, title, event_type, color, start_at, end_at, all_day, created_by)
      VALUES ($1,'📋 Reunión diaria de equipo','volunteer',$2,$3,$4,false,$5)
    `, [refugioId, COLORS.volunteer, setHour(today, 9), setHour(today, 10), createdBy]);
    eventosCreados++;

    console.log(`\n✅ seed-calendario completado: ${eventosCreados} eventos`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
