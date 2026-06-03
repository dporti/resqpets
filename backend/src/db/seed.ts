import { pool } from './pool';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    // 1. Refugio
    const refugioRes = await client.query(`
      INSERT INTO refugios (nombre, direccion, telefono, email)
      VALUES ('Huella Viva', 'Calle Mayor 12, Madrid', '+34 600 123 456', 'info@huellaviva.org')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    const refugioId = refugioRes.rows[0]?.id || 1;

    // 2. Usuarios
    const hash = async (pw: string) => bcrypt.hash(pw, 10);

    await client.query(`
      INSERT INTO usuarios (refugio_id, nombre, email, password_hash, rol) VALUES
      ($1, 'Admin ResQPet', 'admin@resqpet.com', $2, 'admin'),
      ($1, 'Laura G.', 'laura@huellaviva.org', $3, 'coordinador'),
      ($1, 'Marta S.', 'marta@huellaviva.org', $4, 'voluntario'),
      ($1, 'David R.', 'david@huellaviva.org', $5, 'voluntario')
      ON CONFLICT (email) DO NOTHING
    `, [
      refugioId,
      await hash('Admin1234!'),
      await hash('Laura1234!'),
      await hash('Marta1234!'),
      await hash('David1234!'),
    ]);

    // 3. Animales
    await client.query(`
      INSERT INTO animales (
        refugio_id, id_interno, nombre, especie, raza, sexo,
        fecha_nacimiento, peso_kg, estado, ubicacion_texto,
        estado_salud, esterilizado, vacunado, desparasitado, microchip, pasaporte,
        procedencia, fecha_entrada,
        color, tipo_pelo, ojos, tamaño, señas_particulares,
        nivel_actividad, soc_perros, soc_gatos, soc_niños,
        hogar_ideal, experiencia_previa, descripcion, web_publicado,
        veces_compartido, veces_visto, contactos_recibidos
      ) VALUES
      (
        $1, 'HV-2024-125', 'Max', 'perro', 'Border Collie', 'macho',
        '2020-02-15', 18.0, 'en_acogida', 'Casa de Laura',
        'Saludable', true, true, true, true, true,
        'Rescate en vía pública', '2024-04-12',
        'Blanco y negro', 'Medio', 'Marrones', 'mediano',
        'Mancha negra en la nariz y pata delantera izquierda con una mancha blanca',
        4, 3, 0, 3,
        'Casa con jardín', 'Recomendada',
        'Max es un perro muy inteligente, activo y cariñoso. Fue encontrado vagando solo por una carretera. Al principio era desconfiado, pero ahora está totalmente recuperado y disfruta mucho de la compañía humana.\n\nNecesita ejercicio diario y un entorno donde pueda canalizar su energía.',
        true, 128, 2345, 18
      ),
      (
        $1, 'HV-2024-089', 'Luna', 'gato', 'Europea', 'hembra',
        '2022-03-10', 4.0, 'en_residencia', 'Refugio Central',
        'Saludable', true, true, true, true, false,
        'Entrega voluntaria', '2024-03-03',
        'Naranja y blanco', 'Corto', 'Verdes', 'pequeño',
        'Mancha blanca en el pecho',
        3, 0, 3, 3,
        'Piso o casa', 'No requerida',
        'Luna es una gatita muy dulce y cariñosa que busca un hogar donde recibir todo el amor que merece.',
        true, 64, 890, 7
      ),
      (
        $1, 'HV-2024-102', 'Rocky', 'perro', 'Border Collie', 'macho',
        '2021-06-01', 22.0, 'en_proceso', 'Casa de Marta',
        'Saludable', true, true, false, true, false,
        'Abandono', '2024-04-20',
        'Negro y blanco', 'Largo', 'Marrones', 'grande',
        'Cola larga y esponjosa',
        4, 3, 1, 2,
        'Casa con jardín', 'Recomendada',
        'Rocky es un perro lleno de energía. Necesita un adoptante con experiencia y tiempo.',
        false, 95, 1200, 12
      ),
      (
        $1, 'HV-2023-201', 'Mimi', 'gato', 'Siamés', 'hembra',
        '2019-09-20', 3.5, 'en_adopcion', 'Refugio Central',
        'En tratamiento', true, true, true, true, false,
        'Entrega voluntaria', '2023-01-15',
        'Crema y marrón', 'Corto', 'Azules', 'pequeño',
        'Orejas y cola oscuras típicas de la raza',
        1, 1, 2, 0,
        'Piso tranquilo', 'No requerida',
        'Mimi es una gata elegante y tranquila. Lleva tiempo en el refugio buscando su hogar definitivo.',
        true, 210, 3400, 22
      ),
      (
        $1, 'HV-2024-140', 'Nala', 'perro', 'Labrador', 'hembra',
        '2023-05-01', 28.0, 'en_acogida', 'Casa de David',
        'Saludable', false, true, false, true, false,
        'Decomiso', '2024-05-01',
        'Dorado', 'Corto', 'Marrones', 'grande',
        'Ninguna',
        4, 5, 4, 5,
        'Casa con jardín', 'No requerida',
        'Nala es una cachorrita muy juguetona y sociable. Se lleva bien con todo el mundo.',
        false, 30, 410, 4
      )
      ON CONFLICT (id_interno) DO NOTHING
    `, [refugioId]);

    // 4. Avisos
    await client.query(`
      INSERT INTO avisos (refugio_id, titulo, descripcion, tipo, estado, ubicacion)
      VALUES
      ($1, 'Perro visto en Parque del Retiro', 'Perro mediano, color marrón, sin collar', 'encontrado', 'activo', 'Retiro, Madrid'),
      ($1, 'Gata negra en zona Sol', 'Gata negra adulta merodea la zona', 'encontrado', 'activo', 'Sol, Madrid'),
      ($1, 'Perro perdido en Tetuán', 'Perdido desde hace 3 días, tiene microchip', 'perdido', 'activo', 'Tetuán, Madrid')
      ON CONFLICT DO NOTHING
    `, [refugioId]);

    // 5. Donaciones
    await client.query(`
      INSERT INTO donaciones (refugio_id, donante_nombre, donante_email, importe, fecha)
      VALUES
      ($1, 'Ana López', 'ana@email.com', 50.00, CURRENT_DATE - 3),
      ($1, 'Carlos M.', 'carlos@email.com', 100.00, CURRENT_DATE - 10),
      ($1, 'María P.', NULL, 25.00, CURRENT_DATE - 15)
      ON CONFLICT DO NOTHING
    `, [refugioId]);

    // 6. Eventos
    await client.query(`
      INSERT INTO eventos (refugio_id, titulo, descripcion, fecha_inicio, fecha_fin, lugar)
      VALUES
      ($1, 'Campaña de adopción', 'Jornada de adopción abierta al público', NOW() + interval '5 days', NOW() + interval '5 days' + interval '4 hours', 'Parque del Retiro, Madrid'),
      ($1, 'Revisión veterinaria grupal', 'Revisión trimestral de todos los animales', NOW() + interval '8 days', NULL, 'Clínica VetMadrid'),
      ($1, 'Recogida solidaria', 'Recogida de alimentos y artículos para animales', NOW() + interval '13 days', NOW() + interval '13 days' + interval '2 hours', 'Plaza Mayor, Madrid')
      ON CONFLICT DO NOTHING
    `, [refugioId]);

    // 7. Actividad reciente
    const animalesRes = await client.query('SELECT id, nombre FROM animales WHERE refugio_id=$1', [refugioId]);
    const maxAnimal = animalesRes.rows.find((a: {nombre: string}) => a.nombre === 'Max');
    const lunaAnimal = animalesRes.rows.find((a: {nombre: string}) => a.nombre === 'Luna');
    const rockyAnimal = animalesRes.rows.find((a: {nombre: string}) => a.nombre === 'Rocky');

    if (maxAnimal && rockyAnimal && lunaAnimal) {
      await client.query(`
        INSERT INTO actividad (refugio_id, animal_id, tipo, titulo, descripcion)
        VALUES
        ($1, $2, 'acogida', 'Asignado a acogida · Casa de Laura', 'Max ha sido asignado a acogida temporal en casa de Laura'),
        ($1, $2, 'vacunacion', 'Vacunación · Tetravalente + Rabia', 'Vacunación anual realizada correctamente'),
        ($1, $3, 'adopcion', 'Marta ha solicitado adoptar a Rocky', 'Solicitud de adopción recibida de Marta S.'),
        ($1, $4, 'vacunacion', 'Vacuna registrada para Luna', 'Vacuna antirrábica registrada'),
        ($1, $2, 'otro', 'Nuevo aviso: Gato visto en Chamberí', NULL)
        ON CONFLICT DO NOTHING
      `, [refugioId, maxAnimal.id, rockyAnimal.id, lunaAnimal.id]);
    }

    // 8. Notas internas
    if (maxAnimal) {
      const lauraRes = await client.query(`SELECT id FROM usuarios WHERE email='laura@huellaviva.org'`);
      if (lauraRes.rows.length > 0) {
        await client.query(`
          INSERT INTO animal_notas (animal_id, autor_id, texto, pinned)
          VALUES ($1, $2, 'Max ha mejorado mucho su confianza. Ya pasea bien con correa y obedece órdenes básicas. Le encanta jugar con pelotas.', true)
          ON CONFLICT DO NOTHING
        `, [maxAnimal.id, lauraRes.rows[0].id]);
      }
    }

    console.log('✅ Seed completed!');
    console.log('');
    console.log('👤 Usuarios de prueba:');
    console.log('   admin@resqpet.com     / Admin1234!  (admin)');
    console.log('   laura@huellaviva.org  / Laura1234!  (coordinador)');
    console.log('   marta@huellaviva.org  / Marta1234!  (voluntario)');
    console.log('   david@huellaviva.org  / David1234!  (voluntario)');

  } catch (err) {
    console.error('❌ Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
