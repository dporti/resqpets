const path = require('path');
const backendModules = path.join(__dirname, '../backend/node_modules');
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require(path.join(backendModules, 'pg'));
const bcrypt = require(path.join(backendModules, 'bcryptjs'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const ANIMALES = [
  { nombre: 'Toby',  especie: 'perro', raza: 'Mestizo',        sexo: 'macho',  tamaño: 'mediano', estado: 'en_adopcion', descripcion: 'Toby es un perro juguetón y cariñoso, ideal para familias activas.' },
  { nombre: 'Mia',   especie: 'gato',  raza: 'Europeo común',  sexo: 'hembra', tamaño: 'pequeño', estado: 'en_adopcion', descripcion: 'Mia es una gata tranquila que disfruta de las siestas al sol.' },
  { nombre: 'Coco',  especie: 'perro', raza: 'Podenco',        sexo: 'hembra', tamaño: 'mediano', estado: 'en_evaluacion', descripcion: 'Coco llegó hace poco y está en periodo de evaluación de comportamiento.' },
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('Seed multi-tenancy: segundo refugio "Patitas Felices"\n');
    await client.query('BEGIN');

    // Refugio
    const refugioRes = await client.query(
      `INSERT INTO refugios (nombre, ciudad, slug, email, telefono, is_public, plan_id, plan_started_at)
       VALUES ($1,$2,$3,$4,$5,true,'pro',NOW())
       ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET nombre=$1
       RETURNING id`,
      ['Patitas Felices', 'Barcelona', 'patitas-felices', 'contacto@patitasfelices.org', '600111222']
    );
    const refugioId = refugioRes.rows[0].id;
    console.log(`   Refugio creado: id=${refugioId}`);

    // Shelter config
    await client.query(
      `INSERT INTO shelter_config (shelter_id) VALUES ($1) ON CONFLICT (shelter_id) DO NOTHING`,
      [refugioId]
    );

    // Usuario coordinador
    const hash = await bcrypt.hash('Patitas1!', 10);
    const userRes = await client.query(
      `INSERT INTO usuarios (refugio_id, nombre, email, password_hash, rol, activo)
       VALUES ($1,$2,$3,$4,'coordinador',true)
       ON CONFLICT (email) DO UPDATE SET refugio_id=$1
       RETURNING id`,
      [refugioId, 'Marta Soler', 'marta@patitasfelices.org', hash]
    );
    console.log(`   Usuario coordinador creado: id=${userRes.rows[0].id} (marta@patitasfelices.org / Patitas1!)`);

    // Animales
    const countRes = await client.query('SELECT COUNT(*) FROM animales WHERE refugio_id=$1', [refugioId]);
    let n = Number(countRes.rows[0].count);
    for (const a of ANIMALES) {
      n++;
      const idInterno = `PF-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO animales (refugio_id, id_interno, nombre, especie, raza, sexo, tamaño, estado, descripcion, web_publicado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
         ON CONFLICT (id_interno) DO NOTHING`,
        [refugioId, idInterno, a.nombre, a.especie, a.raza, a.sexo, a.tamaño, a.estado, a.descripcion]
      );
      console.log(`   Animal creado: ${a.nombre} (${idInterno})`);
    }

    await client.query('COMMIT');
    console.log('\nSeed multi-tenancy completado.');
    console.log('Login: marta@patitasfelices.org / Patitas1!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(() => process.exit(1));
