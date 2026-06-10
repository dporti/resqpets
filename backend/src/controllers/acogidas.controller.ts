import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// ── KARMA HELPER ─────────────────────────────────────
async function addKarma(refugioId: number, familiaId: number, puntos: number, razon: string) {
  await query(
    `INSERT INTO karma_events (refugio_id, entity_type, entity_id, puntos, razon)
     VALUES ($1,'foster_family',$2,$3,$4)`,
    [refugioId, familiaId, puntos, razon]
  );
  await query(
    `UPDATE foster_families SET karma_puntos = karma_puntos + $1 WHERE id = $2`,
    [puntos, familiaId]
  );
}

// ── FAMILIAS ──────────────────────────────────────────
export async function getFamilias(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { estado, especie } = req.query;
  try {
    let q = `
      SELECT f.*,
        (SELECT COUNT(*) FROM foster_assignments fa
         WHERE fa.familia_id=f.id AND fa.estado='active') as acogidas_activas_count,
        (SELECT COUNT(*) FROM foster_assignments fa
         WHERE fa.familia_id=f.id AND fa.estado='completed') as acogidas_total
      FROM foster_families f
      WHERE f.refugio_id=$1`;
    const params: unknown[] = [refugioId];
    let idx = 2;
    if (estado && estado !== 'all') { q += ` AND f.estado=$${idx++}`; params.push(estado); }
    if (especie === 'perro') { q += ` AND f.acepta_perros=true`; }
    if (especie === 'gato') { q += ` AND f.acepta_gatos=true`; }
    q += ` ORDER BY CASE f.estado WHEN 'available' THEN 1 WHEN 'full' THEN 2 WHEN 'paused' THEN 3 ELSE 4 END, f.nombre ASC`;
    res.json((await query(q, params)).rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getFamilia(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const [famRes, activasRes, historialRes, karmaRes] = await Promise.all([
      query(`SELECT * FROM foster_families WHERE id=$1 AND refugio_id=$2`, [id, refugioId]),
      query(`
        SELECT fa.*, a.nombre as animal_nombre, a.especie as animal_especie,
               f.url as animal_foto, fa.iniciada_at
        FROM foster_assignments fa
        LEFT JOIN animales a ON a.id=fa.animal_id
        LEFT JOIN animal_fotos f ON f.animal_id=fa.animal_id AND f.es_principal=true
        WHERE fa.familia_id=$1 AND fa.estado='active' ORDER BY fa.iniciada_at DESC`, [id]),
      query(`
        SELECT fa.*, a.nombre as animal_nombre, a.especie as animal_especie
        FROM foster_assignments fa
        LEFT JOIN animales a ON a.id=fa.animal_id
        WHERE fa.familia_id=$1 AND fa.estado='completed'
        ORDER BY fa.finalizada_at DESC LIMIT 20`, [id]),
      query(`SELECT * FROM karma_events WHERE entity_type='foster_family' AND entity_id=$1 ORDER BY created_at DESC LIMIT 20`, [id]),
    ]);
    if (famRes.rows.length === 0) { res.status(404).json({ error: 'Familia no encontrada' }); return; }
    res.json({ ...famRes.rows[0], acogidas_activas: activasRes.rows, historial: historialRes.rows, karma_historial: karmaRes.rows });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function createFamilia(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const {
    nombre, email, telefono, direccion, ciudad, zona,
    max_animales = 1, acepta_perros = true, acepta_gatos = false, acepta_otros = false,
    acepta_pequeño = true, acepta_mediano = true, acepta_grande = false,
    acepta_necesidades_especiales = false, acepta_cachorros = true, acepta_seniors = false,
    tiene_jardin = false, otros_animales_casa, ninos_casa = false, edades_ninos, notas,
  } = req.body;
  if (!nombre) { res.status(400).json({ error: 'nombre es requerido' }); return; }
  try {
    const result = await query(
      `INSERT INTO foster_families (refugio_id,nombre,email,telefono,direccion,ciudad,zona,
       max_animales,acepta_perros,acepta_gatos,acepta_otros,acepta_pequeño,acepta_mediano,acepta_grande,
       acepta_necesidades_especiales,acepta_cachorros,acepta_seniors,tiene_jardin,
       otros_animales_casa,ninos_casa,edades_ninos,notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [refugioId,nombre,email,telefono,direccion,ciudad,zona,max_animales,
       acepta_perros,acepta_gatos,acepta_otros,acepta_pequeño,acepta_mediano,acepta_grande,
       acepta_necesidades_especiales,acepta_cachorros,acepta_seniors,tiene_jardin,
       otros_animales_casa,ninos_casa,edades_ninos,notas]
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function updateFamilia(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const fields = ['nombre','email','telefono','direccion','ciudad','zona','max_animales',
    'acepta_perros','acepta_gatos','acepta_otros','acepta_pequeño','acepta_mediano','acepta_grande',
    'acepta_necesidades_especiales','acepta_cachorros','acepta_seniors','tiene_jardin',
    'otros_animales_casa','ninos_casa','edades_ninos','notas','estado'];
  const updates: string[] = []; const values: unknown[] = []; let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f}=$${idx++}`); values.push(req.body[f]); }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No hay campos' }); return; }
  values.push(id); values.push(refugioId);
  try {
    const r = await query(`UPDATE foster_families SET ${updates.join(',')} WHERE id=$${idx++} AND refugio_id=$${idx} RETURNING *`, values);
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

// ── ASIGNAR ANIMAL ─────────────────────────────────────
export async function asignarAnimal(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params; // familia_id
  const refugioId = req.user!.refugioId;
  const { animal_id, iniciada_at = new Date().toISOString().slice(0,10), fin_estimado_at, notas_coordinador } = req.body;
  if (!animal_id) { res.status(400).json({ error: 'animal_id requerido' }); return; }
  try {
    const fam = await query(`SELECT * FROM foster_families WHERE id=$1 AND refugio_id=$2`, [id, refugioId]);
    if (fam.rows.length === 0) { res.status(404).json({ error: 'Familia no encontrada' }); return; }
    const familia = fam.rows[0];
    if (familia.animales_actuales >= familia.max_animales) { res.status(400).json({ error: 'Familia sin slots disponibles' }); return; }

    const animalRes = await query(`SELECT nombre, estado_salud, fecha_nacimiento FROM animales WHERE id=$1 AND refugio_id=$2`, [animal_id, refugioId]);
    if (animalRes.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

    const result = await query(
      `INSERT INTO foster_assignments (refugio_id,animal_id,familia_id,iniciada_at,fin_estimado_at,notas_coordinador,creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [refugioId, animal_id, id, iniciada_at, fin_estimado_at, notas_coordinador, req.user!.userId]
    );

    const newCount = familia.animales_actuales + 1;
    await query(
      `UPDATE foster_families SET animales_actuales=$1, estado=CASE WHEN $1 >= max_animales THEN 'full' ELSE 'available' END WHERE id=$2`,
      [newCount, id]
    );

    {
      const a = animalRes.rows[0];
      await query(`UPDATE animales SET estado='en_acogida', ubicacion_texto=$1 WHERE id=$2 AND refugio_id=$3`, [familia.nombre, animal_id, refugioId]);
      await query(
        `INSERT INTO actividad (refugio_id,animal_id,usuario_id,tipo,titulo) VALUES ($1,$2,$3,'acogida',$4)`,
        [refugioId, animal_id, req.user!.userId, `Asignado a acogida en ${familia.nombre}`]
      );
      // Karma bonus for special cases
      if (a.estado_salud && a.estado_salud !== 'Saludable' && familia.acepta_necesidades_especiales) {
        await addKarma(refugioId, Number(id), 20, 'Acogida de animal con necesidades especiales');
      }
      if (a.fecha_nacimiento) {
        const ageMonths = (Date.now() - new Date(a.fecha_nacimiento).getTime()) / (30 * 24 * 3600 * 1000);
        if (ageMonths < 6) await addKarma(refugioId, Number(id), 10, 'Acogida de cachorro');
        if (ageMonths > 96) await addKarma(refugioId, Number(id), 15, 'Acogida de animal senior');
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
}

// ── ACOGIDAS ACTIVAS ──────────────────────────────────
export async function getActivas(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  try {
    const result = await query(`
      SELECT fa.*, a.nombre as animal_nombre, a.especie as animal_especie,
             a.raza as animal_raza, f2.url as animal_foto,
             ff.nombre as familia_nombre, ff.zona as familia_zona,
             ff.telefono as familia_telefono,
             CURRENT_DATE - fa.iniciada_at as dias_acogida,
             (SELECT MAX(fc.contactado_at) FROM foster_contacts fc WHERE fc.assignment_id=fa.id) as ultimo_contacto
      FROM foster_assignments fa
      LEFT JOIN animales a ON a.id=fa.animal_id
      LEFT JOIN animal_fotos f2 ON f2.animal_id=fa.animal_id AND f2.es_principal=true
      LEFT JOIN foster_families ff ON ff.id=fa.familia_id
      WHERE fa.refugio_id=$1 AND fa.estado='active'
      ORDER BY fa.iniciada_at ASC`, [refugioId]);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getHistorial(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { familia_id, animal_id, page = '1', limit = '20' } = req.query as Record<string, string>;
  try {
    let where = ` WHERE fa.refugio_id=$1 AND fa.estado='completed'`;
    const params: unknown[] = [refugioId]; let idx = 2;
    if (familia_id) { where += ` AND fa.familia_id=$${idx++}`; params.push(familia_id); }
    if (animal_id) { where += ` AND fa.animal_id=$${idx++}`; params.push(animal_id); }

    const pageN = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageN - 1) * limitN;

    const countRes = await query(`SELECT COUNT(*) FROM foster_assignments fa${where}`, params);
    const result = await query(
      `SELECT fa.*, a.nombre as animal_nombre, a.especie as animal_especie,
             ff.nombre as familia_nombre, ff.zona as familia_zona,
             fa.finalizada_at - fa.iniciada_at as dias_totales
      FROM foster_assignments fa
      LEFT JOIN animales a ON a.id=fa.animal_id
      LEFT JOIN foster_families ff ON ff.id=fa.familia_id${where}
      ORDER BY fa.finalizada_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitN, offset]
    );
    const total = Number(countRes.rows[0].count);
    res.json({ data: result.rows, total, page: pageN, limit: limitN, totalPages: Math.ceil(total / limitN) });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

// ── CONTACTO / SEGUIMIENTO ────────────────────────────
export async function createContacto(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params; // assignment_id
  const refugioId = req.user!.refugioId;
  const { tipo = 'llamada', contactado_at, estado_animal = 'bien', notas, requiere_accion = false, descripcion_accion } = req.body;
  try {
    const result = await query(
      `INSERT INTO foster_contacts (refugio_id,assignment_id,tipo,contactado_at,estado_animal,notas,requiere_accion,descripcion_accion,creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [refugioId, id, tipo, contactado_at || new Date().toISOString(), estado_animal, notas, requiere_accion, descripcion_accion, req.user!.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getContactos(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params; // assignment_id
  try {
    const result = await query(
      `SELECT fc.*, u.nombre as usuario_nombre FROM foster_contacts fc
       LEFT JOIN usuarios u ON u.id=fc.creado_por
       WHERE fc.assignment_id=$1 ORDER BY fc.contactado_at DESC`, [id]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

// ── FINALIZAR ACOGIDA ─────────────────────────────────
export async function finalizarAcogida(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params; // assignment_id
  const refugioId = req.user!.refugioId;
  const { motivo_fin, valoracion, notas_valoracion, finalizada_at = new Date().toISOString().slice(0,10) } = req.body;
  if (!motivo_fin) { res.status(400).json({ error: 'motivo_fin requerido' }); return; }
  try {
    const assRes = await query(`SELECT * FROM foster_assignments WHERE id=$1 AND refugio_id=$2`, [id, refugioId]);
    if (assRes.rows.length === 0) { res.status(404).json({ error: 'Acogida no encontrada' }); return; }
    const ass = assRes.rows[0];

    await query(
      `UPDATE foster_assignments SET estado='completed', motivo_fin=$1, valoracion=$2, notas_valoracion=$3, finalizada_at=$4 WHERE id=$5`,
      [motivo_fin, valoracion, notas_valoracion, finalizada_at, id]
    );

    // Update family slots
    const famRes = await query(`SELECT * FROM foster_families WHERE id=$1`, [ass.familia_id]);
    if (famRes.rows.length > 0) {
      const fam = famRes.rows[0];
      const newCount = Math.max(0, fam.animales_actuales - 1);
      await query(
        `UPDATE foster_families SET animales_actuales=$1, estado=CASE WHEN $1=0 THEN 'available' WHEN $1 < max_animales THEN 'available' ELSE 'full' END WHERE id=$2`,
        [newCount, ass.familia_id]
      );
    }

    // Update animal status
    if (ass.animal_id) {
      let nuevoEstado = 'en_residencia';
      let nuevaUbicacion = 'Refugio';
      if (motivo_fin === 'adopted_by_family') { nuevoEstado = 'en_proceso'; nuevaUbicacion = famRes.rows[0]?.nombre || 'Adoptado'; }
      if (motivo_fin === 'transferred') { nuevoEstado = 'en_acogida'; }
      if (motivo_fin === 'deceased') { nuevoEstado = 'fallecido'; }
      await query(`UPDATE animales SET estado=$1, ubicacion_texto=$2 WHERE id=$3`, [nuevoEstado, nuevaUbicacion, ass.animal_id]);
      await query(
        `INSERT INTO actividad (refugio_id,animal_id,usuario_id,tipo,titulo) VALUES ($1,$2,$3,'acogida',$4)`,
        [refugioId, ass.animal_id, req.user!.userId, `Acogida finalizada: ${motivo_fin}`]
      );
    }

    // Karma points
    if (ass.familia_id) {
      const inicio = new Date(ass.iniciada_at);
      const fin = new Date(finalizada_at);
      const dias = Math.max(0, Math.floor((fin.getTime() - inicio.getTime()) / 86400000));
      const ptsDias = Math.floor(dias / 7);
      if (ptsDias > 0) await addKarma(refugioId, ass.familia_id, ptsDias, `${dias} días de acogida`);
      if (motivo_fin === 'adopted_by_family') await addKarma(refugioId, ass.familia_id, 10, 'Animal adoptado desde el hogar de acogida');
      const totalHistorial = await query(`SELECT COUNT(*) FROM foster_assignments WHERE familia_id=$1 AND estado='completed'`, [ass.familia_id]);
      if (Number(totalHistorial.rows[0].count) === 1) await addKarma(refugioId, ass.familia_id, 50, 'Primera acogida completada');
      if (valoracion === 5) await addKarma(refugioId, ass.familia_id, 10, 'Valoración de 5 estrellas');
    }

    // If adopted by family → create adoption request automatically
    if (motivo_fin === 'adopted_by_family' && ass.animal_id && ass.familia_id) {
      const fam = famRes.rows[0];
      await query(
        `INSERT INTO adoption_requests (refugio_id,animal_id,nombre,email,telefono,canal,estado,puntuacion,creado_por)
         VALUES ($1,$2,$3,$4,$5,'acogida','aprobada',100,$6)`,
        [refugioId, ass.animal_id, fam.nombre, fam.email, fam.telefono, req.user!.userId]
      );
    }

    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
}
