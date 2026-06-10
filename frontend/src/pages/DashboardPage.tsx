import { useEffect, useState, useCallback } from 'react';
import {
  PawPrint, Home, Heart, Bell, TrendingUp, TrendingDown, ChevronRight,
  Dog, AlertTriangle, Syringe, ClipboardList, Calendar, Coins,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardData, Animal } from '../types';
import { Badge, AnimalAvatar, formatDateTime, Card, CardHeader, Spinner, ErrorState } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

interface Props {
  onVerAnimal: (a: Animal) => void;
  onNew: () => void;
}

function VerTodos({ label, onClick }: { label?: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        fontSize: 12.5, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600,
        transition: 'gap 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.gap = '5px'}
      onMouseLeave={e => e.currentTarget.style.gap = '2px'}
    >
      {label || 'Ver todos'}
      <ChevronRight size={14} strokeWidth={2.5} />
    </span>
  );
}

export default function DashboardPage({ onVerAnimal, onNew }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.dashboard()
      .then(setData)
      .catch(e => { console.error(e); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState onRetry={load} />;
  }

  const s = data?.stats;

  const statCards = [
    { icon: PawPrint, val: s?.totalAnimales ?? 0, label: 'Animales a tu cuidado', delta: s?.nuevosHoy ?? 0, dLabel: 'nuevos hoy', color: '#16a34a', bg: '#dcfce7' },
    { icon: Home, val: s?.enAcogida ?? 0, label: 'En acogida', color: '#3b82f6', bg: '#dbeafe' },
    { icon: Heart, val: s?.enAdopcion ?? 0, label: 'En proceso de adopción', color: '#a855f7', bg: '#f3e8ff' },
    { icon: Bell, val: s?.avisosActivos ?? 0, label: 'Avisos activos', color: '#f59e0b', bg: '#fef3c7' },
    { icon: TrendingUp, val: data?.adopciones.esteMes ?? 0, label: 'Adopciones este mes', color: '#0ea5e9', bg: '#e0f2fe' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-page)', minHeight: '100vh' }}>
      <TopBar
        titulo={`${saludo}, ${user?.nombre?.split(' ')[0]}`}
        subtitulo={`Resumen de la actividad de ${user?.refugioNombre} · ${hoy}`}
        onNew={onNew}
        avisosCount={s?.avisosActivos}
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            return (
              <div key={i} style={{
                background: 'var(--bg-surface)', borderRadius: 12, padding: '18px 18px',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
                transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: st.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Icon size={19} color={st.color} strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{st.val}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0', fontWeight: 500 }}>{st.label}</div>
                {st.delta !== undefined && st.delta > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: 'var(--color-primary)', fontWeight: 600, marginTop: 6 }}>
                    <TrendingUp size={12} strokeWidth={2.5} />
                    +{st.delta} {st.dLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Tabla animales recientes */}
            <Card>
              <CardHeader title="Animales a tu cuidado" action={<VerTodos />} />
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    {['Nombre', 'Estado', 'Ubicación', 'Última actualización', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '9px 16px', textAlign: 'left', fontSize: 11.5,
                        color: 'var(--text-faint)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.animalesRecientes || []).map(a => (
                    <tr key={a.id}
                      onClick={() => onVerAnimal(a)}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AnimalAvatar especie={a.especie} id={a.id} size={36} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{a.nombre}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{a.especie} · {a.raza}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}><Badge estado={a.estado} /></td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{a.ubicacion_texto}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{formatDateTime(a.updated_at)}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-faint)' }}><ChevronRight size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Gráfico + Adopciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Donut */}
              <Card style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 14 }}>Distribución de animales</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <svg width={110} height={110} viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
                    {(() => {
                      const total = s?.totalAnimales || 1;
                      const segs = [
                        { val: s?.enAcogida || 0, color: '#22c55e', label: 'Acogida' },
                        { val: s?.enResidencia || 0, color: '#3b82f6', label: 'Residencia' },
                        { val: s?.enAdopcion || 0, color: '#a855f7', label: 'Adopción' },
                        { val: s?.enEvaluacion || 0, color: '#f59e0b', label: 'Evaluación' },
                        { val: s?.enProceso || 0, color: '#6366f1', label: 'En proceso' },
                      ];
                      const r = 42, cx = 55, cy = 55, circ = 2 * Math.PI * r;
                      let cum = 0;
                      return segs.map((seg, i) => {
                        const pct = seg.val / total;
                        const dash = pct * circ;
                        const rot = -90 + (cum / total) * 360;
                        cum += seg.val;
                        return (
                          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={seg.color} strokeWidth={17}
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeLinecap="butt"
                            transform={`rotate(${rot} ${cx} ${cy})`} />
                        );
                      });
                    })()}
                    <text x={55} y={51} textAnchor="middle" fontSize={19} fontWeight={800} fill="var(--text-primary)">{s?.totalAnimales || 0}</text>
                    <text x={55} y={64} textAnchor="middle" fontSize={10} fill="var(--text-faint)">Total</text>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                    {[
                      { color: '#22c55e', label: 'En acogida', val: s?.enAcogida || 0 },
                      { color: '#3b82f6', label: 'En residencia', val: s?.enResidencia || 0 },
                      { color: '#a855f7', label: 'En adopción', val: s?.enAdopcion || 0 },
                      { color: '#f59e0b', label: 'En evaluación', val: s?.enEvaluacion || 0 },
                      { color: '#6366f1', label: 'En proceso', val: s?.enProceso || 0 },
                    ].map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-muted)', flex: 1 }}>{l.label}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{l.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Adopciones */}
              <Card style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>Adopciones</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {data?.adopciones.esteMes ?? 0}
                    </div>
                    {data && data.adopciones.mesAnterior > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: data.adopciones.esteMes >= data.adopciones.mesAnterior ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                        {data.adopciones.esteMes >= data.adopciones.mesAnterior ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                        {Math.abs(data.adopciones.esteMes - data.adopciones.mesAnterior)} vs. mes anterior
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>Este mes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{data?.adopciones.esteAño ?? 0}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Total {new Date().getFullYear()}</div>
                  </div>
                </div>
                {/* Sparkline placeholder */}
                <svg width="100%" height={60} viewBox="0 0 220 60" preserveAspectRatio="none">
                  <polyline
                    points="0,50 40,40 80,35 120,25 160,20 220,10"
                    fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polygon
                    points="0,50 40,40 80,35 120,25 160,20 220,10 220,60 0,60"
                    fill="#16a34a" fillOpacity="0.08" />
                </svg>
              </Card>
            </div>

            {/* Donaciones */}
            <Card style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={14} color="#16a34a" strokeWidth={2.2} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Donaciones del mes</span>
                </div>
                <VerTodos label="Ver informe" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {(data?.donaciones.esteMes || 0).toLocaleString('es-ES')} €
              </div>
              {data && data.donaciones.mesAnterior > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: data.donaciones.esteMes >= data.donaciones.mesAnterior ? '#16a34a' : '#dc2626', margin: '4px 0 12px' }}>
                  {data.donaciones.esteMes >= data.donaciones.mesAnterior ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                  {Math.abs(Math.round(((data.donaciones.esteMes - data.donaciones.mesAnterior) / data.donaciones.mesAnterior) * 100))}% vs. mes pasado
                </div>
              )}
              <div style={{ background: 'var(--bg-subtle-2)', borderRadius: 6, height: 7, margin: '12px 0 6px', overflow: 'hidden' }}>
                <div style={{
                  background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: 6, height: '100%',
                  width: `${Math.min(100, Math.round(((data?.donaciones.esteMes || 0) / (data?.donaciones.objetivo || 2000)) * 100))}%`,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Objetivo mensual: {(data?.donaciones.objetivo || 2000).toLocaleString('es-ES')} €
                {' '}·{' '}
                <strong style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(((data?.donaciones.esteMes || 0) / (data?.donaciones.objetivo || 2000)) * 100)}%
                </strong>
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avisos */}
            <Card>
              <CardHeader title="Avisos activos" action={<VerTodos />} />
              {(data?.avisos || []).slice(0, 3).map((av, i, arr) => {
                const AvisoIcon = av.tipo === 'perdido' ? Dog : av.tipo === 'urgente' ? AlertTriangle : PawPrint;
                const avisoColor = av.tipo === 'urgente' ? '#dc2626' : 'var(--text-muted)';
                const avisoBg = av.tipo === 'urgente' ? '#fee2e2' : 'var(--bg-subtle-2)';
                return (
                  <div key={av.id} style={{
                    display: 'flex', gap: 12, padding: '12px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, background: avisoBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <AvisoIcon size={19} color={avisoColor} strokeWidth={2.2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{av.titulo}</div>
                      {av.ubicacion && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>📍 {av.ubicacion}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{formatDateTime(av.created_at)}</span>
                        <Badge estado={av.tipo === 'urgente' ? 'urgente' : 'activo'} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!data?.avisos || data.avisos.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                  No hay avisos activos
                </div>
              )}
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader title="Actividad reciente" action={<VerTodos />} />
              {(data?.actividad || []).slice(0, 5).map((a, i, arr) => {
                const ActIcon = a.tipo === 'vacunacion' ? Syringe : a.tipo === 'adopcion' ? Heart : a.tipo === 'acogida' ? Home : ClipboardList;
                const actColor = a.tipo === 'vacunacion' ? 'var(--color-primary)' : a.tipo === 'adopcion' ? '#db2777' : a.tipo === 'acogida' ? '#3b82f6' : 'var(--text-muted)';
                const actBg = a.tipo === 'vacunacion' ? '#dcfce7' : a.tipo === 'adopcion' ? '#fce7f3' : a.tipo === 'acogida' ? '#dbeafe' : 'var(--bg-subtle-2)';
                return (
                  <div key={a.id} style={{
                    display: 'flex', gap: 10, padding: '10px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: actBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ActIcon size={14} color={actColor} strokeWidth={2.3} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{a.titulo}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 1 }}>{formatDateTime(a.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              {(!data?.actividad || data.actividad.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                  Sin actividad reciente
                </div>
              )}
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader title="Próximos eventos" action={<VerTodos label="Ver calendario" />} />
              {(data?.eventos || []).map((ev, i, arr) => {
                const colors = ['#6366f1', '#06b6d4', '#f59e0b'];
                const c = colors[i % colors.length];
                return (
                  <div key={ev.id} style={{
                    display: 'flex', gap: 12, padding: '12px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: c + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Calendar size={16} color={c} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ev.titulo}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                        {new Date(ev.fecha_inicio).toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })}
                        {ev.fecha_fin ? ` · ${new Date(ev.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!data?.eventos || data.eventos.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                  Sin eventos próximos
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
