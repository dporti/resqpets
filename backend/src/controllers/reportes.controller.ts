import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

// ── HELPERS ───────────────────────────────────────────────────────────

function parsePeriod(q: Record<string, string>) {
  const { period, date_from, date_to } = q;
  const now = new Date();
  let from: Date, to: Date;

  switch (period) {
    case 'mes_anterior':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case '3_meses':
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case '6_meses':
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'anio':
      from = new Date(now.getFullYear(), 0, 1);
      to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      from = new Date(date_from ?? '');
      to   = new Date((date_to ?? '') + 'T23:59:59');
      break;
    default: // este_mes
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration - 1000);
  const prevTo   = new Date(from.getTime() - 1);
  return { from, to, prevFrom, prevTo };
}

// ── RESUMEN ───────────────────────────────────────────────────────────

export async function getResumen(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to, prevFrom, prevTo } = parsePeriod(req.query as Record<string, string>);

    const [
      ingresosR, prevIngresosR,
      adopcionesR, prevAdopcionesR,
      tiempoMedioR,
      acogidasActivasR,
      sosResueltoR, prevSosR,
      estadosR, especiesR,
      monthlyR,
      dailyR,
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3`, [refugioId, from, to]),
      query(`SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3`, [refugioId, prevFrom, prevTo]),
      query(`SELECT COUNT(*) FROM adoption_expedients WHERE refugio_id=$1 AND completed_at BETWEEN $2 AND $3`, [refugioId, from, to]),
      query(`SELECT COUNT(*) FROM adoption_expedients WHERE refugio_id=$1 AND completed_at BETWEEN $2 AND $3`, [refugioId, prevFrom, prevTo]),
      query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (ae.completed_at - ar.created_at))/86400))::int AS dias
        FROM adoption_expedients ae
        JOIN adoption_requests ar ON ar.id = ae.request_id
        WHERE ae.refugio_id=$1 AND ae.completed_at BETWEEN $2 AND $3 AND ae.completed_at IS NOT NULL
      `, [refugioId, from, to]),
      query(`SELECT COUNT(*) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.estado='active'`, [refugioId]),
      query(`SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND estado IN ('rescued','resolved') AND updated_at BETWEEN $2 AND $3`, [refugioId, from, to]),
      query(`SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND estado IN ('rescued','resolved') AND updated_at BETWEEN $2 AND $3`, [refugioId, prevFrom, prevTo]),
      query(`SELECT estado, COUNT(*) as total FROM animales WHERE refugio_id=$1 AND estado != 'fallecido' GROUP BY estado`, [refugioId]),
      query(`SELECT especie, COUNT(*) as total FROM animales WHERE refugio_id=$1 GROUP BY especie`, [refugioId]),
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS mes_label,
          DATE_TRUNC('month', m.mes) AS mes_date,
          COALESCE(a.cnt,0) AS ingresos,
          COALESCE(ae.cnt,0) AS adopciones,
          COALESCE(fa.cnt,0) AS acogidas,
          COALESCE(s.cnt,0) AS sos
        FROM generate_series($2::date, $3::date, '1 month') AS m(mes)
        LEFT JOIN (SELECT DATE_TRUNC('month',created_at) d, COUNT(*) cnt FROM animales WHERE refugio_id=$1 GROUP BY d) a ON a.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',completed_at) d, COUNT(*) cnt FROM adoption_expedients WHERE refugio_id=$1 AND completed_at IS NOT NULL GROUP BY d) ae ON ae.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',iniciada_at) d, COUNT(*) cnt FROM foster_assignments fa2 JOIN animales an ON fa2.animal_id=an.id WHERE an.refugio_id=$1 GROUP BY d) fa ON fa.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',created_at) d, COUNT(*) cnt FROM sos_alerts WHERE refugio_id=$1 GROUP BY d) s ON s.d=m.mes
        ORDER BY m.mes
      `, [refugioId, from, to]),
      query(`
        SELECT DATE(created_at) AS fecha, COUNT(*) AS cnt
        FROM animales
        WHERE refugio_id=$1 AND created_at >= NOW() - INTERVAL '52 weeks'
        GROUP BY DATE(created_at)
        ORDER BY fecha
      `, [refugioId]),
    ]);

    const ingresos = Number(ingresosR.rows[0].count);
    const adopciones = Number(adopcionesR.rows[0].count);
    const kpis = {
      ingresos,
      prev_ingresos:   Number(prevIngresosR.rows[0].count),
      adopciones,
      prev_adopciones: Number(prevAdopcionesR.rows[0].count),
      tiempo_medio:    tiempoMedioR.rows[0]?.dias ?? 0,
      acogidas_activas: Number(acogidasActivasR.rows[0].count),
      sos_resueltos:   Number(sosResueltoR.rows[0].count),
      prev_sos:        Number(prevSosR.rows[0].count),
      tasa_adopcion:   ingresos > 0 ? Math.round((adopciones / ingresos) * 100) : 0,
    };

    res.json({
      kpis,
      estados: estadosR.rows,
      especies: especiesR.rows,
      monthly: monthlyR.rows,
      daily_heatmap: dailyR.rows,
    });
  } catch (e) {
    console.error('getResumen error:', e);
    res.status(500).json({ error: 'Error al cargar resumen' });
  }
}

// ── ANIMALES ──────────────────────────────────────────────────────────

export async function getAnimalesReport(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [kpisR, ingresasSalidasR, procedenciaR, estanciaEspecieR, topAntiguosR] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3) AS total,
          (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(ae.completed_at,NOW()) - a.created_at))/86400))::int
           FROM animales a LEFT JOIN adoption_expedients ae ON ae.refugio_id=a.refugio_id
           WHERE a.refugio_id=$1 AND a.created_at BETWEEN $2 AND $3) AS tiempo_medio,
          (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado='fallecido' AND updated_at BETWEEN $2 AND $3) AS fallecidos,
          (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado NOT IN ('fallecido') AND (señas_particulares ILIKE '%especial%' OR estado_salud != 'Saludable')) AS necesidades_especiales
      `, [refugioId, from, to]),
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS mes_label,
          COALESCE(i.cnt,0) AS ingresos,
          COALESCE(ad.cnt,0) AS adopciones,
          COALESCE(fa.cnt,0) AS otras_salidas
        FROM generate_series($2::date, $3::date, '1 month') AS m(mes)
        LEFT JOIN (SELECT DATE_TRUNC('month',created_at) d, COUNT(*) cnt FROM animales WHERE refugio_id=$1 GROUP BY d) i ON i.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',completed_at) d, COUNT(*) cnt FROM adoption_expedients WHERE refugio_id=$1 AND completed_at IS NOT NULL GROUP BY d) ad ON ad.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',finalizada_at) d, COUNT(*) cnt FROM foster_assignments fa2 JOIN animales an ON fa2.animal_id=an.id WHERE an.refugio_id=$1 AND fa2.estado='completed' GROUP BY d) fa ON fa.d=m.mes
        ORDER BY m.mes
      `, [refugioId, from, to]),
      query(`
        SELECT procedencia, COUNT(*) as total
        FROM animales
        WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3 AND procedencia IS NOT NULL
        GROUP BY procedencia
        ORDER BY total DESC
        LIMIT 6
      `, [refugioId, from, to]),
      query(`
        SELECT especie,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400))::int AS dias_medio
        FROM animales
        WHERE refugio_id=$1 AND estado NOT IN ('fallecido')
        GROUP BY especie
      `, [refugioId]),
      query(`
        SELECT a.id, a.nombre, a.especie, a.raza, a.estado,
          EXTRACT(EPOCH FROM (NOW() - a.fecha_entrada))/86400 AS dias_refugio,
          fp.url AS foto
        FROM animales a
        LEFT JOIN animal_fotos fp ON fp.animal_id=a.id AND fp.es_principal=true
        WHERE a.refugio_id=$1 AND a.estado NOT IN ('fallecido')
        ORDER BY a.fecha_entrada ASC NULLS LAST
        LIMIT 10
      `, [refugioId]),
    ]);

    const semanas = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (7 * 86400000)));

    res.json({
      kpis: {
        total: Number(kpisR.rows[0].total),
        media_semana: Math.round(Number(kpisR.rows[0].total) / semanas * 10) / 10,
        tiempo_medio: kpisR.rows[0].tiempo_medio ?? 0,
        necesidades_especiales: Number(kpisR.rows[0].necesidades_especiales),
        fallecidos: Number(kpisR.rows[0].fallecidos),
      },
      ingresos_salidas: ingresasSalidasR.rows,
      procedencia: procedenciaR.rows,
      estancia_especie: estanciaEspecieR.rows,
      top_antiguos: topAntiguosR.rows,
    });
  } catch (e) {
    console.error('getAnimalesReport error:', e);
    res.status(500).json({ error: 'Error al cargar datos de animales' });
  }
}

// ── ADOPCIONES ────────────────────────────────────────────────────────

export async function getAdopcionesReport(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [kpisR, funnelR, porMesR, viviendaR, experienciaR, massolicitadosR, historialR] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3) AS solicitudes,
          (SELECT COUNT(*) FROM adoption_expedients WHERE refugio_id=$1 AND completed_at BETWEEN $2 AND $3) AS completadas,
          (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND estado='rechazada' AND updated_at BETWEEN $2 AND $3) AS rechazadas,
          (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (ae.completed_at - ar.created_at))/86400))::int
           FROM adoption_expedients ae JOIN adoption_requests ar ON ar.id=ae.request_id
           WHERE ae.refugio_id=$1 AND ae.completed_at BETWEEN $2 AND $3) AS tiempo_proceso,
          (SELECT canal, COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3 GROUP BY canal ORDER BY COUNT(*) DESC LIMIT 1) AS canal_top
      `, [refugioId, from, to]),
      query(`
        SELECT
          (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3) AS recibidas,
          (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND estado='en_evaluacion' AND created_at BETWEEN $2 AND $3) AS evaluacion,
          (SELECT COUNT(*) FROM adoption_interviews WHERE refugio_id IS NULL OR EXISTS(SELECT 1 FROM adoption_requests ar WHERE ar.id=adoption_interviews.request_id AND ar.refugio_id=$1 AND ar.created_at BETWEEN $2 AND $3)) AS entrevistas,
          (SELECT COUNT(*) FROM adoption_requests WHERE refugio_id=$1 AND estado='aprobada' AND updated_at BETWEEN $2 AND $3) AS aprobadas,
          (SELECT COUNT(*) FROM adoption_expedients WHERE refugio_id=$1 AND completed_at BETWEEN $2 AND $3) AS completadas
      `, [refugioId, from, to]),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', completed_at), 'Mon YY') AS mes_label,
          COUNT(*) AS completadas
        FROM adoption_expedients
        WHERE refugio_id=$1 AND completed_at BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('month', completed_at), mes_label
        ORDER BY DATE_TRUNC('month', completed_at)
      `, [refugioId, from, to]),
      query(`
        SELECT COALESCE(tipo_vivienda,'Sin datos') AS tipo, COUNT(*) AS total
        FROM adoption_requests
        WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3 AND tipo_vivienda IS NOT NULL
        GROUP BY tipo_vivienda
      `, [refugioId, from, to]),
      query(`
        SELECT CASE WHEN experiencia_previa IS NOT NULL AND experiencia_previa != '' THEN 'Con experiencia' ELSE 'Sin experiencia' END AS tipo, COUNT(*) AS total
        FROM adoption_requests
        WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3
        GROUP BY 1
      `, [refugioId, from, to]),
      query(`
        SELECT a.id, a.nombre, a.especie, fp.url AS foto, COUNT(ar.id) AS solicitudes
        FROM adoption_requests ar
        JOIN animales a ON ar.animal_id = a.id
        LEFT JOIN animal_fotos fp ON fp.animal_id=a.id AND fp.es_principal=true
        WHERE ar.refugio_id=$1 AND ar.created_at BETWEEN $2 AND $3
        GROUP BY a.id, a.nombre, a.especie, fp.url
        ORDER BY solicitudes DESC LIMIT 10
      `, [refugioId, from, to]),
      query(`
        SELECT ae.id, a.nombre AS animal, a.especie, fp.url AS foto,
          ar.nombre AS adoptante, ar.canal,
          ar.created_at AS fecha_solicitud, ae.completed_at,
          EXTRACT(EPOCH FROM (ae.completed_at - ar.created_at))/86400 AS dias_proceso,
          ar.puntuacion
        FROM adoption_expedients ae
        JOIN adoption_requests ar ON ae.request_id = ar.id
        LEFT JOIN animales a ON ar.animal_id = a.id
        LEFT JOIN animal_fotos fp ON fp.animal_id=a.id AND fp.es_principal=true
        WHERE ae.refugio_id=$1 AND ae.completed_at BETWEEN $2 AND $3
        ORDER BY ae.completed_at DESC
        LIMIT 50
      `, [refugioId, from, to]),
    ]);

    const kpis = kpisR.rows[0];
    const f = funnelR.rows[0];
    const solicitudesTotal = Number(f.recibidas);

    res.json({
      kpis: {
        solicitudes: Number(kpis.solicitudes),
        completadas: Number(kpis.completadas),
        rechazadas: Number(kpis.rechazadas),
        tiempo_proceso: kpis.tiempo_proceso ?? 0,
        tasa_conversion: solicitudesTotal > 0 ? Math.round((Number(f.completadas) / solicitudesTotal) * 100) : 0,
      },
      funnel: [
        { name: 'Solicitudes recibidas', value: Number(f.recibidas) },
        { name: 'En evaluación', value: Number(f.evaluacion) },
        { name: 'Entrevista realizada', value: Number(f.entrevistas) },
        { name: 'Aprobadas', value: Number(f.aprobadas) },
        { name: 'Completadas', value: Number(f.completadas) },
      ],
      por_mes: porMesR.rows,
      vivienda: viviendaR.rows,
      experiencia: experienciaR.rows,
      mas_solicitados: massolicitadosR.rows,
      historial: historialR.rows,
    });
  } catch (e) {
    console.error('getAdopcionesReport error:', e);
    res.status(500).json({ error: 'Error al cargar datos de adopciones' });
  }
}

// ── ACOGIDAS ──────────────────────────────────────────────────────────

export async function getAcogidasReport(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [kpisR, topFamiliasR, duracionR, motivosR, rankingR] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(DISTINCT familia_id) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.estado='active') AS activas,
          (SELECT COUNT(*) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.iniciada_at BETWEEN $2 AND $3) AS iniciadas,
          (SELECT COUNT(*) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.estado='completed' AND fa.finalizada_at BETWEEN $2 AND $3) AS completadas,
          (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(fa.finalizada_at,NOW())-fa.iniciada_at))/86400)::int,0) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.estado IN ('active','completed') AND fa.iniciada_at BETWEEN $2 AND $3) AS dias_totales,
          (SELECT COUNT(*) FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.motivo_fin='adoptado_familia' AND fa.finalizada_at BETWEEN $2 AND $3) AS adoptados_familia
      `, [refugioId, from, to]),
      query(`
        SELECT ff.nombre, ff.karma_puntos,
          COUNT(fa.id) AS acogidas,
          COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(fa.finalizada_at,NOW())-fa.iniciada_at))/86400)::int,0) AS dias_total
        FROM foster_families ff
        JOIN foster_assignments fa ON fa.familia_id=ff.id
        JOIN animales a ON fa.animal_id=a.id
        WHERE a.refugio_id=$1 AND fa.iniciada_at BETWEEN $2 AND $3
        GROUP BY ff.id, ff.nombre, ff.karma_puntos
        ORDER BY dias_total DESC
        LIMIT 10
      `, [refugioId, from, to]),
      query(`
        SELECT
          CASE
            WHEN duracion < 15 THEN '0-15 días'
            WHEN duracion < 30 THEN '15-30 días'
            WHEN duracion < 60 THEN '30-60 días'
            WHEN duracion < 90 THEN '60-90 días'
            WHEN duracion < 180 THEN '90-180 días'
            ELSE '>180 días'
          END AS rango,
          COUNT(*) AS total
        FROM (
          SELECT EXTRACT(EPOCH FROM (COALESCE(finalizada_at,NOW())-iniciada_at))/86400 AS duracion
          FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id
          WHERE a.refugio_id=$1 AND fa.iniciada_at BETWEEN $2 AND $3
        ) sub
        GROUP BY rango
        ORDER BY MIN(duracion)
      `, [refugioId, from, to]),
      query(`
        SELECT COALESCE(motivo_fin,'en_curso') AS motivo, COUNT(*) AS total
        FROM foster_assignments fa JOIN animales a ON fa.animal_id=a.id
        WHERE a.refugio_id=$1 AND fa.iniciada_at BETWEEN $2 AND $3
        GROUP BY motivo_fin
      `, [refugioId, from, to]),
      query(`
        SELECT ff.id, ff.nombre, ff.karma_puntos, ff.estado,
          COUNT(fa.id) AS acogidas_total,
          COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(fa.finalizada_at,NOW())-fa.iniciada_at))/86400)::int,0) AS dias_total,
          COUNT(CASE WHEN fa.motivo_fin='adoptado_familia' THEN 1 END) AS adoptados,
          ROUND(AVG(fa.valoracion),1) AS valoracion_media,
          MAX(fa.iniciada_at) AS ultima_acogida
        FROM foster_families ff
        LEFT JOIN foster_assignments fa ON fa.familia_id=ff.id
        WHERE ff.refugio_id=$1
        GROUP BY ff.id, ff.nombre, ff.karma_puntos, ff.estado
        ORDER BY dias_total DESC
        LIMIT 20
      `, [refugioId]),
    ]);

    const k = kpisR.rows[0];
    const iniciadas = Number(k.iniciadas);
    const adoptados = Number(k.adoptados_familia);

    res.json({
      kpis: {
        activas: Number(k.activas),
        iniciadas,
        completadas: Number(k.completadas),
        dias_totales: Number(k.dias_totales),
        adoptados_familia: adoptados,
        pct_adopcion_familia: iniciadas > 0 ? Math.round((adoptados / iniciadas) * 100) : 0,
      },
      top_familias: topFamiliasR.rows,
      duracion: duracionR.rows,
      motivos: motivosR.rows,
      ranking: rankingR.rows,
    });
  } catch (e) {
    console.error('getAcogidasReport error:', e);
    res.status(500).json({ error: 'Error al cargar datos de acogidas' });
  }
}

