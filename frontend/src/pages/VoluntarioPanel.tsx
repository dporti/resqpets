import { useState, useEffect, FormEvent } from 'react';
import { VoluntarioStats } from '../types';
import { api } from '../api/client';
import { Spinner, formatDate, formatDateTime } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { CAT_CFG, PRIO_CFG } from './TareaForm';

interface Props {
  voluntarioId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const KARMA_LEVEL = (pts: number) => {
  if (pts >= 1000) return { label: 'Diamante', emoji: '💎', color: '#06b6d4', next: null, nextPts: 0 };
  if (pts >= 600) return { label: 'Platino', emoji: '🏆', color: '#8b5cf6', next: 'Diamante', nextPts: 1000 };
  if (pts >= 300) return { label: 'Oro', emoji: '🥇', color: '#f59e0b', next: 'Platino', nextPts: 600 };
  if (pts >= 100) return { label: 'Plata', emoji: '🥈', color: '#6b7280', next: 'Oro', nextPts: 300 };
  return { label: 'Bronce', emoji: '🥉', color: '#92400e', next: 'Plata', nextPts: 100 };
};

const BENEFICIOS = [
  { nivel: 'Bronce', emoji: '🥉', pts: 0, beneficio: 'Acceso básico al CRM' },
  { nivel: 'Plata', emoji: '🥈', pts: 100, beneficio: 'Pienso bonificado 5kg/mes' },
  { nivel: 'Oro', emoji: '🥇', pts: 300, beneficio: 'Descuento 20% veterinario partner' },
  { nivel: 'Platino', emoji: '🏆', pts: 600, beneficio: 'Merchandising ResQPet exclusivo' },
  { nivel: 'Diamante', emoji: '💎', pts: 1000, beneficio: 'Invitación a eventos exclusivos' },
];

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };

