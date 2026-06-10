import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getBehaviorEvaluations(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const result = await query(
      `SELECT b.*, u.nombre as usuario_nombre
       FROM behavior_evaluations b
       LEFT JOIN usuarios u ON u.id = b.created_by
       WHERE b.animal_id = $1 AND b.refugio_id = $2
       ORDER BY b.fecha DESC, b.created_at DESC`,
      [id, refugioId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function createBehaviorEvaluation(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const {
    fecha, evaluador, nivel_actividad = 0, soc_perros = 0,
    soc_gatos = 0, soc_niños = 0, hogar_ideal, experiencia_previa, notas,
  } = req.body;
  if (!fecha) { res.status(400).json({ error: 'fecha es requerida' }); return; }
  try {
    const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
    if (animalCheck.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

    const result = await query(
      `INSERT INTO behavior_evaluations
         (animal_id, refugio_id, fecha, evaluador, nivel_actividad, soc_perros, soc_gatos, soc_niños, hogar_ideal, experiencia_previa, notas, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id, refugioId, fecha, evaluador, nivel_actividad, soc_perros, soc_gatos, soc_niños, hogar_ideal, experiencia_previa, notas, req.user!.userId]
    );
    await query(
      `UPDATE animales SET nivel_actividad=$1, soc_perros=$2, soc_gatos=$3, soc_niños=$4,
       hogar_ideal=$5, experiencia_previa=$6 WHERE id=$7 AND refugio_id=$8`,
      [nivel_actividad, soc_perros, soc_gatos, soc_niños, hogar_ideal, experiencia_previa, id, refugioId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}