// ── SOS ───────────────────────────────────────────────────────────────

export async function getSosReport(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [kpisR, porMesR, resolucionR, recientesR, zonaR] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3) AS creados,
          (SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND estado IN ('rescued','resolved') AND updated_at BETWEEN $2 AND $3) AS resueltos,
          (SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND estado='active' AND created_at BETWEEN $2 AND $3) AS activos,
          (SELECT COUNT(*) FROM sos_alerts WHERE refugio_id=$1 AND convertido_a_animal_id IS NOT NULL AND updated_at BETWEEN $2 AND $3) AS rescates,
          (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at-created_at))/3600))::int FROM sos_alerts WHERE refugio_id=$1 AND estado IN ('rescued','resolved') AND updated_at BETWEEN $2 AND $3) AS tiempo_medio_h
      `, [refugioId, from, to]),
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS mes_label,
          COALESCE(p.cnt,0) AS perdidos,
          COALESCE(av.cnt,0) AS avistados,
          COALESCE(r.cnt,0) AS resueltos
        FROM generate_series($2::date, $3::date, '1 month') AS m(mes)
        LEFT JOIN (SELECT DATE_TRUNC('month',created_at) d, COUNT(*) cnt FROM sos_alerts WHERE refugio_id=$1 AND tipo='lost' GROUP BY d) p ON p.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',created_at) d, COUNT(*) cnt FROM sos_alerts WHERE refugio_id=$1 AND tipo='found' GROUP BY d) av ON av.d=m.mes
        LEFT JOIN (SELECT DATE_TRUNC('month',updated_at) d, COUNT(*) cnt FROM sos_alerts WHERE refugio_id=$1 AND estado IN ('rescued','resolved') GROUP BY d) r ON r.d=m.mes
        ORDER BY m.mes
      `, [refugioId, from, to]),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon YY') AS mes_label,
          ROUND(AVG(EXTRACT(EPOCH FROM (updated_at-created_at))/3600))::int AS horas_medio
        FROM sos_alerts
        WHERE refugio_id=$1 AND estado IN ('rescued','resolved') AND updated_at BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('month', updated_at), mes_label
        ORDER BY DATE_TRUNC('month', updated_at)
      `, [refugioId, from, to]),
      query(`
        SELECT id, tipo, urgencia, estado, especie, raza, color, nombre_animal,
          ubicacion_descripcion, latitud, longitud, fotos,
          created_at, updated_at, codigo_referencia,
          CASE WHEN estado IN ('rescued','resolved') THEN
            ROUND(EXTRACT(EPOCH FROM (updated_at-created_at))/3600)::int
          END AS horas_resolucion
        FROM sos_alerts
        WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3
        ORDER BY created_at DESC LIMIT 20
      `, [refugioId, from, to]),
      query(`
        SELECT COALESCE(ubicacion_descripcion, 'Sin ubicación') AS zona, COUNT(*) AS total
        FROM sos_alerts
        WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3
        GROUP BY ubicacion_descripcion
        ORDER BY total DESC LIMIT 5
      `, [refugioId, from, to]),
    ]);

    const k = kpisR.rows[0];
    const creados = Number(k.creados);
    const resueltos = Number(k.resueltos);

    res.json({
      kpis: {
        creados,
        resueltos,
        activos: Number(k.activos),
        rescates: Number(k.rescates),
        tasa_resolucion: creados > 0 ? Math.round((resueltos / creados) * 100) : 0,
        tiempo_medio_h: k.tiempo_medio_h ?? 0,
      },
      por_mes: porMesR.rows,
      resolucion: resolucionR.rows,
      recientes: recientesR.rows,
      zonas: zonaR.rows,
    });
  } catch (e) {
    console.error('getSosReport error:', e);
    res.status(500).json({ error: 'Error al cargar datos SOS' });
  }
}

// ── FINANZAS ──────────────────────────────────────────────────────────

export async function getFinanzasReport(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [kpisR, byCategoryR, evolutionR, topAnimalesR] = await Promise.all([
      query(`
        SELECT
          (SELECT COALESCE(SUM(amount),0) FROM animal_expenses WHERE shelter_id=$1 AND expense_date BETWEEN $2 AND $3) AS total_expenses,
          (SELECT COALESCE(SUM(amount),0) FROM donations WHERE shelter_id=$1 AND status='confirmed' AND created_at BETWEEN $2 AND $3) AS total_income
      `, [refugioId, from, to]),
      query(`
        SELECT category, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
        FROM animal_expenses
        WHERE shelter_id=$1 AND expense_date BETWEEN $2 AND $3
        GROUP BY category
        ORDER BY total DESC
      `, [refugioId, from, to]),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS label,
          COALESCE(exp.total,0) AS expenses,
          COALESCE(inc.total,0) AS income
        FROM generate_series(DATE_TRUNC('month',$2::date), DATE_TRUNC('month',$3::date), '1 month') AS m(mes)
        LEFT JOIN (
          SELECT DATE_TRUNC('month', expense_date) AS mes, SUM(amount) AS total
          FROM animal_expenses WHERE shelter_id=$1 GROUP BY mes) exp ON exp.mes = m.mes
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS mes, SUM(amount) AS total
          FROM donations WHERE shelter_id=$1 AND status='confirmed' GROUP BY mes) inc ON inc.mes = m.mes
        ORDER BY m.mes
      `, [refugioId, from, to]),
      query(`
        SELECT a.id, a.nombre, a.especie, fp.url AS foto,
          COALESCE(e.total_gastos,0) AS total_gastos,
          COALESCE(d.total_ingresos,0) AS total_ingresos
        FROM animales a
        LEFT JOIN animal_fotos fp ON fp.animal_id=a.id AND fp.es_principal=true
        JOIN (
          SELECT animal_id, SUM(amount) AS total_gastos
          FROM animal_expenses
          WHERE shelter_id=$1 AND expense_date BETWEEN $2 AND $3 AND animal_id IS NOT NULL
          GROUP BY animal_id
        ) e ON e.animal_id = a.id
        LEFT JOIN (
          SELECT animal_id, SUM(amount) AS total_ingresos
          FROM donations
          WHERE shelter_id=$1 AND status='confirmed' AND created_at BETWEEN $2 AND $3 AND animal_id IS NOT NULL
          GROUP BY animal_id
        ) d ON d.animal_id = a.id
        WHERE a.refugio_id=$1
        ORDER BY e.total_gastos DESC
        LIMIT 10
      `, [refugioId, from, to]),
    ]);

    const totalExpenses = parseFloat(kpisR.rows[0].total_expenses);
    const totalIncome = parseFloat(kpisR.rows[0].total_income);

    res.json({
      kpis: {
        total_expenses: totalExpenses,
        total_income: totalIncome,
        balance: totalIncome - totalExpenses,
      },
      by_category: byCategoryR.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
      evolution: evolutionR.rows.map(r => ({ ...r, expenses: parseFloat(r.expenses), income: parseFloat(r.income) })),
      top_animales: topAnimalesR.rows.map(r => ({ ...r, total_gastos: parseFloat(r.total_gastos), total_ingresos: parseFloat(r.total_ingresos) })),
    });
  } catch (e) {
    console.error('getFinanzasReport error:', e);
    res.status(500).json({ error: 'Error al cargar datos financieros' });
  }
}