export default function VoluntarioPanel({ voluntarioId, onClose, onUpdated }: Props) {
  const { can, user } = useAuth();
  const [vol, setVol] = useState<VoluntarioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ bio: string; especialidades: string; es_disponible: boolean }>({ bio: '', especialidades: '', es_disponible: true });
  const [saving, setSaving] = useState(false);
  const [newEsp, setNewEsp] = useState('');

  const load = () => {
    api.getVoluntario(voluntarioId).then(v => {
      setVol(v);
      setEditForm({ bio: v.bio || '', especialidades: (v.especialidades || []).join(', '), es_disponible: v.es_disponible ?? true });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [voluntarioId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!vol) return;
    setSaving(true);
    try {
      const esps = editForm.especialidades.split(',').map(s => s.trim()).filter(Boolean);
      await api.updateVoluntario(vol.id, { bio: editForm.bio, especialidades: esps, es_disponible: editForm.es_disponible });
      load(); setEditing(false); onUpdated();
    } finally { setSaving(false); }
  };

  if (loading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 540, background: '#fff', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={36} />
      </div>
    </>
  );
  if (!vol) return null;

  const karma = KARMA_LEVEL(vol.karma_puntos || 0);
  const pct = karma.next ? Math.min(100, Math.round(((vol.karma_puntos || 0) - (BENEFICIOS.find(b => b.nivel === karma.label)?.pts || 0)) / ((karma.nextPts || 1) - (BENEFICIOS.find(b => b.nivel === karma.label)?.pts || 0)) * 100)) : 100;
  const canEdit = can('usuarios:manage') || user?.id === vol.id;

  const ROL_CFG: Record<string, { label: string; bg: string; color: string }> = {
    admin:       { label: 'Admin',       bg: '#fee2e2', color: '#dc2626' },
    coordinador: { label: 'Coordinador', bg: '#dbeafe', color: '#2563eb' },
    voluntario:  { label: 'Voluntario',  bg: '#dcfce7', color: '#16a34a' },
  };
  const rolCfg = ROL_CFG[vol.rol] || ROL_CFG.voluntario;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 540, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#1d4ed8', flexShrink: 0, overflow: 'hidden' }}>
                {vol.avatarUrl ? <img src={vol.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : vol.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{vol.nombre}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: rolCfg.bg, color: rolCfg.color }}>{rolCfg.label}</span>
                  <span style={{ fontSize: 12.5 }}>{karma.emoji} <strong style={{ color: karma.color }}>{karma.label}</strong> · {vol.karma_puntos || 0}pts</span>
                  <span style={{ fontSize: 11.5, color: vol.es_disponible ? '#16a34a' : '#9ca3af', background: vol.es_disponible ? '#f0fdf4' : '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>
                    {vol.es_disponible ? '● Disponible' : '○ No disponible'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {canEdit && <button onClick={() => setEditing(v => !v)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: editing ? '#111827' : '#fff', color: editing ? '#fff' : '#374151', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>{editing ? '✕' : '✏️ Editar'}</button>}
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
          </div>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' }}>Bio / Presentación</label>
                <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Cuéntanos un poco sobre ti..." />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' }}>Especialidades (separadas por comas)</label>
                <input style={inp} value={editForm.especialidades} onChange={e => setEditForm(f => ({ ...f, especialidades: e.target.value }))} placeholder="Fotografía, Transporte, Veterinaria..." />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.es_disponible} onChange={e => setEditForm(f => ({ ...f, es_disponible: e.target.checked }))} style={{ accentColor: '#16a34a' }} />
                Disponible para tareas
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setEditing(false)} style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '7px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Info básica */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                {[
                  { label: 'Email', val: vol.email },
                  { label: 'Alta', val: formatDate(vol.createdAt) },
                  { label: 'Última actividad', val: vol.ultima_actividad ? formatDateTime(vol.ultima_actividad) : 'Sin actividad' },
                  { label: 'Racha actual', val: `${vol.racha_dias || 0} días` },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{f.val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Bio */}
              {vol.bio && <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{vol.bio}"</p>}

              {/* Especialidades */}
              {vol.especialidades && vol.especialidades.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {vol.especialidades.map(e => (
                    <span key={e} style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12.5, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 500 }}>{e}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { icon: '✅', val: vol.tareas_total || 0, label: 'Tareas total' },
              { icon: '📅', val: vol.tareas_mes || 0, label: 'Este mes' },
              { icon: '⏳', val: vol.tareas_pendientes || 0, label: 'Pendientes' },
            ].map(s => (
              <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '4px 0 2px' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Karma progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{karma.emoji} {karma.label} — {vol.karma_puntos || 0} pts</span>
              {karma.next && <span style={{ fontSize: 12, color: '#9ca3af' }}>→ {karma.next} ({karma.nextPts} pts)</span>}
            </div>
            {karma.next && (
              <div style={{ background: '#f3f4f6', borderRadius: 6, height: 8 }}>
                <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${karma.color}, ${karma.color}99)`, height: '100%', borderRadius: 6, transition: 'width 0.5s' }} />
              </div>
            )}
          </div>

          {/* Karma historial */}
          {vol.karma_historial && vol.karma_historial.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Historial de karma</div>
              {vol.karma_historial.slice(0, 10).map(k => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
                  <span style={{ color: '#374151' }}>{k.razon}</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>+{k.puntos}pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Tareas asignadas */}
          {vol.tareas && vol.tareas.filter(t => t.estado !== 'completed').length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Tareas asignadas</div>
              {vol.tareas.filter(t => t.estado !== 'completed').slice(0, 5).map(t => {
                const cat = CAT_CFG[t.categoria];
                const prio = PRIO_CFG[t.prioridad];
                const vencida = t.fecha_limite && new Date(t.fecha_limite) < new Date();
                return (
                  <div key={t.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{cat?.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: prio?.bg, color: prio?.color, fontWeight: 600 }}>{prio?.label}</span>
                        {t.fecha_limite && <span style={{ fontSize: 11, color: vencida ? '#dc2626' : '#9ca3af' }}>{vencida ? '⚠️ Vencida' : formatDate(t.fecha_limite)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Beneficios */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Beneficios por nivel</div>
            {BENEFICIOS.map(b => {
              const unlocked = (vol.karma_puntos || 0) >= b.pts;
              return (
                <div key={b.nivel} style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 4, borderRadius: 8, background: unlocked ? '#f0fdf4' : '#f9fafb', opacity: unlocked ? 1 : 0.5 }}>
                  <span style={{ fontSize: 18 }}>{b.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: unlocked ? '#15803d' : '#6b7280' }}>{b.nivel} ({b.pts}+ pts)</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{b.beneficio}</div>
                  </div>
                  {unlocked && <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: 16 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
