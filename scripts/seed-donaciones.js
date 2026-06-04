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

function rnd(a, b) { return Math.random() * (b - a) + a; }
function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
function daysAgo(d) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; }

const CHANNELS = ['transfer', 'cash', 'bizum', 'transfer', 'bizum'];
const DONORS = [
  { name: 'María García López', email: 'maria.garcia@gmail.com', phone: '612345678', nif: '12345678A' },
  { name: 'Carlos Rodríguez', email: 'carlos.r@hotmail.com', phone: '623456789', nif: '23456789B' },
  { name: 'Ana Martínez Pérez', email: 'ana.m@yahoo.es', phone: '634567890', nif: '34567890C' },
  { name: 'José Fernández', email: 'jose.f@gmail.com', phone: '645678901', nif: '45678901D' },
  { name: 'Laura Sánchez', email: 'laura.s@outlook.com', phone: '656789012', nif: '56789012E' },
  { name: 'Miguel Torres', email: 'miguel.t@gmail.com', phone: '667890123', nif: '67890123F' },
  { name: 'Isabel Gómez', email: 'isabel.g@gmail.com', phone: '678901234', nif: '78901234G' },
  { name: 'Pedro López', email: 'pedro.l@hotmail.com', phone: '689012345', nif: '89012345H' },
  { name: 'Carmen Ruiz', email: 'carmen.r@gmail.com', phone: '690123456', nif: '90123456I' },
  { name: 'Antonio Díaz', email: 'antonio.d@gmail.com', phone: '601234567', nif: '01234567J' },
  { name: 'Lucía Moreno', email: 'lucia.m@gmail.com' },
  { name: 'David Jiménez', email: 'david.j@outlook.com' },
  { name: 'Elena Álvarez', email: 'elena.a@gmail.com' },
  { name: 'Francisco Romero', email: 'fran.r@gmail.com' },
  { name: null, email: null }, // anonymous
];
const AMOUNTS = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 300, 500];

