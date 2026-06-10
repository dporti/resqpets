import React, { useState } from 'react';
import { api } from '../../api/client';
import { PRESET_COLORS } from '../config/shared';

interface Campaign {
  id?: number; name: string; slug?: string; description_short?: string; description_long?: string;
  cover_image_url?: string; goal_amount?: number; status?: string;
  starts_at?: string; ends_at?: string; is_public?: boolean;
  show_on_animal_profiles?: boolean; primary_color?: string;
}
interface Props { campaign?: Campaign; onClose: () => void; onSaved: () => void }

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 };

export function CampanaModal({ campaign, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Campaign>({
    name: '', status: 'draft', is_public: true, show_on_animal_profiles: false,
    primary_color: '#16a34a', goal_amount: 0, ...campaign,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Campaign, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const autoSlug = (name: string) => name.toLowerCase().replace(/[áéíóúñ]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n' })[c]||c).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const save = async () => {
    if (!form.name) { setError('El nombre es requerido'); return; }
    setLoading(true); setError('');
    try {
      const payload = { ...form, slug: form.slug || autoSlug(form.name) };
      if (campaign?.id) await api.put(`/donations/campaigns/${campaign.id}`, payload);
      else await api.post('/donations/campaigns', payload);
      onSaved(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{campaign ? 'Editar campaña' : 'Nueva campaña'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-faint)' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input style={inp} value={form.name} onChange={e => { set('name', e.target.value); if (!campaign) set('slug', autoSlug(e.target.value)); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Slug (URL)</label>
              <input style={inp} value={form.slug || ''} onChange={e => set('slug', e.target.value)} placeholder={autoSlug(form.name || 'nombre')} />
            </div>
            <div>
              <label style={lbl}>Objetivo (€)</label>
              <input type="number" min="0" style={inp} value={form.goal_amount || ''} onChange={e => set('goal_amount', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Descripción corta (widget público)</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} value={form.description_short || ''} onChange={e => set('description_short', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ v:'draft',l:'📝 Borrador'},{v:'active',l:'🟢 Activa'},{v:'paused',l:'⏸ Pausada'},{v:'completed',l:'✅ Finalizada'}].map(s => (
                <button key={s.v} onClick={() => set('status', s.v)} style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                  border: '1.5px solid', borderColor: form.status === s.v ? '#16a34a' : 'var(--border)',
                  background: form.status === s.v ? '#f0fdf4' : 'var(--bg-surface)', color: form.status === s.v ? '#16a34a' : '#374151',
                  fontWeight: form.status === s.v ? 700 : 400,
                }}>{s.l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Fecha inicio</label><input type="date" style={inp} value={form.starts_at?.slice(0,10) || ''} onChange={e => set('starts_at', e.target.value)} /></div>
            <div><label style={lbl}>Fecha fin</label><input type="date" style={inp} value={form.ends_at?.slice(0,10) || ''} onChange={e => set('ends_at', e.target.value)} /></div>
          </div>
          <div>
            <label style={lbl}>Color temático</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_COLORS.slice(0, 8).map(c => (
                <button key={c} onClick={() => set('primary_color', c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer', outline: form.primary_color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
              <input type="color" value={form.primary_color || '#16a34a'} onChange={e => set('primary_color', e.target.value)} style={{ width: 36, height: 28, borderRadius: 6, border: '1.5px solid var(--border)', cursor: 'pointer', padding: 2 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { k: 'is_public' as const, l: 'Mostrar en el portal público' },
              { k: 'show_on_animal_profiles' as const, l: 'Mostrar widget en fichas de animales' },
            ].map(row => (
              <label key={row.k} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={!!form[row.k]} onChange={e => set(row.k, e.target.checked)} style={{ accentColor: '#16a34a' }} />
                {row.l}
              </label>
            ))}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{error}</p>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--bg-subtle-2)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={save} disabled={loading} style={{ flex: 2, padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {loading ? 'Guardando...' : campaign ? 'Guardar cambios' : 'Crear campaña'}
          </button>
        </div>
      </div>
    </div>
  );
}
