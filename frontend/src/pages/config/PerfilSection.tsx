import { useState } from 'react';
import { api } from '../../api/client';
import { SectionCard, Field, SaveButton, inp, Skel, Refugio } from './shared';

interface Props { refugio: Refugio; onSave: (data: Partial<Refugio>) => Promise<void>; loading: boolean }

export function PerfilSection({ refugio, onSave, loading }: Props) {
  const [form, setForm] = useState<Refugio>({ ...refugio });
  const [geocoding, setGeocoding] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const set = (k: keyof Refugio, v: string) => setForm(p => ({ ...p, [k]: v }));

  const geocode = async () => {
    if (!form.direccion && !form.ciudad) return;
    setGeocoding(true);
    try {
      const r = await api.get<{ lat: number; lng: number; display: string }>(
        `/config/geocode?address=${encodeURIComponent(`${form.direccion || ''} ${form.ciudad || ''}`)}`,
      );
      alert(`Coordenadas: ${r.lat}, ${r.lng}\n${r.display}`);
    } catch {
      alert('No se encontraron coordenadas para esa dirección');
    } finally { setGeocoding(false); }
  };

  const uploadFile = async (file: File, type: 'logo' | 'cover') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('assetType', type);
    const token = localStorage.getItem('resqpet_token');
    const res = await fetch('/api/config/upload-asset', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (!res.ok) throw new Error('Error al subir');
    return (await res.json()).url as string;
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile(e.target.files[0], 'logo');
      setForm(p => ({ ...p, logo_url: url }));
    } catch { alert('Error al subir logo'); }
    finally { setLogoUploading(false); }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setCoverUploading(true);
    try {
      const url = await uploadFile(e.target.files[0], 'cover');
      setForm(p => ({ ...p, cover_url: url }));
    } catch { alert('Error al subir portada'); }
    finally { setCoverUploading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => <Skel key={i} />)}
    </div>
  );

  const slugPreview = form.slug || (form.nombre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div>
      <SectionCard title="Identidad de la protectora">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Nombre de la protectora *">
            <input style={inp} value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} />
          </Field>
          <Field label="Slug / URL pública" hint={`resqpet.com/protectoras/${slugPreview}`}>
            <input style={inp} value={form.slug || ''} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder={slugPreview} />
          </Field>
        </div>
        <Field label="Descripción corta (portal público)" hint={`${(form.description_public || '').length}/160 caracteres`}>
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} maxLength={160}
            value={form.description_public || ''} onChange={e => set('description_public', e.target.value)}
            placeholder="Descripción breve para la tarjeta de la protectora" />
        </Field>

        {/* Logo + Cover */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 16 }}>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Logo circular</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4',
                border: '2px solid var(--border)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}>
                {form.logo_url ? <img src={form.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
              </div>
              <label style={{ cursor: 'pointer', padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                {logoUploading ? 'Subiendo...' : 'Cambiar logo'}
                <input type="file" accept="image/*" hidden onChange={handleLogoChange} disabled={logoUploading} />
              </label>
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Imagen de portada (16:9)</p>
            <div style={{
              height: 72, borderRadius: 10, background: form.cover_url ? `url(${form.cover_url}) center/cover` : '#f0fdf4',
              border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
            }}>
              <label style={{ cursor: 'pointer', padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,.9)' }}>
                {coverUploading ? 'Subiendo...' : '📷 Cambiar portada'}
                <input type="file" accept="image/*" hidden onChange={handleCoverChange} disabled={coverUploading} />
              </label>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Contacto y ubicación">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Email de contacto público">
            <input style={inp} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Teléfono público">
            <input style={inp} type="tel" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} />
          </Field>
          <Field label="Dirección">
            <input style={inp} value={form.direccion || ''} onChange={e => set('direccion', e.target.value)} placeholder="Calle, número, etc." />
          </Field>
          <Field label="Ciudad">
            <input style={inp} value={form.ciudad || ''} onChange={e => set('ciudad', e.target.value)} />
          </Field>
        </div>
        <button onClick={geocode} disabled={geocoding} style={{
          padding: '7px 16px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)',
          cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4,
        }}>
          {geocoding ? '🔍 Buscando...' : '🗺️ Obtener coordenadas GPS de la dirección'}
        </button>
      </SectionCard>

      <SectionCard title="Redes sociales y web">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { k: 'website' as const,   label: '🌐 Web propia',  ph: 'https://...' },
            { k: 'instagram' as const, label: '📸 Instagram',    ph: '@protectora' },
            { k: 'facebook' as const,  label: 'Facebook',        ph: 'facebook.com/...' },
          ].map(s => (
            <Field key={s.k} label={s.label}>
              <input style={inp} value={(form as unknown as Record<string, string>)[s.k] || ''} onChange={e => set(s.k, e.target.value)} placeholder={s.ph} />
            </Field>
          ))}
        </div>
      </SectionCard>

      {/* Preview tarjeta portal */}
      <SectionCard title="Preview tarjeta portal público">
        <div style={{
          border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
          maxWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        }}>
          <div style={{ height: 70, background: form.cover_url ? `url(${form.cover_url}) center/cover` : 'linear-gradient(135deg,#064e3b,#059669)', position: 'relative' }}>
            <div style={{
              position: 'absolute', bottom: -18, left: 16, width: 40, height: 40,
              borderRadius: 10, background: 'var(--bg-surface)', border: '2px solid #fff',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {form.logo_url ? <img src={form.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
            </div>
          </div>
          <div style={{ padding: '26px 16px 16px' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{form.nombre || 'Nombre de la protectora'}</p>
            {form.ciudad && <p style={{ margin: '2px 0 6px', fontSize: 12, color: 'var(--text-muted)' }}>📍 {form.ciudad}</p>}
            {form.description_public && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{form.description_public.slice(0, 80)}...</p>}
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onSave={async () => onSave(form)} />
      </div>
    </div>
  );
}
