import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// ── helpers ───────────────────────────────────────────────────────────

async function logAudit(
  refugioId: number, userId: number, userName: string,
  action: string, resourceType?: string, resourceId?: number,
  resourceName?: string, details?: object,
) {
  await query(
    `INSERT INTO audit_log(shelter_id,user_id,user_nombre,action,resource_type,resource_id,resource_name,details)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [refugioId, userId, userName, action, resourceType || null, resourceId || null, resourceName || null, details ? JSON.stringify(details) : null],
  ).catch(() => {});
}

// ── CONFIG ────────────────────────────────────────────────────────────

export async function getConfig(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;

    // Upsert default if not exists
    await query(
      'INSERT INTO shelter_config(shelter_id) VALUES($1) ON CONFLICT(shelter_id) DO NOTHING',
      [refugioId],
    );

    const [configRes, refugioRes, statsRes] = await Promise.all([
      query('SELECT * FROM shelter_config WHERE shelter_id=$1', [refugioId]),
      query('SELECT * FROM refugios WHERE id=$1', [refugioId]),
      query(`
        SELECT
          (SELECT COUNT(*) FROM animales WHERE refugio_id=$1) AS animales,
          (SELECT COUNT(*) FROM usuarios WHERE refugio_id=$1) AS usuarios,
          (SELECT COUNT(*) FROM animal_fotos af JOIN animales a ON af.animal_id=a.id WHERE a.refugio_id=$1) AS fotos
      `, [refugioId]),
    ]);

    res.json({
      config: configRes.rows[0] || {},
      refugio: refugioRes.rows[0] || {},
      stats: statsRes.rows[0] || {},
    });
  } catch (e) {
    console.error('getConfig error:', e);
    res.status(500).json({ error: 'Error al cargar configuración' });
  }
}

export async function updateConfig(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const updates = req.body as Record<string, unknown>;

    // Separate refugio fields from config fields
    const REFUGIO_FIELDS = ['nombre', 'email', 'telefono', 'direccion', 'ciudad',
      'logo_url', 'cover_url', 'website', 'instagram', 'facebook',
      'slug', 'description_public'];
    const refugioUpdates: Record<string, unknown> = {};
    const configUpdates: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(updates)) {
      if (REFUGIO_FIELDS.includes(k)) refugioUpdates[k] = v;
      else configUpdates[k] = v;
    }

    if (Object.keys(refugioUpdates).length) {
      const keys = Object.keys(refugioUpdates);
      const vals = Object.values(refugioUpdates);
      const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(',');
      await query(`UPDATE refugios SET ${sets} WHERE id=$1`, [refugioId, ...vals]);
    }

    if (Object.keys(configUpdates).length) {
      const keys = Object.keys(configUpdates);
      const vals = Object.values(configUpdates);
      const sets = keys.map((k, i) => `${k}=$${i + 2}`).join(',');
      await query(
        `UPDATE shelter_config SET ${sets}, updated_at=NOW() WHERE shelter_id=$1`,
        [refugioId, ...vals],
      );
    }

    const userRes = await query('SELECT nombre FROM usuarios WHERE id=$1', [userId]);
    await logAudit(refugioId, userId, userRes.rows[0]?.nombre, 'config_updated', 'shelter_config', refugioId, 'Configuración', { fields: Object.keys(updates) });

    res.json({ ok: true });
  } catch (e) {
    console.error('updateConfig error:', e);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
}

// ── EQUIPO ────────────────────────────────────────────────────────────

export async function getTeam(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const r = await query(
      `SELECT id, nombre, email, rol, activo, avatar_url, ultimo_acceso, created_at
       FROM usuarios WHERE refugio_id=$1 ORDER BY rol, nombre`,
      [refugioId],
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar equipo' });
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { memberId } = req.params;
    const { rol } = req.body;
    const valid = ['admin', 'coordinador', 'voluntario'];
    if (!valid.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });

    const memberRes = await query(
      'UPDATE usuarios SET rol=$1 WHERE id=$2 AND refugio_id=$3 RETURNING nombre',
      [rol, memberId, refugioId],
    );
    if (!memberRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const actorRes = await query('SELECT nombre FROM usuarios WHERE id=$1', [userId]);
    await logAudit(refugioId, userId, actorRes.rows[0]?.nombre, 'role_changed', 'usuario', Number(memberId), memberRes.rows[0].nombre, { new_role: rol });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
}

export async function toggleMemberStatus(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { memberId } = req.params;

    const cur = await query('SELECT activo, nombre FROM usuarios WHERE id=$1 AND refugio_id=$2', [memberId, refugioId]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newStatus = !cur.rows[0].activo;
    await query('UPDATE usuarios SET activo=$1 WHERE id=$2', [newStatus, memberId]);

    const actorRes = await query('SELECT nombre FROM usuarios WHERE id=$1', [userId]);
    await logAudit(refugioId, userId, actorRes.rows[0]?.nombre, newStatus ? 'user_activated' : 'user_deactivated', 'usuario', Number(memberId), cur.rows[0].nombre);
    res.json({ ok: true, activo: newStatus });
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
}

export async function removeMember(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { memberId } = req.params;

    if (String(memberId) === String(userId)) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });

    const memberRes = await query('SELECT nombre FROM usuarios WHERE id=$1 AND refugio_id=$2', [memberId, refugioId]);
    if (!memberRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Desasociar en lugar de eliminar (preserva datos)
    await query('UPDATE usuarios SET refugio_id=NULL, activo=false WHERE id=$1', [memberId]);

    const actorRes = await query('SELECT nombre FROM usuarios WHERE id=$1', [userId]);
    await logAudit(refugioId, userId, actorRes.rows[0]?.nombre, 'user_removed', 'usuario', Number(memberId), memberRes.rows[0].nombre);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
}

// ── INVITACIONES ──────────────────────────────────────────────────────

export async function getInvitations(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const r = await query(
      `SELECT i.*, u.nombre AS invited_by_nombre
       FROM invitations i LEFT JOIN usuarios u ON i.invited_by=u.id
       WHERE i.shelter_id=$1 AND i.used_at IS NULL AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [refugioId],
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar invitaciones' });
  }
}

