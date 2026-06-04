import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente interno de ResQPet, un CRM para protectoras de animales.
Tu nombre es "Asistente ResQPet".

Tienes acceso a los datos reales de la protectora que se te proporcionan en cada consulta.

PERSONALIDAD:
- Conciso y directo. Respuestas cortas salvo que pidan un informe o email completo.
- Empático con la misión animal, pero profesional.
- Usa emojis con moderación (solo para listas o énfasis clave).
- Responde siempre en español.

FORMATO DE RESPUESTAS:
- Para listas de animales/personas: tabla markdown con las columnas más relevantes.
- Para emails: bloque completo con Asunto: y cuerpo listo para copiar.
- Para estadísticas: número destacado en negrita + contexto breve.
- Para acciones como crear tareas: confirma los datos detectados antes de ejecutar.
- Si detectas que el usuario quiere navegar a una sección, indica exactamente a cuál.

ACCIONES DISPONIBLES (úsalas cuando el usuario lo pida):
- ACTION:NAVIGATE:seccion — navegar a inicio/animales/adopciones/acogidas/voluntarios/reportes/mensajes/calendario/donaciones/configuracion
- ACTION:CREATE_TASK:{"titulo":"...","categoria":"medica|acogida|administrativa|difusion|transporte|adopcion|mantenimiento","prioridad":"alta|media|baja","fecha_limite":"YYYY-MM-DD"} — crear tarea
- ACTION:COPY_EMAIL — indica que el siguiente bloque de texto es un email para copiar

