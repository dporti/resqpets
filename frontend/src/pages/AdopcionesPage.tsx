import { useEffect, useState, useCallback } from 'react';
import { AdoptionRequest, AdoptionExpedient, AdoptionEstado } from '../types';
import { api } from '../api/client';
import { EmptyState, ErrorState, SkeletonList, formatDate } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import SolicitudPanel from './SolicitudPanel';
import ExpedientePanel from './ExpedientePanel';

// ── ESTADO CONFIG ──────────────────────────────────────
const ESTADOS: { val: AdoptionEstado; label: string; color: string; bg: string }[] = [
  { val: 'pendiente', label: 'Pendiente', color: '#92400e', bg: '#fef9c3' },
  { val: 'en_evaluacion', label: 'En evaluación', color: '#1d4ed8', bg: '#dbeafe' },
  { val: 'entrevista_programada', label: 'Entrevista', color: '#6d28d9', bg: '#ede9fe' },
  { val: 'aprobada', label: 'Aprobada', color: '#15803d', bg: '#dcfce7' },
  { val: 'rechazada', label: 'Rechazada', color: '#dc2626', bg: '#fee2e2' },
  { val: 'desistida', label: 'Desistida', color: '#6b7280', bg: '#f3f4f6' },
];

function EstadoBadge({ estado }: { estado: AdoptionEstado }) {
  const cfg = ESTADOS.find(e => e.val === estado) || ESTADOS[0];
  return <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 5, background: '#f3f4f6', borderRadius: 3 }}>
        <div style={{ width: `${score}%`, background: color, height: '100%', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{score}%</span>
    </div>
  );
}

// ── KANBAN COMPONENTS ─────────────────────────────────
function KanbanCard({ solicitud, onClick }: { solicitud: AdoptionRequest; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: solicitud.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onClick}
      style={{
        background: '#fff', borderRadius: 9, border: '1px solid #e5e7eb', padding: '11px 13px',
        cursor: 'grab', marginBottom: 8, transform: CSS.Translate.toString(transform),
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
        opacity: isDragging ? 0.8 : 1, transition: 'box-shadow 0.15s',
      }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
          {solicitud.animal_foto ? <img src={solicitud.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : solicitud.animal_especie === 'perro' ? '🐕' : '🐈'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{solicitud.nombre}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{solicitud.animal_nombre}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(solicitud.created_at)}</span>
        {(solicitud.puntuacion || 0) > 0 && <ScoreBar score={solicitud.puntuacion || 0} />}
      </div>
    </div>
  );
}

function KanbanColumn({ estado, solicitudes, onCardClick, onDrop }: {
  estado: typeof ESTADOS[0]; solicitudes: AdoptionRequest[];
  onCardClick: (id: number) => void; onDrop: (id: number, estado: AdoptionEstado) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: estado.val });
  return (
    <div ref={setNodeRef} style={{ flex: '0 0 200px', minHeight: 400, background: isOver ? '#f0fdf4' : '#f9fafb', borderRadius: 10, padding: '12px 10px', border: `1px solid ${isOver ? '#86efac' : '#e5e7eb'}`, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: estado.bg, color: estado.color }}>{estado.label}</span>
        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{solicitudes.length}</span>
      </div>
      {solicitudes.map(s => (
        <KanbanCard key={s.id} solicitud={s} onClick={() => onCardClick(s.id)} />
      ))}
      {solicitudes.length === 0 && (
        <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, padding: '20px 0' }}>Sin solicitudes</div>
      )}
    </div>
  );
}

