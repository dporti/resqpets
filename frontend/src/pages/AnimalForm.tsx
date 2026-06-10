import { useState, FormEvent } from 'react';
import { Animal } from '../types';
import { api } from '../api/client';
import { Spinner } from '../components/ui';

interface Props {
  animal: Animal | null;
  onClose: () => void;
  onSaved: () => void;
}

type FormData = {
  nombre: string; especie: string; raza: string; sexo: string;
  fecha_nacimiento: string; peso_kg: string; estado: string;
  ubicacion_texto: string; procedencia: string; fecha_entrada: string;
  estado_salud: string; esterilizado: boolean; vacunado: boolean;
  desparasitado: boolean; microchip: boolean; num_microchip: string; pasaporte: boolean;
  color: string; tipo_pelo: string; ojos: string; tamaño: string; señas_particulares: string;
  nivel_actividad: number; soc_perros: number; soc_gatos: number; soc_niños: number;
  hogar_ideal: string; experiencia_previa: string; descripcion: string;
};

function initForm(a: Animal | null): FormData {
  return {
    nombre: a?.nombre || '',
    especie: a?.especie || 'perro',
    raza: a?.raza || '',
    sexo: a?.sexo || '',
    fecha_nacimiento: (a?.fecha_nacimiento || '').toString().slice(0, 10),
    peso_kg: a?.peso_kg?.toString() || '',
    estado: a?.estado || 'en_evaluacion',
    ubicacion_texto: a?.ubicacion_texto || '',
    procedencia: a?.procedencia || '',
    fecha_entrada: (a?.fecha_entrada || '').toString().slice(0, 10),
    estado_salud: a?.estado_salud || 'Saludable',
    esterilizado: a?.esterilizado ?? false,
    vacunado: a?.vacunado ?? false,
    desparasitado: a?.desparasitado ?? false,
    microchip: a?.microchip ?? false,
    num_microchip: a?.num_microchip || '',
    pasaporte: a?.pasaporte ?? false,
    color: a?.color || '',
    tipo_pelo: a?.tipo_pelo || '',
    ojos: a?.ojos || '',
    tamaño: (a?.tamaño as string) || '',
    señas_particulares: a?.señas_particulares || '',
    nivel_actividad: a?.nivel_actividad ?? 0,
    soc_perros: a?.soc_perros ?? 0,
    soc_gatos: a?.soc_gatos ?? 0,
    soc_niños: a?.soc_niños ?? 0,
    hogar_ideal: a?.hogar_ideal || '',
    experiencia_previa: a?.experiencia_previa || '',
    descripcion: a?.descripcion || '',
  };
}

const TABS = ['Básico', 'Salud', 'Comportamiento', 'Apariencia', 'Descripción'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7,
  fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', color: 'var(--text-primary)',
  background: 'var(--bg-surface)', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
};
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const checkboxRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer',
  fontSize: 13.5, color: 'var(--text-secondary)',
};

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const labels = ['No testado', 'Baja', 'Media-baja', 'Media', 'Alta', 'Excelente'];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{labels[value]}</span>
      </div>
      <input type="range" min={0} max={5} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#16a34a' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)' }}>
        <span>0</span><span>5</span>
      </div>
    </div>
  );
}

