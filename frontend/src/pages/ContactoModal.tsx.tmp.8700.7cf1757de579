import { useState, FormEvent } from 'react';
import { api } from '../api/client';
import { Spinner } from '../components/ui';

interface Props {
  assignmentId: number;
  animalNombre: string;
  familiaNombre: string;
  onClose: () => void;
  onSaved: () => void;
}

const TIPOS = [
  { val: 'llamada', label: '📞 Llamada', },
  { val: 'visita', label: '🏠 Visita presencial' },
  { val: 'videollamada', label: '💻 Videollamada' },
  { val: 'whatsapp', label: '💬 WhatsApp' },
];

const ESTADOS_ANIMAL = [
  { val: 'muy_bien', label: '😄 Muy bien' },
  { val: 'bien', label: '🙂 Bien' },
  { val: 'regular', label: '😐 Regular' },
  { val: 'mal', label: '😟 Mal' },
];

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };

export default function ContactoModal({ assignmentId, animalNombre, familiaNombre, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    tipo: 'llamada',
    contactado_at: new Date().toISOString().slice(0, 16),
    estado_animal: 'bien',
    notas: '',
    requiere_accion: false,
    descripcion_accion: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createContacto(assignmentId, form);
      onSaved(); onClose();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 480, maxHeight: '90vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Registrar contacto</div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 2 }}>{animalNombre} · {familiaNombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Tipo de contacto</label>
              <select style={inp} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                {TIPOS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Fecha y hora</label>
              <input type="datetime-local" style={inp} value={form.contactado_at} onChange={e => set('contactado_at', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Estado general del animal</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ESTADOS_ANIMAL.map(e => (
                <button key={e.val} type="button" onClick={() => set('estado_animal', e.val)} style={{
                  flex: 1, padding: '8px 4px', border: `2px solid ${form.estado_animal === e.val ? '#16a34a' : '#e5e7eb'}`,
                  borderRadius: 8, background: form.estado_animal === e.val ? '#f0fdf4' : '#fff',
                  fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontWeight: form.estado_animal === e.val ? 600 : 400, color: form.estado_animal === e.val ? '#15803d' : '#6b7280',
                }}>{e.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Notas de la conversación</label>
            <textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="¿Cómo está el animal? ¿Algún comentario de la familia?" />
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer', padding: '10px 12px', background: form.requiere_accion ? '#fef9c3' : '#f9fafb', borderRadius: 8 }}>
            <input type="checkbox" checked={form.requiere_accion} onChange={e => set('requiere_accion', e.target.checked)} style={{ accentColor: '#d97706', width: 16, height: 16 }} />
            <span style={{ fontWeight: 600, color: form.requiere_accion ? '#92400e' : '#374151' }}>⚠️ Requiere acción</span>
          </label>

          {form.requiere_accion && (
            <div>
              <label style={lbl}>Descripción de la acción requerida</label>
              <input style={inp} value={form.descripcion_accion} onChange={e => set('descripcion_accion', e.target.value)} placeholder="¿Qué hay que hacer?" />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving ? <><Spinner size={14} /> Guardando...</> : '✓ Guardar contacto'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
