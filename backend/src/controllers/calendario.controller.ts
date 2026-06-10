import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

const TYPE_COLORS: Record<string, string> = {
  adoption:   '#16a34a',
  veterinary: '#3b82f6',
  foster:     '#f97316',
  volunteer:  '#8b5cf6',
  urgent:     '#ef4444',
  campaign:   '#f59e0b',
  other:      '#6b7280',
};

function formatEvent(e: Record<string, unknown>) {
  const color = (e.color as string) || TYPE_COLORS[e.event_type as string] || TYPE_COLORS.other;
  return {
    ...e,
    backgroundColor: color,
    borderColor: color,
    start: e.start_at,
    end: e.end_at,
    allDay: e.all_day,
  };
}

// ── LISTAR EVENTOS ────────────────────────────────────────────────────
export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { start, end, type, mine } = req.query as Record<string, string>;

    const conditions: string[] = ['e.shelter_id = $1'];
    const params: unknown[] = [refugioId];

    if (start) { params.push(start); conditions.push(`e.start_at >= $${params.length}`); }
    if (end)   { params.push(end);   conditions.push(`e.start_at <= $${params.length}`); }
    if (type)  { params.push(type);  conditions.push(`e.event_type = $${params.length}`); }
    if (mine === 'true') {
      params.push(userId);
      conditions.push(`($${params.length} = ANY(e.assigned_to) OR e.created_by = $${params.length})`);
    }

    const r = await query(`
      SELECT e.*,
        a.nombre AS animal_nombre, f.url AS animal_foto,
        (SELECT json_agg(json_build_object('id', u.id, 'nombre', u.nombre, 'avatar_url', u.avatar_url))
         FROM unnest(e.assigned_to) AS uid
         JOIN usuarios u ON u.id = uid) AS assignees_info,
        u.nombre AS creator_nombre
      FROM events e
      LEFT JOIN animales a ON e.animal_id = a.id
      LEFT JOIN animal_fotos f ON f.animal_id = a.id AND f.es_principal = true
      LEFT JOIN usuarios u ON e.created_by = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.start_at ASC
    `, params);

    res.json(r.rows.map(formatEvent));
  } catch (e) {
    console.error('getEvents error:', e);
    res.status(500).json({ error: 'Error al cargar eventos' });
  }
}

// ── PRÓXIMOS 7 DÍAS ───────────────────────────────────────────────────
export async function getUpcomingEvents(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const r = await query(`
      SELECT e.id, e.title, e.event_type, e.color, e.start_at, e.end_at, e.all_day,
        a.nombre AS animal_nombre
      FROM events e
      LEFT JOIN animales a ON e.animal_id = a.id
      WHERE e.shelter_id = $1
        AND e.start_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY e.start_at ASC LIMIT 10
    `, [refugioId]);
    res.json(r.rows.map(formatEvent));
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
}

// ── CREAR EVENTO ──────────────────────────────────────────────────────
export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const {
      title, event_type = 'other', color, start_at, end_at, all_day = false,
      location, description, animal_id, assigned_to = [], reminder_minutes,
      is_recurring = false, recurrence_rule, recurrence_end_date,
    } = req.body;

    if (!title || !start_at) return res.status(400).json({ error: 'Título y fecha requeridos' });

    let validAnimalId = null;
    if (animal_id) {
      const a = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [animal_id, refugioId]);
      validAnimalId = a.rows.length ? animal_id : null;
    }
    let validAssignedTo: number[] = [];
    if (assigned_to.length) {
      const u = await query('SELECT id FROM usuarios WHERE id = ANY($1) AND refugio_id=$2', [assigned_to, refugioId]);
      validAssignedTo = u.rows.map((r: { id: number }) => r.id);
    }

    const r = await query(`
      INSERT INTO events (shelter_id, title, event_type, color, start_at, end_at, all_day,
        location, description, animal_id, assigned_to, reminder_minutes,
        is_recurring, recurrence_rule, recurrence_end_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      refugioId, title, event_type, color || null, start_at, end_at || null, all_day,
      location || null, description || null, validAnimalId,
      validAssignedTo.length ? validAssignedTo : null,
      reminder_minutes || null, is_recurring, recurrence_rule || null,
      recurrence_end_date || null, userId,
    ]);

    res.status(201).json(formatEvent(r.rows[0]));
  } catch (e) {
    console.error('createEvent error:', e);
    res.status(500).json({ error: 'Error al crear evento' });
  }
}

// ── ACTUALIZAR EVENTO ─────────────────────────────────────────────────
export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { id } = req.params;
    const {
      title, event_type, color, start_at, end_at, all_day,
      location, description, animal_id, assigned_to, reminder_minutes,
      is_recurring, recurrence_rule, recurrence_end_date,
    } = req.body;

    let validAnimalId = null;
    if (animal_id) {
      const a = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [animal_id, refugioId]);
      validAnimalId = a.rows.length ? animal_id : null;
    }
    let validAssignedTo: number[] | null = null;
    if (assigned_to) {
      const u = await query('SELECT id FROM usuarios WHERE id = ANY($1) AND refugio_id=$2', [assigned_to, refugioId]);
      validAssignedTo = u.rows.map((r: { id: number }) => r.id);
    }

    const r = await query(`
      UPDATE events SET
        title = COALESCE($3, title),
        event_type = COALESCE($4, event_type),
        color = $5,
        start_at = COALESCE($6, start_at),
        end_at = $7,
        all_day = COALESCE($8, all_day),
        location = $9,
        description = $10,
        animal_id = $11,
        assigned_to = COALESCE($12, assigned_to),
        reminder_minutes = $13,
        is_recurring = COALESCE($14, is_recurring),
        recurrence_rule = $15,
        recurrence_end_date = $16,
        updated_at = NOW()
      WHERE id = $1 AND shelter_id = $2 AND auto_generated = false
      RETURNING *
    `, [
      id, refugioId, title || null, event_type || null, color || null,
      start_at || null, end_at || null, all_day ?? null, location || null,
      description || null, validAnimalId,
      validAssignedTo, reminder_minutes || null,
      is_recurring ?? null, recurrence_rule || null, recurrence_end_date || null,
    ]);

    if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado o auto-generado' });
    res.json(formatEvent(r.rows[0]));
  } catch (e) {
    console.error('updateEvent error:', e);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
}

// ── ELIMINAR EVENTO ───────────────────────────────────────────────────
export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { id } = req.params;
    const r = await query(
      'DELETE FROM events WHERE id=$1 AND shelter_id=$2 AND auto_generated=false RETURNING id',
      [id, refugioId],
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
}