async function run() {
  const client = await pool.connect();
  try {
    const refugioRes = await client.query('SELECT id, nombre FROM refugios LIMIT 1');
    if (!refugioRes.rows.length) { console.log('No hay refugio'); return; }
    const { id: refugioId } = refugioRes.rows[0];
    const usersRes = await client.query('SELECT id FROM usuarios WHERE refugio_id=$1 LIMIT 1', [refugioId]);
    const createdBy = usersRes.rows[0]?.id;
    const animalesRes = await client.query('SELECT id FROM animales WHERE refugio_id=$1 LIMIT 3', [refugioId]);
    const animalIds = animalesRes.rows.map(r => r.id);

    // ── CAMPAÑAS ──────────────────────────────────────────────────────
    const campaignsData = [
      {
        name: 'Campaña Verano 2024 — Esterilizaciones',
        slug: 'campana-esterilizaciones-2024',
        description_short: 'Ayúdanos a esterilizar a 50 animales este verano',
        description_long: 'La sobrepoblación de animales abandonados es uno de los mayores problemas de bienestar animal. Con tu donación, podemos cubrir los gastos de esterilización de los animales que llegan a nuestra protectora.',
        goal_amount: 2500, status: 'active',
        starts_at: daysAgo(60), ends_at: daysAgo(-30),
        primary_color: '#16a34a', is_public: true,
        related_animal_id: animalIds[0] || null,
      },
      {
        name: 'Ampliación del Refugio — Nueva Sala Gatos',
        slug: 'nueva-sala-gatos-2024',
        description_short: 'Necesitamos construir una sala adaptada para nuestros gatitos',
        description_long: 'Actualmente tenemos capacidad limitada para acoger gatos. Con tu ayuda, podremos construir una sala específica con espacio, luz natural y zonas de juego.',
        goal_amount: 5000, status: 'completed',
        starts_at: daysAgo(180), ends_at: daysAgo(30),
        primary_color: '#f97316', is_public: true,
        related_animal_id: animalIds[1] || null,
      },
      {
        name: 'Campaña Navidad 2024',
        slug: 'navidad-2024',
        description_short: 'Dale un regalo de Navidad a nuestros animales',
        goal_amount: 1500, status: 'draft',
        starts_at: daysAgo(-20), ends_at: daysAgo(-50),
        primary_color: '#ef4444', is_public: false,
        related_animal_id: null,
      },
    ];

    const campaignIds = [];
    for (const c of campaignsData) {
      const r = await client.query(`
        INSERT INTO donation_campaigns (shelter_id, name, slug, description_short, description_long,
          goal_amount, status, starts_at, ends_at, is_public, primary_color, related_animal_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [refugioId, c.name, c.slug, c.description_short, c.description_long || null,
          c.goal_amount, c.status, c.starts_at, c.ends_at, c.is_public,
          c.primary_color, c.related_animal_id, createdBy]);
      campaignIds.push(r.rows[0].id);
    }

    // ── DONACIONES ────────────────────────────────────────────────────
    let donCreados = 0;
    const donorTotals = {};

    for (let i = 0; i < 50; i++) {
      const daysBack = rndInt(0, 180);
      const createdAt = daysAgo(daysBack);
      const donor = DONORS[i % DONORS.length];
      const isAnon = !donor.email;
      const amount = AMOUNTS[rndInt(0, AMOUNTS.length - 1)];
      const channel = CHANNELS[rndInt(0, CHANNELS.length - 1)];
      const isRecurring = i % 7 === 0;
      const campaignId = i < 30 ? campaignIds[0] : (i < 40 ? campaignIds[1] : null);
      const year = createdAt.getFullYear();
      const receiptNum = `REC-${year}-${String(i + 1).padStart(4, '0')}`;

      await client.query(`
        INSERT INTO donations (shelter_id, amount, channel, donation_type, status, campaign_id,
          is_anonymous, donor_name, donor_email, donor_phone, donor_nif,
          concept, receipt_number, registered_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,'confirmed',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
        [refugioId, amount, channel,
          isRecurring ? 'recurring' : 'one_time', campaignId,
          isAnon, isAnon ? null : donor.name, isAnon ? null : donor.email,
          isAnon ? null : (donor.phone || null), isAnon ? null : (donor.nif || null),
          'Donación para la protectora', receiptNum, createdBy, createdAt]);

      if (!isAnon && donor.email) {
        donorTotals[donor.email] = (donorTotals[donor.email] || 0) + amount;
      }
      donCreados++;
    }

    // ── DONORS ────────────────────────────────────────────────────────
    for (const donor of DONORS.filter(d => d.email)) {
      const stats = await client.query(
        'SELECT COUNT(*) AS cnt, SUM(amount) AS total, MIN(created_at) AS first, MAX(created_at) AS last, BOOL_OR(donation_type=\'recurring\') AS recur FROM donations WHERE shelter_id=$1 AND donor_email=$2',
        [refugioId, donor.email]);
      const s = stats.rows[0];
      if (parseInt(s.cnt) === 0) continue;
      await client.query(`
        INSERT INTO donors (shelter_id, name, email, phone, nif, total_donated, donations_count,
          is_recurring, first_donation_at, last_donation_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT(shelter_id, email) DO UPDATE SET
          total_donated=EXCLUDED.total_donated, donations_count=EXCLUDED.donations_count,
          is_recurring=EXCLUDED.is_recurring, last_donation_at=EXCLUDED.last_donation_at`,
        [refugioId, donor.name, donor.email, donor.phone || null, donor.nif || null,
          parseFloat(s.total) || 0, parseInt(s.cnt), s.recur || false, s.first, s.last]);
    }

    // ── Update raised_amount for campaigns ─────────────────────────
    for (const cid of campaignIds) {
      await client.query(
        'UPDATE donation_campaigns SET raised_amount=(SELECT COALESCE(SUM(amount),0) FROM donations WHERE campaign_id=$1 AND status=\'confirmed\') WHERE id=$1',
        [cid]);
    }

    console.log(`\n✅ seed-donaciones completado:`);
    console.log(`   • 3 campañas`);
    console.log(`   • ${donCreados} donaciones`);
    console.log(`   • ${DONORS.filter(d => d.email).length} donantes en el directorio`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
