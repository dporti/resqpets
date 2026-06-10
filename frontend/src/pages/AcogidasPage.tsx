import { useEffect, useState, useCallback, FormEvent } from 'react';
import { FosterFamily, FosterAssignment, FamilyStatus } from '../types';
import { api } from '../api/client';
import { EmptyState, ErrorState, SkeletonList, formatDate } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import FamiliaPanel from './FamiliaPanel';
import AsignarAcogidaModal from './AsignarAcogidaModal';
import ContactoModal from './ContactoModal';
import FinalizarAcogidaModal from './FinalizarAcogidaModal';

// ── HELPERS ───────────────────────────────────────────
const KARMA_LEVEL = (pts: number) => {
  if (pts >= 1000) return { emoji: '💎', color: '#06b6d4', label: 'Diamante' };
  if (pts >= 600)  return { emoji: '🏆', color: '#8b5cf6', label: 'Platino' };
  if (pts >= 300)  return { emoji: '🥇', color: '#f59e0b', label: 'Oro' };
  if (pts >= 100)  return { emoji: '🥈', color: 'var(--text-muted)', label: 'Plata' };
  return { emoji: '🥉', color: '#92400e', label: 'Bronce' };
};

const STATUS_CFG: Record<FamilyStatus, { label: string; bg: string; color: string }> = {
  available: { label: 'Disponible', bg: '#dcfce7', color: '#16a34a' },
  full:      { label: 'Ocupada',    bg: '#fef9c3', color: '#d97706' },
  paused:    { label: 'En pausa',   bg: '#f3f4f6', color: 'var(--text-muted)' },
  inactive:  { label: 'Inactiva',   bg: '#fee2e2', color: '#dc2626' },
};

const DIAS_COLOR = (dias: number) =>
  dias > 90 ? '#dc2626' : dias > 30 ? '#d97706' : '#16a34a';

