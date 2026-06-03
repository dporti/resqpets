const path = require('path');
const backendModules = path.join(__dirname, '../backend/node_modules');
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require(path.join(backendModules, 'pg'));
const bcrypt = require(path.join(backendModules, 'bcryptjs'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const ago = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
const daysAgo = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0,10); };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

const NUEVOS_VOLUNTARIOS = [
  { nombre: 'Isabel Gómez',      email: 'isabel.gomez@huellaviva.org', rol: 'coordinador', esp: ['Fotografía','Redes sociales'], bio: 'Diseñadora gráfica. Me encargo de toda la comunicación visual y RRSS de la protectora.', karma: 520 },
  { nombre: 'Alejandro Muñoz',   email: 'alex.munoz@huellaviva.org',   rol: 'voluntario',  esp: ['Transporte','Rescate'],        bio: 'Tengo furgoneta y mucha disposición para traslados y rescates de urgencia.',             karma: 145 },
  { nombre: 'Lucía Herrero',     email: 'lucia.herrero@huellaviva.org', rol: 'voluntario',  esp: ['Veterinaria','Salud'],         bio: 'Auxiliar veterinaria. Gestiono la medicación y seguimiento sanitario de los animales.',   karma: 340 },
  { nombre: 'Tomás Vidal',       email: 'tomas.vidal@huellaviva.org',   rol: 'voluntario',  esp: ['Educación','Adiestramiento'], bio: 'Adiestrador canino certificado. Trabajo la socialización y obediencia básica.',          karma: 92 },
  { nombre: 'Patricia Iglesias', email: 'patricia.i@huellaviva.org',    rol: 'voluntario',  esp: ['Acogidas','Adopciones'],       bio: 'Gestiono el seguimiento de familias de acogida y el proceso de adopción.',              karma: 215 },
  { nombre: 'Fernando Castro',   email: 'fernando.c@huellaviva.org',    rol: 'voluntario',  esp: ['Captación fondos'],           bio: 'Me encargo de crowdfunding, donaciones y relaciones con empresas colaboradoras.',       karma: 60 },
  { nombre: 'Ana Belén Ruiz',    email: 'anabelen.r@huellaviva.org',    rol: 'voluntario',  esp: ['Acogidas','Gatos'],           bio: 'Especializada en acogida temporal de gatos, especialmente tímidos y FIV+.',             karma: 410 },
  { nombre: 'Jorge Medina',      email: 'jorge.medina@huellaviva.org',  rol: 'voluntario',  esp: ['Mantenimiento','Limpieza'],   bio: 'Me ocupo del mantenimiento de las instalaciones y limpieza de zonas comunes.',          karma: 78 },
];

