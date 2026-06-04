import { useState } from 'react';
import { api } from '../api/client';
import { PublicAnimal } from '../types';

const STORAGE_KEY = (id: number) => `resqpet_adoption_draft_${id}`;

function loadDraft(animalId: number): Partial<FormData> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(animalId)) || '{}'); } catch { return {}; }
}

interface FormData {
  nombre: string; email: string; telefono: string; ciudad: string;
  tipo_vivienda: string; tiene_terraza: string; horas_solo: number; personas_hogar: string;
  experiencia_previa: string; tiene_animales: string; animales_descripcion: string;
  tiene_ninos: string; edades_ninos: string;
  motivacion: string; como_conocio: string; acepta_privacidad: boolean;
}

const INITIAL: FormData = {
  nombre: '', email: '', telefono: '', ciudad: '',
  tipo_vivienda: '', tiene_terraza: '', horas_solo: 4, personas_hogar: '',
  experiencia_previa: '', tiene_animales: '', animales_descripcion: '',
  tiene_ninos: '', edades_ninos: '',
  motivacion: '', como_conocio: '', acepta_privacidad: false,
};

export function AdoptionForm({ animal, onClose }: { animal: PublicAnimal; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({ ...INITIAL, ...loadDraft(animal.id) });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ id: number; referencia: string } | null>(null);
  const [error, setError] = useState('');

  const set = (k: keyof FormData, v: unknown) => {
    setData(prev => {
      const next = { ...prev, [k]: v };
      localStorage.setItem(STORAGE_KEY(animal.id), JSON.stringify(next));
      return next;
    });
  };

  const submit = async () => {
    if (!data.acepta_privacidad) { setError('Debes aceptar la política de privacidad'); return; }
    if (data.motivacion.length < 50) { setError('La motivación debe tener al menos 50 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.createAdoptionRequest({
        animal_id: animal.id,
        refugio_id: animal.refugio_id,
        ...data,
        tiene_terraza: data.tiene_terraza === 'si',
        tiene_animales: data.tiene_animales === 'si',
        tiene_ninos: data.tiene_ninos === 'si',
      });
      localStorage.removeItem(STORAGE_KEY(animal.id));
      setSuccess(res as { id: number; referencia: string });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['Sobre ti', 'Tu hogar', 'Experiencia', 'Motivación', 'Confirmar'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,.3)',
      }}>
        {success ? (
          <SuccessScreen referencia={success.referencia} animal={animal} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  🐾 Solicitar adopción — {animal.nombre}
                </h2>
                <button onClick={onClose} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af',
                }}>✕</button>
              </div>
              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      height: 4, borderRadius: 2, marginBottom: 4,
                      background: i + 1 <= step ? '#22c55e' : '#e5e7eb',
                      transition: 'background .3s',
                    }} />
                    <span style={{ fontSize: 10, color: i + 1 === step ? '#16a34a' : '#9ca3af', fontWeight: i + 1 === step ? 600 : 400 }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              {step === 1 && <Step1 data={data} set={set} />}
              {step === 2 && <Step2 data={data} set={set} />}
              {step === 3 && <Step3 data={data} set={set} />}
              {step === 4 && <Step4 data={data} set={set} animal={animal} />}
              {step === 5 && <Step5 data={data} set={set} animal={animal} />}

              {error && (
                <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, background: '#fef2f2', padding: '10px 12px', borderRadius: 8 }}>
                  ⚠️ {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between',
            }}>
              {step > 1
                ? <button onClick={() => setStep(s => s - 1)} style={btnSecondary}>← Anterior</button>
                : <div />
              }
              {step < 5
                ? <button onClick={() => setStep(s => s + 1)} style={btnPrimary}>Siguiente →</button>
                : (
                  <button onClick={submit} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .7 : 1 }}>
                    {loading ? 'Enviando...' : '✓ Enviar solicitud'}
                  </button>
                )
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '11px 24px', background: '#22c55e', color: '#fff',
  border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '11px 24px', background: '#f3f4f6', color: '#374151',
  border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
