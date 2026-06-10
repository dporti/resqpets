import { useEffect, useState, useCallback } from 'react';
import { VoluntarioStats, Task, TaskStatus, RankingEntry } from '../types';
import { api } from '../api/client';
import { EmptyState, ErrorState, SkeletonList, formatDate } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TareaForm, { CAT_CFG, PRIO_CFG } from './TareaForm';
import VoluntarioPanel from './VoluntarioPanel';

// ── HELPERS ───────────────────────────────────────────
const KARMA_LEVEL = (pts: number) => {
  if (pts >= 1000) return { label: 'Diamante', emoji: '💎', color: '#06b6d4', bg: '#cffafe' };
  if (pts >= 600)  return { label: 'Platino',  emoji: '🏆', color: '#8b5cf6', bg: '#ede9fe' };
  if (pts >= 300)  return { label: 'Oro',      emoji: '🥇', color: '#f59e0b', bg: '#fef9c3' };
  if (pts >= 100)  return { label: 'Plata',    emoji: '🥈', color: '#6b7280', bg: '#f3f4f6' };
  return { label: 'Bronce', emoji: '🥉', color: '#92400e', bg: '#fef3c7' };
};

const ROL_CFG: Record<string, { label: string; bg: string; color: string }> = {
  admin:       { label: 'Admin',       bg: '#fee2e2', color: '#dc2626' },
  coordinador: { label: 'Coordinador', bg: '#dbeafe', color: '#2563eb' },
  voluntario:  { label: 'Voluntario',  bg: '#dcfce7', color: '#16a34a' },
};

const STATUS_COLS: { val: TaskStatus; label: string; color: string; bg: string }[] = [
  { val: 'pending',     label: 'Pendiente',    color: '#6b7280', bg: '#f3f4f6' },
  { val: 'in_progress', label: 'En progreso',  color: '#2563eb', bg: '#dbeafe' },
  { val: 'blocked',     label: 'Bloqueada',    color: '#dc2626', bg: '#fee2e2' },
  { val: 'completed',   label: 'Completada',   color: '#16a34a', bg: '#dcfce7' },
];

// ── TASK ITEM ─────────────────────────────────────────
function TaskRow({ task, onToggle, onEdit, onDelete, canManage }: {
  task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; canManage: boolean;
}) {
  const [toggling, setToggling] = useState(false);
  const cat = CAT_CFG[task.categoria];
  const prio = PRIO_CFG[task.prioridad];
  const completed = task.estado === 'completed';
  const vencida = task.fecha_limite && new Date(task.fecha_limite) < new Date() && !completed;
  const hoy = task.fecha_limite && new Date(task.fecha_limite).toDateString() === new Date().toDateString();

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(); } finally { setToggling(false); }
  };

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '11px 16px', alignItems: 'flex-start',
      borderBottom: '1px solid #f3f4f6', background: completed ? '#f9fafb' : '#fff',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => !completed && (e.currentTarget.style.background = '#f0fdf4')}
      onMouseLeave={e => !completed && (e.currentTarget.style.background = '#fff')}
    >
      {/* Checkbox */}
      <button onClick={handleToggle} disabled={toggling} style={{
        width: 22, height: 22, borderRadius: 6, border: `2px solid ${completed ? '#16a34a' : '#d1d5db'}`,
        background: completed ? '#16a34a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, marginTop: 1, color: '#fff', fontSize: 13, fontWeight: 700,
        transition: 'all 0.2s',
      }}>
        {toggling ? '...' : completed ? '✓' : ''}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: completed ? '#9ca3af' : '#111', textDecoration: completed ? 'line-through' : 'none', flex: 1 }}>{task.titulo}</span>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: prio.bg, color: prio.color, whiteSpace: 'nowrap' }}>{prio.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 11, background: cat?.bg, color: cat?.color, fontWeight: 500 }}>{cat?.icon} {cat?.label}</span>
          {task.animal_nombre && <span style={{ fontSize: 11.5, color: '#6b7280' }}>🐾 {task.animal_nombre}</span>}
          {task.fecha_limite && (
            <span style={{ fontSize: 11.5, color: vencida ? '#dc2626' : hoy ? '#f97316' : '#9ca3af', fontWeight: vencida || hoy ? 600 : 400 }}>
              {vencida ? '⚠️ ' : hoy ? '⏰ ' : '📅 '}{formatDate(task.fecha_limite)}
            </span>
          )}
          {task.asignados_info && task.asignados_info.length > 0 && (
            <div style={{ display: 'flex', gap: 3 }}>
              {task.asignados_info.slice(0, 3).map(a => (
                <div key={a.id} title={a.nombre} style={{ width: 20, height: 20, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#1d4ed8' }}>
                  {a.nombre.charAt(0)}
                </div>
              ))}
            </div>
          )}
        </div>
        {task.descripcion && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.descripcion}</div>}
      </div>

      {/* Actions */}
      {canManage && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ padding: '3px 8px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', fontSize: 11.5, cursor: 'pointer', color: '#374151', fontFamily: "'Inter', sans-serif" }}>✏️</button>
          <button onClick={onDelete} style={{ padding: '3px 8px', border: '1px solid #fecaca', borderRadius: 5, background: '#fff', fontSize: 11.5, cursor: 'pointer', color: '#dc2626', fontFamily: "'Inter', sans-serif" }}>🗑</button>
        </div>
      )}
    </div>
  );
}