LIMITACIONES:
- Solo usas los datos que se te proporcionan. Si no tienes datos suficientes, dilo.
- No inventas datos ni nombres de animales o personas.
- Si la pregunta no tiene que ver con la protectora, redirige amablemente.`;

// ── DETECCIÓN DE INTENCIÓN ─────────────────────────────────────────────

function detectIntents(q: string): string[] {
  const l = q.toLowerCase();
  const intents: string[] = [];
  if (/animal|perro|gato|mascota|nombre|raza|días|movimiento|ficha|especie|foto/.test(l)) intents.push('animals');
  if (/adopci[oó]n|adoptante|solicitud|expediente|aprobad|rechazad|pendiente/.test(l)) intents.push('adoptions');
  if (/acogida|familia|plaza|disponible|capacidad|acogiendo/.test(l)) intents.push('foster');
  if (/tarea|pendiente|vencida|asignada|urgente|recordatorio/.test(l)) intents.push('tasks');
  if (/voluntario|karma|ranking|activo|disponib/.test(l)) intents.push('volunteers');
  if (/aviso|sos|perdido|encontrado|b[uú]squeda/.test(l)) intents.push('sos');
  if (intents.length === 0) intents.push('stats');
  intents.push('stats'); // always include stats
  return [...new Set(intents)];
}

// ── CONSTRUCCIÓN DE CONTEXTO ──────────────────────────────────────────

async function buildContext(refugioId: number, refugioNombre: string, q: string) {
  const intents = detectIntents(q);
  const ctx: Record<string, unknown> = {
    protectora: refugioNombre,
    fecha_actual: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  };

  const tasks: Promise<void>[] = [];

  // Stats siempre
  tasks.push(
    query(`SELECT
        (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado!='fallecido') AS total_animales,
        (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado='en_adopcion') AS en_adopcion,
        (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado='en_acogida') AS en_acogida,
        (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado='en_residencia') AS en_residencia,
        (SELECT COUNT(*) FROM adoption_expedients WHERE refugio_id=$1 AND completed_at >= date_trunc('month',NOW())) AS adopciones_este_mes,
        (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND estado='pendiente') AS solicitudes_pendientes,
        (SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND estado='active') AS sos_activos,
        (SELECT COUNT(*) FROM tasks WHERE refugio_id=$1 AND estado='pending' AND fecha_limite < NOW()) AS tareas_vencidas,
        (SELECT COUNT(*) FROM foster_families WHERE refugio_id=$1 AND estado='available') AS familias_disponibles
      `, [refugioId]).then(r => { ctx.estadisticas = r.rows[0]; }),
  );

  if (intents.includes('animals')) {
    tasks.push(
      query(`SELECT a.id, a.nombre, a.especie, a.raza, a.estado,
               ROUND(EXTRACT(EPOCH FROM (NOW()-a.updated_at))/86400)::int AS dias_sin_actualizar,
               ROUND(EXTRACT(EPOCH FROM (NOW()-a.fecha_entrada))/86400)::int AS dias_en_protectora,
               a.ubicacion_texto, a.vacunado, a.esterilizado,
               EXTRACT(YEAR FROM AGE(a.fecha_nacimiento)) AS edad_años
             FROM animales a
             WHERE a.refugio_id=$1 AND a.estado!='fallecido'
             ORDER BY dias_sin_actualizar DESC NULLS LAST
             LIMIT 15`, [refugioId]).then(r => { ctx.animales = r.rows; }),
    );
  }

  if (intents.includes('adoptions')) {
    tasks.push(
      query(`SELECT ar.id, ar.nombre AS adoptante, ar.email, ar.estado, ar.created_at,
               a.nombre AS animal, a.especie, a.raza,
               ae.fase_actual, ae.completed_at
             FROM adoption_requests ar
             LEFT JOIN animales a ON ar.animal_id=a.id
             LEFT JOIN adoption_expedients ae ON ae.request_id=ar.id
             WHERE ar.refugio_id=$1
             ORDER BY ar.created_at DESC LIMIT 10`, [refugioId]).then(r => { ctx.adopciones = r.rows; }),
    );
  }

  if (intents.includes('foster')) {
    tasks.push(
      query(`SELECT ff.id, ff.nombre, ff.ciudad, ff.estado, ff.max_animales,
               ff.animales_actuales, ff.acepta_perros, ff.acepta_gatos,
               ff.karma_puntos,
               (ff.max_animales - ff.animales_actuales) AS plazas_libres,
               COUNT(fa.id) AS acogidas_activas
             FROM foster_families ff
             LEFT JOIN foster_assignments fa ON fa.familia_id=ff.id AND fa.estado='active'
             WHERE ff.refugio_id=$1
             GROUP BY ff.id
             ORDER BY plazas_libres DESC, ff.karma_puntos DESC
             LIMIT 12`, [refugioId]).then(r => { ctx.familias_acogida = r.rows; }),
    );
  }

  if (intents.includes('tasks')) {
    tasks.push(
      query(`SELECT t.id, t.titulo, t.categoria, t.prioridad, t.estado,
               t.fecha_limite, a.nombre AS animal_relacionado,
               STRING_AGG(u.nombre, ', ') AS asignados
             FROM tasks t
             LEFT JOIN animales a ON t.animal_id=a.id
             LEFT JOIN unnest(t.asignado_a) AS uid ON true
             LEFT JOIN usuarios u ON u.id=uid
             WHERE t.refugio_id=$1 AND t.estado IN ('pending','in_progress','blocked')
             GROUP BY t.id, a.nombre
             ORDER BY t.fecha_limite ASC NULLS LAST, t.prioridad DESC
             LIMIT 15`, [refugioId]).then(r => { ctx.tareas = r.rows; }),
    );
  }

  if (intents.includes('volunteers')) {
    tasks.push(
      query(`SELECT u.id, u.nombre, u.rol, u.karma_puntos, u.es_disponible,
               u.especialidades,
               COUNT(CASE WHEN t.estado='pending' THEN 1 END) AS tareas_pendientes
             FROM usuarios u
             LEFT JOIN tasks t ON $1=t.refugio_id AND u.id=ANY(t.asignado_a) AND t.estado='pending'
             WHERE u.refugio_id=$1 AND u.activo=true
             GROUP BY u.id
             ORDER BY u.karma_puntos DESC LIMIT 10`, [refugioId]).then(r => { ctx.voluntarios = r.rows; }),
    );
  }

  if (intents.includes('sos')) {
    tasks.push(
      query(`SELECT id, tipo, urgencia, estado, especie, nombre_animal,
               color, descripcion, ubicacion_descripcion,
               ROUND(EXTRACT(EPOCH FROM (NOW()-created_at))/3600)::int AS horas_activo
             FROM sos_alerts
             WHERE refugio_id=$1 AND estado='active'
             ORDER BY urgencia DESC, created_at DESC
             LIMIT 10`, [refugioId]).then(r => { ctx.avisos_sos = r.rows; }),
    );
  }

  await Promise.all(tasks);
  return ctx;
}

// ── CHAT ENDPOINT (streaming) ──────────────────────────────────────────

export async function chat(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { messages = [], query: userQuery } = req.body as { messages: { role: string; content: string }[]; query: string };

    if (!userQuery) return res.status(400).json({ error: 'Query requerida' });

    // Get shelter name
    const refugioRes = await query('SELECT nombre FROM refugios WHERE id=$1', [refugioId]);
    const refugioNombre = refugioRes.rows[0]?.nombre || 'la protectora';

    // Build context
    const ctx = await buildContext(refugioId, refugioNombre, userQuery);
    const contextStr = JSON.stringify(ctx, null, 2);

    // Prepare conversation history (last 6 messages)
    const history = messages.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Add current query with context
    history.push({
      role: 'user',
      content: `DATOS ACTUALES DE LA PROTECTORA:\n${contextStr}\n\nPREGUNTA:\n${userQuery}`,
    });

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    stream.on('text', (text: string) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('finalMessage', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (err: Error) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (e) {
    console.error('assistant chat error:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Error del asistente' });
    else { res.write(`data: ${JSON.stringify({ error: 'Error interno' })}\n\n`); res.end(); }
  }
}

// ── CREATE TASK ACTION ────────────────────────────────────────────────

export async function createTaskAction(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const userId = req.user!.userId;
    const { titulo, categoria = 'administrativa', prioridad = 'media', fecha_limite } = req.body;

    if (!titulo) return res.status(400).json({ error: 'Título requerido' });

    const r = await query(`
      INSERT INTO tasks (refugio_id, titulo, categoria, prioridad, estado, asignado_a, creado_por, fecha_limite)
      VALUES ($1,$2,$3,$4,'pending',$5,$6,$7) RETURNING id, titulo`,
      [refugioId, titulo, categoria, prioridad, [userId], userId, fecha_limite || null]);

    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
}
