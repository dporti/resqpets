const path = require('path');
const backendModules = path.join(__dirname, '../backend/node_modules');
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require(path.join(backendModules, 'pg'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const ago = d => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

const ALERTS = [
  { tipo:'lost',  urg:'high',   esp:'perro', raza:'Border Collie', color:'Negro y blanco', tam:'mediano', nombre:'Max',    lat:40.4153, lng:-3.6835, ub:'Parque del Retiro, entrada Puerta de Alcalá',   desc:'Se escapó del parque asustado por los petardos. Lleva collar rojo con placa.',    dias:1, reportero:'Elena Martín',   tel:'612345678', rep_email:'elena@gmail.com', fotos:['https://picsum.photos/seed/dog1/400/300'] },
  { tipo:'found', urg:'medium', esp:'gato',  raza:'Europeo',       color:'Gris',           tam:'pequeño', nombre:null,     lat:40.4293, lng:-3.7168, ub:'Parque del Oeste, zona rosaleda',                desc:'Gato encontrado debajo de un banco. Parece asustado y algo delgado.',            dias:2, reportero:'Carlos López',   tel:'634987123', rep_email:null,             fotos:['https://picsum.photos/seed/cat1/400/300'] },
  { tipo:'lost',  urg:'high',   esp:'perro', raza:'Labrador',      color:'Dorado',         tam:'grande',  nombre:'Nala',   lat:40.4087, lng:-3.7487, ub:'Casa de Campo, cerca del lago',                  desc:'Nala tiene chip. Se asustó de un ciclista y salió corriendo.',                    dias:1, reportero:'Ana Gómez',      tel:'655234567', rep_email:'ana@gmail.com',  fotos:['https://picsum.photos/seed/dog2/400/300'] },
  { tipo:'found', urg:'low',    esp:'gato',  raza:'Siamés',        color:'Crema y marrón', tam:'pequeño', nombre:null,     lat:40.3932, lng:-3.7040, ub:'Parque Tierno Galván, Madrid',                   desc:'Gatita siamesa muy tranquila. Parece acostumbrada a vivir en casa.',              dias:3, reportero:'Lucía Herrero',  tel:'678012345', rep_email:null,             fotos:['https://picsum.photos/seed/cat2/400/300'] },
  { tipo:'lost',  urg:'medium', esp:'perro', raza:'Golden Retriever', color:'Dorado',      tam:'grande',  nombre:'Coco',   lat:40.4629, lng:-3.6104, ub:'Parque Juan Carlos I, sector oeste',             desc:'Coco salió corriendo cuando sonaron fuegos artificiales. Muy sociable.',          dias:4, reportero:'Miguel Torres',  tel:'601456789', rep_email:'miguel@gmail.com', fotos:['https://picsum.photos/seed/dog3/400/300'] },
  { tipo:'found', urg:'high',   esp:'perro', raza:'Mestizo',       color:'Negro',          tam:'mediano', nombre:null,     lat:40.3862, lng:-3.6922, ub:'Parque de Pradolongo, Usera',                    desc:'Perro negro encontrado herido en la pata delantera. Necesita atención urgente.',  dias:0, reportero:'Sofía Ruiz',     tel:'645321987', rep_email:null,             fotos:['https://picsum.photos/seed/dog4/400/300'] },
  { tipo:'lost',  urg:'low',    esp:'gato',  raza:'Persa',         color:'Blanco',         tam:'mediano', nombre:'Luna',   lat:40.5211, lng:-3.7735, ub:'El Pardo, cerca de la urbanización',             desc:'Luna se escapó cuando dejamos la ventana abierta. Muy miedosa con extraños.',    dias:5, reportero:'David Fernández', tel:'623654321', rep_email:'david@gmail.com', fotos:['https://picsum.photos/seed/cat3/400/300'] },
  { tipo:'found', urg:'medium', esp:'perro', raza:'Beagle',        color:'Tricolor',       tam:'mediano', nombre:null,     lat:40.3081, lng:-3.7333, ub:'Getafe, zona Centro Comercial',                  desc:'Beagle tricolor sin collar encontrado en el aparcamiento. Está bien.',            dias:2, reportero:'Roberto Sanz',   tel:'639012678', rep_email:null,             fotos:['https://picsum.photos/seed/dog5/400/300'] },
  { tipo:'lost',  urg:'high',   esp:'perro', raza:'Pastor Alemán', color:'Negro y marrón', tam:'grande',  nombre:'Rex',    lat:40.3490, lng:-3.8254, ub:'Alcorcón, Parque de los Pinos',                  desc:'Rex se asustó de un camión y se soltó de la correa. Tiene chip y vacunas.',      dias:1, reportero:'Carmen Díaz',   tel:'613567890', rep_email:'carmen@gmail.com', fotos:['https://picsum.photos/seed/dog6/400/300'] },
  { tipo:'found', urg:'low',    esp:'gato',  raza:'Europeo',       color:'Naranja',        tam:'pequeño', nombre:null,     lat:40.3281, lng:-3.7664, ub:'Leganés, Calle Mayor',                           desc:'Gato naranja muy tranquilo encontrado en portal de edificio.',                   dias:6, reportero:'Patricia Iglesias', tel:'691234876', rep_email:null,          fotos:['https://picsum.photos/seed/cat4/400/300'] },
  { tipo:'lost',  urg:'medium', esp:'perro', raza:'Chihuahua',     color:'Marrón',         tam:'pequeño', nombre:'Pipo',   lat:40.4726, lng:-3.8726, ub:'Majadahonda, Parque Central',                   desc:'Pipo se escapó por la puerta del jardín. Muy pequeño, puede estar escondido.',   dias:3, reportero:'Familia Navarro', tel:'648345901', rep_email:'navarro@gmail.com', fotos:['https://picsum.photos/seed/dog7/400/300'] },
  { tipo:'found', urg:'medium', esp:'perro', raza:'Bichón Maltés', color:'Blanco',         tam:'pequeño', nombre:null,     lat:40.4375, lng:-3.8147, ub:'Pozuelo de Alarcón, zona residencial',           desc:'Bichón maltés encontrado vagando solo. Lleva collar rosa sin placa.',            dias:1, reportero:'Isabel Gómez',   tel:'634921345', rep_email:'isabel@gmail.com', fotos:['https://picsum.photos/seed/dog8/400/300'] },
  { tipo:'lost',  urg:'high',   esp:'perro', raza:'Dálmata',       color:'Blanco con manchas', tam:'grande', nombre:'Pongo', lat:40.4930, lng:-3.8737, ub:'Las Rozas, Urb. Las Matas',              desc:'Pongo se soltó durante un paseo. Muy sociable pero puede asustarse del tráfico.', dias:0, reportero:'Jorge Medina',   tel:'605123456', rep_email:null,             fotos:['https://picsum.photos/seed/dog9/400/300'] },
  { tipo:'found', urg:'low',    esp:'gato',  raza:'Angora',        color:'Gris y blanco',  tam:'mediano', nombre:null,     lat:40.4605, lng:-3.4757, ub:'Torrejón de Ardoz, zona industrial',             desc:'Gato angora encontrado en empresa. Parece bien cuidado, busca a sus dueños.',    dias:7, reportero:'Fernando Castro', tel:'657890123', rep_email:'fernando@gmail.com', fotos:['https://picsum.photos/seed/cat5/400/300'] },
  { tipo:'lost',  urg:'medium', esp:'perro', raza:'Schnauzer',     color:'Gris',           tam:'pequeño', nombre:'Fritz',  lat:40.4730, lng:-3.7050, ub:'Barrio de Salamanca, Calle Serrano',            desc:'Fritz se escapó durante una visita al veterinario. Lleva correa sin dueño.',    dias:2, reportero:'Tomás Vidal',    tel:'667890234', rep_email:'tomas@gmail.com', fotos:['https://picsum.photos/seed/dog10/400/300'] },
  { tipo:'found', urg:'high',   esp:'perro', raza:'Mestizo',       color:'Beige',          tam:'mediano', nombre:null,     lat:40.3950, lng:-3.6920, ub:'Vallecas, junto a la M-40',                     desc:'Perro encontrado en carretera M-40. Tiene una herida en la cabeza. URGENTE.',    dias:0, reportero:'Ana Belén Ruiz', tel:'648901234', rep_email:null,             fotos:['https://picsum.photos/seed/dog11/400/300'] },
  { tipo:'lost',  urg:'low',    esp:'gato',  raza:'Maine Coon',    color:'Marrón y negro', tam:'grande',  nombre:'Simba',  lat:40.4200, lng:-3.7100, ub:'Lavapiés, Madrid Centro',                       desc:'Simba es un gato muy grande y majestuoso. Vive en interior, puede estar desorientado.', dias:8, reportero:'Alejandro Muñoz', tel:'619876543', rep_email:'alejandro@gmail.com', fotos:['https://picsum.photos/seed/cat6/400/300'] },
  { tipo:'found', urg:'medium', esp:'perro', raza:'Cocker Spaniel', color:'Rubio',         tam:'mediano', nombre:null,     lat:40.4350, lng:-3.6700, ub:'Barrio de Salamanca, Parque Berlin',             desc:'Cocker spaniel muy tranquilo encontrado en el parque. Lleva collar azul marino.',dias:3, reportero:'Lucía Herrero',  tel:'678012345', rep_email:'lucia@gmail.com', fotos:['https://picsum.photos/seed/dog12/400/300'] },
  { tipo:'lost',  urg:'medium', esp:'perro', raza:'Husky',         color:'Gris y blanco',  tam:'grande',  nombre:'Lobo',   lat:40.4600, lng:-3.6500, ub:'Hortaleza, Parque Juan Carlos I sector norte',   desc:'Lobo es un Husky de 3 años. Muy activo. Se escapó durante el paseo matutino.',   dias:2, reportero:'Miguel Ángel Moreno', tel:'605123456', rep_email:null,      fotos:['https://picsum.photos/seed/dog13/400/300'] },
  { tipo:'found', urg:'low',    esp:'otro',  raza:'Conejo',        color:'Blanco',         tam:'pequeño', nombre:null,     lat:40.4100, lng:-3.7000, ub:'Malasaña, Madrid',                               desc:'Conejo blanco encontrado en escalera de edificio. Parece doméstico.',             dias:5, reportero:'Elena Torres',   tel:'655234567', rep_email:'elena@gmail.com', fotos:['https://picsum.photos/seed/rabbit1/400/300'] },
];

const UPDATES = [
  'El animal fue avistado en la misma zona 2 horas después del aviso.',
  'El dueño ha confirmado que el animal tiene microchip registrado.',
  'La protectora ha enviado un voluntario a la zona a buscar.',
  'Se ha contactado con las clínicas veterinarias de la zona.',
  'Un vecino reportó haberlo visto pero ya no estaba cuando llegamos.',
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seed de SOS Pet...\n');
    const refugioRes = await client.query('SELECT id FROM refugios LIMIT 1');
    const refugioId = refugioRes.rows[0].id;

    await client.query('DELETE FROM sos_updates WHERE TRUE');
    await client.query('DELETE FROM sos_alerts WHERE TRUE');
    console.log('   Datos anteriores eliminados\n');

    console.log(`🔔 Creando ${ALERTS.length} avisos SOS...`);
    let count = 1;
    for (const a of ALERTS) {
      const codigo = `SOS-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`;
      const estadoOptions = count <= 3 ? 'active' : count <= 6 ? 'active' : count <= 12 ? 'active' : count === 13 ? 'rescued' : count === 14 ? 'resolved' : 'active';
      const r = await client.query(
        `INSERT INTO sos_alerts (refugio_id,tipo,urgencia,estado,especie,raza,color,tamaño,
         nombre_animal,descripcion,fotos,latitud,longitud,ubicacion_descripcion,
         visto_en,reportero_nombre,reportero_telefono,reportero_email,
         quiere_notificaciones,codigo_referencia,es_publico)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,true) RETURNING id`,
        [refugioId, a.tipo, a.urg, estadoOptions, a.esp, a.raza, a.color, a.tam,
         a.nombre, a.desc, a.fotos, a.lat, a.lng, a.ub,
         new Date(Date.now() - a.dias * 86400000).toISOString(),
         a.reportero, a.tel, a.rep_email, Math.random() > 0.5, codigo]
      );
      const alertId = r.rows[0].id;

      if (Math.random() > 0.5) {
        await client.query(
          `INSERT INTO sos_updates (sos_alert_id, contenido) VALUES ($1,$2)`,
          [alertId, pick(UPDATES)]
        );
      }
      if (Math.random() > 0.7) {
        await client.query(
          `INSERT INTO sos_updates (sos_alert_id, contenido) VALUES ($1,$2)`,
          [alertId, pick(UPDATES)]
        );
      }
      console.log(`   ✓ [${a.tipo === 'lost' ? '🔴' : '🔵'}][${a.urg}] ${a.esp} ${a.raza} · ${codigo}`);
      count++;
    }

    console.log('\n' + '═'.repeat(52));
    console.log('✅ Seed SOS Pet completado:');
    const stats = ALERTS.reduce((a, x) => { a[x.tipo] = (a[x.tipo]||0)+1; return a; }, {});
    console.log(`   🔴 ${stats['lost']} perdidos · 🔵 ${stats['found']} avistados`);
    console.log(`   🚨 ${ALERTS.filter(a=>a.urg==='high').length} alta urgencia`);
    console.log(`   📍 Madrid y área metropolitana`);
    console.log('═'.repeat(52));
    console.log('\n🌐 Portal público: http://localhost:5173/sos');
    console.log('🗺️  CRM interno: http://localhost:5173 → Avisos');
  } catch(e) {
    console.error('❌ Error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(process.exit);
