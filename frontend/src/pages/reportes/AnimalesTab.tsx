import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, Skeleton, C, PIE_COLORS, CustomTooltip, tbStyle, thStyle, tdStyle } from './shared';
import { ErrorState } from '../../components/ui';

interface AnimalesData {
  kpis: { total: number; media_semana: number; tiempo_medio: number; necesidades_especiales: number; fallecidos: number };
  ingresos_salidas: { mes_label: string; ingresos: number; adopciones: number; otras_salidas: number }[];
  procedencia: { procedencia: string; total: number }[];
  estancia_especie: { especie: string; dias_medio: number }[];
  top_antiguos: { id: number; nombre: string; especie: string; raza: string; estado: string; dias_refugio: number; foto: string }[];
}

const ESTADO_COLOR: Record<string, string> = {
  en_acogida: '#f97316', en_residencia: '#6b7280', en_adopcion: '#16a34a',
  en_proceso: '#3b82f6', en_evaluacion: '#8b5cf6',
};
const ESPECIE_EMOJI: Record<string, string> = { perro: '🐕', gato: '🐈', otro: '🐾' };

export function AnimalesTab({ period }: { period: Period }) {
  const [data, setData] = useState<AnimalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<AnimalesData>(`/reportes/animales?${qs}`).then(d => { setData(d); setLoading(false); }).catch(e => { console.error(e); setError(true); setLoading(false); });
  }, [period.period, period.date_from, period.date_to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skels />;
  if (error || !data) return <ErrorState onRetry={load} />;

  const { kpis } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard label="Animales gestionados" value={kpis.total} icon="🐾" />
        <KPICard label="Media ingresos/semana" value={kpis.media_semana} icon="📅" color={C.blue} />
        <KPICard label="Tiempo medio estancia" value={kpis.tiempo_medio} unit="días" icon="⏱" color={C.orange} />
        <KPICard label="Necesidades especiales" value={kpis.necesidades_especiales} icon="💊" color={C.purple} />
        <KPICard label="Fallecidos en el período" value={kpis.fallecidos} icon="🕊️" color={C.gray} />
      </div>

      {/* Ingresos vs salidas */}
      <ChartCard title="Ingresos vs. salidas por mes">
        {data.ingresos_salidas.length === 0 ? <ChartEmpty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ingresos_salidas} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes_label" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill={C.blue} radius={[4,4,0,0]} />
              <Bar dataKey="adopciones" name="Adopciones" fill={C.green} radius={[4,4,0,0]} />
              <Bar dataKey="otras_salidas" name="Otras salidas" fill={C.gray} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Procedencia + Estancia por especie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Procedencia de ingresos">
          {data.procedencia.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.procedencia} dataKey="total" nameKey="procedencia"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.procedencia.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estancia media por especie (días)">
          {data.estancia_especie.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.estancia_especie} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="especie" fontSize={11} tick={{ fill: '#9ca3af' }}
                  tickFormatter={v => `${ESPECIE_EMOJI[v] || ''} ${v}`} />
                <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={35} />
                <Tooltip formatter={(v) => [`${v} días`, 'Estancia media']} />
                <Bar dataKey="dias_medio" name="Días medio" radius={[6,6,0,0]}>
                  {data.estancia_especie.map((_, i) => <Cell key={i} fill={[C.blue, C.orange, C.purple][i] || C.gray} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top 10 más tiempo */}
      <ChartCard title="Animales con más tiempo en el refugio (activos)">
        {data.top_antiguos.length === 0 ? <ChartEmpty /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tbStyle}>
              <thead>
                <tr>
                  {['Animal', 'Especie / Raza', 'Días en refugio', 'Estado', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.top_antiguos.map(a => {
                  const dias = Math.round(Number(a.dias_refugio));
                  return (
                    <tr key={a.id}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, background: 'var(--bg-subtle-2)',
                            overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {a.foto
                              ? <img src={a.foto} alt={a.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span>{ESPECIE_EMOJI[a.especie] || '🐾'}</span>}
                          </div>
                          <span style={{ fontWeight: 600 }}>{a.nombre}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{[ESPECIE_EMOJI[a.especie], a.raza].filter(Boolean).join(' ')}</td>
                      <td style={tdStyle}>
                        <span style={{
                          fontWeight: 700,
                          color: dias > 180 ? C.red : dias > 90 ? C.orange : C.green,
                        }}>
                          {dias} días {dias > 180 ? '🔴' : dias > 90 ? '🟡' : '🟢'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: (ESTADO_COLOR[a.estado] || C.gray) + '20',
                          color: ESTADO_COLOR[a.estado] || C.gray,
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        }}>
                          {a.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button style={{
                          background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                          padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: C.green, fontWeight: 500,
                        }}>
                          Ver ficha →
                        </button>
                      </td>
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
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={90} />)}
      </div>
      <Skeleton height={270} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton height={240} /><Skeleton height={240} />
      </div>
      <Skeleton height={300} />
    </div>
  );
}
