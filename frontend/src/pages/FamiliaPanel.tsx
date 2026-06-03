import { useState, useEffect, FormEvent } from 'react';
import { FosterFamily, FamilyStatus } from '../types';
import { api } from '../api/client';
import { Spinner, formatDate } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface Props {
  familiaId: number;
  onClose: () => void;
  onUpdated: () => void;
  onAsignar: (familiaId: number) => void;
}

const KARMA_LEVEL = (pts: number) => {
  if (pts >= 1000) return { label: 'Diamante', emoji: '💎', color: '#06b6d4' };
  if (pts >= 600) return { label: 'Platino', emoji: '🏆', color: '#8b5cf6' };
  if (pts >= 300) return { label: 'Oro', emoji: '🥇', color: '#f59e0b' };
  if (pts >= 100) return { label: 'Plata', emoji: '🥈', color: '#6b7280' };
  return { label: 'Bronce', emoji: '🥉', color: '#92400e' };
};

const STATUS_CFG: Record<FamilyStatus, { label: string; bg: string; color: string }> = {
  available: { label: 'Disponible', bg: '#dcfce7', color: '#16a34a' },
  full:      { label: 'Ocupada',    bg: '#fef9c3', color: '#d97706' },
  paused:    { label: 'En pausa',   bg: '#f3f4f6', color: '#6b7280' },
  inactive:  { label: 'Inactiva',   bg: '#fee2e2', color: '#dc2626' },
};

