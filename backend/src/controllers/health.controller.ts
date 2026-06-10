import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getHealthEvents(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const result = await query(
      `SELECT h.*, u.nombre as usuario_nombre
       FROM health_events h
       LEFT JOIN usuarios u ON u.id = h.created_by
       WHERE h.animal_id = $1 AND h.refugio_id = $2
       ORDER BY h.fecha DESC, h.created_at DESC`,
      [id, refugioId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function createHealthEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const { tipo = 'otro', fecha, titulo, descripcion } = req.body;
  if (!titulo || !fecha) { res.status(400).json({ error: 'tipo, fecha y titulo son requeridos' }); return; }
  try {
    const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
    if (animalCheck.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

    const result = await query(
      `INSERT INTO health_events (animal_id, refugio_id, tipo, fecha, titulo, descripcion, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, refugioId, tipo, fecha, titulo, descripcion, req.user!.userId]
    );
    await query(
      `INSERT INTO actividad (refugio_id, animal_id, usuario_id, tipo, titulo)
       VALUES ($1,$2,$3,$4,$5)`,
      [refugioId, id, req.user!.userId, tipo === 'vacuna' ? 'vacunacion' : tipo === 'desparasitacion' ? 'desparasitacion' : 'veterinario', titulo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function deleteHealthEvent(req: AuthRequest, res: Response): Promise<void> {
  const { eventId } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    await query('DELETE FROM health_events WHERE id=$1 AND refugio_id=$2', [eventId, refugioId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}