export async function createInvitation(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { email, rol = 'voluntario', message } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const r = await query(
      `INSERT INTO invitations(shelter_id,email,rol,invited_by,message)
       VALUES($1,$2,$3,$4,$5) RETURNING token`,
      [refugioId, email, rol, userId, message || null],
    );
    const token = r.rows[0].token;
    const link = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/join?token=${token}`;

    res.status(201).json({ ok: true, token, link });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear invitación' });
  }
}

export async function cancelInvitation(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    await query('DELETE FROM invitations WHERE id=$1 AND shelter_id=$2', [req.params.id, refugioId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al cancelar invitación' });
  }
}

// ── AUDIT LOG ─────────────────────────────────────────────────────────

export async function getAuditLog(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT * FROM audit_log WHERE shelter_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [refugioId, limit, offset],
      ),
      query('SELECT COUNT(*) FROM audit_log WHERE shelter_id=$1', [refugioId]),
    ]);

    res.json({ data: dataRes.rows, total: Number(countRes.rows[0].count) });
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar audit log' });
  }
}

// ── UPLOAD ASSET (logo / cover) ───────────────────────────────────────

import multer from 'multer';
const uploadMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadAssetMiddleware = uploadMem.single('file');

export async function uploadAsset(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Archivo requerido' });

    const { assetType = 'logo' } = req.body;
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `shelters/${refugioId}/${assetType}_${Date.now()}.${ext}`;

    const resp = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/shelter-assets/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': file.mimetype,
          'x-upsert': 'true',
        },
        body: file.buffer,
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Supabase upload error:', err);
      return res.status(500).json({ error: 'Error al subir archivo' });
    }

    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/shelter-assets/${path}`;

    // Update refugio
    const column = assetType === 'logo' ? 'logo_url' : 'cover_url';
    await query(`UPDATE refugios SET ${column}=$1 WHERE id=$2`, [url, refugioId]);

    res.json({ url });
  } catch (e) {
    console.error('uploadAsset error:', e);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
}

// ── GEOCODE ───────────────────────────────────────────────────────────

export async function geocodeAddress(req: AuthRequest, res: Response) {
  try {
    const { address } = req.query as { address: string };
    if (!address) return res.status(400).json({ error: 'Dirección requerida' });

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'ResQPet CRM/1.0' } });
    const data = await r.json() as { lat: string; lon: string; display_name: string }[];

    if (!data.length) return res.status(404).json({ error: 'Dirección no encontrada' });
    res.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name });
  } catch (e) {
    res.status(500).json({ error: 'Error al geocodificar' });
  }
}