const TAREAS = [
  { titulo: 'Vacunación anual de Max',                categoria: 'medica',         prioridad: 'alta',  estado: 'pending',     diasLimite: 2,   animIdx: 0 },
  { titulo: 'Actualizar fotos de Luna para adopción', categoria: 'difusion',       prioridad: 'media', estado: 'pending',     diasLimite: 5,   animIdx: 1 },
  { titulo: 'Transporte Rocky a clínica VetMadrid',  categoria: 'transporte',     prioridad: 'alta',  estado: 'in_progress', diasLimite: 1,   animIdx: 2 },
  { titulo: 'Revisar contrato acogida Familia García', categoria: 'administrativa', prioridad: 'media', estado: 'pending',     diasLimite: 7 },
  { titulo: 'Llamada seguimiento adoptante Mimi',    categoria: 'adopcion',       prioridad: 'media', estado: 'pending',     diasLimite: 3,   animIdx: 3 },
  { titulo: 'Publicar post Instagram Max y Nala',    categoria: 'difusion',       prioridad: 'baja',  estado: 'pending',     diasLimite: 4 },
  { titulo: 'Comprar pienso Junior 15kg',            categoria: 'mantenimiento',  prioridad: 'alta',  estado: 'pending',     diasLimite: -1 },  // vencida
  { titulo: 'Evaluación comportamiento Rocky',       categoria: 'medica',         prioridad: 'alta',  estado: 'blocked',     diasLimite: 3,   animIdx: 2 },
  { titulo: 'Preparar kit bienvenida nueva acogida', categoria: 'acogida',        prioridad: 'media', estado: 'pending',     diasLimite: 6 },
  { titulo: 'Revisar perfil adoptivo familia Navarro', categoria: 'adopcion',     prioridad: 'alta',  estado: 'in_progress', diasLimite: 2 },
  { titulo: 'Actualizar página web con nuevos animales', categoria: 'difusion',   prioridad: 'media', estado: 'pending',     diasLimite: 10 },
  { titulo: 'Limpiar y desinfectar jaulas zona gatos', categoria: 'mantenimiento', prioridad: 'baja', estado: 'completed',   diasLimite: -3 },
  { titulo: 'Registrar desparasitación Nala',        categoria: 'medica',         prioridad: 'media', estado: 'completed',   diasLimite: -5, animIdx: 4 },
  { titulo: 'Buscar sponsor para campaña verano',    categoria: 'administrativa', prioridad: 'baja',  estado: 'pending',     diasLimite: 20 },
  { titulo: 'Entregar cartilla sanitaria adoptante', categoria: 'adopcion',       prioridad: 'alta',  estado: 'pending',     diasLimite: 0,  animIdx: 3 },  // hoy
  { titulo: 'Revisión veterinaria mensual residentes', categoria: 'medica',       prioridad: 'alta',  estado: 'pending',     diasLimite: 8 },
  { titulo: 'Grabar vídeo Nala para redes',          categoria: 'difusion',       prioridad: 'media', estado: 'in_progress', diasLimite: 5, animIdx: 4 },
  { titulo: 'Actualizar fichas animales con nuevas fotos', categoria: 'administrativa', prioridad: 'baja', estado: 'pending', diasLimite: 14 },
  { titulo: 'Contactar clínica para descuentos socios', categoria: 'administrativa', prioridad: 'media', estado: 'pending', diasLimite: -2 },  // vencida
  { titulo: 'Organizar jornada adopción parque',     categoria: 'adopcion',       prioridad: 'alta',  estado: 'pending',     diasLimite: 18 },
  { titulo: 'Mantenimiento web y servidor',          categoria: 'mantenimiento',  prioridad: 'media', estado: 'completed',   diasLimite: -7 },
  { titulo: 'Formulario alta nuevas familias acogida', categoria: 'acogida',      prioridad: 'media', estado: 'pending',     diasLimite: 12 },
  { titulo: 'Preparar memoria anual protectora',     categoria: 'administrativa', prioridad: 'alta',  estado: 'pending',     diasLimite: 25 },
  { titulo: 'Socialización Max con cachorros',       categoria: 'medica',         prioridad: 'media', estado: 'pending',     diasLimite: 6, animIdx: 0 },
  { titulo: 'Revisar stock medicamentos básicos',    categoria: 'medica',         prioridad: 'alta',  estado: 'pending',     diasLimite: -1 },  // vencida
];

