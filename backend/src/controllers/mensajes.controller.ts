import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// ── LISTAR CONVERSACIONES ─────────────────────────────────────────────
export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const refugioId = req.user!.refugioId;
    const { type, search } = req.query as Record<string, string>;

    let whereType = '';
    const params: unknown[] = [refugioId, userId];
    if (type && type !== 'all' && type !== 'unread') {
      params.push(type);
      whereType = `AND c.type = $${params.length}`;
    }

    const rows = await query(`
      SELECT
        c.id, c.type, c.name, c.avatar_url, c.contact_name, c.contact_email,
        c.related_animal_id, c.last_message_at, c.created_at,
        -- last message
        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT m.message_type FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_type,
        (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_sender_id,
        -- unread count
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.id
           AND m.sender_id != $2
           AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
        ) AS unread_count,
        cp.last_read_at,
        -- animal info
        a.nombre AS animal_nombre,
        (SELECT f.url FROM animal_fotos f WHERE f.animal_id=a.id AND f.es_principal=true LIMIT 1) AS animal_foto,
        -- participants (for internal)
        (SELECT json_agg(json_build_object('id', u.id, 'nombre', u.nombre, 'avatar_url', u.avatar_url, 'rol', u.rol))
         FROM conversation_participants cp2
         JOIN usuarios u ON cp2.user_id = u.id
         WHERE cp2.conversation_id = c.id AND cp2.user_id != $2
        ) AS other_participants
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $2
      LEFT JOIN animales a ON c.related_animal_id = a.id
      WHERE c.shelter_id = $1 ${whereType}
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `, params);

    let result = rows.rows;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.contact_name || '').toLowerCase().includes(s) ||
        (c.other_participants || []).some((p: { nombre: string }) => p.nombre.toLowerCase().includes(s)) ||
        (c.last_message || '').toLowerCase().includes(s),
      );
    }

    if (type === 'unread') {
      result = result.filter(c => Number(c.unread_count) > 0);
    }

    res.json(result);
  } catch (e) {
    console.error('getConversations error:', e);
    res.status(500).json({ error: 'Error al cargar conversaciones' });
  }
}

// ── MENSAJES DE UNA CONVERSACIÓN ──────────────────────────────────────
export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Verify participant
    const part = await query(
      'SELECT id FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2',
      [id, userId],
    );
    if (!part.rows.length) return res.status(403).json({ error: 'Sin acceso' });

    const rows = await query(`
      SELECT m.*, u.nombre AS sender_nombre, u.avatar_url AS sender_avatar, u.rol AS sender_rol
      FROM messages m
      LEFT JOIN usuarios u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    // Mark as read
    await query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id=$1 AND user_id=$2',
      [id, userId],
    ).catch(() => {});

    res.json(rows.rows);
  } catch (e) {
    console.error('getMessages error:', e);
    res.status(500).json({ error: 'Error al cargar mensajes' });
  }
}

// ── ENVIAR MENSAJE ────────────────────────────────────────────────────
export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { content, message_type = 'text', file_url, file_name, file_size } = req.body;

    if (!content && !file_url) return res.status(400).json({ error: 'Contenido requerido' });

    // Verify participant
    const part = await query(
      'SELECT id FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2',
      [id, userId],
    );
    if (!part.rows.length) return res.status(403).json({ error: 'Sin acceso' });

    const msgRes = await query(`
      INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url, file_name, file_size)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [id, userId, content || null, message_type, file_url || null, file_name || null, file_size || null]);

    const msg = msgRes.rows[0];

    // Get sender info
    const senderRes = await query('SELECT nombre, avatar_url, rol FROM usuarios WHERE id=$1', [userId]);
    const sender = senderRes.rows[0];
    msg.sender_nombre = sender?.nombre;
    msg.sender_avatar = sender?.avatar_url;
    msg.sender_rol = sender?.rol;

    // Update conversation last_message_at
    await query(
      'UPDATE conversations SET last_message_at=NOW(), updated_at=NOW() WHERE id=$1',
      [id],
    ).catch(() => {});

    res.status(201).json(msg);
  } catch (e) {
    console.error('sendMessage error:', e);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
}

// ── CREAR CONVERSACIÓN ────────────────────────────────────────────────
export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const refugioId = req.user!.refugioId;
    const {
      type = 'internal', name, participant_ids = [],
      contact_name, contact_email,
      related_animal_id, related_request_id, related_assignment_id,
      first_message,
    } = req.body;

    const convRes = await query(`
      INSERT INTO conversations (shelter_id, type, name, contact_name, contact_email,
        related_animal_id, related_request_id, related_assignment_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [refugioId, type, name || null, contact_name || null, contact_email || null,
      related_animal_id || null, related_request_id || null, related_assignment_id || null, userId]);

    const convId = convRes.rows[0].id;

    // Add creator as participant
    const allParticipants = [...new Set([userId, ...participant_ids])];
    for (const pid of allParticipants) {
      await query(
        'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [convId, pid, pid === userId],
      );
    }

    // Send first message if provided
    if (first_message) {
      await query(
        'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES ($1,$2,$3,$4)',
        [convId, userId, first_message, 'text'],
      );
      await query('UPDATE conversations SET last_message_at=NOW() WHERE id=$1', [convId]);
    }

    res.status(201).json({ id: convId });
  } catch (e) {
    console.error('createConversation error:', e);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
}

// ── MARCAR COMO LEÍDO ─────────────────────────────────────────────────
export async function markRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await query(
      'UPDATE conversation_participants SET last_read_at=NOW() WHERE conversation_id=$1 AND user_id=$2',
      [id, userId],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
}

// ── TOTAL NO LEÍDOS (para badge sidebar) ──────────────────────────────
export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const r = await query(`
      SELECT COUNT(*) AS total FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
      WHERE m.sender_id != $1
        AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
    `, [userId]);
    res.json({ unread: Number(r.rows[0].total) });
  } catch (e) {
    res.status(500).json({ unread: 0 });
  }
}

// ── USUARIOS PARA NUEVA CONVERSACIÓN ─────────────────────────────────
export async function getChatUsers(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const refugioId = req.user!.refugioId;
    const r = await query(
      'SELECT id, nombre, rol, avatar_url, activo FROM usuarios WHERE refugio_id=$1 AND id!=$2 AND activo=true ORDER BY nombre',
      [refugioId, userId],
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
}
