import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import canvasConfetti from 'canvas-confetti';
import { api } from '../../api/client';
import { ErrorState } from '../../components/ui';

interface Summary {
  this_month: { total: number; count: string; unique_donors: string };
  prev_month: { total: number; count: string };
  historical: { total: number; count: string };
  evolution: { label: string; amount: number; count: string }[];
  by_channel: { channel: string; total: number; count: string }[];
  by_type: { type: string; total: number; count: string }[];
  top_donors: { name: string; total: string }[];
  latest: { id: number; amount: number; donor_name?: string; channel: string; created_at: string; campaign_name?: string }[];
  goal: number;
}

const CHANNEL_LABEL: Record<string, string> = { transfer: 'Transferencia', cash: 'Efectivo', bizum: 'Bizum', stripe: 'Online', other: 'Otro' };
const TYPE_LABEL: Record<string, string> = { one_time: 'Única', recurring: 'Recurrente' };
const PIE_COLORS = ['#16a34a','#3b82f6','#f97316','#8b5cf6','#6b7280'];

function pct(v: number, g: number) { return g > 0 ? Math.min(100, Math.round((v / g) * 100)) : 0; }
function fmt(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
function relTime(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `Hace ${m}m`;
  if (m < 1440) return `Hace ${Math.floor(m/60)}h`;
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function ResumenTab() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get<Summary>('/donations/summary').then(d => {
      setData(d);
      setLoading(false);
      if (d.goal > 0 && d.this_month.total >= d.goal) {
        canvasConfetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }).catch(e => { console.error(e); setError(true); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadSkel />;
  if (error || !data) return <ErrorState onRetry={load} />;

  const p = pct(data.this_month.total, data.goal);
  const prevTotal = data.prev_month.total;
  const trend = prevTotal > 0 ? Math.round(((data.this_month.total - prevTotal) / prevTotal) * 100) : null;
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <KPICard
          label="Recaudación este mes" value={fmt(data.this_month.total)}
          sub={`${fmt(data.prev_month.total)} el mes anterior`}
          trend={trend} color="#16a34a"
          progress={data.goal > 0 ? { current: data.this_month.total, goal: data.goal } : undefined}
        />
        <KPICard
          label="Donaciones este mes" value={data.this_month.count}
          sub={`Media: ${data.this_month.count ? fmt(data.this_month.total / parseInt(data.this_month.count)) : '—'}`}
          color="#3b82f6"
        />
        <KPICard
          label="Donantes únicos" value={data.this_month.unique_donors}
          sub="Este mes" color="#8b5cf6"
        />
        <KPICard
          label="Recaudación histórica" value={fmt(data.historical.total)}
          sub={`${data.historical.count} donaciones en total`}
          color="#f97316"
        />
      </div>

      {/* Objetivo mensual */}
      {data.goal > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Objetivo de este mes</h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                {fmt(data.this_month.total)} de {fmt(data.goal)} · {daysLeft} días restantes
              </p>
            </div>
            <span style={{
              fontSize: 20, fontWeight: 800,
              color: p < 30 ? '#ef4444' : p < 70 ? '#f59e0b' : '#16a34a',
            }}>{p}%</span>
          </div>
          <div style={{ height: 16, background: 'var(--bg-subtle-2)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${p}%`, height: '100%', borderRadius: 8, transition: 'width .8s',
              background: p < 30 ? 'linear-gradient(90deg,#ef4444,#f87171)'
                : p < 70 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
                : 'linear-gradient(90deg,#16a34a,#4ade80)',
            }} />
          </div>
          {p < 100 && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Faltan <strong>{fmt(data.goal - data.this_month.total)}</strong> para alcanzar el objetivo
            </p>
          )}
          {p >= 100 && (
            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>🎉 ¡Objetivo superado!</p>
          )}
        </div>
      )}

      {/* Evolución 12 meses */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>Evolución mensual (12 meses)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.evolution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" fontSize={11} tick={{ fill: '#9ca3af' }} />
            <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={50} tickFormatter={v => `${v}€`} />
            <Tooltip formatter={(v: unknown) => [fmt(v as number), 'Recaudado']} />
            <Bar dataKey="amount" name="amount" fill="#3b82f6" radius={[4,4,0,0]} />
            {data.goal > 0 && (
              <Line data={data.evolution.map(() => ({ amount: data.goal }))} type="monotone" dataKey="amount" stroke="#f97316" strokeDasharray="5 5" dot={false} name="Objetivo" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Por canal (este año)</h3>
          {data.by_channel.length === 0 ? <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.by_channel} dataKey="total" nameKey="channel" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                  {data.by_channel.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), CHANNEL_LABEL[n as string] || (n as string)]} />
                <Legend formatter={(n: unknown) => CHANNEL_LABEL[n as string] || (n as string)} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Por tipo (este año)</h3>
          {data.by_type.length === 0 ? <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.by_type} dataKey="total" nameKey="type" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                  {data.by_type.map((_: unknown, i: number) => <Cell key={i} fill={['#16a34a','#3b82f6'][i] || '#6b7280'} />)}
                </Pie>
                <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), TYPE_LABEL[n as string] || (n as string)]} />
                <Legend formatter={(n: unknown) => TYPE_LABEL[n as string] || (n as string)} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Últimas + Top donantes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Últimas donaciones</h3>
          {data.latest.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                  {(d.donor_name || 'A')[0]}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.donor_name || 'Anónimo'}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-faint)' }}>{relTime(d.created_at)} · {CHANNEL_LABEL[d.channel] || d.channel}</p>
                </div>
              </div>
              <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 15 }}>{fmt(d.amount)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Top donantes este mes</h3>
          {data.top_donors.length === 0 ? <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin donantes este mes</p> : data.top_donors.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: i === 0 ? 22 : 16, width: 28, textAlign: 'center' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.name || 'Anónimo'}</p>
              </div>
              <span style={{ fontWeight: 800, color: '#16a34a' }}>{fmt(parseFloat(d.total))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, trend, color, progress }: {
  label: string; value: string | number; sub?: string; trend?: number | null;
  color?: string; progress?: { current: number; goal: number };
}) {
  const p = progress ? pct(progress.current, progress.goal) : null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</p>
        {trend !== null && trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 12, background: trend >= 0 ? '#f0fdf4' : '#fef2f2', color: trend >= 0 ? '#16a34a' : '#ef4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)' }}>{sub}</p>}
      {p !== null && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 5, background: 'var(--bg-subtle-2)', borderRadius: 3 }}>
            <div style={{ width: `${p}%`, height: '100%', background: color || '#16a34a', borderRadius: 3, transition: 'width .5s' }} />
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-faint)' }}>{p}% del objetivo</p>
        </div>
      )}
    </div>
  );
}

function LoadSkel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {Array.from({length:4}).map((_,i)=><div key={i} style={{height:100,borderRadius:14,...sk}}/>)}
      </div>
      <div style={{height:260,borderRadius:14,...sk}}/>
    </div>
  );
}
const sk = { background:'linear-gradient(90deg,var(--bg-subtle-2) 25%,var(--bg-subtle-2) 50%,var(--bg-subtle-2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' };