// ── EXPORT DATA (CSV) ─────────────────────────────────────────────────

export async function getExportData(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { from, to } = parsePeriod(req.query as Record<string, string>);

    const [animalesR, adopcionesR, acogidasR, sosR] = await Promise.all([
      query(`SELECT id,nombre,especie,raza,sexo,estado,created_at,fecha_entrada,ubicacion_texto,vacunado,esterilizado,microchip FROM animales WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at`, [refugioId, from, to]),
      query(`SELECT ae.id,a.nombre animal,ar.nombre adoptante,ar.email,ar.canal,ar.created_at solicitud,ae.completed_at FROM adoption_expedients ae JOIN adoption_requests ar ON ar.id=ae.request_id LEFT JOIN animales a ON ar.animal_id=a.id WHERE ae.refugio_id=$1 AND ae.completed_at BETWEEN $2 AND $3 ORDER BY ae.completed_at`, [refugioId, from, to]),
      query(`SELECT fa.id,ff.nombre familia,a.nombre animal,fa.iniciada_at,fa.finalizada_at,fa.estado,fa.motivo_fin,fa.valoracion FROM foster_assignments fa JOIN foster_families ff ON fa.familia_id=ff.id JOIN animales a ON fa.animal_id=a.id WHERE a.refugio_id=$1 AND fa.iniciada_at BETWEEN $2 AND $3 ORDER BY fa.iniciada_at`, [refugioId, from, to]),
      query(`SELECT id,tipo,urgencia,estado,especie,nombre_animal,ubicacion_descripcion,created_at,updated_at FROM sos_alerts WHERE refugio_id=$1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at`, [refugioId, from, to]),
    ]);

    res.json({
      animales: animalesR.rows,
      adopciones: adopcionesR.rows,
      acogidas: acogidasR.rows,
      sos: sosR.rows,
    });
  } catch (e) {
    console.error('getExportData error:', e);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
}

// ── AI SUMMARY ────────────────────────────────────────────────────────

export async function getAiSummary(req: AuthRequest, res: Response) {
  try {
    const { kpis, periodo, refugio_nombre } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Eres un analista de datos para protectoras de animales.
Genera un resumen ejecutivo breve y profesional (3-4 párrafos) en español para el informe de "${refugio_nombre}" del período "${periodo}".

Datos clave:
- Animales ingresados: ${kpis.ingresos}
- Adopciones completadas: ${kpis.adopciones}
- Tasa de adopción: ${kpis.tasa_adopcion}%
- Tiempo medio en refugio: ${kpis.tiempo_medio} días
- Familias de acogida activas: ${kpis.acogidas_activas}
- Avisos SOS resueltos: ${kpis.sos_resueltos}

El tono debe ser positivo pero realista. Menciona los puntos fuertes y áreas de mejora. Máximo 200 palabras.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = (message.content[0] as { type: string; text: string }).text;
    res.json({ summary });
  } catch (e) {
    console.error('getAiSummary error:', e);
    res.status(500).json({ error: 'Error al generar resumen IA' });
  }
}
