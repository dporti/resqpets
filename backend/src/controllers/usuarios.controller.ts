import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getUsuarios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const refugioId = req.user!.refugioId;
    const result = await query(
      `SELECT id, nombre, email, rol, activo, avatar_url, ultimo_acceso, created_at
       FROM usuarios WHERE refugio_id = $1 ORDER BY rol, nombre`,
      [refugioId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createUsuario(req: AuthRequest, res: Response): Promise<void> {
  try {
    const refugioId = req.user!.refugioId;
    const { nombre, email, password, rol = 'voluntario' } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    const validRoles = ['admin', 'coordinador', 'voluntario'];
    if (!validRoles.includes(rol)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    // Only admin can create admins
    if (rol === 'admin' && req.user!.rol !== 'admin') {
      res.status(403).json({ error: 'Solo un admin puede crear otros admins' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO usuarios (refugio_id, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol, activo, created_at`,
      [refugioId, nombre, email.toLowerCase().trim(), hash, rol]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === '23505') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updateUsuario(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;
    const { nombre, rol, activo } = req.body;

    // Cannot modify yourself via this endpoint to demote
    if (Number(id) === req.user!.userId && rol && rol !== req.user!.rol) {
      res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (nombre !== undefined) { updates.push(`nombre=$${idx++}`); values.push(nombre); }
    if (rol !== undefined)    { updates.push(`rol=$${idx++}`); values.push(rol); }
    if (activo !== undefined) { updates.push(`activo=$${idx++}`); values.push(activo); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nada que actualizar' });
      return;
    }

    values.push(id, refugioId);
    const result = await query(
      `UPDATE usuarios SET ${updates.join(', ')}
       WHERE id=$${idx} AND refugio_id=$${idx+1}
       RETURNING id, nombre, email, rol, activo`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteUsuario(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;

    if (Number(id) === req.user!.userId) {
      res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      return;
    }

    // Soft delete
    const result = await query(
      `UPDATE usuarios SET activo=false WHERE id=$1 AND refugio_id=$2 RETURNING id, nombre`,
      [id, refugioId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: `Usuario "${result.rows[0].nombre}" desactivado` });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
