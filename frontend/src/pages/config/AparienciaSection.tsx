import { useState } from 'react';
import { SectionCard, SaveButton, Toggle, Field, inp, PRESET_COLORS, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

export function AparienciaSection({ config, onSave }: Props) {
  const [color, setColor] = useState(config.primary_color || '#22c55e');
  const [name, setName] = useState(config.crm_display_name || '');
  const [density, setDensity] = useState(config.interface_density || 'normal');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('resqpet_dark') === 'true');

  const applyColor = (c: string) => {
    setColor(c);
    document.documentElement.style.setProperty('--color-primary', c);
  };

  const toggleDark = (v: boolean) => {
    setDarkMode(v);
    localStorage.setItem('resqpet_dark', String(v));
  };

  return (
    <div>
      <SectionCard title="Color principal" description="Personaliza el color de los botones, badges y elementos activos del CRM">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Colores predefinidos</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 280 }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => applyColor(c)} style={{
                  width: 32, height: 32, borderRadius: 8, background: c, border: 'none',
                  cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2, boxShadow: color === c ? '0 0 0 2px #fff inset' : 'none',
                  transition: 'transform .1s',
                }} title={c} />
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Color personalizado</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={color} onChange={e => applyColor(e.target.value)} style={{ width: 48, height: 48, borderRadius: 10, border: '1.5px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
              <input style={{ ...inp, width: 110 }} value={color} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) applyColor(e.target.value); }} placeholder="#22c55e" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 10, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Preview:</p>
          <button style={{ padding: '8px 18px', background: color, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Botón principal</button>
          <span style={{ background: color + '20', color: color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Badge activo</span>
          <a href="#" onClick={e => e.preventDefault()} style={{ color, fontWeight: 600, fontSize: 13 }}>Enlace de ejemplo</a>
        </div>
      </SectionCard>

      <SectionCard title="Nombre del CRM">
        <Field label="Nombre mostrado en el header" hint="Deja vacío para usar el nombre de la protectora">
          <input style={{ ...inp, maxWidth: 340 }} value={name} onChange={e => setName(e.target.value)} placeholder="Ej: CRM Huella Viva" />
        </Field>
      </SectionCard>

      <SectionCard title="Interfaz">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Modo oscuro</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Pendiente de implementar (guardado en preferencias del navegador)</p>
            </div>
            <Toggle checked={darkMode} onChange={toggleDark} />
          </div>

          <div>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13, color: '#374151' }}>Densidad de la interfaz</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'compact', label: '📐 Compacta', desc: 'Más información en pantalla' },
                { id: 'normal',  label: '🖥️ Normal',   desc: 'Balance entre densidad y legibilidad' },
                { id: 'spacious',label: '🌿 Espaciada',desc: 'Mayor espacio para leer' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDensity(opt.id)} style={{
                  flex: 1, padding: '12px', border: '2px solid', cursor: 'pointer', textAlign: 'center',
                  borderColor: density === opt.id ? color : '#e5e7eb',
                  background: density === opt.id ? color + '10' : '#fff',
                  borderRadius: 10,
                }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: density === opt.id ? color : '#374151' }}>{opt.label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9ca3af' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onSave={() => onSave({ primary_color: color, crm_display_name: name, interface_density: density })} />
      </div>
    </div>
  );
}