function RadioGroup({ options, value, onChange }: {
  options: { val: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.val} onClick={() => onChange(o.val)} style={{
          padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
          border: '1.5px solid', transition: 'all .15s',
          borderColor: value === o.val ? '#22c55e' : '#e5e7eb',
          background: value === o.val ? '#f0fdf4' : '#fff',
          color: value === o.val ? '#16a34a' : '#374151',
          fontWeight: value === o.val ? 600 : 400,
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <>
      <Field label="Nombre completo *">
        <input style={inputStyle} value={data.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Tu nombre" />
      </Field>
      <Field label="Email *">
        <input style={inputStyle} type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
      </Field>
      <Field label="Teléfono">
        <input style={inputStyle} type="tel" value={data.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000" />
      </Field>
      <Field label="Ciudad / Provincia">
        <input style={inputStyle} value={data.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Madrid" />
      </Field>
    </>
  );
}
function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <>
      <Field label="Tipo de vivienda">
        <RadioGroup value={data.tipo_vivienda} onChange={v => set('tipo_vivienda', v)}
          options={[
            { val: 'piso', label: 'Piso' },
            { val: 'casa_sin_jardin', label: 'Casa sin jardín' },
            { val: 'casa_con_jardin', label: 'Casa con jardín' },
            { val: 'finca', label: 'Finca' },
          ]}
        />
      </Field>
      <Field label="¿Tienes terraza o balcón?">
        <RadioGroup value={data.tiene_terraza} onChange={v => set('tiene_terraza', v)}
          options={[{ val: 'si', label: 'Sí' }, { val: 'no', label: 'No' }]}
        />
      </Field>
      <Field label={`¿Cuántas horas estará solo? — ${data.horas_solo}h`}>
        <input type="range" min={0} max={12} value={data.horas_solo}
          onChange={e => set('horas_solo', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#22c55e' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </Field>
      <Field label="¿Cuántas personas viven en el hogar?">
        <input style={inputStyle} type="number" min={1} value={data.personas_hogar}
          onChange={e => set('personas_hogar', e.target.value)} placeholder="2" />
      </Field>
    </>
  );
}
function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <>
      <Field label="¿Has tenido animales antes?">
        <RadioGroup value={data.experiencia_previa} onChange={v => set('experiencia_previa', v)}
          options={[{ val: 'si', label: 'Sí' }, { val: 'no', label: 'No' }]}
        />
        {data.experiencia_previa === 'si' && (
          <textarea style={{ ...inputStyle, marginTop: 10, resize: 'vertical', minHeight: 70 }}
            value={typeof data.experiencia_previa === 'string' && data.experiencia_previa !== 'si' ? data.experiencia_previa : ''}
            onChange={e => set('experiencia_previa', e.target.value)}
            placeholder="¿Qué pasó con ellos? ¿Siguen contigo?"
          />
        )}
      </Field>
      <Field label="¿Tienes animales ahora?">
        <RadioGroup value={data.tiene_animales} onChange={v => set('tiene_animales', v)}
          options={[{ val: 'si', label: 'Sí' }, { val: 'no', label: 'No' }]}
        />
        {data.tiene_animales === 'si' && (
          <input style={{ ...inputStyle, marginTop: 10 }} value={data.animales_descripcion}
            onChange={e => set('animales_descripcion', e.target.value)}
            placeholder="¿Cuáles y cuántos?" />
        )}
      </Field>
      <Field label="¿Hay niños en casa?">
        <RadioGroup value={data.tiene_ninos} onChange={v => set('tiene_ninos', v)}
          options={[{ val: 'si', label: 'Sí' }, { val: 'no', label: 'No' }]}
        />
        {data.tiene_ninos === 'si' && (
          <input style={{ ...inputStyle, marginTop: 10 }} value={data.edades_ninos}
            onChange={e => set('edades_ninos', e.target.value)}
            placeholder="Edades de los niños" />
        )}
      </Field>
    </>
  );
}
function Step4({ data, set, animal }: { data: FormData; set: (k: keyof FormData, v: unknown) => void; animal: PublicAnimal }) {
  return (
    <>
      <Field label={`¿Por qué quieres adoptar a ${animal.nombre}? (mín. 50 caracteres)`}>
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          value={data.motivacion}
          onChange={e => set('motivacion', e.target.value)}
          placeholder={`Cuéntanos qué te ha enamorado de ${animal.nombre} y cómo encaja en tu vida...`}
        />
        <span style={{ fontSize: 11, color: data.motivacion.length >= 50 ? '#16a34a' : '#9ca3af' }}>
          {data.motivacion.length}/50 mínimo
        </span>
      </Field>
      <Field label="¿Cómo conociste ResQPet?">
        <select style={{ ...inputStyle, background: '#fff' }} value={data.como_conocio}
          onChange={e => set('como_conocio', e.target.value)}>
          <option value="">Selecciona...</option>
          <option value="google">Google / Buscador</option>
          <option value="redes">Redes sociales</option>
          <option value="amigo">Amigo / Familiar</option>
          <option value="veterinario">Veterinario</option>
          <option value="otro">Otro</option>
        </select>
      </Field>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginTop: 8 }}>
        <input type="checkbox" checked={data.acepta_privacidad}
          onChange={e => set('acepta_privacidad', e.target.checked)}
          style={{ marginTop: 2, accentColor: '#22c55e' }}
        />
        <span style={{ fontSize: 13, color: '#374151' }}>
          Acepto la <a href="#" style={{ color: '#16a34a' }}>política de privacidad</a> y que mis datos se compartan con la protectora para gestionar mi solicitud de adopción.
        </span>
      </label>
    </>
  );
}
function Step5({ data, animal }: { data: FormData; set: (k: keyof FormData, v: unknown) => void; animal: PublicAnimal }) {
  return (
    <div>
      <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
        Revisa tu solicitud antes de enviarla. Recibirás un email de confirmación en <strong>{data.email}</strong>.
      </p>
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#111827' }}>🐾 Animal solicitado</p>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{animal.nombre} — {animal.refugio_nombre}</p>
      </div>
      {[
        { label: 'Nombre', val: data.nombre },
        { label: 'Email', val: data.email },
        { label: 'Ciudad', val: data.ciudad },
        { label: 'Vivienda', val: data.tipo_vivienda },
        { label: 'Horas solo', val: `${data.horas_solo}h` },
        { label: 'Experiencia previa', val: data.experiencia_previa === 'si' ? 'Sí' : 'No' },
        { label: 'Niños en casa', val: data.tiene_ninos === 'si' ? `Sí (${data.edades_ninos})` : 'No' },
      ].map(r => (
        <div key={r.label} style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14,
        }}>
          <span style={{ color: '#6b7280' }}>{r.label}</span>
          <span style={{ fontWeight: 500, color: '#111827' }}>{r.val || '—'}</span>
        </div>
      ))}
    </div>
  );
}
function SuccessScreen({ referencia, animal, onClose }: { referencia: string; animal: PublicAnimal; onClose: () => void }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
        ¡Solicitud enviada!
      </h2>
      <p style={{ color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
        La protectora <strong>{animal.refugio_nombre}</strong> recibirá tu solicitud y se pondrá en contacto contigo en menos de 48h.
      </p>
      <div style={{
        background: '#f0fdf4', border: '1.5px solid #bbf7d0',
        borderRadius: 12, padding: '16px 24px', marginBottom: 28,
      }}>
        <p style={{ margin: 0, color: '#16a34a', fontWeight: 700, fontSize: 18 }}>
          Referencia: {referencia}
        </p>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
          Guarda este número para hacer seguimiento
        </p>
      </div>
      <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, textAlign: 'left' }}>
        <p style={{ fontWeight: 600, color: '#374151', marginBottom: 8 }}>Próximos pasos:</p>
        <p>1. Recibirás un email de confirmación</p>
        <p>2. La protectora evaluará tu perfil</p>
        <p>3. Te contactarán para programar una entrevista</p>
        <p>4. Si todo va bien, concertaréis el encuentro con {animal.nombre} 🐾</p>
      </div>
      <button onClick={onClose} style={{
        ...btnPrimary, width: '100%',
      }}>
        Cerrar
      </button>
    </div>
  );
}
