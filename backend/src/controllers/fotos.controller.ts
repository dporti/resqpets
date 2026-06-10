import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function uploadFoto(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;

  if (!file) { res.status(400).json({ error: 'No file provided' }); return; }

  const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
  if (animalCheck.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(503).json({ error: 'SUPABASE_URL y SUPABASE_SERVICE_KEY no configurados en .env' });
    return;
  }

  try {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `${refugioId}/${id}/${Date.now()}.${ext}`;
    const bucket = 'animal-photos';

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': file.mimetype,
        'x-upsert': 'true',
      },
      body: file.buffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      res.status(500).json({ error: `Supabase Storage error: ${err}` });
      return;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    const existing = await query('SELECT id FROM animal_fotos WHERE animal_id=$1 AND es_principal=true', [id]);
    const esPrincipal = existing.rows.length === 0;

    const result = await query(
      `INSERT INTO animal_fotos (animal_id, url, es_principal) VALUES ($1,$2,$3) RETURNING *`,
      [id, publicUrl, esPrincipal]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('uploadFoto error:', err);
    res.status(500).json({ error: 'Error al subir la foto' });
  }
}

export async function deleteFoto(req: AuthRequest, res: Response): Promise<void> {
  const { fotoId } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const foto = await query(
      `SELECT f.* FROM animal_fotos f JOIN animales a ON a.id=f.animal_id WHERE f.id=$1 AND a.refugio_id=$2`,
      [fotoId, refugioId]
    );
    if (foto.rows.length === 0) { res.status(404).json({ error: 'Foto no encontrada' }); return; }
    await query('DELETE FROM animal_fotos WHERE id=$1', [fotoId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}

export async function setPrincipal(req: AuthRequest, res: Response): Promise<void> {
  const { id, fotoId } = req.params;
  const refugioId = req.user!.refugioId;
  try {
    const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
    if (animalCheck.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }

    const foto = await query('SELECT id FROM animal_fotos WHERE id=$1 AND animal_id=$2', [fotoId, id]);
    if (foto.rows.length === 0) { res.status(404).json({ error: 'Foto no encontrada' }); return; }

    await query('UPDATE animal_fotos SET es_principal=false WHERE animal_id=$1', [id]);
    await query('UPDATE animal_fotos SET es_principal=true WHERE id=$1', [fotoId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
}
