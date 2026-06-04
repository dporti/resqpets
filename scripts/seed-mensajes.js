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

function daysAgo(d, h = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, rnd(0, 59), 0, 0);
  return dt;
}
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const MESSAGES = {
  internal: [
    'Hola, ¿puedes encargarte de la visita de seguimiento de Max esta tarde?',
    'Claro, a las 18:00 estoy disponible.',
    '¿Alguien puede llevar a Luna al veterinario mañana por la mañana?',
    'Yo puedo llevarlo si nadie más puede.',
    'Reunión de equipo cancelada por hoy. La reagendamos para el jueves.',
    'Recibido. ¿A qué hora el jueves?',
    '¿Has visto el nuevo aviso SOS de Usera? Parece que es un Labrador.',
    'Sí, ya lo vi. He contactado con el reportero.',
    'Necesitamos más pienso para los gatos de la sala C.',
    'Lo apunto para el pedido de la semana.',
    'La familia García ha confirmado la visita para el sábado con Tobi.',
    '¡Genial! Le aviso a David para que esté preparado.',
  ],
  adoptant: [
    'Hola, he completado el formulario de adopción. ¿Qué pasos siguen?',
    'Buenos días. Hemos recibido su solicitud. En 48h le contactamos para la entrevista.',
    '¿Cuándo podría conocer al animal en persona?',
    'Después de la entrevista telefónica podemos acordar una visita. ¿Le viene bien la próxima semana?',
    'Me parece perfecto. Quedo a la espera.',
    'Le confirmamos cita el viernes a las 11:00. ¿Le viene bien?',
    'Perfecto, allí estaré. ¡Tengo muchas ganas de conocerle!',
    'Recordatorio: mañana a las 11:00 tiene la visita. Pregunte por Laura a la entrada.',
    'Muchas gracias por el recordatorio. Hasta mañana.',
  ],
  foster: [
    'Buenas tardes, ¿cómo está Mochi? Llevamos una semana sin noticias.',
    'Todo muy bien. Se ha adaptado perfectamente a la familia. Come bien y duerme mucho.',
    '¡Qué alegría saberlo! ¿Tiene algún problema de comportamiento?',
    'Ninguno. Es un encanto. Los niños están enamorados de él.',
    'Perfecto. En dos semanas haremos la visita de seguimiento. ¿Les va bien el martes 18?',
    'El martes perfecto, por la tarde mejor.',
    '¿Necesitan algún suministro? Pienso, medicación...',
    'Nos quedan pocos antiparasitarios. Si pudieran traer cuando vengan...',
    'Por supuesto, los llevamos. Hasta el martes.',
  ],
};