export default function AnimalForm({ animal, onClose, onSaved }: Props) {
  const [tab, setTab] = useState('Básico');
  const [form, setForm] = useState<FormData>(() => initForm(animal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (payload.peso_kg === '') payload.peso_kg = null;
      if (payload.fecha_nacimiento === '') payload.fecha_nacimiento = null;
      if (payload.fecha_entrada === '') payload.fecha_entrada = null;

      if (animal) {
        await api.updateAnimal(animal.id, payload as Partial<Animal>);
      } else {
        await api.createAnimal(payload as Partial<Animal>);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40,
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 540,
        background: 'var(--bg-surface)', zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {animal ? `Editar: ${animal.nombre}` : 'Nuevo animal'}
            </div>
            {animal && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{(animal as Animal & { id_interno?: string }).id_interno}</div>}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
            color: 'var(--text-faint)', lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 16px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 12px', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t ? '#16a34a' : 'transparent'}`,
              fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
              color: tab === t ? '#16a34a' : 'var(--text-muted)',
              fontFamily: "'Inter', sans-serif", marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {tab === 'Básico' && <>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del animal" />
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Especie</label>
                <select style={inputStyle} value={form.especie} onChange={e => set('especie', e.target.value)}>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sexo</label>
                <select style={inputStyle} value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Raza</label>
                <input style={inputStyle} value={form.raza} onChange={e => set('raza', e.target.value)} placeholder="Raza o mezcla" />
              </div>
              <div>
                <label style={labelStyle}>Tamaño</label>
                <select style={inputStyle} value={form.tamaño} onChange={e => set('tamaño', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="pequeño">Pequeño</option>
                  <option value="mediano">Mediano</option>
                  <option value="grande">Grande</option>
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Fecha de nacimiento</label>
                <input type="date" style={inputStyle} value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg)</label>
                <input type="number" step="0.1" min="0" style={inputStyle} value={form.peso_kg} onChange={e => set('peso_kg', e.target.value)} placeholder="ej. 12.5" />
              </div>
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Estado</label>
                <select style={inputStyle} value={form.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="en_evaluacion">En evaluación</option>
                  <option value="en_acogida">En acogida</option>
                  <option value="en_residencia">En residencia</option>
                  <option value="en_adopcion">En adopción</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="fallecido">Fallecido</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ubicación actual</label>
                <input style={inputStyle} value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} placeholder="ej. Casa de Laura" />
              </div>
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Procedencia</label>
                <input style={inputStyle} value={form.procedencia} onChange={e => set('procedencia', e.target.value)} placeholder="ej. Rescate en vía pública" />
              </div>
              <div>
                <label style={labelStyle}>Fecha de entrada</label>
                <input type="date" style={inputStyle} value={form.fecha_entrada} onChange={e => set('fecha_entrada', e.target.value)} />
              </div>
            </div>
          </>}

          {tab === 'Salud' && <>
            <div>
              <label style={labelStyle}>Estado de salud</label>
              <select style={inputStyle} value={form.estado_salud} onChange={e => set('estado_salud', e.target.value)}>
                <option value="Saludable">Saludable</option>
                <option value="En tratamiento">En tratamiento</option>
                <option value="Recuperación">Recuperación</option>
                <option value="Crónico">Crónico</option>
              </select>
            </div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { field: 'vacunado' as const, label: '💉 Vacunado' },
                { field: 'esterilizado' as const, label: '✂️ Esterilizado / Castrado' },
                { field: 'desparasitado' as const, label: '🐛 Desparasitado' },
                { field: 'microchip' as const, label: '📡 Microchip' },
                { field: 'pasaporte' as const, label: '📋 Pasaporte europeo' },
              ].map(({ field, label }) => (
                <label key={field} style={checkboxRowStyle}>
                  <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#16a34a', cursor: 'pointer' }} />
                  {label}
                </label>
              ))}
            </div>
            {form.microchip && (
              <div>
                <label style={labelStyle}>Número de microchip</label>
                <input style={inputStyle} value={form.num_microchip} onChange={e => set('num_microchip', e.target.value)} placeholder="15 dígitos" />
              </div>
            )}
          </>}

          {tab === 'Comportamiento' && <>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', fontSize: 12.5, color: '#166534', marginBottom: 4 }}>
              0 = No testado · 1–5 escala de menos a más
            </div>
            <SliderRow label="⚡ Nivel de actividad" value={form.nivel_actividad} onChange={v => set('nivel_actividad', v)} />
            <SliderRow label="🐕 Sociabilidad con perros" value={form.soc_perros} onChange={v => set('soc_perros', v)} />
            <SliderRow label="🐈 Sociabilidad con gatos" value={form.soc_gatos} onChange={v => set('soc_gatos', v)} />
            <SliderRow label="👶 Sociabilidad con niños" value={form.soc_niños} onChange={v => set('soc_niños', v)} />
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Hogar ideal</label>
                <input style={inputStyle} value={form.hogar_ideal} onChange={e => set('hogar_ideal', e.target.value)} placeholder="ej. Casa con jardín" />
              </div>
              <div>
                <label style={labelStyle}>Experiencia previa</label>
                <select style={inputStyle} value={form.experiencia_previa} onChange={e => set('experiencia_previa', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="No requerida">No requerida</option>
                  <option value="Recomendada">Recomendada</option>
                  <option value="Necesaria">Necesaria</option>
                </select>
              </div>
            </div>
          </>}

          {tab === 'Apariencia' && <>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Color</label>
                <input style={inputStyle} value={form.color} onChange={e => set('color', e.target.value)} placeholder="ej. Blanco y negro" />
              </div>
              <div>
                <label style={labelStyle}>Tipo de pelo</label>
                <select style={inputStyle} value={form.tipo_pelo} onChange={e => set('tipo_pelo', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="Corto">Corto</option>
                  <option value="Medio">Medio</option>
                  <option value="Largo">Largo</option>
                  <option value="Rizado">Rizado</option>
                  <option value="Sin pelo">Sin pelo</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Color de ojos</label>
              <input style={inputStyle} value={form.ojos} onChange={e => set('ojos', e.target.value)} placeholder="ej. Marrones" />
            </div>
            <div>
              <label style={labelStyle}>Señas particulares</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.señas_particulares} onChange={e => set('señas_particulares', e.target.value)} placeholder="Marcas, manchas u otras características distintivas..." />
            </div>
          </>}

          {tab === 'Descripción' && <>
            <div>
              <label style={labelStyle}>Descripción pública</label>
              <textarea rows={8} style={{ ...inputStyle, resize: 'vertical' }} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe la personalidad, historia y necesidades del animal..." />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Esta descripción se mostrará en la web de adopción si el animal está publicado.
            </div>
          </>}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex',
          justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: 'var(--bg-surface)',
        }}>
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--bg-surface)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", color: 'var(--text-secondary)',
          }}>Cancelar</button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving} style={{
            padding: '9px 20px', border: 'none', borderRadius: 8,
            background: saving ? '#86efac' : '#16a34a', color: '#fff',
            fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {saving && <Spinner size={14} />}
            {animal ? 'Guardar cambios' : 'Crear animal'}
          </button>
        </div>
      </div>
    </>
  );
}