// ── NUEVA SOLICITUD MODAL ─────────────────────────────
function NuevaSolicitudModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', animal_id: '',
    tipo_vivienda: 'piso', tiene_terraza: false, horas_solo: 0,
    experiencia_previa: '', otros_animales: '', ninos: false,
    edades_ninos: '', motivacion: '', canal: 'manual',
  });
  const [saving, setSaving] = useState(false);
  const [animales, setAnimales] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    api.getAnimales({ limit: 100 }).then(r => setAnimales(r.data.map(a => ({ id: a.id, nombre: a.nombre }))));
  }, []);

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      await api.createSolicitud({ ...form, animal_id: form.animal_id ? Number(form.animal_id) : undefined });
      onCreated(); onClose();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 540, maxHeight: '90vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Nueva solicitud manual</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Nombre *</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" /></div>
            <div><label style={lbl}>Canal</label>
              <select style={inp} value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))}>
                <option value="manual">Manual</option><option value="telefono">Teléfono</option><option value="web">Web</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Email</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label style={lbl}>Teléfono</label><input style={inp} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
          </div>
          <div><label style={lbl}>Animal solicitado</label>
            <select style={inp} value={form.animal_id} onChange={e => setForm(f => ({ ...f, animal_id: e.target.value }))}>
              <option value="">Sin especificar</option>
              {animales.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Tipo de vivienda</label>
              <select style={inp} value={form.tipo_vivienda} onChange={e => setForm(f => ({ ...f, tipo_vivienda: e.target.value }))}>
                <option value="piso">Piso</option><option value="casa_jardin">Casa con jardín</option><option value="casa_sin_jardin">Casa sin jardín</option>
              </select>
            </div>
            <div><label style={lbl}>Horas solo al día</label><input type="number" min={0} max={24} style={inp} value={form.horas_solo} onChange={e => setForm(f => ({ ...f, horas_solo: Number(e.target.value) }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.tiene_terraza} onChange={e => setForm(f => ({ ...f, tiene_terraza: e.target.checked }))} style={{ accentColor: '#16a34a' }} /> Tiene terraza
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.ninos} onChange={e => setForm(f => ({ ...f, ninos: e.target.checked }))} style={{ accentColor: '#16a34a' }} /> Niños en casa
            </label>
          </div>
          {form.ninos && <div><label style={lbl}>Edades de los niños</label><input style={inp} value={form.edades_ninos} onChange={e => setForm(f => ({ ...f, edades_ninos: e.target.value }))} placeholder="ej: 5, 8 años" /></div>}
          <div><label style={lbl}>Experiencia previa con animales</label><textarea rows={2} style={{ ...inp, resize: 'none' }} value={form.experiencia_previa} onChange={e => setForm(f => ({ ...f, experiencia_previa: e.target.value }))} /></div>
          <div><label style={lbl}>Otros animales en casa</label><input style={inp} value={form.otros_animales} onChange={e => setForm(f => ({ ...f, otros_animales: e.target.value }))} /></div>
          <div><label style={lbl}>Motivación para adoptar</label><textarea rows={3} style={{ ...inp, resize: 'none' }} value={form.motivacion} onChange={e => setForm(f => ({ ...f, motivacion: e.target.value }))} /></div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !form.nombre.trim()} style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            {saving ? 'Guardando...' : 'Crear solicitud'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────
export default function AdopcionesPage() {
  const { can } = useAuth();
  const [vista, setVista] = useState<'solicitudes' | 'expedientes'>('solicitudes');
  const [viewMode, setViewMode] = useState<'tabla' | 'kanban'>('tabla');
  const [solicitudes, setSolicitudes] = useState<AdoptionRequest[]>([]);
  const [expedientes, setExpedientes] = useState<AdoptionExpedient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(null);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<number | null>(null);
  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const loadSolicitudes = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const params: Record<string, string | number> = viewMode === 'kanban'
        ? { limit: 200, page: 1 }
        : { limit: LIMIT, page };
      if (estadoFilter) params.estado = estadoFilter;
      const data = await api.getSolicitudes(params);
      setSolicitudes(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [estadoFilter, viewMode, page]);

  const loadExpedientes = useCallback(async () => {
    setLoading(true); setError(false);
    try { const data = await api.getExpedientes(); setExpedientes(data); }
    catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, []);

  const reload = useCallback(() => {
    vista === 'solicitudes' ? loadSolicitudes() : loadExpedientes();
  }, [vista, loadSolicitudes, loadExpedientes]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [estadoFilter, viewMode, vista]);

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
    const solicitudId = Number(active.id);
    const nuevoEstado = over.id as AdoptionEstado;
    const sol = solicitudes.find(s => s.id === solicitudId);
    if (!sol || sol.estado === nuevoEstado) return;
    setSolicitudes(prev => prev.map(s => s.id === solicitudId ? { ...s, estado: nuevoEstado } : s));
    await api.cambiarEstado(solicitudId, nuevoEstado);
  };

  const diasEnFase = (exp: AdoptionExpedient) => {
    const d = Math.floor((Date.now() - new Date(exp.updated_at || exp.created_at).getTime()) / 86400000);
    return d;
  };

  const FASE_LABELS = ['', 'Documentación', 'Preparación', 'Entrega', 'Seguimiento'];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar
        titulo="Adopciones"
        subtitulo={vista === 'solicitudes' ? `${solicitudes.length} solicitudes` : `${expedientes.length} expedientes activos`}
        showNew={can('adopciones:manage') && vista === 'solicitudes'}
        newLabel="+ Nueva solicitud"
        onNew={() => setShowNuevaSolicitud(true)}
      />

      {/* Sub-nav */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          {(['solicitudes', 'expedientes'] as const).map(v => (
            <button key={v} onClick={() => { setVista(v); setEstadoFilter(''); }} style={{
              padding: '12px 18px', background: 'none', border: 'none',
              borderBottom: `2px solid ${vista === v ? '#16a34a' : 'transparent'}`,
              fontSize: 13.5, fontWeight: vista === v ? 700 : 400,
              color: vista === v ? '#16a34a' : '#6b7280', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {v === 'solicitudes' ? '📋 Solicitudes' : '📁 Expedientes'}
              {v === 'solicitudes' && pendientes > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>{pendientes}</span>
              )}
            </button>
          ))}
        </div>
        {vista === 'solicitudes' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {(['tabla', 'kanban'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12.5,
                background: viewMode === m ? '#111827' : '#fff', color: viewMode === m ? '#fff' : '#6b7280',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: viewMode === m ? 600 : 400,
              }}>{m === 'tabla' ? '≡ Tabla' : '⊟ Kanban'}</button>
            ))}
          </div>
        )}
      </div>

      {/* Filtros estado (solo tabla solicitudes) */}
      {vista === 'solicitudes' && viewMode === 'tabla' && (
        <div style={{ padding: '12px 24px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setEstadoFilter('')} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', borderColor: estadoFilter === '' ? '#16a34a' : '#e5e7eb', background: estadoFilter === '' ? '#16a34a' : '#fff', color: estadoFilter === '' ? '#fff' : '#6b7280', fontSize: 12.5, fontWeight: estadoFilter === '' ? 600 : 400, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Todos</button>
          {ESTADOS.map(e => (
            <button key={e.val} onClick={() => setEstadoFilter(e.val)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', borderColor: estadoFilter === e.val ? e.color : '#e5e7eb', background: estadoFilter === e.val ? e.bg : '#fff', color: estadoFilter === e.val ? e.color : '#6b7280', fontSize: 12.5, fontWeight: estadoFilter === e.val ? 600 : 400, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{e.label}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : vista === 'solicitudes' ? (
          viewMode === 'tabla' ? (
            /* ── TABLA ────────────────────────────────────── */
            solicitudes.length === 0 ? (
              <EmptyState icon="📋" title="Sin solicitudes" subtitle="Las solicitudes recibidas aparecerán aquí" />
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Solicitante', 'Animal', 'Fecha', 'Canal', 'Estado', 'Compatibilidad', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map(s => (
                      <tr key={s.id} onClick={() => setSelectedSolicitudId(s.id)}
                        style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#4338ca', flexShrink: 0 }}>
                              {s.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{s.nombre}</div>
                              <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{s.email || s.telefono || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
                              {s.animal_foto ? <img src={s.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.animal_especie === 'perro' ? '🐕' : s.animal_especie === 'gato' ? '🐈' : '🐾'}
                            </div>
                            <span style={{ fontSize: 13, color: '#374151' }}>{s.animal_nombre || '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>{s.canal || 'web'}</span>
                        </td>
                        <td style={{ padding: '11px 16px' }}><EstadoBadge estado={s.estado} /></td>
                        <td style={{ padding: '11px 16px' }}>
                          {(s.puntuacion || 0) > 0 ? <ScoreBar score={s.puntuacion || 0} /> : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <button onClick={e => { e.stopPropagation(); setSelectedSolicitudId(s.id); }} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#374151', fontFamily: "'Inter', sans-serif" }}>
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
                      Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{
                        padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 7,
                        background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                        opacity: page === 1 ? 0.4 : 1, fontFamily: "'Inter', sans-serif", fontSize: 13,
                      }}>← Anterior</button>
                      <span style={{ fontSize: 13, color: '#374151' }}>{page} / {totalPages}</span>
                      <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{
                        padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 7,
                        background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        opacity: page === totalPages ? 0.4 : 1, fontFamily: "'Inter', sans-serif", fontSize: 13,
                      }}>Siguiente →</button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── KANBAN ───────────────────────────────────── */
            <div style={{ marginTop: 8 }}>
              <DndContext onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
                  {ESTADOS.map(estado => (
                    <KanbanColumn
                      key={estado.val}
                      estado={estado}
                      solicitudes={solicitudes.filter(s => s.estado === estado.val)}
                      onCardClick={setSelectedSolicitudId}
                      onDrop={(id, est) => api.cambiarEstado(id, est)}
                    />
                  ))}
                </div>
              </DndContext>
            </div>
          )
        ) : (
          /* ── EXPEDIENTES ──────────────────────────────── */
          expedientes.length === 0 ? (
            <EmptyState icon="📁" title="Sin expedientes activos" subtitle="Los expedientes se crean al aprobar una solicitud" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {expedientes.map(exp => {
                const totalItems = Number(exp.items_total) || 15;
                const doneItems = Number(exp.items_completados) || 0;
                const pct = Math.round((doneItems / totalItems) * 100);
                return (
                  <div key={exp.id} onClick={() => setSelectedExpedienteId(exp.id)}
                    style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'center', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
                      {exp.animal_foto ? <img src={exp.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : exp.animal_especie === 'perro' ? '🐕' : '🐈'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{exp.animal_nombre}</div>
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>→ {exp.adoptante_nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 5 }}>
                          <div style={{ width: `${pct}%`, background: '#16a34a', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 11.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{doneItems}/{totalItems} completados</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                        Fase {exp.fase_actual}: {FASE_LABELS[exp.fase_actual]}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{diasEnFase(exp)}d en esta fase</div>
                    </div>
                    <div style={{ fontSize: 20, color: '#d1d5db' }}>›</div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Panels */}
      {selectedSolicitudId && (
        <SolicitudPanel
          solicitudId={selectedSolicitudId}
          onClose={() => setSelectedSolicitudId(null)}
          onUpdated={loadSolicitudes}
          onAprobada={(expId) => { setSelectedSolicitudId(null); setVista('expedientes'); setSelectedExpedienteId(expId); loadExpedientes(); }}
        />
      )}

      {selectedExpedienteId && (
        <ExpedientePanel
          expedienteId={selectedExpedienteId}
          onClose={() => setSelectedExpedienteId(null)}
          onCerrado={() => { setSelectedExpedienteId(null); loadExpedientes(); }}
        />
      )}

      {showNuevaSolicitud && (
        <NuevaSolicitudModal onClose={() => setShowNuevaSolicitud(false)} onCreated={loadSolicitudes} />
      )}
    </div>
  );
}