async function run() {
  const client = await pool.connect();
  try {
    const refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    if (!refugioRes.rows.length) { console.log('No hay refugio'); return; }
    const refugioId = refugioRes.rows[0].id;

    const usersRes = await client.query('SELECT id, nombre FROM usuarios WHERE refugio_id=$1 ORDER BY id', [refugioId]);
    const users = usersRes.rows;
    if (users.length < 2) { console.log('Necesitas al menos 2 usuarios. Ejecuta npm run seed primero.'); return; }

    const animalesRes = await client.query('SELECT id FROM animales WHERE refugio_id=$1 LIMIT 5', [refugioId]);
    const animalIds = animalesRes.rows.map(r => r.id);

    const requestsRes = await client.query('SELECT id FROM adoption_requests WHERE refugio_id=$1 LIMIT 3', [refugioId]);
    const requestIds = requestsRes.rows.map(r => r.id);

    const assignmentsRes = await client.query(
      'SELECT fa.id FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.estado=\'active\' LIMIT 3',
      [refugioId],
    );
    const assignmentIds = assignmentsRes.rows.map(r => r.id);

    let convCreados = 0, msgCreados = 0;

    // ── CONVERSACIONES INTERNAS ────────────────────────────────────
    const internalPairs = [
      [users[0].id, users[1].id],
      [users[0].id, users[2 % users.length].id],
      users.length > 3 ? [users[1].id, users[3].id] : [users[0].id, users[1].id],
    ];

    for (const [u1, u2] of internalPairs) {
      const convRes = await client.query(`
        INSERT INTO conversations (shelter_id, type, created_by, last_message_at)
        VALUES ($1,'internal',$2, NOW()) RETURNING id
      `, [refugioId, u1]);
      const convId = convRes.rows[0].id;
      await client.query('INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1,$2,true),($1,$3,false)', [convId, u1, u2]);

      const msgs = MESSAGES.internal.slice(0, rnd(4, 12));
      for (let i = 0; i < msgs.length; i++) {
        const sender = i % 2 === 0 ? u1 : u2;
        const daysBack = rnd(0, 6);
        await client.query(`
          INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at)
          VALUES ($1,$2,$3,'text',$4)
        `, [convId, sender, msgs[i], daysAgo(daysBack, rnd(8, 20))]);
        msgCreados++;
      }
      await client.query('UPDATE conversations SET last_message_at=NOW() - (random()*interval\'2 days\') WHERE id=$1', [convId]);
      convCreados++;
    }

    // Grupo interno
    if (users.length >= 3) {
      const convRes = await client.query(`
        INSERT INTO conversations (shelter_id, type, name, created_by, last_message_at)
        VALUES ($1,'internal','🐾 Equipo Coordinación',$2,NOW()) RETURNING id
      `, [refugioId, users[0].id]);
      const convId = convRes.rows[0].id;
      for (const u of users.slice(0, Math.min(4, users.length))) {
        await client.query('INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [convId, u.id, u.id === users[0].id]);
      }
      const msgs = MESSAGES.internal;
      for (let i = 0; i < msgs.length; i++) {
        const sender = users[i % users.length].id;
        await client.query(`INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at) VALUES ($1,$2,$3,'text',$4)`,
          [convId, sender, msgs[i], daysAgo(rnd(0, 7), rnd(9, 19))]);
        msgCreados++;
      }
      convCreados++;
    }

    // ── CONVERSACIONES CON ADOPTANTES ─────────────────────────────
    const adoptantContacts = [
      { name: 'María García', email: 'maria.garcia@gmail.com' },
      { name: 'Carlos Rodríguez', email: 'c.rodriguez@hotmail.com' },
      { name: 'Ana Martínez', email: 'ana.m@yahoo.es' },
    ];

    for (let i = 0; i < Math.min(3, adoptantContacts.length); i++) {
      const contact = adoptantContacts[i];
      const convRes = await client.query(`
        INSERT INTO conversations (shelter_id, type, contact_name, contact_email,
          related_animal_id, related_request_id, created_by, last_message_at)
        VALUES ($1,'adoptant',$2,$3,$4,$5,$6,NOW()) RETURNING id
      `, [refugioId, contact.name, contact.email,
        animalIds[i % animalIds.length] || null,
        requestIds[i % requestIds.length] || null,
        users[0].id]);
      const convId = convRes.rows[0].id;
      await client.query('INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1,$2,true)', [convId, users[0].id]);

      const msgs = MESSAGES.adoptant.slice(0, rnd(4, 9));
      for (let j = 0; j < msgs.length; j++) {
        const isInternal = j % 2 !== 0;
        await client.query(`
          INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type, created_at)
          VALUES ($1,$2,$3,$4,'text',$5)
        `, [convId,
          isInternal ? users[0].id : null,
          isInternal ? null : contact.name,
          msgs[j],
          daysAgo(rnd(0, 5), rnd(9, 18))]);
        msgCreados++;
      }
      convCreados++;
    }

    // ── CONVERSACIONES CON FAMILIAS ACOGIDA ───────────────────────
    const fosterContacts = [
      { name: 'Familia Pérez', email: 'familia.perez@gmail.com' },
      { name: 'Luisa Sánchez', email: 'luisa.s@gmail.com' },
    ];

    for (let i = 0; i < Math.min(2, fosterContacts.length); i++) {
      const contact = fosterContacts[i];
      const convRes = await client.query(`
        INSERT INTO conversations (shelter_id, type, contact_name, contact_email,
          related_animal_id, related_assignment_id, created_by, last_message_at)
        VALUES ($1,'foster',$2,$3,$4,$5,$6,NOW()) RETURNING id
      `, [refugioId, contact.name, contact.email,
        animalIds[(i + 2) % animalIds.length] || null,
        assignmentIds[i % Math.max(1, assignmentIds.length)] || null,
        users[0].id]);
      const convId = convRes.rows[0].id;
      await client.query('INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1,$2,true)', [convId, users[0].id]);

      const msgs = MESSAGES.foster.slice(0, rnd(4, 9));
      for (let j = 0; j < msgs.length; j++) {
        const isInternal = j % 2 !== 0;
        await client.query(`
          INSERT INTO messages (conversation_id, sender_id, sender_name, content, message_type, created_at)
          VALUES ($1,$2,$3,$4,'text',$5)
        `, [convId,
          isInternal ? users[0].id : null,
          isInternal ? null : contact.name,
          msgs[j],
          daysAgo(rnd(0, 4), rnd(10, 20))]);
        msgCreados++;
      }
      convCreados++;
    }

    // Marcar algunos no leídos (no actualizar last_read_at para el primer usuario)
    console.log(`\n✅ seed-mensajes completado:`);
    console.log(`   • ${convCreados} conversaciones`);
    console.log(`   • ${msgCreados} mensajes`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