function Stars({ val, onChange }: { val: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
          style={{ fontSize: 18, cursor: onChange ? 'pointer' : 'default', color: i <= (hover || val) ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };

export default function FamiliaPanel({ familiaId, onClose, onUpdated, onAsignar }: Props) {
  const { can } = useAuth();
  const [familia, setFamilia] = useState<FosterFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FosterFamily>>({});
  const [saving, setSaving] = useState(false);
  const [showPausarModal, setShowPausarModal] = useState(false);
  const [motivoPausa, setMotivoPausa] = useState('');

  const load = () => {
    api.getFamilia(familiaId).then(f => {
      setFamilia(f);
      setEditForm(f);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [familiaId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!familia) return;
    setSaving(true);
    try {
      await api.updateFamilia(familia.id, editForm);
      load(); setEditing(false); onUpdated();
    } finally { setSaving(false); }
  };

  const handlePausar = async () => {
    if (!familia) return;
    await api.updateFamilia(familia.id, { estado: familia.estado === 'paused' ? 'available' : 'paused' });
    load(); setShowPausarModal(false); onUpdated();
  };

  if (loading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: '#fff', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={36} />
      </div>
    </>
  );
  if (!familia) return null;

  const karma = KARMA_LEVEL(familia.karma_puntos);
  const statusCfg = STATUS_CFG[familia.estado];
  const slotsLibres = familia.max_animales - familia.animales_actuales;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#1d4ed8', flexShrink: 0, overflow: 'hidden' }}>
                {familia.avatar_url ? <img src={familia.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : familia.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{familia.nombre}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                  <span style={{ fontSize: 12.5 }}>{karma.emoji} <strong style={{ color: karma.color }}>{karma.label}</strong> · {familia.karma_puntos}pts</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
          </div>
          {can('animales:update') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setEditing(v => !v)} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: editing ? '#111827' : '#fff', color: editing ? '#fff' : '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {editing ? '✕ Cancelar' : '✏️ Editar'}
              </button>
              <button onClick={() => onAsignar(familia.id)} disabled={slotsLibres === 0} style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: slotsLibres > 0 ? '#16a34a' : '#e5e7eb', color: slotsLibres > 0 ? '#fff' : '#9ca3af', fontSize: 12.5, fontWeight: 600, cursor: slotsLibres > 0 ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif" }}>
                🐾 Asignar animal
              </button>
              <button onClick={() => setShowPausarModal(true)} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', color: '#6b7280', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {familia.estado === 'paused' ? '▶️ Activar' : '⏸ Pausar'}
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {editing ? (
            /* ── EDIT FORM ─── */
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={row2}>
                <div><label style={lbl}>Nombre</label><input style={inp} value={editForm.nombre || ''} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} /></div>
                <div><label style={lbl}>Email</label><input type="email" style={inp} value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div style={row2}>
                <div><label style={lbl}>Teléfono</label><input style={inp} value={editForm.telefono || ''} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} /></div>
                <div><label style={lbl}>Ciudad / Zona</label><input style={inp} value={editForm.zona || ''} onChange={e => setEditForm(f => ({ ...f, zona: e.target.value }))} /></div>
              </div>
              <div><label style={lbl}>Dirección</label><input style={inp} value={editForm.direccion || ''} onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))} /></div>
              <div style={row2}>
                <div><label style={lbl}>Máx. animales</label><input type="number" min={1} max={10} style={inp} value={editForm.max_animales || 1} onChange={e => setEditForm(f => ({ ...f, max_animales: Number(e.target.value) }))} /></div>
                <div><label style={lbl}>Estado</label>
                  <select style={inp} value={editForm.estado || 'available'} onChange={e => setEditForm(f => ({ ...f, estado: e.target.value as FamilyStatus }))}>
                    <option value="available">Disponible</option>
                    <option value="full">Ocupada</option>
                    <option value="paused">En pausa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Acepta</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'acepta_perros', label: '🐕 Perros' },
                    { key: 'acepta_gatos', label: '🐈 Gatos' },
                    { key: 'acepta_otros', label: '🐾 Otros' },
                    { key: 'acepta_pequeño', label: 'Pequeños' },
                    { key: 'acepta_mediano', label: 'Medianos' },
                    { key: 'acepta_grande', label: 'Grandes' },
                    { key: 'acepta_necesidades_especiales', label: 'Especiales' },
                    { key: 'acepta_cachorros', label: 'Cachorros' },
                    { key: 'acepta_seniors', label: 'Seniors' },
                    { key: 'tiene_jardin', label: '🌿 Jardín' },
                    { key: 'ninos_casa', label: '👶 Niños' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!(editForm as Record<string, unknown>)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: '#16a34a' }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Notas</label><textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={editForm.notas || ''} onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))} /></div>
              <button type="submit" disabled={saving} style={{ padding: '9px 0', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          ) : (
            /* ── VIEW MODE ─── */
            <>
              {/* Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                {[
                  { label: 'Email', val: familia.email || '—' },
                  { label: 'Teléfono', val: familia.telefono || '—' },
                  { label: 'Ciudad', val: familia.ciudad || familia.zona || '—' },
                  { label: 'Alta', val: formatDate(familia.fecha_alta) },
                  { label: 'Acogidas completadas', val: String(familia.acogidas_total || 0) },
                  { label: 'Slots', val: `${familia.animales_actuales}/${familia.max_animales} (${slotsLibres} libre${slotsLibres !== 1 ? 's' : ''})` },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Slots visual */}
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: familia.max_animales }, (_, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < familia.animales_actuales ? '#16a34a' : '#e5e7eb', border: '1px solid', borderColor: i < familia.animales_actuales ? '#86efac' : '#d1d5db' }} />
                ))}
                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{slotsLibres > 0 ? `${slotsLibres} disponible${slotsLibres !== 1 ? 's' : ''}` : 'Completa'}</span>
              </div>

              {/* Capacidad */}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Acepta</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {familia.acepta_perros && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🐕 Perros</span>}
                  {familia.acepta_gatos && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🐈 Gatos</span>}
                  {familia.acepta_otros && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🐾 Otros</span>}
                  {familia.acepta_pequeño && <span style={{ background: '#f0fdf4', color: '#374151', padding: '3px 9px', borderRadius: 20, fontSize: 12, border: '1px solid #e5e7eb' }}>Pequeños</span>}
                  {familia.acepta_mediano && <span style={{ background: '#f0fdf4', color: '#374151', padding: '3px 9px', borderRadius: 20, fontSize: 12, border: '1px solid #e5e7eb' }}>Medianos</span>}
                  {familia.acepta_grande && <span style={{ background: '#f0fdf4', color: '#374151', padding: '3px 9px', borderRadius: 20, fontSize: 12, border: '1px solid #e5e7eb' }}>Grandes</span>}
                  {familia.acepta_necesidades_especiales && <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>♿ Especiales</span>}
                  {familia.acepta_cachorros && <span style={{ background: '#fef9c3', color: '#92400e', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🐣 Cachorros</span>}
                  {familia.acepta_seniors && <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🧓 Seniors</span>}
                  {familia.tiene_jardin && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>🌿 Jardín</span>}
                  {familia.ninos_casa && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 9px', borderRadius: 20, fontSize: 12 }}>👶 Niños{familia.edades_ninos ? ` (${familia.edades_ninos})` : ''}</span>}
                </div>
                {familia.otros_animales_casa && <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 6 }}>Otros animales: {familia.otros_animales_casa}</div>}
                {familia.notas && <div style={{ fontSize: 12.5, color: '#4b5563', marginTop: 6, fontStyle: 'italic' }}>{familia.notas}</div>}
              </div>

              {/* Acogidas actuales */}
              {familia.acogidas_activas && familia.acogidas_activas.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Animales en acogida ahora</div>
                  {familia.acogidas_activas.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>{a.animal_especie === 'perro' ? '🐕' : '🐈'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.animal_nombre}</div>
                        <div style={{ fontSize: 11.5, color: '#6b7280' }}>Desde {formatDate(a.iniciada_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Karma historial */}
              {familia.karma_historial && familia.karma_historial.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 8 }}>Historial karma {karma.emoji} {familia.karma_puntos} pts</div>
                  {familia.karma_historial.map(k => (
                    <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
                      <span style={{ color: '#374151' }}>{k.razon}</span>
                      <span style={{ fontWeight: 700, color: k.puntos > 0 ? '#16a34a' : '#dc2626' }}>+{k.puntos}pts</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPausarModal && (
        <>
          <div onClick={() => setShowPausarModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 380, padding: 24, zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              {familia.estado === 'paused' ? 'Reactivar familia' : 'Poner en pausa'}
            </div>
            {familia.estado !== 'paused' && (
              <textarea rows={3} value={motivoPausa} onChange={e => setMotivoPausa(e.target.value)} placeholder="Motivo de la pausa (opcional)..." style={{ ...inp, marginBottom: 14, resize: 'none' }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowPausarModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handlePausar} style={{ padding: '8px 18px', background: familia.estado === 'paused' ? '#16a34a' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {familia.estado === 'paused' ? 'Reactivar' : 'Pausar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
