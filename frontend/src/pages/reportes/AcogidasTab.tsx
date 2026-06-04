import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, Skeleton, C, PIE_COLORS, tbStyle, thStyle, tdStyle } from './shared';

interface AcogidasData {
  kpis: { activas: number; iniciadas: number; completadas: number; dias_totales: number; adoptados_familia: number; pct_adopcion_familia: number };
  top_familias: { nombre: string; karma_puntos: number; acogidas: number; dias_total: number }[];
  duracion: { rango: string; total: number }[];
  motivos: { motivo: string; total: number }[];
  ranking: { id: number; nombre: string; karma_puntos: number; estado: string; acogidas_total: number; dias_total: number; adoptados: number; valoracion_media: number; ultima_acogida: string }[];
}

const MOTIVO_LABEL: Record<string, string> = {
  adoptado_familia: 'Adoptado por la familia',
  adoptado_otra: 'Adoptado por otra familia',
  devuelto_protectora: 'Devuelto a la protectora',
  trasladado: 'Trasladado a otra acogida',
  fallecido: 'Fallecido',
  en_curso: 'En curso',
};

function karmaLevel(pts: number) {
  if (pts >= 1000) return { label: 'Diamante', color: '#06b6d4' };
  if (pts >= 600)  return { label: 'Platino',  color: '#8b5cf6' };
  if (pts >= 300)  return { label: 'Oro',      color: '#f59e0b' };
  if (pts >= 100)  return { label: 'Plata',    color: '#9ca3af' };
  return { label: 'Bronce', color: '#92400e' };
}

export function AcogidasTab({ period }: { period: Period }) {
  const [data, setData] = useState<AcogidasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<AcogidasData>(`/reportes/acogidas?${qs}`).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [period.period, period.date_from, period.date_to]);

  if (loading) return <Skels />;
  if (!data) return <ChartEmpty text="Error al cargar datos" />;

  const { kpis } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard label="Familias activas ahora" value={kpis.activas} icon="👨‍👩‍👧" color={C.green} />
        <KPICard label="Acogidas iniciadas" value={kpis.iniciadas} icon="🏠" color={C.blue} />
        <KPICard label="Acogidas completadas" value={kpis.completadas} icon="✅" color={C.teal} />
        <KPICard label="Días totales acogida" value={kpis.dias_totales} icon="📅" color={C.orange} />
        <KPICard label="Adoptados desde acogida" value={kpis.adoptados_familia} icon="❤️" color={C.purple} />
        <KPICard label="% termina en adopción" value={kpis.pct_adopcion_familia} unit="%" icon="🎯" color={C.red} />
      </div>

      {/* Top familias + histograma duración */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Top familias por días de acogida">
          {data.top_familias.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={Math.max(160, data.top_familias.length * 36)}>
              <BarChart data={data.top_familias} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" fontSize={11} tick={{ fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="nombre" fontSize={11} tick={{ fill: '#374151' }} width={100} />
                <Tooltip formatter={(v) => [v, 'Días de acogida']} />
                <Bar dataKey="dias_total" name="Días totales" radius={[0,6,6,0]}>
                  {data.top_familias.map(f => {
                    const lv = karmaLevel(f.karma_puntos);
                    return <Cell key={f.nombre} fill={lv.color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Duración de las acogidas">
          {data.duracion.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.duracion} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="rango" fontSize={10} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={28} />
                <Tooltip formatter={(v) => [v, 'Acogidas']} />
                <Bar dataKey="total" name="Acogidas" fill={C.blue} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Motivos finalización */}
      <ChartCard title="Motivos de finalización de acogidas">
        {data.motivos.length === 0 ? <ChartEmpty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.motivos} dataKey="total" nameKey="motivo"
                cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {data.motivos.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, MOTIVO_LABEL[String(n)] || String(n)]} />
              <Legend formatter={n => MOTIVO_LABEL[String(n)] || String(n)} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Ranking familias */}
      <ChartCard title="Ranking de familias de acogida" minHeight={0}>
        {data.ranking.length === 0 ? <ChartEmpty text="No hay familias registradas" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tbStyle}>
              <thead>
                <tr>
                  {['#', 'Familia', 'Nivel', 'Acogidas', 'Días totales', 'Adoptados', 'Valoración', 'Última acogida'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((f, i) => {
                  const lv = karmaLevel(f.karma_puntos);
                  return (
                    <tr key={f.id}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#9ca3af' }}>#{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{f.nombre}</td>
                      <td style={tdStyle}>
                        <span style={{ color: lv.color, fontWeight: 700, fontSize: 12 }}>
                          {lv.label} ({f.karma_puntos} pts)
                        </span>
                      </td>
                      <td style={tdStyle}>{f.acogidas_total}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{f.dias_total} días</td>
                      <td style={tdStyle}>{f.adoptados}</td>
                      <td style={tdStyle}>
                        {f.valoracion_media
                          ? <span>{'⭐'.repeat(Math.round(f.valoracion_media))} ({f.valoracion_media})</span>
                          : '—'}
                      </td>
                      <td style={tdStyle}>{f.ultima_acogida ? new Date(f.ultima_acogida).toLocaleDateString('es-ES') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function Skels() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={90} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton height={240} /><Skeleton height={240} />
      </div>
      <Skeleton height={360} />
    </div>
  );
}
