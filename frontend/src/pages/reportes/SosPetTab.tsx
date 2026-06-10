import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, Skeleton, C, CustomTooltip, tbStyle, thStyle, tdStyle } from './shared';
import { ErrorState } from '../../components/ui';

interface SosData {
  kpis: { creados: number; resueltos: number; activos: number; rescates: number; tasa_resolucion: number; tiempo_medio_h: number };
  por_mes: { mes_label: string; perdidos: number; avistados: number; resueltos: number }[];
  resolucion: { mes_label: string; horas_medio: number }[];
  recientes: {
    id: number; tipo: string; urgencia: string; estado: string; especie: string;
    nombre_animal: string; ubicacion_descripcion: string;
    fotos: string[]; created_at: string; horas_resolucion: number; codigo_referencia: string;
  }[];
  zonas: { zona: string; total: number }[];
}

const TIPO_COLOR: Record<string, string> = { lost: C.red, found: C.blue };
const ESTADO_COLOR: Record<string, string> = { active: C.orange, rescued: C.green, resolved: C.teal, false_alarm: C.gray };
const URGENCIA_COLOR: Record<string, string> = { high: C.red, medium: C.orange, low: C.green };

export function SosPetTab({ period }: { period: Period }) {
  const [data, setData] = useState<SosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<SosData>(`/reportes/sos?${qs}`).then(d => { setData(d); setLoading(false); }).catch(e => { console.error(e); setError(true); setLoading(false); });
  }, [period.period, period.date_from, period.date_to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skels />;
  if (error || !data) return <ErrorState onRetry={load} />;

  const { kpis } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard label="Avisos creados" value={kpis.creados} icon="🚨" color={C.orange} />
        <KPICard label="Avisos resueltos" value={kpis.resueltos} icon="✅" color={C.green} />
        <KPICard label="Tasa de resolución" value={kpis.tasa_resolucion} unit="%" icon="📈" color={C.teal} />
        <KPICard label="Tiempo medio resolución" value={kpis.tiempo_medio_h} unit="h" icon="⏱" color={C.blue} />
        <KPICard label="Convertidos en rescate" value={kpis.rescates} icon="🐾" color={C.purple} />
        <KPICard label="Activos ahora" value={kpis.activos} icon="🔴" color={C.red} />
      </div>

      {/* Avisos por tipo/mes */}
      <ChartCard title="Avisos por tipo y mes">
        {data.por_mes.length === 0 ? <ChartEmpty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.por_mes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes_label" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="perdidos"  name="Perdidos"  fill={C.red}   radius={[4,4,0,0]} />
              <Bar dataKey="avistados" name="Avistados" fill={C.blue}  radius={[4,4,0,0]} />
              <Bar dataKey="resueltos" name="Resueltos" fill={C.green} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Tiempo resolución + Zonas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Tiempo medio de resolución (horas)">
          {data.resolucion.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.resolucion} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes_label" fontSize={11} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={48} stroke={C.red} strokeDasharray="4 4"
                  label={{ value: 'Objetivo 48h', position: 'right', fontSize: 10, fill: C.red }} />
                <Line type="monotone" dataKey="horas_medio" name="Horas medio" stroke={C.orange} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Zonas con más avisos">
          {data.zonas.length === 0 ? <ChartEmpty /> : (
            <div style={{ paddingTop: 10 }}>
              {data.zonas.map((z, i) => {
                const max = data.zonas[0].total;
                const pct = Math.round((z.total / max) * 100);
                return (
                  <div key={z.zona} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>#{i+1} {z.zona}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{z.total}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-subtle-2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: C.red, borderRadius: 4, transition: 'width .5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Tabla avisos recientes */}
      <ChartCard title="Últimos 20 avisos del período" minHeight={0}>
        {data.recientes.length === 0 ? <ChartEmpty text="Sin avisos en este período" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tbStyle}>
              <thead>
                <tr>
                  {['Aviso', 'Tipo', 'Urgencia', 'Estado', 'Especie', 'Ubicación', 'Creado', 'Resolución'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recientes.map(s => {
                  const hace = Math.floor((Date.now() - new Date(s.created_at).getTime()) / 3600000);
                  return (
                    <tr key={s.id}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-subtle-2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.fotos?.[0] ? <img src={s.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🐾</span>}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{s.nombre_animal || s.especie || '—'}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: TIPO_COLOR[s.tipo] || C.gray, fontWeight: 700, fontSize: 12 }}>
                          {s.tipo === 'lost' ? '🔴 Perdido' : '🔵 Avistado'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: URGENCIA_COLOR[s.urgencia] || C.gray, fontSize: 12, fontWeight: 600 }}>
                          {s.urgencia === 'high' ? '🔥 Alta' : s.urgencia === 'medium' ? '⚡ Media' : '✅ Baja'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: (ESTADO_COLOR[s.estado] || C.gray) + '20', color: ESTADO_COLOR[s.estado] || C.gray, padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>
                          {s.estado}
                        </span>
                      </td>
                      <td style={tdStyle}>{s.especie || '—'}</td>
                      <td style={{ ...tdStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ubicacion_descripcion || '—'}</td>
                      <td style={tdStyle}>{hace < 24 ? `Hace ${hace}h` : `Hace ${Math.floor(hace/24)}d`}</td>
                      <td style={tdStyle}>{s.horas_resolucion ? `${s.horas_resolucion}h` : '—'}</td>
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
      <Skeleton height={270} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton height={240} /><Skeleton height={240} />
      </div>
      <Skeleton height={320} />
    </div>
  );
}
