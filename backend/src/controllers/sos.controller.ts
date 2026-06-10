import { Request, Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

const genCodigo = async (): Promise<string> => {
  const r = await query('SELECT COUNT(*) FROM sos_alerts');
  const n = String(Number(r.rows[0].count) + 1).padStart(4, '0');
  return `SOS-${new Date().getFullYear()}-${n}`;
};

// ── PÚBLICO (sin auth) ────────────────────────────────
export async function getPublicAlertas(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(`
      SELECT id, tipo, urgencia, estado, especie, raza, color, tamaño,
             descripcion, fotos, latitud, longitud, ubicacion_descripcion,
             visto_en, nombre_animal, señas_particulares, codigo_referencia, created_at
      FROM sos_alerts
      WHERE es_publico=true AND estado='active'
      ORDER BY CASE urgencia WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC
      LIMIT 200`);
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getPublicAlerta(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const [alertRes, updatesRes] = await Promise.all([
      query(`SELECT id,tipo,urgencia,estado,especie,raza,color,tamaño,lleva_collar,señas_particulares,
                    nombre_animal,descripcion,fotos,latitud,longitud,ubicacion_descripcion,
                    visto_en,codigo_referencia,created_at
             FROM sos_alerts WHERE id=$1 AND es_publico=true`, [id]),
      query(`SELECT contenido, created_at FROM sos_updates WHERE sos_alert_id=$1 ORDER BY created_at ASC`, [id]),
    ]);
    if (alertRes.rows.length === 0) { res.status(404).json({ error: 'Aviso no encontrado' }); return; }
    res.json({ ...alertRes.rows[0], updates: updatesRes.rows });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function createPublicAlerta(req: Request, res: Response): Promise<void> {
  const {
    tipo = 'lost', urgencia = 'medium', especie, raza, color, tamaño,
    lleva_collar = false, señas_particulares, nombre_animal, descripcion,
    fotos = [], latitud, longitud, ubicacion_descripcion, visto_en,
    reportero_nombre, reportero_telefono, reportero_email, quiere_notificaciones = false,
  } = req.body;
  if (!reportero_telefono) { res.status(400).json({ error: 'Teléfono de contacto requerido' }); return; }
  try {
    const codigo = await genCodigo();
    // Assign to nearest shelter
    const refugioRes = await query('SELECT id FROM refugios LIMIT 1');
    const refugioId = refugioRes.rows[0]?.id || null;

    const result = await query(
      `INSERT INTO sos_alerts (refugio_id,tipo,urgencia,especie,raza,color,tamaño,
       lleva_collar,señas_particulares,nombre_animal,descripcion,fotos,
       latitud,longitud,ubicacion_descripcion,visto_en,
       reportero_nombre,reportero_telefono,reportero_email,
       quiere_notificaciones,codigo_referencia)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [refugioId, tipo, urgencia, especie, raza, color, tamaño,
       lleva_collar, señas_particulares, nombre_animal, descripcion, fotos,
       latitud, longitud, ubicacion_descripcion, visto_en || new Date().toISOString(),
       reportero_nombre, reportero_telefono, reportero_email,
       quiere_notificaciones, codigo]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
}

// ── PRIVADO (auth) ────────────────────────────────────
export async function getAlertas(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { tipo, estado, urgencia, page = '1', limit = '20' } = req.query as Record<string, string>;
  try {
    let where = ` WHERE (s.refugio_id=$1 OR s.refugio_id IS NULL)`;
    const params: unknown[] = [refugioId]; let idx = 2;
    if (tipo) { where += ` AND s.tipo=$${idx++}`; params.push(tipo); }
    if (estado && estado !== 'todos') { where += ` AND s.estado=$${idx++}`; params.push(estado); }
    if (urgencia) { where += ` AND s.urgencia=$${idx++}`; params.push(urgencia); }

    const pageN = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageN - 1) * limitN;

    const countRes = await query(`SELECT COUNT(*) FROM sos_alerts s${where}`, params);
    const result = await query(
      `SELECT s.*,
               (SELECT COUNT(*) FROM sos_updates u WHERE u.sos_alert_id=s.id) as updates_count
             FROM sos_alerts s${where}
             ORDER BY CASE s.urgencia WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, s.created_at DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitN, offset]
    );
    const total = Number(countRes.rows[0].count);
    res.json({ data: result.rows, total, page: pageN, limit: limitN, totalPages: Math.ceil(total / limitN) });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getAlerta(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const [alertRes, updatesRes, nearbyRes] = await Promise.all([
      query(`SELECT * FROM sos_alerts WHERE id=$1`, [id]),
      query(`SELECT u.*, us.nombre as autor FROM sos_updates u
             LEFT JOIN usuarios us ON us.id=u.creado_por
             WHERE u.sos_alert_id=$1 ORDER BY u.created_at ASC`, [id]),
      query(`SELECT id,tipo,especie,raza,color,tamaño,latitud,longitud,codigo_referencia,estado,fotos
             FROM sos_alerts WHERE id!=$1 AND estado='active'
             AND latitud IS NOT NULL AND longitud IS NOT NULL LIMIT 10`, [id]),
    ]);
    if (alertRes.rows.length === 0) { res.status(404).json({ error: 'Aviso no encontrado' }); return; }
    const alert = alertRes.rows[0];

    // Similarity scoring for nearby alerts
    const nearby = nearbyRes.rows.map(n => {
      let score = 0;
      if (n.especie === alert.especie) score += 40;
      if (n.color === alert.color) score += 30;
      if (n.tamaño === alert.tamaño) score += 20;
      if (n.latitud && alert.latitud) {
        const dist = Math.sqrt(Math.pow(n.latitud - alert.latitud, 2) + Math.pow(n.longitud - alert.longitud, 2));
        if (dist < 0.05) score += 10;
      }
      return { ...n, similitud: score };
    }).filter(n => n.similitud > 0).sort((a, b) => b.similitud - a.similitud).slice(0, 5);

    res.json({ ...alert, updates: updatesRes.rows, coincidencias: nearby });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function updateAlerta(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const { estado, urgencia, es_publico } = req.body;
  try {
    const updates: string[] = []; const vals: unknown[] = []; let idx = 1;
    if (estado !== undefined) { updates.push(`estado=$${idx++}`); vals.push(estado); }
    if (urgencia !== undefined) { updates.push(`urgencia=$${idx++}`); vals.push(urgencia); }
    if (es_publico !== undefined) { updates.push(`es_publico=$${idx++}`); vals.push(es_publico); }
    if (updates.length === 0) { res.status(400).json({ error: 'Sin cambios' }); return; }
    vals.push(id); vals.push(refugioId);
    const r = await query(`UPDATE sos_alerts SET ${updates.join(',')} WHERE id=$${idx++} AND refugio_id=$${idx} RETURNING *`, vals);
    if (r.rows.length === 0) { res.status(404).json({ error: 'Aviso no encontrado' }); return; }
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function addUpdate(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { contenido } = req.body;
  if (!contenido) { res.status(400).json({ error: 'contenido requerido' }); return; }
  try {
    const r = await query(
      `INSERT INTO sos_updates (sos_alert_id, contenido, creado_por) VALUES ($1,$2,$3) RETURNING *`,
      [id, contenido, req.user!.userId]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function convertirARescate(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const alertRes = await query(`SELECT * FROM sos_alerts WHERE id=$1 AND (refugio_id=$2 OR refugio_id IS NULL)`, [id, refugioId]);
    if (alertRes.rows.length === 0) { res.status(404).json({ error: 'Aviso no encontrado' }); return; }
    const a = alertRes.rows[0];

    const countRes = await query('SELECT COUNT(*) FROM animales WHERE refugio_id=$1', [refugioId]);
    const num = String(Number(countRes.rows[0].count) + 1).padStart(3, '0');
    const idInterno = `HV-${new Date().getFullYear()}-${num}`;

    const animalRes = await query(
      `INSERT INTO animales (refugio_id, id_interno, nombre, especie, raza, color, tamaño, estado, procedencia, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'en_evaluacion',$8,$9) RETURNING id`,
      [refugioId, idInterno, a.nombre_animal || 'Sin nombre', a.especie || 'perro', a.raza,
       a.color, a.tamaño, `Aviso SOS #${a.codigo_referencia}`, a.descripcion]
    );
    const animalId = animalRes.rows[0].id;

    if (a.fotos && a.fotos.length > 0) {
      for (let i = 0; i < a.fotos.length; i++) {
        await query(`INSERT INTO animal_fotos (animal_id, url, es_principal) VALUES ($1,$2,$3)`, [animalId, a.fotos[i], i === 0]);
      }
    }

    await query(`UPDATE sos_alerts SET estado='rescued', convertido_a_animal_id=$1 WHERE id=$2`, [animalId, id]);
    await query(`INSERT INTO sos_updates (sos_alert_id, contenido, creado_por) VALUES ($1,$2,$3)`,
      [id, `Aviso convertido a rescate. Ficha creada: ${idInterno}`, req.user!.userId]);

    res.json({ ok: true, animal_id: animalId, id_interno: idInterno });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
}
