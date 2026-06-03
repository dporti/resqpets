import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const refugioId = req.user!.refugioId;

    const [
      statsRes,
      animalesRecientesRes,
      avisosRes,
      actividadRes,
      adopcionesRes,
      eventosRes,
      donacionesRes,
    ] = await Promise.all([
      // Stats principales
      query(`
        SELECT
          COUNT(*) FILTER (WHERE true) as total,
          COUNT(*) FILTER (WHERE estado = 'en_acogida') as en_acogida,
          COUNT(*) FILTER (WHERE estado = 'en_residencia') as en_residencia,
          COUNT(*) FILTER (WHERE estado = 'en_adopcion') as en_adopcion,
          COUNT(*) FILTER (WHERE estado = 'en_proceso') as en_proceso,
          COUNT(*) FILTER (WHERE estado = 'en_evaluacion') as en_evaluacion,
          COUNT(*) FILTER (WHERE created_at >= NOW() - interval '1 day') as nuevos_hoy,
          COUNT(*) FILTER (WHERE created_at >= NOW() - interval '2 days' AND created_at < NOW() - interval '1 day') as nuevos_ayer
        FROM animales WHERE refugio_id = $1 AND estado != 'fallecido'
      `, [refugioId]),

      // Últimos 5 animales actualizados
      query(`
        SELECT a.id, a.nombre, a.especie, a.raza, a.estado, a.ubicacion_texto,
               a.updated_at, f.url as foto_principal
        FROM animales a
        LEFT JOIN animal_fotos f ON f.animal_id = a.id AND f.es_principal = true
        WHERE a.refugio_id = $1 AND a.estado != 'fallecido'
        ORDER BY a.updated_at DESC LIMIT 5
      `, [refugioId]),

      // Avisos activos
      query(`
        SELECT * FROM avisos
        WHERE refugio_id = $1 AND estado = 'activo'
        ORDER BY created_at DESC LIMIT 5
      `, [refugioId]),

      // Actividad reciente
      query(`
        SELECT ac.*, u.nombre as usuario_nombre, u.avatar_url,
               a.nombre as animal_nombre
        FROM actividad ac
        LEFT JOIN usuarios u ON u.id = ac.usuario_id
        LEFT JOIN animales a ON a.id = ac.animal_id
        WHERE ac.refugio_id = $1
        ORDER BY ac.created_at DESC LIMIT 10
      `, [refugioId]),

      // Adopciones del mes
      query(`
        SELECT
          COUNT(*) FILTER (WHERE fecha_adopcion >= date_trunc('month', NOW())) as este_mes,
          COUNT(*) FILTER (WHERE fecha_adopcion >= date_trunc('year', NOW())) as este_año,
          COUNT(*) FILTER (WHERE
            fecha_adopcion >= date_trunc('month', NOW() - interval '1 month') AND
            fecha_adopcion < date_trunc('month', NOW())
          ) as mes_anterior
        FROM adopciones WHERE (SELECT refugio_id FROM animales WHERE id = animal_id LIMIT 1) = $1
      `, [refugioId]),

      // Próximos eventos
      query(`
        SELECT * FROM eventos
        WHERE refugio_id = $1 AND fecha_inicio >= NOW()
        ORDER BY fecha_inicio ASC LIMIT 5
      `, [refugioId]),

      // Donaciones del mes
      query(`
        SELECT
          COALESCE(SUM(importe) FILTER (WHERE fecha >= date_trunc('month', NOW())), 0) as este_mes,
          COALESCE(SUM(importe) FILTER (WHERE
            fecha >= date_trunc('month', NOW() - interval '1 month') AND
            fecha < date_trunc('month', NOW())
          ), 0) as mes_anterior,
          COALESCE(SUM(importe) FILTER (WHERE fecha >= date_trunc('year', NOW())), 0) as este_año
        FROM donaciones WHERE refugio_id = $1
      `, [refugioId]),
    ]);

    const stats = statsRes.rows[0];
    const avisos = await query(
      `SELECT COUNT(*) FROM avisos WHERE refugio_id = $1 AND estado = 'activo'`,
      [refugioId]
    );

    res.json({
      stats: {
        totalAnimales: Number(stats.total),
        enAcogida: Number(stats.en_acogida),
        enResidencia: Number(stats.en_residencia),
        enAdopcion: Number(stats.en_adopcion),
        enProceso: Number(stats.en_proceso),
        enEvaluacion: Number(stats.en_evaluacion),
        nuevosHoy: Number(stats.nuevos_hoy),
        nuevosAyer: Number(stats.nuevos_ayer),
        avisosActivos: Number(avisos.rows[0].count),
      },
      animalesRecientes: animalesRecientesRes.rows,
      avisos: avisosRes.rows,
      actividad: actividadRes.rows,
      adopciones: {
        esteMes: Number(adopcionesRes.rows[0]?.este_mes || 0),
        esteAño: Number(adopcionesRes.rows[0]?.este_año || 0),
        mesAnterior: Number(adopcionesRes.rows[0]?.mes_anterior || 0),
      },
      eventos: eventosRes.rows,
      donaciones: {
        esteMes: Number(donacionesRes.rows[0]?.este_mes || 0),
        mesAnterior: Number(donacionesRes.rows[0]?.mes_anterior || 0),
        esteAño: Number(donacionesRes.rows[0]?.este_año || 0),
        objetivo: 2000,
      },
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
