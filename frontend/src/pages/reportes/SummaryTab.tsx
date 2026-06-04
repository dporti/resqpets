import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';
import { Period, periodToParams, KPICard, ChartCard, ChartEmpty, ActivityHeatmap, Skeleton, C, PIE_COLORS, CustomTooltip } from './shared';

interface SummaryData {
  kpis: Record<string, number>;
  estados: { estado: string; total: number }[];
  especies: { especie: string; total: number }[];
  monthly: { mes_label: string; ingresos: number; adopciones: number; acogidas: number; sos: number }[];
  daily_heatmap: { fecha: string; cnt: number }[];
}

const ESTADO_LABEL: Record<string, string> = {
  en_acogida: 'En acogida', en_residencia: 'En residencia',
  en_adopcion: 'En adopción', en_proceso: 'En proceso',
  en_evaluacion: 'En evaluación', fallecido: 'Fallecido',
};
const ESPECIE_LABEL: Record<string, string> = { perro: '🐕 Perros', gato: '🐈 Gatos', otro: '🐾 Otros' };

export function SummaryTab({ period }: { period: Period }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams(periodToParams(period)).toString();
    api.get<SummaryData>(`/reportes/resumen?${qs}`).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [period.period, period.date_from, period.date_to]);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <ChartEmpty text="Error al cargar datos" />;

  const { kpis } = data;

  const KPIS = [
    { label: 'Animales ingresados', value: kpis.ingresos, prev: kpis.prev_ingresos, icon: '🐾', color: C.blue },
    { label: 'Adopciones completadas', value: kpis.adopciones, prev: kpis.prev_adopciones, icon: '🏠', color: C.green },
    { label: 'Tasa de adopción', value: kpis.tasa_adopcion, unit: '%', icon: '📈', color: C.teal },
    { label: 'Tiempo medio en refugio', value: kpis.tiempo_medio, unit: 'días', icon: '⏱', color: C.orange },
    { label: 'Animales en acogida', value: kpis.acogidas_activas, icon: '❤️', color: C.purple },
    { label: 'Avisos SOS resueltos', value: kpis.sos_resueltos, prev: kpis.prev_sos, icon: '✅', color: C.red },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {KPIS.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Gráfico evolución mensual */}
      <ChartCard title="Evolución mensual">
        {data.monthly.length === 0 ? <ChartEmpty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes_label" fontSize={11} tick={{ fill: '#9ca3af' }} />
              <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="adopciones" name="Adopciones" stroke={C.green} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="acogidas" name="Acogidas" stroke={C.orange} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sos" name="Avisos SOS" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Distribuciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Distribución por estado">
          {data.estados.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.estados} dataKey="total" nameKey="estado"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3}>
                  {data.estados.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, ESTADO_LABEL[String(n)] || String(n)]} />
                <Legend formatter={n => ESTADO_LABEL[String(n)] || String(n)} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribución por especie">
          {data.especies.length === 0 ? <ChartEmpty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.especies} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" fontSize={11} tick={{ fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="especie" fontSize={11} tick={{ fill: '#9ca3af' }} width={60}
                  tickFormatter={v => ESPECIE_LABEL[v] || v} />
                <Tooltip formatter={(v, n) => [v, ESPECIE_LABEL[String(n)] || String(n)]} />
                <Bar dataKey="total" name="Total" radius={[0, 6, 6, 0]}>
                  {data.especies.map((_, i) => <Cell key={i} fill={[C.blue, C.orange, C.purple][i] || C.gray} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Mapa de calor */}
      <ChartCard title="Actividad del refugio (últimas 52 semanas)">
        <ActivityHeatmap data={data.daily_heatmap} />
      </ChartCard>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={100} />)}
      </div>
      <Skeleton height={280} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Skeleton height={240} /><Skeleton height={240} />
      </div>
    </div>
  );
}
