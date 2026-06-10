import { useState, useEffect, FormEvent } from 'react';
import { Task, TaskCategoria, TaskPriority, VoluntarioStats } from '../types';
import { api } from '../api/client';
import { Spinner } from '../components/ui';

interface Props {
  tarea?: Task | null;
  onClose: () => void;
  onSaved: (t: Task) => void;
}

export const CAT_CFG: Record<TaskCategoria, { icon: string; label: string; color: string; bg: string }> = {
  medica:          { icon: '🏥', label: 'Médica',         color: '#2563eb', bg: '#dbeafe' },
  acogida:         { icon: '🏠', label: 'Acogida',        color: '#16a34a', bg: '#dcfce7' },
  administrativa:  { icon: '📋', label: 'Administrativa', color: '#d97706', bg: '#fef9c3' },
  difusion:        { icon: '📸', label: 'Difusión',       color: '#9333ea', bg: '#f3e8ff' },
  transporte:      { icon: '🚗', label: 'Transporte',     color: '#f97316', bg: '#ffedd5' },
  adopcion:        { icon: '🎯', label: 'Adopción',       color: '#ec4899', bg: '#fce7f3' },
  mantenimiento:   { icon: '🔧', label: 'Mantenimiento',  color: '#6b7280', bg: '#f3f4f6' },
};

export const PRIO_CFG: Record<TaskPriority, { label: string; color: string; bg: string; pts: number }> = {
  alta:  { label: 'Alta',  color: '#dc2626', bg: '#fee2e2', pts: 10 },
  media: { label: 'Media', color: '#d97706', bg: '#fef9c3', pts: 5 },
  baja:  { label: 'Baja',  color: '#16a34a', bg: '#dcfce7', pts: 2 },
};

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };

export default function TareaForm({ tarea, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    titulo: tarea?.titulo || '',
    descripcion: tarea?.descripcion || '',
    categoria: tarea?.categoria || 'administrativa' as TaskCategoria,
    prioridad: tarea?.prioridad || 'media' as TaskPriority,
    fecha_limite: tarea?.fecha_limite?.slice(0, 10) || '',
    asignado_a: tarea?.asignado_a || [] as number[],
    animal_id: tarea?.animal_id?.toString() || '',
    es_recurrente: tarea?.es_recurrente || false,
    frecuencia: tarea?.frecuencia || 'semanal',
    notas: tarea?.notas || '',
  });
  const [voluntarios, setVoluntarios] = useState<VoluntarioStats[]>([]);
  const [animales, setAnimales] = useState<{ id: number; nombre: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getVoluntarios({ limit: 100 }).then(r => setVoluntarios(r.data.filter(u => u.activo)));
    api.getAnimales({ limit: '100' }).then(r => setAnimales(r.data.map(a => ({ id: a.id, nombre: a.nombre }))));
  }, []);

  const toggleAsignado = (id: number) =>
    setForm(f => ({ ...f, asignado_a: f.asignado_a.includes(id) ? f.asignado_a.filter(x => x !== id) : [...f.asignado_a, id] }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, animal_id: form.animal_id ? Number(form.animal_id) : undefined };
      const saved = tarea ? await api.updateTask(tarea.id, payload) : await api.createTask(payload);
      onSaved(saved as Task);
    } finally { setSaving(false); }
  };

  const prio = PRIO_CFG[form.prioridad];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 560, maxHeight: '92vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{tarea ? 'Editar tarea' : 'Nueva tarea'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Título *</label>
            <input style={inp} value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Descripción corta de la tarea" autoFocus />
          </div>

          <div>
            <label style={lbl}>Categoría</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Object.entries(CAT_CFG) as [TaskCategoria, typeof CAT_CFG[TaskCategoria]][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, categoria: k }))} style={{
                  padding: '5px 11px', borderRadius: 20, border: `2px solid ${form.categoria === k ? v.color : '#e5e7eb'}`,
                  background: form.categoria === k ? v.bg : '#fff',
                  color: form.categoria === k ? v.color : '#6b7280',
                  fontSize: 12.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontWeight: form.categoria === k ? 700 : 400,
                }}>{v.icon} {v.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Prioridad <span style={{ fontSize: 11, color: prio.color, fontWeight: 700 }}>(+{prio.pts} karma al completar)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.entries(PRIO_CFG) as [TaskPriority, typeof PRIO_CFG[TaskPriority]][]).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, prioridad: k }))} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: `2px solid ${form.prioridad === k ? v.color : '#e5e7eb'}`,
                  background: form.prioridad === k ? v.bg : '#fff', color: form.prioridad === k ? v.color : '#6b7280',
                  fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: form.prioridad === k ? 700 : 400,
                }}>{v.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Fecha límite</label>
              <input type="date" style={inp} value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Animal relacionado</label>
              <select style={inp} value={form.animal_id} onChange={e => setForm(f => ({ ...f, animal_id: e.target.value }))}>
                <option value="">Sin animal</option>
                {animales.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Asignar a voluntarios</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto', padding: 4 }}>
              {voluntarios.map(v => {
                const sel = form.asignado_a.includes(v.id);
                return (
                  <button key={v.id} type="button" onClick={() => toggleAsignado(v.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
                    borderRadius: 20, border: `2px solid ${sel ? '#16a34a' : '#e5e7eb'}`,
                    background: sel ? '#f0fdf4' : '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>
                      {v.nombre.charAt(0)}
                    </div>
                    <span style={{ fontSize: 12.5, color: sel ? '#16a34a' : '#374151', fontWeight: sel ? 600 : 400 }}>{v.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={lbl}>Descripción / Notas</label>
            <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalles adicionales..." />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer', padding: '8px 10px', background: '#f9fafb', borderRadius: 8 }}>
            <input type="checkbox" checked={form.es_recurrente} onChange={e => setForm(f => ({ ...f, es_recurrente: e.target.checked }))} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
            <span style={{ fontWeight: 500 }}>🔄 Tarea recurrente</span>
          </label>

          {form.es_recurrente && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Frecuencia</label>
                <select style={inp} value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))}>
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving || !form.titulo.trim()} style={{
              padding: '8px 22px', background: form.titulo.trim() ? '#16a34a' : '#e5e7eb',
              color: form.titulo.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 7,
              fontWeight: 600, cursor: form.titulo.trim() ? 'pointer' : 'not-allowed',
              fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {saving ? <Spinner size={14} /> : null}
              {tarea ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
