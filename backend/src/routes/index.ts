import { Router } from 'express';
import { login, me, changePassword } from '../controllers/auth.controller';
import { getDashboard } from '../controllers/dashboard.controller';
import { getAnimales, getAnimal, createAnimal, updateAnimal, deleteAnimal, addNota } from '../controllers/animales.controller';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../controllers/usuarios.controller';
import { getHealthEvents, createHealthEvent, deleteHealthEvent } from '../controllers/health.controller';
import { getBehaviorEvaluations, createBehaviorEvaluation } from '../controllers/behavior.controller';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documents.controller';
import { upload, uploadFoto, deleteFoto, setPrincipal } from '../controllers/fotos.controller';
import { generateInstagram } from '../controllers/instagram.controller';
import { authenticate, requirePermiso } from '../middleware/auth';

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

// ── FOTOS ────────────────────────────────────────────
router.post('/animales/:id/fotos', authenticate, requirePermiso('animales:update'), upload.single('file'), uploadFoto);
router.delete('/animales/:id/fotos/:fotoId', authenticate, requirePermiso('animales:update'), deleteFoto);
router.put('/animales/:id/fotos/:fotoId/principal', authenticate, requirePermiso('animales:update'), setPrincipal);

// ── EVENTOS MÉDICOS ───────────────────────────────────
router.get('/animales/:id/health', authenticate, requirePermiso('animales:read'), getHealthEvents);
router.post('/animales/:id/health', authenticate, requirePermiso('animales:update'), createHealthEvent);
router.delete('/animales/:id/health/:eventId', authenticate, requirePermiso('animales:update'), deleteHealthEvent);

// ── EVALUACIONES COMPORTAMIENTO ───────────────────────
router.get('/animales/:id/behavior', authenticate, requirePermiso('animales:read'), getBehaviorEvaluations);
router.post('/animales/:id/behavior', authenticate, requirePermiso('animales:update'), createBehaviorEvaluation);

// ── DOCUMENTOS ────────────────────────────────────────
router.get('/animales/:id/documents', authenticate, requirePermiso('animales:read'), getDocuments);
router.post('/animales/:id/documents', authenticate, requirePermiso('animales:update'), createDocument);
router.delete('/animales/:id/documents/:docId', authenticate, requirePermiso('animales:update'), deleteDocument);

// ── INSTAGRAM COPY ────────────────────────────────────
router.post('/animales/:id/instagram', authenticate, requirePermiso('animales:update'), generateInstagram);

// ── AVISOS ────────────────────────────────────────────
router.get('/avisos', authenticate, requirePermiso('avisos:read'), async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  res.json((await query(`SELECT * FROM avisos WHERE refugio_id=$1 ORDER BY created_at DESC`, [refugioId])).rows);
});

// ── DONACIONES ────────────────────────────────────────
router.get('/donaciones', authenticate, requirePermiso('donaciones:read'), async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  res.json((await query(`SELECT * FROM donaciones WHERE refugio_id=$1 ORDER BY fecha DESC`, [refugioId])).rows);
});

// ── EVENTOS ───────────────────────────────────────────
router.get('/eventos', authenticate, async (req, res) => {
  const { query } = await import('../db/pool');
  const refugioId = (req as import('../middleware/auth').AuthRequest).user!.refugioId;
  res.json((await query(`SELECT * FROM eventos WHERE refugio_id=$1 AND fecha_inicio >= NOW() ORDER BY fecha_inicio ASC`, [refugioId])).rows);
});

// ── USUARIOS ──────────────────────────────────────────
router.get('/usuarios', authenticate, requirePermiso('usuarios:read'), getUsuarios);
router.post('/usuarios', authenticate, requirePermiso('usuarios:manage'), createUsuario);
router.put('/usuarios/:id', authenticate, requirePermiso('usuarios:manage'), updateUsuario);
router.delete('/usuarios/:id', authenticate, requirePermiso('usuarios:manage'), deleteUsuario);

// ── PERMISOS ──────────────────────────────────────────
router.get('/permisos', authenticate, (req, res) => {
  const { PERMISOS, canDo } = require('../types');
  const rol = (req as import('../middleware/auth').AuthRequest).user!.rol;
  const permisos: Record<string, boolean> = {};
  for (const p of Object.keys(PERMISOS)) permisos[p] = canDo(rol, p);
  res.json({ rol, permisos });
});

export default router;
