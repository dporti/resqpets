import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getDocuments(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const result = await query(
      `SELECT d.*, u.nombre as usuario_nombre
       FROM animal_documents d
       LEFT JOIN usuarios u ON u.id = d.subido_por
       WHERE d.animal_id = $1 AND d.refugio_id = $2
       ORDER BY d.created_at DESC`,
      [id, refugioId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function createDocument(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const { tipo = 'otro', nombre, file_url } = req.body;
  if (!nombre || !file_url) { res.status(400).json({ error: 'nombre y file_url son requeridos' }); return; }
  try {
    const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
    if (animalCheck.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

    const result = await query(
      `INSERT INTO animal_documents (animal_id, refugio_id, tipo, nombre, file_url, subido_por)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, refugioId, tipo, nombre, file_url, req.user!.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function deleteDocument(req: AuthRequest, res: Response): Promise<void> {
  const { docId } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    await query('DELETE FROM animal_documents WHERE id=$1 AND refugio_id=$2', [docId, refugioId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}