// ── NUEVA FAMILIA MODAL ───────────────────────────────
function NuevaFamiliaModal({ onClose, onCreada }: { onClose: () => void; onCreada: () => void }) {
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', ciudad: '', zona: '', direccion: '',
    max_animales: 1, acepta_perros: true, acepta_gatos: false, acepta_otros: false,
    acepta_pequeño: true, acepta_mediano: true, acepta_grande: false,
    acepta_necesidades_especiales: false, acepta_cachorros: true, acepta_seniors: false,
    tiene_jardin: false, otros_animales_casa: '', ninos_casa: false, edades_ninos: '', notas: '',
  });
  const [saving, setSaving] = useState(false);
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    try { await api.createFamilia(form); onCreada(); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-surface)', borderRadius: 14, width: 540, maxHeight: '90vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Añadir familia de acogida</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-faint)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Nombre *</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Familia García / Laura M." /></div>
            <div><label style={lbl}>Máx. animales</label><input type="number" min={1} max={10} style={inp} value={form.max_animales} onChange={e => setForm(f => ({ ...f, max_animales: Number(e.target.value) }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Email</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label style={lbl}>Teléfono</label><input style={inp} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Ciudad</label><input style={inp} value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} /></div>
            <div><label style={lbl}>Barrio / Zona</label><input style={inp} value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} /></div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Acepta</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { key: 'acepta_perros', label: '🐕 Perros' }, { key: 'acepta_gatos', label: '🐈 Gatos' },
                { key: 'acepta_otros', label: '🐾 Otros' }, { key: 'acepta_pequeño', label: 'Pequeños' },
                { key: 'acepta_mediano', label: 'Medianos' }, { key: 'acepta_grande', label: 'Grandes' },
                { key: 'acepta_necesidades_especiales', label: '♿ Especiales' },
                { key: 'acepta_cachorros', label: '🐣 Cachorros' }, { key: 'acepta_seniors', label: '🧓 Seniors' },
                { key: 'tiene_jardin', label: '🌿 Jardín' }, { key: 'ninos_casa', label: '👶 Niños' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!(form as Record<string, unknown>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: '#16a34a' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div><label style={lbl}>Notas</label><textarea rows={2} style={{ ...inp, resize: 'none' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Experiencia previa, horarios, observaciones..." /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving || !form.nombre.trim()} style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {saving ? 'Guardando...' : 'Crear familia'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────
export default function AcogidasPage() {
  const { can } = useAuth();
  const [vista, setVista] = useState<'familias' | 'activas' | 'historial'>('familias');
  const [familias, setFamilias] = useState<FosterFamily[]>([]);
  const [activas, setActivas] = useState<FosterAssignment[]>([]);
  const [historial, setHistorial] = useState<FosterAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const [selectedFamiliaId, setSelectedFamiliaId] = useState<number | null>(null);
  const [asignarFamiliaId, setAsignarFamiliaId] = useState<number | null>(null);
  const [showNuevaFamilia, setShowNuevaFamilia] = useState(false);
  const [contactoData, setContactoData] = useState<{ assignmentId: number; animalNombre: string; familiaNombre: string } | null>(null);
  const [finalizarData, setFinalizarData] = useState<{ assignmentId: number; animalNombre: string; familiaNombre: string } | null>(null);

  const loadFamilias = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const params: Record<string, string> = {};
      if (filtroEstado !== 'all') params.estado = filtroEstado;
      if (filtroEspecie) params.especie = filtroEspecie;
      setFamilias(await api.getFamilias(params));
    } catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [filtroEstado, filtroEspecie]);

  const loadActivas = useCallback(async () => {
    setLoading(true); setError(false);
    try { setActivas(await api.getActivas()); }
    catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, []);

  const loadHistorial = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const r = await api.getHistorial({ limit: LIMIT, page });
      setHistorial(r.data);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    }
    catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [page]);

  const reload = useCallback(() => {
    if (vista === 'familias') loadFamilias();
    else if (vista === 'activas') loadActivas();
    else loadHistorial();
  }, [vista, loadFamilias, loadActivas, loadHistorial]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [vista]);

  const familiasFiltradas = familias.filter(f =>
    !search || f.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (f.zona || '').toLowerCase().includes(search.toLowerCase())
  );

  const alerts90 = activas.filter(a => Number(a.dias_acogida) > 90).length;

  const MOTIVOS_FIN: Record<string, string> = {
    adopted_by_family: '❤️ Adoptado por familia', adopted_other: '🏠 Adoptado otro',
    transferred: '🔄 Trasladado', returned: '🏛️ Devuelto', deceased: '🕊️ Fallecido',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-subtle)', minHeight: '100vh' }}>
      <TopBar
        titulo="Acogidas"
        subtitulo={vista === 'familias' ? `${familias.length} familias` : vista === 'activas' ? `${activas.length} activas` : `${total} finalizadas`}
        showNew={can('animales:update') && vista === 'familias'}
        newLabel="+ Añadir familia"
        onNew={() => setShowNuevaFamilia(true)}
      />

      {/* Sub-nav */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center' }}>
        {([
          { val: 'familias', label: '👨‍👩‍👧 Familias' },
          { val: 'activas', label: '🏠 Acogidas activas' },
          { val: 'historial', label: '📋 Historial' },
        ] as const).map(v => (
          <button key={v.val} onClick={() => setVista(v.val)} style={{
            padding: '12px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${vista === v.val ? '#16a34a' : 'transparent'}`,
            fontSize: 13.5, fontWeight: vista === v.val ? 700 : 400,
            color: vista === v.val ? '#16a34a' : 'var(--text-muted)', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {v.label}
            {v.val === 'activas' && alerts90 > 0 && (
              <span style={{ background: '#f97316', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>{alerts90}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filtros (solo familias) */}
      {vista === 'familias' && (
        <div style={{ padding: '12px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 260 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar familia..."
              style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }} />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
            <option value="all">Todos los estados</option>
            <option value="available">Disponibles</option>
            <option value="full">Ocupadas</option>
            <option value="paused">En pausa</option>
          </select>
          <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
            <option value="">Todas las especies</option>
            <option value="perro">🐕 Perros</option>
            <option value="gato">🐈 Gatos</option>
          </select>
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : vista === 'familias' ? (
          /* ── GRID FAMILIAS ─────────────────────────── */
          familiasFiltradas.length === 0 ? (
            <EmptyState icon="👨‍👩‍👧" title="Sin familias de acogida" subtitle="Añade la primera familia de acogida" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 8 }}>
              {familiasFiltradas.map(f => {
                const karma = KARMA_LEVEL(f.karma_puntos);
                const statusCfg = STATUS_CFG[f.estado];
                const slotsLibres = f.max_animales - f.animales_actuales;
                return (
                  <div key={f.id} style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1d4ed8', flexShrink: 0, overflow: 'hidden' }}>
                        {f.avatar_url ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : f.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{f.zona || f.ciudad || '—'}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                          <span style={{ fontSize: 11.5 }}>{karma.emoji} <strong style={{ color: karma.color }}>{f.karma_puntos}pts</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Slots */}
                    <div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 5 }}>Capacidad: {f.animales_actuales}/{f.max_animales}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {Array.from({ length: f.max_animales }, (_, i) => (
                          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i < f.animales_actuales ? '#16a34a' : 'var(--border)' }} />
                        ))}
                        <span style={{ fontSize: 11.5, color: slotsLibres > 0 ? '#16a34a' : '#d97706', fontWeight: 600, marginLeft: 6 }}>
                          {slotsLibres > 0 ? `${slotsLibres} libre${slotsLibres !== 1 ? 's' : ''}` : 'Completa'}
                        </span>
                      </div>
                    </div>

                    {/* Especies que acepta */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {f.acepta_perros && <span style={{ fontSize: 18 }}>🐕</span>}
                      {f.acepta_gatos && <span style={{ fontSize: 18 }}>🐈</span>}
                      {f.acepta_otros && <span style={{ fontSize: 18 }}>🐾</span>}
                      {f.tiene_jardin && <span style={{ fontSize: 16 }}>🌿</span>}
                      {f.acepta_necesidades_especiales && <span style={{ fontSize: 16 }}>♿</span>}
                      {f.acepta_cachorros && <span style={{ fontSize: 16 }}>🐣</span>}
                      {f.acepta_seniors && <span style={{ fontSize: 16 }}>🧓</span>}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <button onClick={() => setSelectedFamiliaId(f.id)} style={{ flex: 1, padding: '7px 0', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', fontSize: 12.5, cursor: 'pointer', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Ver perfil</button>
                      {can('animales:update') && (
                        <button onClick={() => setAsignarFamiliaId(f.id)} disabled={slotsLibres === 0} style={{
                          flex: 1, padding: '7px 0', border: 'none', borderRadius: 7,
                          background: slotsLibres > 0 ? '#16a34a' : 'var(--bg-subtle-2)',
                          color: slotsLibres > 0 ? '#fff' : 'var(--text-faint)',
                          fontSize: 12.5, cursor: slotsLibres > 0 ? 'pointer' : 'not-allowed',
                          fontWeight: 600, fontFamily: "'Inter', sans-serif",
                        }}>Asignar</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : vista === 'activas' ? (
          /* ── TABLA ACTIVAS ─────────────────────────── */
          <>
            {alerts90 > 0 && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 9, padding: '10px 16px', fontSize: 13, color: '#92400e', marginTop: 8, marginBottom: 4 }}>
                ⚠️ {alerts90} animal{alerts90 !== 1 ? 'es' : ''} llevan más de 90 días en acogida sin actualización
              </div>
            )}
            {activas.length === 0 ? (
              <EmptyState icon="🏠" title="Sin acogidas activas" subtitle="Asigna un animal a una familia para comenzar" />
            ) : (
              <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)' }}>
                      {['Animal', 'Familia de acogida', 'Inicio', 'Días', 'Último contacto', 'Acciones'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activas.map(a => {
                      const dias = Number(a.dias_acogida) || 0;
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, overflow: 'hidden', flexShrink: 0 }}>
                                {a.animal_foto ? <img src={a.animal_foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : a.animal_especie === 'perro' ? '🐕' : '🐈'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.animal_nombre}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{a.animal_especie} · {a.animal_raza}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{a.familia_nombre}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{a.familia_zona}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDate(a.iniciada_at)}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: DIAS_COLOR(dias), background: DIAS_COLOR(dias) + '20', padding: '3px 9px', borderRadius: 20 }}>
                              {dias}d
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: a.ultimo_contacto ? 'var(--text-secondary)' : '#dc2626' }}>
                            {a.ultimo_contacto ? formatDate(a.ultimo_contacto) : 'Sin contacto'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {can('animales:read') && (
                                <button onClick={() => setContactoData({ assignmentId: a.id, animalNombre: a.animal_nombre || '', familiaNombre: a.familia_nombre || '' })}
                                  style={{ padding: '4px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)', fontSize: 11.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                  📞 Contacto
                                </button>
                              )}
                              {can('animales:update') && (
                                <button onClick={() => setFinalizarData({ assignmentId: a.id, animalNombre: a.animal_nombre || '', familiaNombre: a.familia_nombre || '' })}
                                  style={{ padding: '4px 9px', border: '1px solid #fecaca', borderRadius: 6, background: 'var(--bg-surface)', fontSize: 11.5, cursor: 'pointer', color: '#dc2626', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                  Finalizar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* ── HISTORIAL ─────────────────────────────── */
          historial.length === 0 ? (
            <EmptyState icon="📋" title="Sin historial" subtitle="Las acogidas finalizadas aparecerán aquí" />
          ) : (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    {['Animal', 'Familia', 'Inicio', 'Fin', 'Duración', 'Resultado', 'Valoración'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13.5, fontWeight: 500 }}>{h.animal_nombre}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>{h.familia_nombre}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDate(h.iniciada_at)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDate(h.finalizada_at)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{Number(h.dias_totales) || '—'}d</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5 }}>{MOTIVOS_FIN[h.motivo_fin || ''] || h.motivo_fin || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {h.valoracion ? (
                          <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(h.valoracion)}{'☆'.repeat(5 - h.valoracion)}</span>
                        ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                    Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12.5, color: page === 1 ? 'var(--border)' : '#374151', fontFamily: "'Inter', sans-serif" }}>← Anterior</button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12.5, color: page === totalPages ? 'var(--border)' : '#374151', fontFamily: "'Inter', sans-serif" }}>Siguiente →</button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Modals / Panels */}
      {selectedFamiliaId && (
        <FamiliaPanel familiaId={selectedFamiliaId} onClose={() => setSelectedFamiliaId(null)}
          onUpdated={loadFamilias}
          onAsignar={(fId) => { setSelectedFamiliaId(null); setAsignarFamiliaId(fId); }} />
      )}
      {asignarFamiliaId && (
        <AsignarAcogidaModal familiaId={asignarFamiliaId} onClose={() => setAsignarFamiliaId(null)}
          onAsignado={() => { setAsignarFamiliaId(null); loadFamilias(); if (vista === 'activas') loadActivas(); }} />
      )}
      {showNuevaFamilia && (
        <NuevaFamiliaModal onClose={() => setShowNuevaFamilia(false)} onCreada={() => { setShowNuevaFamilia(false); loadFamilias(); }} />
      )}
      {contactoData && (
        <ContactoModal {...contactoData} onClose={() => setContactoData(null)} onSaved={loadActivas} />
      )}
      {finalizarData && (
        <FinalizarAcogidaModal {...finalizarData} onClose={() => setFinalizarData(null)}
          onFinalizada={() => { setFinalizarData(null); loadActivas(); }} />
      )}
    </div>
  );
}
