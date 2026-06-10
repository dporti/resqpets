import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { DashboardData, Animal } from '../types';
import { Badge, AnimalAvatar, formatDateTime, Card, CardHeader, Spinner, ErrorState } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

interface Props {
  onVerAnimal: (a: Animal) => void;
  onNew: () => void;
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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar
        titulo={`¡${saludo}, ${user?.nombre?.split(' ')[0]}! 👋`}
        subtitulo={`Resumen de la actividad de ${user?.refugioNombre} · ${hoy}`}
        onNew={onNew}
        avisosCount={s?.avisosActivos}
      />

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* STATS */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { icon: '🐾', val: s?.totalAnimales ?? 0, label: 'Animales a tu cuidado', delta: s?.nuevosHoy ?? 0, dLabel: 'nuevos hoy' },
            { icon: '🏠', val: s?.enAcogida ?? 0, label: 'En acogida' },
            { icon: '❤️', val: s?.enAdopcion ?? 0, label: 'En proceso de adopción' },
            { icon: '🔔', val: s?.avisosActivos ?? 0, label: 'Avisos activos' },
            { icon: '📊', val: data?.adopciones.esteMes ?? 0, label: 'Adopciones este mes' },
          ].map((st, i) => (
            <div key={i} style={{
              flex: 1, background: '#fff', borderRadius: 10, padding: '16px 18px',
              border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{st.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111', lineHeight: 1 }}>{st.val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 4px' }}>{st.label}</div>
              {st.delta !== undefined && st.delta > 0 && (
                <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 500 }}>+{st.delta} {st.dLabel}</div>
              )}
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Tabla animales recientes */}
            <Card>
              <CardHeader title="Animales a tu cuidado" action={
                <span style={{ fontSize: 12.5, color: '#16a34a', cursor: 'pointer', fontWeight: 500 }}>Ver todos</span>
              } />
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Nombre', 'Estado', 'Ubicación', 'Última actualización', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '9px 16px', textAlign: 'left', fontSize: 12,
                        color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.animalesRecientes || []).map(a => (
                    <tr key={a.id}
                      onClick={() => onVerAnimal(a)}
                      style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AnimalAvatar especie={a.especie} id={a.id} size={36} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111' }}>{a.nombre}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.especie} · {a.raza}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}><Badge estado={a.estado} /></td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>{a.ubicacion_texto}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#6b7280' }}>{formatDateTime(a.updated_at)}</td>
                      <td style={{ padding: '11px 16px', color: '#d1d5db', fontSize: 18, cursor: 'pointer' }}>•••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Gráfico + Adopciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* Donut */}
              <Card style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 14 }}>Distribución de animales</div>
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
                            transform={`rotate(${rot} ${cx} ${cy})`} />
                        );
                      });
                    })()}
                    <text x={55} y={51} textAnchor="middle" fontSize={19} fontWeight={800} fill="#111">{s?.totalAnimales || 0}</text>
                    <text x={55} y={64} textAnchor="middle" fontSize={10} fill="#9ca3af">Total</text>
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
                        <span style={{ color: '#6b7280', flex: 1 }}>{l.label}</span>
                        <span style={{ color: '#374151', fontWeight: 600 }}>{l.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Adopciones */}
              <Card style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 12 }}>Adopciones</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>
                      {data?.adopciones.esteMes ?? 0}
                      {data && data.adopciones.mesAnterior > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a', marginLeft: 8 }}>
                          +{data.adopciones.esteMes - data.adopciones.mesAnterior} vs anterior
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Este mes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{data?.adopciones.esteAño ?? 0}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Total {new Date().getFullYear()}</div>
                  </div>
                </div>
                {/* Sparkline placeholder */}
                <svg width="100%" height={60} viewBox="0 0 220 60" preserveAspectRatio="none">
                  <polyline
                    points="0,50 40,40 80,35 120,25 160,20 220,10"
                    fill="none" stroke="#16a34a" strokeWidth="2" />
                  <polygon
                    points="0,50 40,40 80,35 120,25 160,20 220,10 220,60 0,60"
                    fill="#16a34a" fillOpacity="0.08" />
                </svg>
              </Card>
            </div>

            {/* Donaciones */}
            <Card style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Donaciones del mes</span>
                <span style={{ fontSize: 12.5, color: '#16a34a', cursor: 'pointer' }}>Ver informe</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>
                {(data?.donaciones.esteMes || 0).toLocaleString('es-ES')} €
              </div>
              {data && data.donaciones.mesAnterior > 0 && (
                <div style={{ fontSize: 12, color: '#16a34a', margin: '4px 0 12px' }}>
                  {data.donaciones.esteMes >= data.donaciones.mesAnterior ? '+' : ''}
                  {Math.round(((data.donaciones.esteMes - data.donaciones.mesAnterior) / data.donaciones.mesAnterior) * 100)}% vs. mes pasado
                </div>
              )}
              <div style={{ background: '#f3f4f6', borderRadius: 6, height: 7, margin: '12px 0 6px' }}>
                <div style={{
                  background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: 6, height: '100%',
                  width: `${Math.min(100, Math.round(((data?.donaciones.esteMes || 0) / (data?.donaciones.objetivo || 2000)) * 100))}%`,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Objetivo mensual: {(data?.donaciones.objetivo || 2000).toLocaleString('es-ES')} €
                {' '}·{' '}
                <strong style={{ color: '#374151' }}>
                  {Math.round(((data?.donaciones.esteMes || 0) / (data?.donaciones.objetivo || 2000)) * 100)}%
                </strong>
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avisos */}
            <Card>
              <CardHeader title="Avisos activos" action={
                <span style={{ fontSize: 12.5, color: '#16a34a', cursor: 'pointer', fontWeight: 500 }}>Ver todos</span>
              } />
              {(data?.avisos || []).slice(0, 3).map((av, i, arr) => (
                <div key={av.id} style={{
                  display: 'flex', gap: 12, padding: '12px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 8, background: '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    {av.tipo === 'perdido' ? '🐕' : av.tipo === 'urgente' ? '🚨' : '🐾'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{av.titulo}</div>
                    {av.ubicacion && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>📍 {av.ubicacion}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{formatDateTime(av.created_at)}</span>
                      <Badge estado={av.tipo === 'urgente' ? 'urgente' : 'activo'} />
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.avisos || data.avisos.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No hay avisos activos
                </div>
              )}
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader title="Actividad reciente" action={
                <span style={{ fontSize: 12.5, color: '#16a34a', cursor: 'pointer', fontWeight: 500 }}>Ver todos</span>
              } />
              {(data?.actividad || []).slice(0, 5).map((a, i, arr) => (
                <div key={a.id} style={{
                  display: 'flex', gap: 10, padding: '10px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: a.tipo === 'vacunacion' ? '#dcfce7' : a.tipo === 'adopcion' ? '#fce7f3' : '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                  }}>
                    {a.tipo === 'vacunacion' ? '💉' : a.tipo === 'adopcion' ? '❤️' : a.tipo === 'acogida' ? '🏠' : '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: '#374151' }}>{a.titulo}</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{formatDateTime(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader title="Próximos eventos" action={
                <span style={{ fontSize: 12.5, color: '#16a34a', cursor: 'pointer', fontWeight: 500 }}>Ver calendario</span>
              } />
              {(data?.eventos || []).map((ev, i, arr) => {
                const colors = ['#6366f1', '#06b6d4', '#f59e0b'];
                const c = colors[i % colors.length];
                return (
                  <div key={ev.id} style={{
                    display: 'flex', gap: 12, padding: '12px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: c + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{ev.titulo}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(ev.fecha_inicio).toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })}
                        {ev.fecha_fin ? ` · ${new Date(ev.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} – ${new Date(ev.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
