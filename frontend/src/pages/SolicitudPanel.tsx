import { useState, useEffect, useCallback, FormEvent } from 'react';
import { AdoptionRequest, AdoptionEstado } from '../types';
import { api } from '../api/client';
import { Badge, Spinner, ErrorState, formatDateTime, formatDate } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface Props {
  solicitudId: number;
  onClose: () => void;
  onUpdated: () => void;
  onAprobada: (expedientId: number) => void;
}

const ESTADOS: { val: AdoptionEstado; label: string; color: string; bg: string }[] = [
  { val: 'pendiente', label: 'Pendiente de revisión', color: '#92400e', bg: '#fef9c3' },
  { val: 'en_evaluacion', label: 'En evaluación', color: '#1d4ed8', bg: '#dbeafe' },
  { val: 'entrevista_programada', label: 'Entrevista programada', color: '#6d28d9', bg: '#ede9fe' },
  { val: 'aprobada', label: 'Aprobada', color: '#15803d', bg: '#dcfce7' },
  { val: 'rechazada', label: 'Rechazada', color: '#dc2626', bg: '#fee2e2' },
  { val: 'desistida', label: 'Desistida', color: '#6b7280', bg: '#f3f4f6' },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const bg = score >= 70 ? '#dcfce7' : score >= 40 ? '#fef9c3' : '#fee2e2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 6, height: 8 }}>
        <div style={{ width: `${score}%`, background: color, borderRadius: 6, height: '100%', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color, minWidth: 36 }}>{score}%</span>
    </div>
  );
}

function calcScore(solicitud: AdoptionRequest): { score: number; criterios: { label: string; pts: number; ok: boolean }[] } {
  const criterios: { label: string; pts: number; ok: boolean }[] = [];
  const nAct = solicitud.nivel_actividad ?? solicitud.animal_nivel_actividad ?? 0;
  const socNiños = solicitud.soc_niños ?? solicitud.animal_soc_niños ?? 0;
  const socPerros = solicitud.soc_perros ?? solicitud.animal_soc_perros ?? 0;
  const socGatos = solicitud.soc_gatos ?? solicitud.animal_soc_gatos ?? 0;
  const hogarIdeal = (solicitud.hogar_ideal ?? solicitud.animal_hogar_ideal ?? '').toLowerCase();

  const tieneJardin = solicitud.tipo_vivienda === 'casa_jardin';
  const necesitaJardin = hogarIdeal.includes('jardín') || hogarIdeal.includes('jardin');
  criterios.push({ label: 'Vivienda con jardín (animal lo necesita)', pts: 20, ok: tieneJardin && necesitaJardin || (!necesitaJardin) });

  const sinNinos = !solicitud.ninos;
  const noAptoNinos = socNiños < 3;
  criterios.push({ label: 'Sin niños / animal no apto para niños', pts: 15, ok: sinNinos || !noAptoNinos });

  criterios.push({ label: 'Experiencia previa con animales', pts: 10, ok: !!(solicitud.experiencia_previa && solicitud.experiencia_previa.trim().length > 5) });

  const umbralHoras = nAct <= 2 ? 8 : nAct === 3 ? 6 : 4;
  const horasSolo = solicitud.horas_solo ?? 0;
  criterios.push({ label: `Horas solo (≤${umbralHoras}h recomendado)`, pts: 20, ok: horasSolo <= umbralHoras });

  const sinOtros = !(solicitud.otros_animales && solicitud.otros_animales.trim().length > 2);
  const socialBajo = socPerros < 3 || socGatos < 3;
  criterios.push({ label: 'Sin otros animales (animal baja sociabilidad)', pts: 15, ok: sinOtros || !socialBajo });

  const score = criterios.reduce((s, c) => s + (c.ok ? c.pts : 0), 20);
  return { score: Math.min(100, score), criterios };
}

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };

export default function SolicitudPanel({ solicitudId, onClose, onUpdated, onAprobada }: Props) {
  const { can } = useAuth();
  const [sol, setSol] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<AdoptionEstado>('pendiente');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [notas, setNotas] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [showEntrevistaModal, setShowEntrevistaModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showAprobarConfirm, setShowAprobarConfirm] = useState(false);
  const [entrevistaForm, setEntrevistaForm] = useState({ fecha: '', hora: '10:00', tipo: 'presencial', notas: '' });
  const [aprobando, setAprobando] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getSolicitud(solicitudId).then(s => {
      setSol(s); setNuevoEstado(s.estado); setNotas(s.notas_internas || '');
    }).catch(e => { console.error(e); setError(true); }).finally(() => setLoading(false));
  }, [solicitudId]);

  useEffect(() => { load(); }, [load]);

  const handleCambiarEstado = async () => {
    if (!sol) return;
    setCambiandoEstado(true);
    try {
      await api.cambiarEstado(sol.id, nuevoEstado, nuevoEstado === 'rechazada' ? motivoRechazo : undefined);
      setSol(s => s ? { ...s, estado: nuevoEstado } : s);
      onUpdated();
      setShowRechazarModal(false);
    } finally { setCambiandoEstado(false); }
  };

  const handleGuardarNotas = async () => {
    if (!sol) return;
    setGuardandoNotas(true);
    try { await api.updateSolicitud(sol.id, { notas_internas: notas }); onUpdated(); }
    finally { setGuardandoNotas(false); }
  };

  const handleEntrevista = async (e: FormEvent) => {
    e.preventDefault();
    if (!sol || !entrevistaForm.fecha) return;
    const fecha = `${entrevistaForm.fecha}T${entrevistaForm.hora}:00`;
    await api.programarEntrevista(sol.id, { fecha, tipo: entrevistaForm.tipo, notas: entrevistaForm.notas });
    const updated = await api.getSolicitud(sol.id);
    setSol(updated); setNuevoEstado('entrevista_programada');
    setShowEntrevistaModal(false); onUpdated();
  };

  const handleAprobar = async () => {
    if (!sol) return;
    setAprobando(true);
    try {
      const r = await api.aprobarSolicitud(sol.id);
      onAprobada(r.expedient_id); onClose();
    } finally { setAprobando(false); }
  };

  if (loading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 580, background: '#fff', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={36} />
      </div>
    </>
  );
  if (error) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 580, background: '#fff', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ErrorState onRetry={load} />
      </div>
    </>
  );
  if (!sol) return null;

  const { score, criterios } = calcScore(sol);
  const estadoCfg = ESTADOS.find(e => e.val === sol.estado);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 580, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{sol.nombre}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: estadoCfg?.bg, color: estadoCfg?.color }}>{estadoCfg?.label}</span>
              {sol.canal && <span style={{ fontSize: 11.5, color: '#9ca3af', textTransform: 'capitalize' }}>vía {sol.canal}</span>}
              <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{formatDate(sol.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {/* Animal solicitado */}
          {sol.animal_nombre && (
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden' }}>
                {sol.animal_foto ? <img src={sol.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : sol.animal_especie === 'perro' ? '🐕' : '🐈'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{sol.animal_nombre}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, textTransform: 'capitalize' }}>{sol.animal_especie}</div>
                <ScoreBadge score={score} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Compatibilidad</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626' }}>{score}%</div>
              </div>
            </div>
          )}

          {/* Criterios compatibilidad */}
          {sol.animal_nombre && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 8 }}>Desglose de compatibilidad</div>
              {criterios.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 12.5 }}>
                  <span style={{ color: c.ok ? '#16a34a' : '#dc2626', fontSize: 14, flexShrink: 0 }}>{c.ok ? '✓' : '✗'}</span>
                  <span style={{ flex: 1, color: '#374151' }}>{c.label}</span>
                  <span style={{ fontWeight: 600, color: c.ok ? '#16a34a' : '#9ca3af' }}>+{c.ok ? c.pts : 0}pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Datos solicitante */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 10 }}>Datos del solicitante</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
              {[
                { label: 'Email', val: sol.email || '—' },
                { label: 'Teléfono', val: sol.telefono || '—' },
                { label: 'Vivienda', val: { piso: 'Piso', casa_jardin: 'Casa con jardín', casa_sin_jardin: 'Casa sin jardín' }[sol.tipo_vivienda || ''] || sol.tipo_vivienda || '—' },
                { label: 'Terraza', val: sol.tiene_terraza ? 'Sí' : 'No' },
                { label: 'Horas solo', val: sol.horas_solo !== undefined ? `${sol.horas_solo}h/día` : '—' },
                { label: 'Niños en casa', val: sol.ninos ? `Sí${sol.edades_ninos ? ` (${sol.edades_ninos})` : ''}` : 'No' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{f.val}</div>
                </div>
              ))}
            </div>
            {sol.experiencia_previa && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 3 }}>Experiencia previa</div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{sol.experiencia_previa}</p>
              </div>
            )}
            {sol.otros_animales && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 3 }}>Otros animales en casa</div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{sol.otros_animales}</p>
              </div>
            )}
            {sol.motivacion && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 3 }}>Motivación</div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{sol.motivacion}</p>
              </div>
            )}
          </div>

          {/* Entrevistas programadas */}
          {sol.entrevistas && sol.entrevistas.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Entrevistas</div>
              {sol.entrevistas.map(e => (
                <div key={e.id} style={{ background: '#ede9fe', borderRadius: 8, padding: '10px 12px', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#6d28d9' }}>{new Date(e.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ color: '#7c3aed', marginLeft: 8 }}>· {e.tipo}</span>
                  {e.notas && <div style={{ color: '#374151', marginTop: 3 }}>{e.notas}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Cambiar estado */}
          {can('adopciones:manage') && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 10 }}>Cambiar estado</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {can('adopciones:manage') && (
                  <button onClick={() => setShowEntrevistaModal(true)} style={{ padding: '7px 12px', background: '#ede9fe', color: '#6d28d9', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    📅 Programar entrevista
                  </button>
                )}
                {sol.estado !== 'rechazada' && (
                  <button onClick={() => setShowRechazarModal(true)} style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    ✗ Rechazar
                  </button>
                )}
                {sol.estado !== 'aprobada' && (
                  <button onClick={() => setShowAprobarConfirm(true)} style={{ padding: '7px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    ✓ Aprobar
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value as AdoptionEstado)} style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }}>
                  {ESTADOS.map(e => <option key={e.val} value={e.val}>{e.label}</option>)}
                </select>
                <button onClick={handleCambiarEstado} disabled={cambiandoEstado || nuevoEstado === sol.estado} style={{ padding: '7px 14px', background: nuevoEstado === sol.estado ? '#e5e7eb' : '#374151', color: nuevoEstado === sol.estado ? '#9ca3af' : '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {cambiandoEstado ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {/* Notas internas */}
          <div>
            <label style={{ ...lbl, fontSize: 13.5 }}>Notas internas</label>
            <textarea rows={4} value={notas} onChange={e => setNotas(e.target.value)}
              style={{ ...inp, resize: 'vertical' }} placeholder="Notas del coordinador sobre esta solicitud..." />
            <button onClick={handleGuardarNotas} disabled={guardandoNotas} style={{ marginTop: 6, padding: '7px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {guardandoNotas ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>

          {/* Timeline */}
          {sol.timeline && sol.timeline.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 10 }}>Historial</div>
              {sol.timeline.map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: '#374151' }}>{t.descripcion}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateTime(t.created_at)}{t.usuario_nombre && ` · ${t.usuario_nombre}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: entrevista */}
      {showEntrevistaModal && (
        <>
          <div onClick={() => setShowEntrevistaModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 420, padding: 24, zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Programar entrevista</div>
            <form onSubmit={handleEntrevista} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Fecha *</label><input type="date" style={inp} value={entrevistaForm.fecha} onChange={e => setEntrevistaForm(f => ({ ...f, fecha: e.target.value }))} required /></div>
                <div><label style={lbl}>Hora</label><input type="time" style={inp} value={entrevistaForm.hora} onChange={e => setEntrevistaForm(f => ({ ...f, hora: e.target.value }))} /></div>
              </div>
              <div>
                <label style={lbl}>Tipo</label>
                <select style={inp} value={entrevistaForm.tipo} onChange={e => setEntrevistaForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="presencial">Presencial</option>
                  <option value="videollamada">Videollamada</option>
                  <option value="telefono">Teléfono</option>
                </select>
              </div>
              <div><label style={lbl}>Notas</label><textarea rows={2} style={{ ...inp, resize: 'none' }} value={entrevistaForm.notas} onChange={e => setEntrevistaForm(f => ({ ...f, notas: e.target.value }))} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowEntrevistaModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 18px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Programar</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal: rechazar */}
      {showRechazarModal && (
        <>
          <div onClick={() => setShowRechazarModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 420, padding: 24, zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Rechazar solicitud</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>El motivo se guardará en el expediente y puede usarse para comunicar la decisión.</div>
            <textarea rows={4} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Motivo del rechazo..." style={{ ...inp, resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowRechazarModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={() => { setNuevoEstado('rechazada'); handleCambiarEstado(); }} disabled={cambiandoEstado} style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {cambiandoEstado ? '...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: aprobar */}
      {showAprobarConfirm && (
        <>
          <div onClick={() => setShowAprobarConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 400, padding: 24, zIndex: 70, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Aprobar solicitud</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Se creará un expediente de adopción y el animal pasará a estado "En proceso".</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setShowAprobarConfirm(false)} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleAprobar} disabled={aprobando} style={{ padding: '9px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {aprobando ? <Spinner size={16} /> : '✓ Aprobar y crear expediente'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