// ── KANBAN ────────────────────────────────────────────
function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const cat = CAT_CFG[task.categoria];
  const prio = PRIO_CFG[task.prioridad];
  const vencida = task.fecha_limite && new Date(task.fecha_limite) < new Date() && task.estado !== 'completed';
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{
      background: '#fff', borderRadius: 9, border: '1px solid #e5e7eb', padding: '10px 12px',
      marginBottom: 7, cursor: 'grab', transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.8 : 1,
      boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 5 }}>{task.titulo}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: cat?.bg, color: cat?.color }}>{cat?.icon} {cat?.label}</span>
        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: prio.bg, color: prio.color, fontWeight: 600 }}>{prio.label}</span>
        {vencida && <span style={{ fontSize: 11, color: '#dc2626' }}>⚠️ Vencida</span>}
      </div>
      {task.asignados_info && task.asignados_info.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {task.asignados_info.slice(0, 3).map(a => (
            <div key={a.id} title={a.nombre} style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>
              {a.nombre.charAt(0)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanCol({ col, tasks, onDrop }: { col: typeof STATUS_COLS[0]; tasks: Task[]; onDrop: (id: number, st: TaskStatus) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.val });
  return (
    <div ref={setNodeRef} style={{ flex: '0 0 220px', minHeight: 400, background: isOver ? '#f0fdf4' : '#f9fafb', borderRadius: 10, padding: '12px 10px', border: `1px solid ${isOver ? '#86efac' : '#e5e7eb'}`, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: col.bg, color: col.color }}>{col.label}</span>
        <span style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600 }}>{tasks.length}</span>
      </div>
      {tasks.map(t => <KanbanCard key={t.id} task={t} />)}
    </div>
  );
}

// ── PODIO RANKING ─────────────────────────────────────
function Podio({ top3 }: { top3: RankingEntry[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [110, 140, 90];
  const pos = [2, 1, 3];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'flex-end', padding: '20px 0 0' }}>
      {order.map((entry, i) => {
        const karma = KARMA_LEVEL(entry.karma_total);
        return (
          <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {pos[i] === 1 && <span style={{ fontSize: 28 }}>👑</span>}
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#1d4ed8', border: `3px solid ${karma.color}` }}>
              {entry.avatar_url ? <img src={entry.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : entry.nombre.charAt(0)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{entry.nombre.split(' ')[0]}</div>
              <div style={{ fontSize: 12, color: karma.color, fontWeight: 600 }}>{karma.emoji} {entry.karma_periodo.toLocaleString('es-ES')} pts</div>
            </div>
            <div style={{
              width: 90, height: heights[i], background: i === 1 ? 'linear-gradient(180deg,#fde68a,#f59e0b)' : i === 0 ? 'linear-gradient(180deg,#e2e8f0,#94a3b8)' : 'linear-gradient(180deg,#fed7aa,#f97316)',
              borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
              fontSize: 24, fontWeight: 800, color: '#fff',
            }}>{pos[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────
export default function VoluntariosPage() {
  const { can, user } = useAuth();
  const [vista, setVista] = useState<'voluntarios' | 'tareas' | 'rankings'>('voluntarios');
  const [voluntarios, setVoluntarios] = useState<VoluntarioStats[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rankings, setRankings] = useState<{ voluntarios: RankingEntry[]; familias: RankingEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [taskViewMode, setTaskViewMode] = useState<'lista' | 'kanban'>('lista');
  const [rankingPeriodo, setRankingPeriodo] = useState<'mes' | 'año' | 'total'>('mes');
  const [rankingTab, setRankingTab] = useState<'voluntarios' | 'familias'>('voluntarios');
  const [selectedVolId, setSelectedVolId] = useState<number | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;
  const [showNuevoVol, setShowNuevoVol] = useState(false);
  const [nuevoVolForm, setNuevoVolForm] = useState({ nombre: '', email: '', password: '', rol: 'voluntario' });
  const [nuevoVolError, setNuevoVolError] = useState('');
  const [savingVol, setSavingVol] = useState(false);

  const loadVoluntarios = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const r = await api.getVoluntarios({ limit: LIMIT, page });
      setVoluntarios(r.data);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    }
    catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [page]);

  const loadTasks = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const params: Record<string, string> = {};
      if (filtroEstado !== 'todas') params.estado = filtroEstado;
      setTasks(await api.getTasks(params));
    } catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [filtroEstado]);

  const loadRankings = useCallback(async () => {
    setLoading(true); setError(false);
    try { setRankings(await api.getRankings(rankingPeriodo)); }
    catch (e) { console.error(e); setError(true); }
    finally { setLoading(false); }
  }, [rankingPeriodo]);

  const reload = useCallback(() => {
    if (vista === 'voluntarios') loadVoluntarios();
    else if (vista === 'tareas') loadTasks();
    else loadRankings();
  }, [vista, loadVoluntarios, loadTasks, loadRankings]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [vista]);

  const handleToggleTask = async (task: Task) => {
    await api.completeTask(task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, estado: t.estado === 'completed' ? 'pending' : 'completed' as TaskStatus } : t));
  };

  const handleDeleteTask = async (id: number) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || !active) return;
    const taskId = Number(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.estado === newStatus) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, estado: newStatus } : t));
    await api.updateTask(taskId, { estado: newStatus });
  };

  const handleCrearVoluntario = async () => {
    if (!nuevoVolForm.nombre || !nuevoVolForm.email || !nuevoVolForm.password) {
      setNuevoVolError('Todos los campos son requeridos');
      return;
    }
    setSavingVol(true);
    setNuevoVolError('');
    try {
      await api.createUsuario(nuevoVolForm);
      setShowNuevoVol(false);
      setNuevoVolForm({ nombre: '', email: '', password: '', rol: 'voluntario' });
      setPage(1);
      loadVoluntarios();
    } catch (e) {
      setNuevoVolError(e instanceof Error ? e.message : 'Error al crear voluntario');
    } finally {
      setSavingVol(false);
    }
  };

  const volsFiltrados = voluntarios.filter(v =>
    (!search || v.nombre.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filtroRol || v.rol === filtroRol)
  );

  const vencidas = tasks.filter(t => t.fecha_limite && new Date(t.fecha_limite) < new Date() && t.estado !== 'completed').length;
  const pendientesCount = tasks.filter(t => t.estado === 'pending').length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar
        titulo="Voluntarios"
        subtitulo={vista === 'voluntarios' ? `${total} voluntarios` : vista === 'tareas' ? `${tasks.length} tareas` : 'Rankings'}
        showNew={can('usuarios:manage') && vista === 'voluntarios'}
        newLabel="+ Añadir voluntario"
        onNew={() => setShowNuevoVol(true)}
      />

      {/* Sub-nav */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          {([
            { val: 'voluntarios', label: '👥 Voluntarios' },
            { val: 'tareas', label: '✅ Tareas' },
            { val: 'rankings', label: '🏆 Rankings' },
          ] as const).map(v => (
            <button key={v.val} onClick={() => setVista(v.val)} style={{
              padding: '12px 18px', background: 'none', border: 'none',
              borderBottom: `2px solid ${vista === v.val ? '#16a34a' : 'transparent'}`,
              fontSize: 13.5, fontWeight: vista === v.val ? 700 : 400,
              color: vista === v.val ? '#16a34a' : '#6b7280', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {v.label}
              {v.val === 'tareas' && vencidas > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>{vencidas}</span>
              )}
            </button>
          ))}
        </div>
        {vista === 'tareas' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {(['lista', 'kanban'] as const).map(m => (
              <button key={m} onClick={() => setTaskViewMode(m)} style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12.5, background: taskViewMode === m ? '#111827' : '#fff', color: taskViewMode === m ? '#fff' : '#6b7280', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {m === 'lista' ? '≡ Lista' : '⊟ Kanban'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TAB VOLUNTARIOS ── */}
      {vista === 'voluntarios' && (
        <div style={{ padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar voluntario..."
                style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }} />
            </div>
            <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="coordinador">Coordinador</option>
              <option value="voluntario">Voluntario</option>
            </select>
          </div>

          {loading ? (
            <SkeletonList rows={6} />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) :volsFiltrados.length === 0 ? (
            <EmptyState icon="👥" title="Sin voluntarios" subtitle="Añade el primer voluntario" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {volsFiltrados.map(v => {
                const karma = KARMA_LEVEL(v.karma_puntos || 0);
                const rolCfg = ROL_CFG[v.rol] || ROL_CFG.voluntario;
                return (
                  <div key={v.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: v.activo ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1d4ed8', overflow: 'hidden' }}>
                          {v.avatarUrl ? <img src={v.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v.nombre.charAt(0)}
                        </div>
                        {v.activo && v.es_disponible && (
                          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.nombre}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: rolCfg.bg, color: rolCfg.color }}>{rolCfg.label}</span>
                          <span style={{ fontSize: 11.5 }}>{karma.emoji} <strong style={{ color: karma.color }}>{v.karma_puntos || 0}pts</strong></span>
                        </div>
                      </div>
                    </div>

                    {v.especialidades && v.especialidades.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {v.especialidades.slice(0, 3).map(e => (
                          <span key={e} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>{e}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                      <div style={{ background: '#f9fafb', borderRadius: 7, padding: '6px 8px' }}>
                        <div style={{ color: '#9ca3af' }}>Tareas mes</div>
                        <div style={{ fontWeight: 700, color: '#111' }}>{v.tareas_mes || 0}</div>
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: 7, padding: '6px 8px' }}>
                        <div style={{ color: '#9ca3af' }}>Pendientes</div>
                        <div style={{ fontWeight: 700, color: (v.tareas_pendientes || 0) > 0 ? '#f59e0b' : '#111' }}>{v.tareas_pendientes || 0}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      <button onClick={() => setSelectedVolId(v.id)} style={{ flex: 1, padding: '7px 0', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', fontSize: 12.5, cursor: 'pointer', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Ver perfil</button>
                      {can('animales:update') && (
                        <button onClick={() => { setEditTask(null); setShowTaskForm(true); }} style={{ flex: 1, padding: '7px 0', border: 'none', borderRadius: 7, background: '#16a34a', color: '#fff', fontSize: 12.5, cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>+ Tarea</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', marginTop: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
                Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12.5, color: page === 1 ? '#d1d5db' : '#374151', fontFamily: "'Inter', sans-serif" }}>← Anterior</button>
                <span style={{ fontSize: 13, color: '#374151' }}>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12.5, color: page === totalPages ? '#d1d5db' : '#374151', fontFamily: "'Inter', sans-serif" }}>Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB TAREAS ── */}
      {vista === 'tareas' && (
        <div>
          {/* Alertas */}
          {vencidas > 0 && (
            <div style={{ margin: '12px 24px 0', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 9, padding: '10px 16px', fontSize: 13, color: '#92400e' }}>
              ⚠️ {vencidas} tarea{vencidas !== 1 ? 's' : ''} vencida{vencidas !== 1 ? 's' : ''} sin completar
            </div>
          )}

          {/* Filtros */}
          <div style={{ padding: '12px 24px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['todas', 'pending', 'in_progress', 'blocked', 'completed', 'vencidas'].map(e => (
                <button key={e} onClick={() => setFiltroEstado(e)} style={{
                  padding: '5px 12px', borderRadius: 20, border: '1px solid', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  borderColor: filtroEstado === e ? '#16a34a' : '#e5e7eb',
                  background: filtroEstado === e ? '#16a34a' : '#fff',
                  color: filtroEstado === e ? '#fff' : '#6b7280',
                  fontWeight: filtroEstado === e ? 600 : 400,
                }}>
                  {e === 'todas' ? 'Todas' : e === 'pending' ? 'Pendientes' : e === 'in_progress' ? 'En progreso' : e === 'blocked' ? 'Bloqueadas' : e === 'completed' ? 'Completadas' : `⚠️ Vencidas`}
                  {e === 'pending' && pendientesCount > 0 && <span style={{ marginLeft: 4, background: '#dc262620', color: '#dc2626', borderRadius: 10, padding: '0 5px', fontSize: 11 }}>{pendientesCount}</span>}
                </button>
              ))}
            </div>
            {can('animales:update') && (
              <button onClick={() => { setEditTask(null); setShowTaskForm(true); }} style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                + Nueva tarea
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonList rows={6} />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) :tasks.length === 0 ? (
            <div style={{ padding: '0 24px' }}><EmptyState icon="✅" title="Sin tareas" subtitle="Crea la primera tarea del equipo" /></div>
          ) : taskViewMode === 'lista' ? (
            <div style={{ margin: '0 24px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {tasks.map(t => (
                <TaskRow key={t.id} task={t}
                  onToggle={() => handleToggleTask(t)}
                  onEdit={() => { setEditTask(t); setShowTaskForm(true); }}
                  onDelete={() => handleDeleteTask(t.id)}
                  canManage={can('animales:update')}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '0 24px 24px' }}>
              <DndContext onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
                  {STATUS_COLS.map(col => (
                    <KanbanCol key={col.val} col={col} tasks={tasks.filter(t => t.estado === col.val)}
                      onDrop={(id, st) => api.updateTask(id, { estado: st })} />
                  ))}
                </div>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* ── TAB RANKINGS ── */}
      {vista === 'rankings' && (
        <div style={{ padding: '16px 24px 24px' }}>
          {/* Período */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['mes', 'año', 'total'] as const).map(p => (
                <button key={p} onClick={() => setRankingPeriodo(p)} style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 13,
                  borderColor: rankingPeriodo === p ? '#16a34a' : '#e5e7eb',
                  background: rankingPeriodo === p ? '#16a34a' : '#fff',
                  color: rankingPeriodo === p ? '#fff' : '#6b7280',
                  fontWeight: rankingPeriodo === p ? 600 : 400, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>{p === 'mes' ? 'Este mes' : p === 'año' ? 'Este año' : 'Histórico'}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['voluntarios', 'familias'] as const).map(t => (
                <button key={t} onClick={() => setRankingTab(t)} style={{
                  padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13,
                  background: rankingTab === t ? '#111827' : '#fff', color: rankingTab === t ? '#fff' : '#6b7280',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>{t === 'voluntarios' ? '👥 Voluntarios' : '🏠 Familias'}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonList rows={6} />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) :!rankings ? null : (
            <>
              {/* Podio */}
              {(() => {
                const list = rankingTab === 'voluntarios' ? rankings.voluntarios : rankings.familias;
                if (list.length >= 2) return <Podio top3={list.slice(0, 3)} />;
                return null;
              })()}

              {/* Tabla */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['#', rankingTab === 'voluntarios' ? 'Voluntario' : 'Familia', 'Nivel', 'Puntos período', 'Total', rankingTab === 'voluntarios' ? 'Tareas mes' : 'Acogidas', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rankingTab === 'voluntarios' ? rankings.voluntarios : rankings.familias).map((entry, i) => {
                      const karma = KARMA_LEVEL(entry.karma_total);
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '11px 14px', fontSize: 13.5, fontWeight: 700, color: '#111' }}>{medal || `#${i + 1}`}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1d4ed8', flexShrink: 0 }}>
                                {entry.nombre.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{entry.nombre}</div>
                                {entry.rol && <div style={{ fontSize: 11.5, color: '#9ca3af', textTransform: 'capitalize' }}>{entry.rol}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: karma.bg, color: karma.color }}>
                              {karma.emoji} {karma.label}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{entry.karma_periodo.toLocaleString('es-ES')}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6b7280' }}>{entry.karma_total.toLocaleString('es-ES')}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151' }}>
                            {rankingTab === 'voluntarios' ? (entry.tareas_mes || 0) : (entry.acogidas_total || 0)}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            {rankingTab === 'voluntarios' && (
                              <button onClick={() => setSelectedVolId(entry.id)} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Ver</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Beneficios */}
              <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px 20px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 12 }}>Beneficios por nivel</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { emoji: '🥉', nivel: 'Bronce', pts: '0-99', beneficio: 'Acceso básico al CRM' },
                    { emoji: '🥈', nivel: 'Plata', pts: '100-299', beneficio: 'Pienso bonificado 5kg/mes' },
                    { emoji: '🥇', nivel: 'Oro', pts: '300-599', beneficio: 'Descuento 20% veterinario partner' },
                    { emoji: '🏆', nivel: 'Platino', pts: '600-999', beneficio: 'Merchandising ResQPet exclusivo' },
                    { emoji: '💎', nivel: 'Diamante', pts: '1000+', beneficio: 'Eventos exclusivos' },
                  ].map(b => (
                    <div key={b.nivel} style={{ flex: '1 1 150px', background: '#f9fafb', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{b.emoji}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111' }}>{b.nivel}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{b.pts} pts</div>
                      <div style={{ fontSize: 12, color: '#374151' }}>{b.beneficio}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Panels / Modals */}
      {selectedVolId && (
        <VoluntarioPanel voluntarioId={selectedVolId} onClose={() => setSelectedVolId(null)} onUpdated={loadVoluntarios} />
      )}
      {showTaskForm && (
        <TareaForm tarea={editTask} onClose={() => { setShowTaskForm(false); setEditTask(null); }}
          onSaved={saved => {
            setTasks(prev => editTask ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
            setShowTaskForm(false); setEditTask(null);
          }} />
      )}

      {/* Modal nuevo voluntario */}
      {showNuevoVol && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowNuevoVol(false)}>
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>Añadir voluntario</h2>
            {(['nombre', 'email', 'password'] as const).map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  {field === 'password' ? 'Contraseña' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={nuevoVolForm[field]}
                  onChange={e => setNuevoVolForm({ ...nuevoVolForm, [field]: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Rol</label>
              <select
                value={nuevoVolForm.rol}
                onChange={e => setNuevoVolForm({ ...nuevoVolForm, rol: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: "'Inter', sans-serif" }}
              >
                <option value="voluntario">Voluntario</option>
                <option value="coordinador">Coordinador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {nuevoVolError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                {nuevoVolError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNuevoVol(false)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >Cancelar</button>
              <button
                onClick={handleCrearVoluntario}
                disabled={savingVol}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >{savingVol ? 'Guardando...' : 'Crear voluntario'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
