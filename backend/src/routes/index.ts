import { Router } from 'express';
import { login, me, changePassword } from '../controllers/auth.controller';
import { getDashboard } from '../controllers/dashboard.controller';
import { getAnimales, getAnimal, createAnimal, updateAnimal, deleteAnimal, addNota } from '../controllers/animales.controller';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarios.controller';
import { authenticate, requireRole, requirePermiso } from '../middleware/auth';

const router = Router();

// ── AUTH ──────────────────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.put('/auth/password', authenticate, changePassword);

// ── DASHBOARD ─────────────────────────────────────────
router.get('/dashboard', authenticate, getDashboard);

// ── ANIMALES ──────────────────────────────────────────
router.get('/animales', authenticate, requirePermiso('animales:read'), getAnimales);
router.get('/animales/:id', authenticate, requirePermiso('animales:read'), getAnimal);
router.post('/animales', authenticate, requirePermiso('animales:create'), createAnimal);
router.put('/animales/:id', authenticate, requirePermiso('animales:update'), updateAnimal);
router.delete('/animales/:id', authenticate, requirePermiso('animales:delete'), deleteAnimal);
router.post('/animales/:id/notas', authenticate, requirePermiso('animales:read'), addNota);

// ── AVISOS ────────────────────────────────────────────
router.get('/avisos', authenticate, requirePermiso('avisos:read'), async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  const result = await query(
    `SELECT * FROM avisos WHERE refugio_id=$1 ORDER BY created_at DESC`,
    [refugioId]
  );
  res.json(result.rows);
});

// ── DONACIONES ────────────────────────────────────────
router.get('/donaciones', authenticate, requirePermiso('donaciones:read'), async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  const result = await query(
    `SELECT * FROM donaciones WHERE refugio_id=$1 ORDER BY fecha DESC`,
    [refugioId]
  );
  res.json(result.rows);
});

// ── EVENTOS ───────────────────────────────────────────
router.get('/eventos', authenticate, async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  const result = await query(
    `SELECT * FROM eventos WHERE refugio_id=$1 AND fecha_inicio >= NOW() ORDER BY fecha_inicio ASC`,
    [refugioId]
  );
  res.json(result.rows);
});

// ── USUARIOS (solo admin y coordinador pueden ver) ────
router.get('/usuarios', authenticate, requirePermiso('usuarios:read'), getUsuarios);
router.post('/usuarios', authenticate, requirePermiso('usuarios:manage'), createUsuario);
router.put('/usuarios/:id', authenticate, requirePermiso('usuarios:manage'), updateUsuario);
router.delete('/usuarios/:id', authenticate, requirePermiso('usuarios:manage'), deleteUsuario);

// ── PERMISOS (frontend lo usa para saber qué mostrar) ─
router.get('/permisos', authenticate, (req, res) => {
  const { PERMISOS } = require('../types');
  const rol = (req as import('../middleware/auth').AuthRequest).user!.rol;
  const permisos: Record<string, boolean> = {};
  for (const p of Object.keys(PERMISOS)) {
    const { canDo } = require('../types');
    permisos[p] = canDo(rol, p);
  }
  res.json({ rol, permisos });
});

export default router;
