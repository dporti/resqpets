import { useEffect, useState, useCallback } from 'react';
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, Skeleton, C, PIE_COLORS, tbStyle, thStyle, tdStyle } from './shared';
import { ErrorState } from '../../components/ui';

interface FinanzasData {
  kpis: { total_expenses: number; total_income: number; balance: number };
  by_category: { category: string; total: number; count: string }[];
  evolution: { label: string; expenses: number; income: number }[];
  top_animales: { id: number; nombre: string; especie: string; foto: string; total_gastos: number; total_ingresos: number }[];
}

const CATEGORY_LABEL: Record<string, string> = {
  veterinario: 'Veterinario', alimentacion: 'Alimentación', medicacion: 'Medicación',
  alojamiento: 'Alojamiento', transporte: 'Transporte', esterilizacion: 'Esterilización', otros: 'Otros',
};
const ESPECIE_EMOJI: Record<string, string> = { perro: '🐕', gato: '🐈', otro: '🐾' };

function fmt(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }

export function FinanzasTab({ period }: { period: Period }) {
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<FinanzasData>(`/reportes/finanzas?${qs}`).then(d => { setData(d); setLoading(false); }).catch(e => { console.error(e); setError(true); setLoading(false); });
  }, [period.period, period.date_from, period.date_to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skels />;
  if (error || !data) return <ErrorState onRetry={load} />;

  const { kpis } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard label="Gastos del período" value={fmt(kpis.total_expenses)} icon="💸" color={C.red} />
        <KPICard label="Ingresos del período" value={fmt(kpis.total_income)} icon="💚" color={C.green} />
        <KPICard label="Balance" value={fmt(kpis.balance)} icon="⚖️" color={kpis.balance >= 0 ? C.green : C.red} />
      </div>

      {/* Evolución */}
      <ChartCard title="Gastos vs. ingresos por mes">
        {data.evolution.length === 0 ? <ChartEmpty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.evolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={50} tickFormatter={v => `${v}€`} />
              <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), n === 'expenses' ? 'Gastos' : 'Ingresos']} />
              <Legend formatter={(n: unknown) => n === 'expenses' ? 'Gastos' : 'Ingresos'} iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expenses" name="expenses" fill={C.red} radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="income" name="income" stroke={C.green} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Por categoría */}
      <ChartCard title="Gastos por categoría">
        {data.by_category.length === 0 ? <ChartEmpty /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), CATEGORY_LABEL[n as string] || (n as string)]} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              {data.by_category.map((c, i) => (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#4b5563' }}>{CATEGORY_LABEL[c.category] || c.category}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      {/* Coste por animal */}
      <ChartCard title="Coste por animal (top 10 del período)">
        {data.top_animales.length === 0 ? <ChartEmpty /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tbStyle}>
              <thead>
                <tr>
                  {['Animal', 'Gastos', 'Donaciones recibidas', 'Balance'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.top_animales.map(a => {
                  const balance = a.total_ingresos - a.total_gastos;
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
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: C.red }}>{fmt(a.total_gastos)}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: C.green }}>{fmt(a.total_ingresos)}</span></td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: balance >= 0 ? C.green : C.red }}>{fmt(balance)}</span>
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
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={90} />)}
      </div>
      <Skeleton height={270} />
      <Skeleton height={240} />
      <Skeleton height={300} />
    </div>
  );
}
