/**
 * seed-acogidas.js
 * Pobla las tablas de acogidas con datos de ejemplo realistas.
 * Uso: node scripts/seed-acogidas.js
 */

const path = require('path');
const backendModules = path.join(__dirname, '../backend/node_modules');
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require(path.join(backendModules, 'pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── HELPERS ───────────────────────────────────────────
const ago = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── FAMILIAS ──────────────────────────────────────────
const FAMILIAS = [
  {
    nombre: 'Familia Martínez',
    email: 'martinez.acogida@gmail.com',
    telefono: '612 345 678',
    direccion: 'Calle Embajadores 45, 2ºB',
    ciudad: 'Madrid',
    zona: 'Vallecas',
    max_animales: 2,
    acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: false, acepta_mediano: true, acepta_grande: true,
    acepta_necesidades_especiales: false, acepta_cachorros: false, acepta_seniors: true,
    tiene_jardin: false, ninos_casa: true, edades_ninos: '8, 12',
    otros_animales_casa: '',
    notas: 'Familia muy comprometida, llevan 2 años colaborando. El padre trabaja desde casa a media jornada.',
    estado: 'full',
    karma_puntos: 420,
    fecha_alta: ago(730),
    animales_actuales: 2,
  },
  {
    nombre: 'Laura Sánchez',
    email: 'laura.sanchez.acoge@hotmail.com',
    telefono: '634 987 123',
    direccion: 'Calle Fuencarral 89, 4ºA',
    ciudad: 'Madrid',
    zona: 'Chamberí',
    max_animales: 1,
    acepta_perros: false, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: false, acepta_grande: false,
    acepta_necesidades_especiales: true, acepta_cachorros: true, acepta_seniors: true,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: 'Tengo un gato castrado de 5 años muy tranquilo',
    notas: 'Trabaja desde casa, puede dedicar mucho tiempo al animal. Especializada en gatos con trauma y miedosos.',
    estado: 'available',
    karma_puntos: 185,
    fecha_alta: ago(400),
    animales_actuales: 0,
  },
  {
    nombre: 'Carlos y Ana Romero',
    email: 'romero.familia.acogida@gmail.com',
    telefono: '655 234 567',
    direccion: 'Calle Arroyo del Monte 12',
    ciudad: 'Pozuelo de Alarcón',
    zona: 'Pozuelo',
    max_animales: 3,
    acepta_perros: true, acepta_gatos: true, acepta_otros: true,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: true,
    acepta_necesidades_especiales: true, acepta_cachorros: true, acepta_seniors: true,
    tiene_jardin: true, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: 'Un perro labrador adulto muy sociable',
    notas: 'Familia de referencia. Casa grande con jardín de 200m². Carlos es veterinario en clínica privada. Disponibles para emergencias.',
    estado: 'full',
    karma_puntos: 850,
    fecha_alta: ago(1095),
    animales_actuales: 3,
  },
  {
    nombre: 'Marta García',
    email: 'marta.garcia.voluntaria@gmail.com',
    telefono: '678 012 345',
    direccion: 'Carrer de Verdi 33, 1º1ª',
    ciudad: 'Barcelona',
    zona: 'Gràcia',
    max_animales: 2,
    acepta_perros: true, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: false, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: true, acepta_seniors: false,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Diseñadora freelance, muy flexible con los horarios. Experiencia con perros de rescate ansiosos.',
    estado: 'available',
    karma_puntos: 110,
    fecha_alta: ago(365),
    animales_actuales: 0,
  },
  {
    nombre: 'Pedro Jiménez',
    email: 'pedro.jimenez.acogida@outlook.com',
    telefono: '601 456 789',
    direccion: 'Calle San Fernando 78, 3ºC',
    ciudad: 'Sevilla',
    zona: 'Triana',
    max_animales: 1,
    acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: false, acepta_mediano: true, acepta_grande: true,
    acepta_necesidades_especiales: true, acepta_cachorros: false, acepta_seniors: true,
    tiene_jardin: true, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Jubilado con mucho tiempo libre. Especializado en perros mayores y con problemas de movilidad. Tiene patio con sombra.',
    estado: 'available',
    karma_puntos: 320,
    fecha_alta: ago(900),
    animales_actuales: 0,
  },
  {
    nombre: 'Familia López',
    email: 'lopezfamilia.acogida@gmail.com',
    telefono: '619 876 543',
    direccion: 'Calle de la Encina 5',
    ciudad: 'Alcobendas',
    zona: 'Alcobendas',
    max_animales: 2,
    acepta_perros: true, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: true, acepta_seniors: false,
    tiene_jardin: true, ninos_casa: true, edades_ninos: '5',
    otros_animales_casa: '',
    notas: 'Recién incorporados. Casa adosada con jardín vallado. El niño adora los animales y están muy motivados.',
    estado: 'available',
    karma_puntos: 10,
    fecha_alta: ago(60),
    animales_actuales: 0,
  },
  {
    nombre: 'Sofía Ruiz',
    email: 'sofia.ruiz.gatos@gmail.com',
    telefono: '645 321 987',
    direccion: 'Carrer de Colón 55, 2ºB',
    ciudad: 'Valencia',
    zona: 'El Carmen',
    max_animales: 2,
    acepta_perros: false, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: false, acepta_grande: false,
    acepta_necesidades_especiales: true, acepta_cachorros: false, acepta_seniors: true,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: 'Dos gatos propios, muy sociables',
    notas: 'Etóloga felina. Experta en socialización de gatos ferales y con miedo. Tiene sala habilitada especialmente para nuevos acogidos.',
    estado: 'full',
    karma_puntos: 290,
    fecha_alta: ago(600),
    animales_actuales: 2,
  },
  {
    nombre: 'David Fernández',
    email: 'david.fernandez.acoge@gmail.com',
    telefono: '623 654 321',
    direccion: 'Calle Orcasitas 23, 1ºA',
    ciudad: 'Madrid',
    zona: 'Carabanchel',
    max_animales: 1,
    acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: false, acepta_mediano: true, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: false, acepta_seniors: false,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Runner habitual, puede dar mucho ejercicio al animal. Vive solo, el perro tendrá toda la atención.',
    estado: 'available',
    karma_puntos: 70,
    fecha_alta: ago(180),
    animales_actuales: 0,
  },
  {
    nombre: 'Familia Navarro',
    email: 'navarro.acogida.maj@gmail.com',
    telefono: '691 234 876',
    direccion: 'Calle Real 15',
    ciudad: 'Majadahonda',
    zona: 'Majadahonda',
    max_animales: 2,
    acepta_perros: true, acepta_gatos: true, acepta_otros: true,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: true, acepta_seniors: false,
    tiene_jardin: true, ninos_casa: true, edades_ninos: '4, 7, 10',
    otros_animales_casa: '',
    notas: 'Tres niños acostumbrados a animales desde pequeños. La madre trabaja solo por las mañanas.',
    estado: 'available',
    karma_puntos: 155,
    fecha_alta: ago(500),
    animales_actuales: 0,
  },
  {
    nombre: 'Elena Torres',
    email: 'elena.torres.acogida@hotmail.com',
    telefono: '667 890 234',
    direccion: 'Carrer de Provença 210, 3º2ª',
    ciudad: 'Barcelona',
    zona: 'Eixample',
    max_animales: 2,
    acepta_perros: true, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: false, acepta_grande: false,
    acepta_necesidades_especiales: true, acepta_cachorros: false, acepta_seniors: true,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Enfermera, turno de mañanas. Puede cuidar animales con medicación. Mucha experiencia con gatos FIV+.',
    estado: 'available',
    karma_puntos: 205,
    fecha_alta: ago(450),
    animales_actuales: 0,
  },
  {
    nombre: 'Miguel Ángel Moreno',
    email: 'miguelmoreno.acoge@gmail.com',
    telefono: '605 123 456',
    direccion: 'Calle de Arturo Soria 88, 2ºB',
    ciudad: 'Madrid',
    zona: 'Hortaleza',
    max_animales: 1,
    acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: false, acepta_mediano: false, acepta_grande: true,
    acepta_necesidades_especiales: false, acepta_cachorros: false, acepta_seniors: false,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Vive en dúplex, espacio amplio. Antiguo adiestrador, puede ayudar con perros con problemas de comportamiento.',
    estado: 'paused',
    karma_puntos: 60,
    fecha_alta: ago(270),
    animales_actuales: 0,
  },
  {
    nombre: 'Familia Herrera',
    email: 'herrera.lasrozas.acogida@gmail.com',
    telefono: '657 890 123',
    direccion: 'Calle del Roble 3',
    ciudad: 'Las Rozas de Madrid',
    zona: 'Las Rozas',
    max_animales: 3,
    acepta_perros: true, acepta_gatos: true, acepta_otros: true,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: true,
    acepta_necesidades_especiales: true, acepta_cachorros: true, acepta_seniors: true,
    tiene_jardin: true, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: 'Una perra golden retriever de 6 años',
    notas: 'Finca con jardín de 800m². Disponibles para acogidas de urgencia. Llevan 3 años colaborando activamente.',
    estado: 'available',
    karma_puntos: 680,
    fecha_alta: ago(1095),
    animales_actuales: 1,
  },
  {
    nombre: 'Carmen Díaz',
    email: 'carmen.diaz.gatos@gmail.com',
    telefono: '613 567 890',
    direccion: 'Calle Larios 22, 1ºA',
    ciudad: 'Málaga',
    zona: 'Centro',
    max_animales: 2,
    acepta_perros: false, acepta_gatos: true, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: false, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: true, acepta_seniors: true,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Trabaja 100% remoto. Piso céntrico bien acondicionado para gatos. Experiencia previa con colonia urbana.',
    estado: 'paused',
    karma_puntos: 95,
    fecha_alta: ago(300),
    animales_actuales: 0,
  },
  {
    nombre: 'Roberto Sanz',
    email: 'roberto.sanz.acoge@outlook.com',
    telefono: '639 012 678',
    direccion: 'Paseo de las Delicias 45, 3ºC',
    ciudad: 'Madrid',
    zona: 'Arganzuela',
    max_animales: 1,
    acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: false, acepta_mediano: true, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: false, acepta_seniors: false,
    tiene_jardin: false, ninos_casa: false, edades_ninos: '',
    otros_animales_casa: '',
    notas: 'Primera vez acogiendo, ha recibido formación. Muy responsable y constante en las actualizaciones.',
    estado: 'inactive',
    karma_puntos: 0,
    fecha_alta: ago(45),
    animales_actuales: 0,
  },
  {
    nombre: 'Familia Castillo',
    email: 'castillo.boadilla.acogida@gmail.com',
    telefono: '648 345 901',
    direccion: 'Calle del Golf 8',
    ciudad: 'Boadilla del Monte',
    zona: 'Boadilla',
    max_animales: 3,
    acepta_perros: true, acepta_gatos: true, acepta_otros: true,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: true,
    acepta_necesidades_especiales: true, acepta_cachorros: true, acepta_seniors: true,
    tiene_jardin: true, ninos_casa: true, edades_ninos: '6, 9, 14',
    otros_animales_casa: '',
    notas: 'El padre es veterinario en clínica propia en Majadahonda. Pueden manejar cualquier caso médico complejo. Casa referencia del refugio.',
    estado: 'full',
    karma_puntos: 510,
    fecha_alta: ago(800),
    animales_actuales: 3,
  },
];

const NOTAS_ASIGNACION = [
  'Medicación antiparasitaria al día. Darle el pienso en 2 tomas. Le gusta dormir en cama.',
  'Animal tímido, necesita tiempo de adaptación. No forzar el contacto los primeros días. Consultar cualquier duda.',
  'Muy sociable, se adapta rápido. Subir fotos al WhatsApp cada semana. Próxima vacuna en 3 semanas.',
  'Viene de situación de maltrato, puede asustarse con ruidos fuertes. Tratar con mucha paciencia y calma.',
  'Cachorro activo, necesita 3 paseos diarios mínimo. Está en proceso de aprendizaje de normas básicas.',
  'Animal senior con artrosis leve. No escalar escaleras, adaptar cama a altura baja. Frío le afecta.',
  'Muy glotón, racionar bien la comida. Pesa un poco de más, dieta de control. Mucho ejercicio recomendado.',
  'En proceso de socialización con otros perros. Evitar parques con perros sueltos durante la primera semana.',
];

const NOTAS_CONTACTO_BIEN = [
  'El animal está genial, muy integrado en la familia. Come bien y tiene mucha energía.',
  'Todo perfecto. Ha ganado confianza increíblemente rápido. La familia está encantada.',
  'Muy contento y juguetón. Se lleva bien con todos en casa. Sin novedad.',
  'Evolución muy positiva. Ya duerme tranquilo y no tiene ansiedad por separación.',
  'Come, juega y duerme fenomenal. Ha aprendido a subir y bajar escaleras solo.',
];

const NOTAS_CONTACTO_REGULAR = [
  'Come un poco menos de lo habitual, hay que vigilarlo. Por lo demás bien.',
  'Algo nervioso los últimos días, puede ser por los cambios de tiempo. Sin alarma.',
  'Le ha costado adaptarse a los turnos de trabajo, pero ya va mejorando.',
  'Tuvo un pequeño episodio de vómito pero ya está bien. Pendientes.',
];

const NOTAS_VALORACION = [
  'Familia excepcional. El animal llegó tímido y en 3 semanas era otro. Totalmente recomendables.',
  'Muy responsables y comunicativos. Actualizaciones constantes y mucho cariño.',
  'Excelente acogida. Atendieron todas las pautas al pie de la letra. Gracias.',
  'Familia muy cálida. El animal salió de allí mucho más confiado y equilibrado.',
  'Buen trabajo aunque les costó un poco el tema de la medicación al principio.',
  'Cumplidores y cariñosos. Lo repiten sin dudarlo.',
];

const FIN_RAZONES = [
  { motivo: 'adopted_by_family', peso: 3 },
  { motivo: 'adopted_other', peso: 5 },
  { motivo: 'returned', peso: 2 },
  { motivo: 'transferred', peso: 2 },
];

const randomMotivo = () => {
  const pool = FIN_RAZONES.flatMap(m => Array(m.peso).fill(m.motivo));
  return pick(pool);
};

// ── MAIN ──────────────────────────────────────────────
async function main() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed de Acogidas...\n');

    // 1. Obtener IDs existentes
    const refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    if (refugioRes.rows.length === 0) throw new Error('No hay refugios en la BD');
    const refugioId = refugioRes.rows[0].id;

    const adminRes = await client.query("SELECT id FROM usuarios WHERE rol='admin' LIMIT 1");
    if (adminRes.rows.length === 0) throw new Error('No hay usuario admin en la BD');
    const adminId = adminRes.rows[0].id;

    const animalesRes = await client.query(`
      SELECT id, nombre, especie, estado FROM animales
      WHERE refugio_id = $1 ORDER BY id`, [refugioId]);
    const animales = animalesRes.rows;
    console.log(`   Refugio ID: ${refugioId}`);
    console.log(`   Admin ID: ${adminId}`);
    console.log(`   Animales encontrados: ${animales.length}`);

    // 2. Limpiar datos previos de acogidas (para re-run limpio)
    await client.query('DELETE FROM karma_events WHERE refugio_id = $1', [refugioId]);
    await client.query('DELETE FROM foster_contacts WHERE refugio_id = $1', [refugioId]);
    await client.query('DELETE FROM foster_assignments WHERE refugio_id = $1', [refugioId]);
    await client.query('DELETE FROM foster_families WHERE refugio_id = $1', [refugioId]);
    console.log('   Datos anteriores eliminados\n');

    // 3. Insertar familias
    console.log('👨‍👩‍👧 Creando 15 familias de acogida...');
    const familiaIds = [];
    for (const f of FAMILIAS) {
      const r = await client.query(`
        INSERT INTO foster_families (
          refugio_id, nombre, email, telefono, direccion, ciudad, zona,
          max_animales, animales_actuales,
          acepta_perros, acepta_gatos, acepta_otros,
          acepta_pequeño, acepta_mediano, acepta_grande,
          acepta_necesidades_especiales, acepta_cachorros, acepta_seniors,
          tiene_jardin, otros_animales_casa, ninos_casa, edades_ninos, notas,
          estado, karma_puntos, fecha_alta
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,
          $10,$11,$12,
          $13,$14,$15,
          $16,$17,$18,
          $19,$20,$21,$22,$23,
          $24,$25,$26
        ) RETURNING id`,
        [
          refugioId, f.nombre, f.email, f.telefono, f.direccion, f.ciudad, f.zona,
          f.max_animales, f.animales_actuales,
          f.acepta_perros, f.acepta_gatos, f.acepta_otros,
          f.acepta_pequeño, f.acepta_mediano, f.acepta_grande,
          f.acepta_necesidades_especiales, f.acepta_cachorros, f.acepta_seniors,
          f.tiene_jardin, f.otros_animales_casa, f.ninos_casa, f.edades_ninos, f.notas,
          f.estado, f.karma_puntos, f.fecha_alta,
        ]
      );
      familiaIds.push({ id: r.rows[0].id, ...f });
      process.stdout.write(`   ✓ ${f.nombre}\n`);
    }

    // 4. Acogidas activas
    console.log('\n🏠 Creando acogidas activas...');
    const familiasDisponibles = familiaIds.filter(f => f.animales_actuales > 0 || f.estado === 'full');
    const animalesParaActivas = animales.filter(a => a.estado === 'en_acogida');

    const assignmentIds = [];
    const familiasConActivas = [
      familiaIds.find(f => f.nombre === 'Familia Martínez'),
      familiaIds.find(f => f.nombre === 'Carlos y Ana Romero'),
      familiaIds.find(f => f.nombre === 'Sofía Ruiz'),
      familiaIds.find(f => f.nombre === 'Familia Castillo'),
      familiaIds.find(f => f.nombre === 'Familia Herrera'),
    ].filter(Boolean);

    // Asignar animales reales a familias
    let assignedAnimals = 0;
    for (let i = 0; i < Math.min(familiasConActivas.length, animales.length); i++) {
      const familia = familiasConActivas[i];
      const animal = animales[i % animales.length];
      const diasInicio = rnd(5, 118);
      const iniciada_at = ago(diasInicio);

      const r = await client.query(`
        INSERT INTO foster_assignments (
          refugio_id, animal_id, familia_id, iniciada_at, fin_estimado_at,
          estado, notas_coordinador, creado_por
        ) VALUES ($1,$2,$3,$4,$5,'active',$6,$7) RETURNING id`,
        [
          refugioId, animal.id, familia.id, iniciada_at,
          ago(rnd(-30, -5)), // fin estimado en el futuro
          pick(NOTAS_ASIGNACION), adminId,
        ]
      );
      assignmentIds.push({ id: r.rows[0].id, animalNombre: animal.nombre, familiaNombre: familia.nombre, diasInicio });
      assignedAnimals++;
      console.log(`   ✓ ${animal.nombre} → ${familia.nombre} (${diasInicio} días)`);
    }

    // Si hay más animales en acogida sin asignar, crear más con otras familias
    const otrasDisponibles = familiaIds.filter(f => !familiasConActivas.find(fc => fc?.id === f.id) && f.estado !== 'inactive');
    for (let i = assignedAnimals; i < Math.min(8, animales.length); i++) {
      const familia = otrasDisponibles[i % otrasDisponibles.length];
      if (!familia) break;
      const animal = animales[(i + 2) % animales.length];
      const diasInicio = rnd(5, 90);
      const r = await client.query(`
        INSERT INTO foster_assignments (
          refugio_id, animal_id, familia_id, iniciada_at,
          estado, notas_coordinador, creado_por
        ) VALUES ($1,$2,$3,$4,'active',$5,$6) RETURNING id`,
        [refugioId, animal.id, familia.id, ago(diasInicio), pick(NOTAS_ASIGNACION), adminId]
      );
      assignmentIds.push({ id: r.rows[0].id, animalNombre: animal.nombre, familiaNombre: familia.nombre, diasInicio });
      console.log(`   ✓ ${animal.nombre} → ${familia.nombre} (${diasInicio} días)`);
    }

    // 5. Acogidas completadas (historial) — 20 registros
    console.log('\n📋 Creando historial de acogidas completadas (20)...');
    let completadas = 0;
    for (let i = 0; i < 20; i++) {
      const familia = pick(familiaIds);
      const animal = pick(animales);
      const diasFin = rnd(30, 730);
      const duracion = rnd(14, 180);
      const finalizada_at = ago(diasFin);
      const iniciada_at = ago(diasFin + duracion);
      const valoracion = rnd(3, 5);
      const motivo = randomMotivo();

      await client.query(`
        INSERT INTO foster_assignments (
          refugio_id, animal_id, familia_id, iniciada_at, finalizada_at,
          estado, motivo_fin, valoracion, notas_valoracion, notas_coordinador, creado_por
        ) VALUES ($1,$2,$3,$4,$5,'completed',$6,$7,$8,$9,$10)`,
        [
          refugioId, animal.id, familia.id, iniciada_at, finalizada_at,
          motivo, valoracion, pick(NOTAS_VALORACION), pick(NOTAS_ASIGNACION), adminId,
        ]
      );
      completadas++;
    }
    console.log(`   ✓ ${completadas} acogidas completadas creadas`);

    // 6. Contactos de seguimiento para acogidas activas
    console.log('\n📞 Creando contactos de seguimiento...');
    const TIPOS_CONTACTO = ['llamada', 'visita', 'whatsapp', 'llamada', 'llamada'];
    const ESTADOS_ANIMAL = ['muy_bien', 'bien', 'bien', 'bien', 'regular'];
    let totalContactos = 0;

    for (const assignment of assignmentIds) {
      const nContactos = rnd(2, 5);
      const diasBase = assignment.diasInicio;

      for (let j = 0; j < nContactos; j++) {
        const diasContacto = Math.floor((diasBase / nContactos) * (j + 1));
        const estadoAnimal = pick(ESTADOS_ANIMAL);
        const notas = estadoAnimal === 'regular' ? pick(NOTAS_CONTACTO_REGULAR) : pick(NOTAS_CONTACTO_BIEN);
        const requiereAccion = estadoAnimal === 'regular' && Math.random() < 0.3;

        await client.query(`
          INSERT INTO foster_contacts (
            refugio_id, assignment_id, tipo, contactado_at,
            estado_animal, notas, requiere_accion, descripcion_accion, creado_por
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            refugioId, assignment.id, pick(TIPOS_CONTACTO),
            new Date(Date.now() - diasContacto * 86400000).toISOString(),
            estadoAnimal, notas, requiereAccion,
            requiereAccion ? 'Hacer seguimiento en 3 días' : null,
            adminId,
          ]
        );
        totalContactos++;
      }
      console.log(`   ✓ ${nContactos} contactos para ${assignment.animalNombre} (${assignment.familiaNombre})`);
    }

    // 7. Karma events para familias con puntos
    console.log('\n⭐ Creando eventos de karma...');
    let totalKarmaEvents = 0;

    for (const familia of familiaIds) {
      if (familia.karma_puntos === 0) continue;

      let puntosRestantes = familia.karma_puntos;
      const diasBase = parseInt(familia.fecha_alta.split('T')[0]) ? 0 : 0;

      // Primera acogida completada: +50
      if (puntosRestantes >= 50) {
        await client.query(
          `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon, created_at)
           VALUES ($1,'foster_family',$2,50,'Primera acogida completada',$3)`,
          [refugioId, familia.id, ago(rnd(200, parseInt(familia.fecha_alta) || 300))]
        );
        puntosRestantes -= 50;
        totalKarmaEvents++;
      }

      // Días de acogida: +1 cada 7 días
      const numPeriodos = Math.floor(Math.min(puntosRestantes, 200) / 1);
      if (numPeriodos > 0) {
        const ptsDias = Math.min(puntosRestantes, numPeriodos);
        await client.query(
          `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon, created_at)
           VALUES ($1,'foster_family',$2,$3,$4,$5)`,
          [refugioId, familia.id, ptsDias, `${ptsDias * 7} días acumulados de acogida`, ago(rnd(30, 150))]
        );
        puntosRestantes -= ptsDias;
        totalKarmaEvents++;
      }

      // Adopciones desde el hogar: +10 cada una
      while (puntosRestantes >= 10) {
        await client.query(
          `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon, created_at)
           VALUES ($1,'foster_family',$2,10,'Animal adoptado desde el hogar de acogida',$3)`,
          [refugioId, familia.id, ago(rnd(60, 300))]
        );
        puntosRestantes -= 10;
        totalKarmaEvents++;
        if (puntosRestantes < 10) break;
      }

      // Especiales: +20 si aplica
      if (puntosRestantes >= 20 && familia.acepta_necesidades_especiales) {
        await client.query(
          `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon, created_at)
           VALUES ($1,'foster_family',$2,20,'Acogida de animal con necesidades especiales',$3)`,
          [refugioId, familia.id, ago(rnd(90, 400))]
        );
        totalKarmaEvents++;
      }
    }
    console.log(`   ✓ ${totalKarmaEvents} eventos de karma creados`);

    // ── RESUMEN ───────────────────────────────────────
    console.log('\n' + '═'.repeat(52));
    console.log('✅ Seed completado:');
    console.log(`   👨‍👩‍👧 ${FAMILIAS.length} familias de acogida creadas`);
    console.log(`   🏠 ${assignmentIds.length} acogidas activas`);
    console.log(`   📋 ${completadas} acogidas completadas`);
    console.log(`   📞 ${totalContactos} contactos de seguimiento`);
    console.log(`   ⭐ ${totalKarmaEvents} eventos de karma`);
    console.log('═'.repeat(52));

    console.log('\nFamilias por estado:');
    const byStatus = {};
    for (const f of FAMILIAS) byStatus[f.estado] = (byStatus[f.estado] || 0) + 1;
    for (const [k, v] of Object.entries(byStatus)) console.log(`   ${k}: ${v}`);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(process.exit);
