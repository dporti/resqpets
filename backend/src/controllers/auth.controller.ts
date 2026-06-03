import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const result = await query(
      `SELECT u.*, r.nombre as refugio_nombre
       FROM usuarios u
       LEFT JOIN refugios r ON r.id = u.refugio_id
       WHERE u.email = $1 AND u.activo = true`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    // Update last access
    await query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
      [user.id]
    );

    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      refugioId: user.refugio_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'],
    });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        refugioId: user.refugio_id,
        refugioNombre: user.refugio_nombre,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.refugio_id, u.avatar_url, u.ultimo_acceso,
              r.nombre as refugio_nombre
       FROM usuarios u
       LEFT JOIN refugios r ON r.id = u.refugio_id
       WHERE u.id = $1 AND u.activo = true`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      refugioId: u.refugio_id,
      refugioNombre: u.refugio_nombre,
      avatarUrl: u.avatar_url,
      ultimoAcceso: u.ultimo_acceso,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }

    const result = await query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [req.user!.userId]
    );

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      res.status(400).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [newHash, req.user!.userId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('ChangePassword error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
