import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

const KARMA_TAREA: Record<string, number> = { alta: 10, media: 5, baja: 2 };

// ── VOLUNTARIOS ───────────────────────────────────────

export async function getVoluntarios(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  try {
    const pageN = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageN - 1) * limitN;

    const countRes = await query(`SELECT COUNT(*) FROM usuarios WHERE refugio_id=$1`, [refugioId]);
    const result = await query(`
      SELECT u.id, u.nombre, u.email, u.rol, u.avatar_url, u.activo,
             u.karma_puntos, u.especialidades, u.bio, u.es_disponible,
             u.ultima_actividad, u.racha_dias, u.created_at,
             (SELECT COUNT(*) FROM tasks t WHERE u.id = ANY(t.asignado_a)
              AND t.estado = 'completed'
              AND DATE_TRUNC('month', t.completada_at) = DATE_TRUNC('month', NOW())
             ) as tareas_mes,
             (SELECT COUNT(*) FROM tasks t WHERE u.id = ANY(t.asignado_a)
              AND t.estado = 'completed') as tareas_total,
             (SELECT COUNT(*) FROM tasks t WHERE u.id = ANY(t.asignado_a)
              AND t.estado IN ('pending','in_progress')) as tareas_pendientes
      FROM usuarios u
      WHERE u.refugio_id = $1
      ORDER BY u.activo DESC, u.ultima_actividad DESC NULLS LAST, u.nombre ASC
      LIMIT $2 OFFSET $3`,
      [refugioId, limitN, offset]
    );
    const total = Number(countRes.rows[0].count);
    res.json({ data: result.rows, total, page: pageN, limit: limitN, totalPages: Math.ceil(total / limitN) });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function getVoluntario(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const [volRes, karmaRes, tareasRes] = await Promise.all([
      query(`SELECT u.*, u.karma_puntos, u.especialidades, u.bio, u.es_disponible,
                    u.ultima_actividad, u.racha_dias
             FROM usuarios u WHERE u.id=$1 AND u.refugio_id=$2`, [id, refugioId]),
      query(`SELECT * FROM karma_events WHERE entity_type='voluntario' AND entity_id=$1
             ORDER BY created_at DESC LIMIT 30`, [id]),
      query(`SELECT t.*, a.nombre as animal_nombre, a.especie as animal_especie
             FROM tasks t LEFT JOIN animales a ON a.id=t.animal_id
             WHERE $1 = ANY(t.asignado_a) AND t.refugio_id=$2
             ORDER BY CASE t.estado WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, t.fecha_limite ASC NULLS LAST`,
        [id, refugioId]),
    ]);
    if (volRes.rows.length === 0) { res.status(404).json({ error: 'Voluntario no encontrado' }); return; }
    res.json({ ...volRes.rows[0], karma_historial: karmaRes.rows, tareas: tareasRes.rows });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function updateVoluntario(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const { bio, especialidades, es_disponible, nombre, rol } = req.body;
  const fields: string[] = []; const vals: unknown[] = []; let idx = 1;
  if (bio !== undefined) { fields.push(`bio=$${idx++}`); vals.push(bio); }
  if (especialidades !== undefined) { fields.push(`especialidades=$${idx++}`); vals.push(especialidades); }
  if (es_disponible !== undefined) { fields.push(`es_disponible=$${idx++}`); vals.push(es_disponible); }
  if (nombre !== undefined) { fields.push(`nombre=$${idx++}`); vals.push(nombre); }
  if (rol !== undefined && req.user!.rol === 'admin') { fields.push(`rol=$${idx++}`); vals.push(rol); }
  if (fields.length === 0) { res.status(400).json({ error: 'Sin cambios' }); return; }
  vals.push(id); vals.push(refugioId);
  try {
    const r = await query(`UPDATE usuarios SET ${fields.join(',')} WHERE id=$${idx++} AND refugio_id=$${idx} RETURNING *`, vals);
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

// ── TAREAS ────────────────────────────────────────────

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { estado, asignado_a, categoria } = req.query;
  try {
    let q = `
      SELECT t.*,
        a.nombre as animal_nombre, a.especie as animal_especie,
        (SELECT json_agg(json_build_object('id',u.id,'nombre',u.nombre,'avatar_url',u.avatar_url))
         FROM usuarios u WHERE u.id = ANY(t.asignado_a)) as asignados_info,
        (SELECT json_build_object('id',u.id,'nombre',u.nombre)
         FROM usuarios u WHERE u.id = t.creado_por) as creador_info
      FROM tasks t
      LEFT JOIN animales a ON a.id=t.animal_id
      WHERE t.refugio_id=$1`;
    const params: unknown[] = [refugioId]; let idx = 2;
    if (estado === 'vencidas') {
      q += ` AND t.fecha_limite < CURRENT_DATE AND t.estado != 'completed'`;
    } else if (estado && estado !== 'todas') {
      q += ` AND t.estado=$${idx++}`; params.push(estado);
    }
    if (asignado_a) { q += ` AND $${idx++} = ANY(t.asignado_a)`; params.push(Number(asignado_a)); }
    if (categoria) { q += ` AND t.categoria=$${idx++}`; params.push(categoria); }
    q += ` ORDER BY CASE t.estado WHEN 'in_progress' THEN 1 WHEN 'pending' THEN 2 WHEN 'blocked' THEN 3 ELSE 4 END,
           CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
           t.fecha_limite ASC NULLS LAST`;
    res.json((await query(q, params)).rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const {
    titulo, descripcion, categoria = 'administrativa', prioridad = 'media',
    animal_id, asignado_a = [], fecha_limite, es_recurrente = false,
    frecuencia, fin_recurrencia, notas,
  } = req.body;
  if (!titulo) { res.status(400).json({ error: 'titulo requerido' }); return; }
  try {
    const r = await query(
      `INSERT INTO tasks (refugio_id,titulo,descripcion,categoria,prioridad,animal_id,
       asignado_a,creado_por,fecha_limite,es_recurrente,frecuencia,fin_recurrencia,notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [refugioId, titulo, descripcion, categoria, prioridad, animal_id || null,
       asignado_a, req.user!.userId, fecha_limite || null, es_recurrente,
       frecuencia || null, fin_recurrencia || null, notas]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const fields = ['titulo','descripcion','categoria','prioridad','estado','animal_id',
    'asignado_a','fecha_limite','es_recurrente','frecuencia','fin_recurrencia','notas'];
  const updates: string[] = []; const vals: unknown[] = []; let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f}=$${idx++}`); vals.push(req.body[f]); }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'Sin cambios' }); return; }
  vals.push(id); vals.push(refugioId);
  try {
    const r = await query(`UPDATE tasks SET ${updates.join(',')} WHERE id=$${idx++} AND refugio_id=$${idx} RETURNING *`, vals);
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

export async function completeTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const userId = req.user!.userId;
  try {
    const taskRes = await query(`SELECT * FROM tasks WHERE id=$1 AND refugio_id=$2`, [id, refugioId]);
    if (taskRes.rows.length === 0) { res.status(404).json({ error: 'Tarea no encontrada' }); return; }
    const task = taskRes.rows[0];
    const completed = task.estado === 'completed';
    const nuevoEstado = completed ? 'pending' : 'completed';

    await query(
      `UPDATE tasks SET estado=$1, completada_at=$2, completada_por=$3 WHERE id=$4 AND refugio_id=$5`,
      [nuevoEstado, completed ? null : new Date().toISOString(), completed ? null : userId, id, refugioId]
    );

    // Karma solo al completar, para cada asignado
    if (!completed && task.asignado_a && task.asignado_a.length > 0) {
      const pts = KARMA_TAREA[task.prioridad] || 5;
      for (const uid of task.asignado_a) {
        await query(
          `INSERT INTO karma_events (refugio_id,entity_type,entity_id,puntos,razon)
           VALUES ($1,'voluntario',$2,$3,$4)`,
          [refugioId, uid, pts, `Tarea completada (${task.prioridad}): ${task.titulo}`]
        );
        await query(`UPDATE usuarios SET karma_puntos=karma_puntos+$1, ultima_actividad=NOW() WHERE id=$2 AND refugio_id=$3`, [pts, uid, refugioId]);
      }
    }

    await query(`UPDATE usuarios SET ultima_actividad=NOW() WHERE id=$1`, [userId]);
    res.json({ ok: true, nuevo_estado: nuevoEstado });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    await query(`DELETE FROM tasks WHERE id=$1 AND refugio_id=$2`, [id, refugioId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Error interno' }); }
}

// ── RANKINGS ──────────────────────────────────────────

export async function getRankings(req: AuthRequest, res: Response): Promise<void> {
  const refugioId = req.user!.refugioId;
  const { periodo = 'total' } = req.query;

  let fechaFiltro = '';
  if (periodo === 'mes') fechaFiltro = `AND created_at >= DATE_TRUNC('month', NOW())`;
  if (periodo === 'año') fechaFiltro = `AND created_at >= DATE_TRUNC('year', NOW())`;

  try {
    const [volRes, famRes] = await Promise.all([
      query(`
        SELECT u.id, u.nombre, u.rol, u.avatar_url, u.karma_puntos as karma_total,
               u.racha_dias,
               COALESCE((SELECT SUM(puntos) FROM karma_events
                WHERE entity_type='voluntario' AND entity_id=u.id ${fechaFiltro}), 0) as karma_periodo,
               (SELECT COUNT(*) FROM tasks t WHERE u.id = ANY(t.asignado_a) AND t.estado='completed') as tareas_total,
               (SELECT COUNT(*) FROM tasks t WHERE u.id = ANY(t.asignado_a) AND t.estado='completed'
                AND DATE_TRUNC('month', t.completada_at) = DATE_TRUNC('month', NOW())) as tareas_mes
        FROM usuarios u WHERE u.refugio_id=$1 AND u.activo=true
        ORDER BY karma_periodo DESC, karma_total DESC`, [refugioId]),
      query(`
        SELECT f.id, f.nombre, f.karma_puntos as karma_total, f.estado,
               COALESCE((SELECT SUM(puntos) FROM karma_events
                WHERE entity_type='foster_family' AND entity_id=f.id ${fechaFiltro}), 0) as karma_periodo,
               (SELECT COUNT(*) FROM foster_assignments fa WHERE fa.familia_id=f.id AND fa.estado='completed') as acogidas_total,
               COALESCE((SELECT SUM(fa.finalizada_at::date - fa.iniciada_at::date)
                FROM foster_assignments fa WHERE fa.familia_id=f.id AND fa.estado='completed'), 0) as dias_totales
        FROM foster_families f WHERE f.refugio_id=$1
        ORDER BY karma_periodo DESC, karma_total DESC`, [refugioId]),
    ]);
    res.json({ voluntarios: volRes.rows, familias: famRes.rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error interno' }); }
}
