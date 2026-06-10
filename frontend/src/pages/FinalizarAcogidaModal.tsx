import { useState, FormEvent } from 'react';
import { api } from '../api/client';
import { Spinner } from '../components/ui';

interface Props {
  assignmentId: number;
  animalNombre: string;
  familiaNombre: string;
  onClose: () => void;
  onFinalizada: () => void;
}

const MOTIVOS = [
  { val: 'adopted_by_family', label: '❤️ Animal adoptado por la familia de acogida' },
  { val: 'adopted_other', label: '🏠 Animal adoptado por otra familia' },
  { val: 'transferred', label: '🔄 Trasladado a otra acogida' },
  { val: 'returned', label: '🏛️ Devuelto a residencia en protectora' },
  { val: 'deceased', label: '🕊️ Animal fallecido durante la acogida' },
];

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' };

function Stars({ val, onChange }: { val: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          style={{ fontSize: 28, cursor: 'pointer', color: i <= (hover || val) ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </div>
  );
}

export default function FinalizarAcogidaModal({ assignmentId, animalNombre, familiaNombre, onClose, onFinalizada }: Props) {
  const [form, setForm] = useState({
    motivo_fin: '',
    finalizada_at: new Date().toISOString().slice(0, 10),
    valoracion: 0,
    notas_valoracion: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.motivo_fin) return;
    setSaving(true);
    try {
      await api.finalizarAcogida(assignmentId, form);
      onFinalizada(); onClose();
    } finally { setSaving(false); }
  };

  const motivoCfg = MOTIVOS.find(m => m.val === form.motivo_fin);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-surface)', borderRadius: 14, width: 500, maxHeight: '90vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Finalizar acogida</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{animalNombre} · {familiaNombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-faint)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Motivo de finalización *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOTIVOS.map(m => (
                <label key={m.val} style={{
                  display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px',
                  borderRadius: 9, border: `2px solid ${form.motivo_fin === m.val ? '#16a34a' : 'var(--border)'}`,
                  background: form.motivo_fin === m.val ? '#f0fdf4' : 'var(--bg-surface)', cursor: 'pointer',
                  fontSize: 13.5, color: 'var(--text-secondary)',
                }}>
                  <input type="radio" name="motivo" value={m.val} checked={form.motivo_fin === m.val} onChange={() => set('motivo_fin', m.val)} style={{ accentColor: '#16a34a' }} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          {form.motivo_fin === 'adopted_by_family' && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 9, padding: '12px 14px', fontSize: 13, color: '#15803d' }}>
              ✨ Se creará automáticamente un expediente de adopción y se sumará karma a la familia.
            </div>
          )}

          <div>
            <label style={lbl}>Fecha de finalización</label>
            <input type="date" style={inp} value={form.finalizada_at} onChange={e => set('finalizada_at', e.target.value)} />
          </div>

          <div>
            <label style={{ ...lbl, marginBottom: 8 }}>Valoración de la acogida</label>
            <Stars val={form.valoracion} onChange={v => set('valoracion', v)} />
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>La familia recibirá {form.valoracion === 5 ? '+10' : '0'} puntos de karma extra por esta valoración</div>
          </div>

          <div>
            <label style={lbl}>Comentarios sobre la acogida</label>
            <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.notas_valoracion} onChange={e => set('notas_valoracion', e.target.value)} placeholder="Observaciones, agradecimientos, áreas de mejora..." />
          </div>

          {form.motivo_fin && (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 9, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Resultado: </strong>{motivoCfg?.label}
              {form.valoracion > 0 && ` · ${form.valoracion}⭐`}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving || !form.motivo_fin} style={{ padding: '8px 20px', background: form.motivo_fin ? '#16a34a' : 'var(--border)', color: form.motivo_fin ? '#fff' : '#9ca3af', border: 'none', borderRadius: 7, fontWeight: 600, cursor: form.motivo_fin ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving ? <><Spinner size={14} /> Procesando...</> : '✓ Finalizar acogida'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
