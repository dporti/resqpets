import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, FunnelChart, Skeleton, C, PIE_COLORS, CustomTooltip, tbStyle, thStyle, tdStyle } from './shared';
import { ErrorState } from '../../components/ui';

interface AdopcionesData {
  kpis: { solicitudes: number; completadas: number; rechazadas: number; tiempo_proceso: number; tasa_conversion: number };
  funnel: { name: string; value: number }[];
  por_mes: { mes_label: string; completadas: number }[];
  vivienda: { tipo: string; total: number }[];
  experiencia: { tipo: string; total: number }[];
  mas_solicitados: { id: number; nombre: string; especie: string; foto: string; solicitudes: number }[];
  historial: { id: number; animal: string; foto: string; adoptante: string; canal: string; fecha_solicitud: string; completed_at: string; dias_proceso: number; puntuacion: number }[];
}

const VIVIENDA_LABEL: Record<string, string> = {
  piso: 'Piso', casa_sin_jardin: 'Casa s/ jardín',
  casa_con_jardin: 'Casa c/ jardín', finca: 'Finca',
};
const CANAL_COLOR: Record<string, string> = { web: C.green, manual: C.blue, telefono: C.orange };
const ESPECIE_EMOJI: Record<string, string> = { perro: '🐕', gato: '🐈', otro: '🐾' };

export function AdopcionesTab({ period }: { period: Period }) {
  const [data, setData] = useState<AdopcionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<AdopcionesData>(`/reportes/adopciones?${qs}`).then(d => { setData(d); setLoading(false); }).catch(e => { console.error(e); setError(true); setLoading(false); });
  }, [period.period, period.date_from, period.date_to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skels />;
  if (error || !data) return <ErrorState onRetry={load} />;

  const { kpis } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard label="Solicitudes recibidas" value={kpis.solicitudes} icon="📝" color={C.blue} />
        <KPICard label="Adopciones completadas" value={kpis.completadas} icon="🏠" color={C.green} />
        <KPICard label="Tasa de conversión" value={kpis.tasa_conversion} unit="%" icon="📈" color={C.teal} />
        <KPICard label="Tiempo medio proceso" value={kpis.tiempo_proceso} unit="días" icon="⏱" color={C.orange} />
        <KPICard label="Solicitudes rechazadas" value={kpis.rechazadas} icon="❌" color={C.red} />
      </div>

      {/* Funnel + por mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Embudo de adopción">
          {data.funnel[0]?.value === 0 ? <ChartEmpty /> : <FunnelChart data={data.funnel} />}
        </ChartCard>

        <ChartCard title="Adopciones completadas por mes">
          {data.por_mes.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.por_mes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes_label" fontSize={11} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completadas" name="Adopciones" fill={C.green} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Perfil adoptante */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Tipo de vivienda">
          {data.vivienda.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.vivienda} dataKey="total" nameKey="tipo" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.vivienda.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, VIVIENDA_LABEL[String(n)] || String(n)]} />
                <Legend formatter={n => VIVIENDA_LABEL[String(n)] || String(n)} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Experiencia previa con animales">
          {data.experiencia.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.experiencia} dataKey="total" nameKey="tipo" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {data.experiencia.map((_, i) => <Cell key={i} fill={[C.green, C.blue][i] || C.gray} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Más solicitados */}
      {data.mas_solicitados.length > 0 && (
        <ChartCard title="Animales más solicitados">
          <ResponsiveContainer width="100%" height={Math.max(160, data.mas_solicitados.length * 38)}>
            <BarChart data={data.mas_solicitados} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="nombre" fontSize={11} tick={{ fill: '#374151' }} width={90} />
              <Tooltip formatter={(v) => [v, 'Solicitudes']} />
              <Bar dataKey="solicitudes" name="Solicitudes" fill={C.green} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Historial */}
      <ChartCard title="Historial de adopciones del período" minHeight={0}>
        {data.historial.length === 0 ? <ChartEmpty text="Sin adopciones en este período" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tbStyle}>
              <thead>
                <tr>
                  {['Animal', 'Adoptante', 'Canal', 'F. Solicitud', 'F. Adopción', 'Días proceso', 'Score'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.historial.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle-2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {r.foto ? <img src={r.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14 }}>🐾</span>}
                        </div>
                        <span style={{ fontWeight: 600 }}>{r.animal || '—'}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{r.adoptante}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: (CANAL_COLOR[r.canal] || C.gray) + '20',
                        color: CANAL_COLOR[r.canal] || C.gray,
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      }}>
                        {r.canal || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{r.fecha_solicitud ? new Date(r.fecha_solicitud).toLocaleDateString('es-ES') : '—'}</td>
                    <td style={tdStyle}>{r.completed_at ? new Date(r.completed_at).toLocaleDateString('es-ES') : '—'}</td>
                    <td style={tdStyle}>{r.dias_proceso ? `${Math.round(r.dias_proceso)} días` : '—'}</td>
                    <td style={tdStyle}>
                      {r.puntuacion
                        ? <span style={{ fontWeight: 700, color: r.puntuacion >= 70 ? C.green : r.puntuacion >= 40 ? C.orange : C.red }}>
                          {r.puntuacion}%
                        </span>
                        : '—'}
                    </td>
                  </tr>
                ))}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton height={260} /><Skeleton height={260} />
      </div>
      <Skeleton height={320} />
    </div>
  );
}
