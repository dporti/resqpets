import React from 'react';
import {
  LineChart, Line, ResponsiveContainer,
} from 'recharts';

// ── COLORES ───────────────────────────────────────────────────────────
export const C = {
  green:  '#16a34a',
  blue:   '#3b82f6',
  orange: '#f97316',
  red:    '#ef4444',
  purple: '#8b5cf6',
  yellow: '#f59e0b',
  gray:   '#6b7280',
  teal:   '#0d9488',
};
export const PIE_COLORS = [C.green, C.blue, C.orange, C.red, C.purple, C.yellow, C.teal, C.gray];

// ── PERIOD ────────────────────────────────────────────────────────────
export interface Period {
  period: string;
  date_from?: string;
  date_to?: string;
  label: string;
}
export const PERIODS: Period[] = [
  { period: 'este_mes',     label: 'Este mes' },
  { period: 'mes_anterior', label: 'Mes anterior' },
  { period: '3_meses',      label: 'Últimos 3 meses' },
  { period: '6_meses',      label: 'Últimos 6 meses' },
  { period: 'anio',         label: 'Este año' },
  { period: 'custom',       label: 'Personalizado' },
];

export function periodToParams(p: Period): Record<string, string> {
  const q: Record<string, string> = { period: p.period };
  if (p.period === 'custom' && p.date_from && p.date_to) {
    q.date_from = p.date_from;
    q.date_to   = p.date_to;
  }
  return q;
}

// ── KPI CARD ─────────────────────────────────────────────────────────
interface KPIProps {
  label: string;
  value: string | number;
  prev?: number;
  unit?: string;
  sparkData?: number[];
  color?: string;
  icon?: string;
}
export function KPICard({ label, value, prev, unit, sparkData, color = C.green, icon }: KPIProps) {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  const trend = prev !== undefined && prev > 0
    ? Math.round(((numValue - prev) / prev) * 100) : null;
  const up = trend !== null && trend >= 0;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>
          {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}
        </p>
        {trend !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 12,
            background: up ? '#f0fdf4' : '#fef2f2',
            color: up ? C.green : C.red,
          }}>
            {up ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' }}>
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>{unit}</span>}
      </p>
      {sparkData && sparkData.length > 1 && (
        <div style={{ height: 32, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── CHART EMPTY ───────────────────────────────────────────────────────
export function ChartEmpty({ text = 'Sin datos para este período' }: { text?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 200, color: '#9ca3af', gap: 8,
    }}>
      <span style={{ fontSize: 40 }}>📊</span>
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

// ── CHART CARD ────────────────────────────────────────────────────────
export function ChartCard({ title, children, minHeight = 260 }: { title: string; children: React.ReactNode; minHeight?: number }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: '20px 24px', minHeight,
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#374151' }}>{title}</h3>
      {children}
    </div>
  );
}

// ── ACTIVITY HEATMAP (GitHub-style) ──────────────────────────────────
interface HeatmapDay { fecha: string; cnt: number }
export function ActivityHeatmap({ data }: { data: HeatmapDay[] }) {
  const map = new Map(data.map(d => [d.fecha, Number(d.cnt)]));
  const max = Math.max(...Array.from(map.values()), 1);

  // Build 52 weeks × 7 days grid, starting from last Sunday
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Date[][] = [];
  let cur = new Date(startDate);
  while (cur <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const getColor = (cnt: number) => {
    if (!cnt) return '#f3f4f6';
    const intensity = cnt / max;
    if (intensity < 0.25) return '#bbf7d0';
    if (intensity < 0.5)  return '#4ade80';
    if (intensity < 0.75) return '#16a34a';
    return '#064e3b';
  };

  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const DAYS = ['D','L','M','X','J','V','S'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 20 }}>
          {DAYS.map(d => <span key={d} style={{ fontSize: 9, color: '#9ca3af', height: 12, lineHeight: '12px' }}>{d}</span>)}
        </div>
        {/* Grid */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
            {/* Month labels */}
            <div style={{ display: 'flex', gap: 2 }}>
              {weeks.map((week, wi) => {
                const firstDayOfMonth = week[0].getDate() <= 7;
                return (
                  <div key={wi} style={{ width: 12, fontSize: 9, color: '#9ca3af', overflow: 'visible', whiteSpace: 'nowrap' }}>
                    {firstDayOfMonth ? MONTHS[week[0].getMonth()] : ''}
                  </div>
                );
              })}
            </div>
            {/* Days 0-6 */}
            {Array.from({ length: 7 }, (_, dayOfWeek) => (
              <div key={dayOfWeek} style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, wi) => {
                  const date = week[dayOfWeek];
                  if (!date) return <div key={wi} style={{ width: 12, height: 12 }} />;
                  const dateStr = date.toISOString().slice(0, 10);
                  const cnt = map.get(dateStr) || 0;
                  return (
                    <div key={wi} title={`${dateStr}: ${cnt} evento${cnt !== 1 ? 's' : ''}`}
                      style={{
                        width: 12, height: 12, borderRadius: 2,
                        background: getColor(cnt),
                        cursor: 'default',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 8, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Menos</span>
        {['#f3f4f6','#bbf7d0','#4ade80','#16a34a','#064e3b'].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Más</span>
      </div>
    </div>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────
export function Skeleton({ height = 200, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div style={{
      height, width,
      background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: 8,
    }} />
  );
}

// ── TABLE ─────────────────────────────────────────────────────────────
export const tbStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 13,
};
export const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 600,
  color: '#6b7280', borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb', fontSize: 12, whiteSpace: 'nowrap',
};
export const tdStyle: React.CSSProperties = {
  padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#374151',
};

// ── FUNNEL ────────────────────────────────────────────────────────────
export function FunnelChart({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1].value : null;
        const conv = prev && prev > 0 ? Math.round((d.value / prev) * 100) : null;
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 13 }}>
              <span style={{ color: '#374151' }}>{d.name}</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>
                {d.value.toLocaleString('es-ES')}
                {conv !== null && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>({conv}%)</span>}
              </span>
            </div>
            <div style={{ height: 28, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `hsl(${140 - i * 18}, 70%, ${45 + i * 3}%)`,
                borderRadius: 6, transition: 'width .6s',
                display: 'flex', alignItems: 'center', paddingLeft: 8,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TOOLTIP CUSTOM ────────────────────────────────────────────────────
export function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)',
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#111827', fontSize: 13 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: '0 0 2px', fontSize: 12, color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}
