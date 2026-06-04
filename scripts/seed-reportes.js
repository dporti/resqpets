/**
 * seed-reportes.js — genera 12 meses de datos históricos para el módulo de reportes
 * Uso: node scripts/seed-reportes.js
 */
const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv/config'));
process.env.DOTENV_CONFIG_PATH = path.join(__dirname, '../backend/.env');
// Manual .env load
const fs = require('fs');
const envFile = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
  });
}
const { Pool } = require(path.join(__dirname, '../backend/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(d) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; }
function monthsAgo(m, day = 1) { const dt = new Date(); dt.setMonth(dt.getMonth() - m, day); return dt; }

const ESPECIES = ['perro', 'gato', 'otro'];
const RAZAS = { perro: ['Mestizo', 'Labrador', 'Pastor Alemán', 'Beagle', 'Golden'], gato: ['Mestizo', 'Siamés', 'Persa', 'Maine Coon'], otro: ['Conejo', 'Hurón', 'Hámster'] };
const PROCEDENCIAS = ['Rescate en vía pública', 'Entrega voluntaria', 'Transferencia protectora', 'Aviso SOS', 'Otros'];
const VIVIENDAS = ['piso', 'casa_sin_jardin', 'casa_con_jardin', 'finca'];
const MOTIVOS_FIN = ['adoptado_familia', 'adoptado_otra', 'devuelto_protectora', 'trasladado'];
const SOS_ZONAS = ['Centro Madrid', 'Vallecas', 'Carabanchel', 'Usera', 'Retiro', 'Hortaleza', 'Alcobendas', 'Getafe'];

async function run() {
  const client = await pool.connect();
  try {
    // Get or create refugio
    let refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    if (refugioRes.rows.length === 0) { console.log('No hay refugio. Ejecuta seed primero.'); return; }
    const refugioId = refugioRes.rows[0].id;

    // Get existing animals for relations
    const animalesRes = await client.query('SELECT id FROM animales WHERE refugio_id=$1', [refugioId]);
    const animalIds = animalesRes.rows.map(r => r.id);
    if (animalIds.length === 0) { console.log('No hay animales. Ejecuta seed primero.'); return; }

    // Get users for relations
    const usersRes = await client.query('SELECT id FROM usuarios WHERE refugio_id=$1 LIMIT 3', [refugioId]);
    const userIds = usersRes.rows.map(r => r.id);
    const userId = userIds[0];

    let animalesCreados = 0;
    let adopcionesCreadas = 0;
    let acogidasCreadas = 0;
    let sosCreados = 0;

    // ── 1. CREA ANIMALES HISTÓRICOS (12 meses) ─────────────────────
    console.log('Creando animales históricos...');
    const nuevosAnimales = [];
    for (let mes = 11; mes >= 0; mes--) {
      const cnt = rnd(3, 8);
      for (let i = 0; i < cnt; i++) {
        const especie = ESPECIES[rnd(0, 2)];
        const dia = rnd(1, 28);
        const fechaEntrada = monthsAgo(mes, dia);
        const res = await client.query(`
          INSERT INTO animales (refugio_id, nombre, especie, raza, sexo, estado, procedencia,
            fecha_entrada, nivel_actividad, soc_perros, soc_gatos, soc_niños, vacunado, esterilizado,
            microchip, desparasitado, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)
          RETURNING id
        `, [
          refugioId,
          `Animal${rnd(100,999)}`,
          especie,
          RAZAS[especie][rnd(0, RAZAS[especie].length - 1)],
          rnd(0,1) ? 'macho' : 'hembra',
          mes <= 2 ? 'en_adopcion' : (mes <= 5 ? 'en_acogida' : 'en_residencia'),
          PROCEDENCIAS[rnd(0, 4)],
          fechaEntrada.toISOString().slice(0,10),
          rnd(1,5), rnd(0,5), rnd(0,5), rnd(0,5),
          rnd(0,1)===1, rnd(0,1)===1, rnd(0,1)===1, rnd(0,1)===1,
          fechaEntrada,
        ]);
        nuevosAnimales.push(res.rows[0].id);
        animalesCreados++;
      }
    }
    const todosAnimales = [...animalIds, ...nuevosAnimales];

    // ── 2. ADOPTION REQUESTS + EXPEDIENTS ─────────────────────────
    console.log('Creando adopciones históricas...');
    for (let mes = 10; mes >= 0; mes--) {
      const cnt = rnd(2, 6);
      for (let i = 0; i < cnt; i++) {
        const animalId = todosAnimales[rnd(0, todosAnimales.length - 1)];
        const fechaSolicitud = monthsAgo(mes, rnd(1,15));
        const reqRes = await client.query(`
          INSERT INTO adoption_requests (refugio_id, animal_id, nombre, email, telefono,
            tipo_vivienda, horas_solo, experiencia_previa, ninos, motivacion, canal,
            estado, puntuacion, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'aprobada',$12,$13,$13)
          RETURNING id
        `, [
          refugioId, animalId,
          `Adoptante ${rnd(100,999)}`, `adopt${rnd(100,999)}@test.com`, `6${rnd(10000000,99999999)}`,
          VIVIENDAS[rnd(0,3)], rnd(2,10),
          rnd(0,1) ? 'Tuve un perro de pequeño' : null,
          rnd(0,1)===1, 'Me encanta este animal y quiero darle un hogar',
          rnd(0,1) ? 'web' : 'manual',
          rnd(50,100), fechaSolicitud,
        ]);
        const requestId = reqRes.rows[0].id;
        if (mes < 9) {
          const fechaCompletar = new Date(fechaSolicitud.getTime() + rnd(5,30) * 86400000);
          await client.query(`
            INSERT INTO adoption_expedients (refugio_id, request_id, animal_id,
              adoptante_nombre, adoptante_email, fase_actual, completed_at, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,4,$6,$7,$7)
          `, [
            refugioId, requestId, animalId,
            `Adoptante ${rnd(100,999)}`, `adopt@test.com`,
            fechaCompletar, fechaSolicitud,
          ]);
          adopcionesCreadas++;
        }
      }
    }

    // ── 3. FOSTER FAMILIES + ASSIGNMENTS ──────────────────────────
    console.log('Creando acogidas históricas...');
    const familiasRes = await client.query('SELECT id FROM foster_families WHERE refugio_id=$1', [refugioId]);
    let familiaIds = familiasRes.rows.map(r => r.id);

    if (familiaIds.length === 0) {
      for (let i = 0; i < 5; i++) {
        const fRes = await client.query(`
          INSERT INTO foster_families (refugio_id, nombre, email, ciudad,
            max_animales, acepta_perros, acepta_gatos, acepta_otros,
            acepta_pequeño, acepta_mediano, acepta_grande,
            acepta_necesidades_especiales, acepta_cachorros, acepta_seniors,
            tiene_jardin, ninos_casa, estado, karma_puntos)
          VALUES ($1,$2,$3,'Madrid',2,true,true,false,true,true,false,false,true,false,false,false,'available',$4)
          RETURNING id
        `, [refugioId, `Familia Histórica ${i+1}`, `familia${i+1}@test.com`, rnd(20,200)]);
        familiaIds.push(fRes.rows[0].id);
      }
    }

    for (let mes = 11; mes >= 0; mes--) {
      const cnt = rnd(1, 4);
      for (let i = 0; i < cnt; i++) {
        const animalId = todosAnimales[rnd(0, todosAnimales.length - 1)];
        const familiaId = familiaIds[rnd(0, familiaIds.length - 1)];
        const inicio = monthsAgo(mes, rnd(1,20));
        const duracion = rnd(10, 150);
        const fin = new Date(inicio.getTime() + duracion * 86400000);
        const completada = fin < new Date();
        await client.query(`
          INSERT INTO foster_assignments (animal_id, familia_id, iniciada_at,
            finalizada_at, estado, motivo_fin, valoracion, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
          animalId, familiaId, inicio,
          completada ? fin : null,
          completada ? 'completed' : 'active',
          completada ? MOTIVOS_FIN[rnd(0,3)] : null,
          completada ? rnd(3,5) : null,
          inicio,
        ]);
        acogidasCreadas++;
      }
    }

    // ── 4. SOS ALERTS ─────────────────────────────────────────────
    console.log('Creando avisos SOS históricos...');
    for (let mes = 11; mes >= 0; mes--) {
      const cnt = rnd(3, 10);
      for (let i = 0; i < cnt; i++) {
        const esResuelto = mes > 1 && rnd(0,1);
        const fechaCreacion = monthsAgo(mes, rnd(1,28));
        const zona = SOS_ZONAS[rnd(0, SOS_ZONAS.length-1)];
        await client.query(`
          INSERT INTO sos_alerts (refugio_id, tipo, urgencia, estado, especie,
            color, ubicacion_descripcion, latitud, longitud,
            reportero_nombre, reportero_telefono,
            codigo_referencia, es_publico, fotos, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,'{}', $13,$14)
        `, [
          refugioId,
          rnd(0,1) ? 'lost' : 'found',
          ['high','medium','low'][rnd(0,2)],
          esResuelto ? (rnd(0,1) ? 'rescued' : 'resolved') : 'active',
          ESPECIES[rnd(0,2)],
          ['negro','blanco','marrón','gris'][rnd(0,3)],
          zona,
          40.4168 + (Math.random() - 0.5) * 0.3,
          -3.7038 + (Math.random() - 0.5) * 0.3,
          `Reportero ${rnd(100,999)}`, `6${rnd(10000000,99999999)}`,
          `SOS-${rnd(1000,9999)}-${rnd(1000,9999)}`,
          fechaCreacion,
          esResuelto ? new Date(fechaCreacion.getTime() + rnd(2,96) * 3600000) : fechaCreacion,
        ]);
        sosCreados++;
      }
    }

    console.log(`\n✅ seed-reportes completado:`);
    console.log(`   • ${animalesCreados} animales históricos`);
    console.log(`   • ${adopcionesCreadas} adopciones completadas`);
    console.log(`   • ${acogidasCreadas} acogidas históricas`);
    console.log(`   • ${sosCreados} avisos SOS`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