const KARMA_RAZONES_VOL = [
  'Tarea completada (alta): Vacunación registrada',
  'Tarea completada (media): Fotos actualizadas',
  'Registrar ingreso de animal',
  'Registrar evento médico',
  'Tarea completada (alta): Transporte realizado',
  'Completar expediente de adopción',
  'Tarea completada (media): Seguimiento adoptante',
  'Racha de 7 días consecutivos activo',
  'Adopción completada',
  'Tarea completada (baja): Limpieza realizada',
  'Registrar evaluación de comportamiento',
  'Tarea completada (alta): Revisión veterinaria',
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seed de Voluntarios...\n');
    const refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    const refugioId = refugioRes.rows[0].id;
    const animalesRes = await client.query(`SELECT id,nombre FROM animales WHERE refugio_id=$1 ORDER BY id`, [refugioId]);
    const animales = animalesRes.rows;
    const adminRes = await client.query(`SELECT id FROM usuarios WHERE rol='admin' AND refugio_id=$1 LIMIT 1`, [refugioId]);
    const adminId = adminRes.rows[0].id;

    console.log(`   Refugio: ${refugioId}, Admin: ${adminId}, Animales: ${animales.length}`);

    // Borrar tareas y karma de voluntarios previos
    await client.query(`DELETE FROM tasks WHERE refugio_id=$1`, [refugioId]);
    await client.query(`DELETE FROM karma_events WHERE entity_type='voluntario' AND refugio_id=$1`, [refugioId]);

    // Extender/actualizar voluntarios existentes
    console.log('\n👥 Actualizando voluntarios existentes con karma y especialidades...');
    const existingVols = await client.query(`SELECT id,nombre FROM usuarios WHERE refugio_id=$1`, [refugioId]);
    for (const v of existingVols.rows) {
      await client.query(
        `UPDATE usuarios SET karma_puntos=$1, especialidades=$2, es_disponible=true, ultima_actividad=$3 WHERE id=$4`,
        [rnd(50, 920), ['Cuidado animal','CRM'], ago(rnd(0, 5)), v.id]
      );
    }

    // Crear nuevos voluntarios
    console.log('\n👤 Creando 8 voluntarios nuevos...');
    const hash = await bcrypt.hash('Voluntario1!', 10);
    const volIds = [];
    for (const v of NUEVOS_VOLUNTARIOS) {
      const r = await client.query(
        `INSERT INTO usuarios (refugio_id, nombre, email, password_hash, rol, activo, karma_puntos, especialidades, bio, es_disponible, ultima_actividad)
         VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,true,$9) ON CONFLICT (email) DO UPDATE
         SET karma_puntos=$6, especialidades=$7, bio=$8, ultima_actividad=$9 RETURNING id`,
        [refugioId, v.nombre, v.email, hash, v.rol, v.karma, v.esp, v.bio, ago(rnd(0, 10))]
      );
      volIds.push({ id: r.rows[0].id, ...v });
      console.log(`   ✓ ${v.nombre} (${v.rol}) — ${v.karma} pts karma`);
    }

    // Todos los voluntarios (existentes + nuevos)
    const todosVols = await client.query(`SELECT id FROM usuarios WHERE refugio_id=$1 AND activo=true`, [refugioId]);
    const allVolIds = todosVols.rows.map(r => r.id);

    // Crear 25 tareas
    console.log('\n✅ Creando 25 tareas...');
    for (const t of TAREAS) {
      const asignados = [pick(allVolIds), pick(allVolIds)].filter((v,i,a) => a.indexOf(v) === i);
      const animal = t.animIdx !== undefined && animales[t.animIdx] ? animales[t.animIdx].id : null;
      const fechaLimite = t.diasLimite !== undefined ? daysAgo(-t.diasLimite) : null;
      const completadaAt = t.estado === 'completed' ? ago(rnd(1, 5)) : null;
      const completadaPor = t.estado === 'completed' ? pick(asignados) : null;

      await client.query(
        `INSERT INTO tasks (refugio_id, titulo, categoria, prioridad, estado, animal_id, asignado_a, creado_por, fecha_limite, completada_at, completada_por)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [refugioId, t.titulo, t.categoria, t.prioridad, t.estado, animal, asignados, adminId, fechaLimite, completadaAt, completadaPor]
      );
    }
    console.log(`   ✓ 25 tareas creadas (vencidas, hoy, próximas semana, completadas)`);

    // Karma events para cada voluntario
    console.log('\n⭐ Generando karma events...');
    let totalKarma = 0;
    for (const v of [...existingVols.rows, ...volIds]) {
      const karmaRes = await client.query(`SELECT karma_puntos FROM usuarios WHERE id=$1`, [v.id]);
      let ptsRestantes = karmaRes.rows[0]?.karma_puntos || 0;
      while (ptsRestantes > 0) {
        const razon = pick(KARMA_RAZONES_VOL);
        const pts = razon.includes('alta') ? 10 : razon.includes('media') ? 5 : razon.includes('baja') ? 2 : razon.includes('adopción') ? 25 : razon.includes('Racha') ? 10 : 8;
        const ptsReal = Math.min(pts, ptsRestantes);
        await client.query(
          `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon, created_at) VALUES ($1,'voluntario',$2,$3,$4,$5)`,
          [refugioId, v.id, ptsReal, razon, ago(rnd(1, 200))]
        );
        ptsRestantes -= ptsReal;
        totalKarma++;
        if (ptsRestantes <= 0) break;
      }
    }

    console.log('\n' + '═'.repeat(52));
    console.log('✅ Seed voluntarios completado:');
    console.log(`   👤 ${NUEVOS_VOLUNTARIOS.length} voluntarios nuevos creados`);
    console.log(`   ✅ 25 tareas creadas (${TAREAS.filter(t=>t.diasLimite<0).length} vencidas, ${TAREAS.filter(t=>t.diasLimite===0).length} hoy)`);
    console.log(`   ⭐ ${totalKarma} karma events generados`);
    console.log('═'.repeat(52));
    console.log('\n🔑 Login nuevos voluntarios: password = Voluntario1!');
  } catch(e) {
    console.error('❌ Error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(process.exit);
