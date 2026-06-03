import { useState, useRef, useEffect } from 'react';
import { SosAlert } from '../types';
import { api } from '../api/client';
import { generatePoster } from '../utils/PosterGenerator';
import 'leaflet/dist/leaflet.css';

const STEPS = ['Tipo', 'Fotos', 'Animal', 'Ubicación', 'Contacto', 'Listo'];

type FormData = {
  tipo: 'lost' | 'found' | '';
  urgencia: 'high' | 'medium' | 'low';
  fotos: string[];
  especie: string; raza: string; color: string; tamaño: string;
  lleva_collar: boolean; señas: string; nombre: string;
  latitud: number | null; longitud: number | null; ubicacion: string;
  descripcion: string; fecha: string;
  reportero_nombre: string; reportero_telefono: string; reportero_email: string;
  quiere_notificaciones: boolean;
};

const initForm = (): FormData => ({
  tipo: '', urgencia: 'medium', fotos: [],
  especie: '', raza: '', color: '', tamaño: '', lleva_collar: false, señas: '', nombre: '',
  latitud: null, longitud: null, ubicacion: '', descripcion: '', fecha: new Date().toISOString().slice(0,16),
  reportero_nombre: '', reportero_telefono: '', reportero_email: '', quiere_notificaciones: false,
});

const COLORES = ['#f5f5dc', '#8B4513', '#000000', '#808080', '#ffffff', '#FFD700', '#FFA500', '#A52A2A', '#FF6347'];
const COLORES_LABEL: Record<string, string> = { '#f5f5dc': 'Beige', '#8B4513': 'Marrón', '#000000': 'Negro', '#808080': 'Gris', '#ffffff': 'Blanco', '#FFD700': 'Dorado', '#FFA500': 'Naranja', '#A52A2A': 'Rojizo', '#FF6347': 'Tomate' };

const btn = (active: boolean, urgente?: boolean): React.CSSProperties => ({
  flex: 1, padding: '16px 8px', border: `2px solid ${active ? (urgente ? '#dc2626' : '#2563eb') : '#e5e7eb'}`,
  borderRadius: 12, background: active ? (urgente ? '#fee2e2' : '#dbeafe') : '#fff',
  cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: active ? 700 : 500,
  color: active ? (urgente ? '#dc2626' : '#2563eb') : '#374151', transition: 'all 0.15s',
});

function StepProgress({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '16px 20px' }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#dc2626' : '#e5e7eb', transition: 'background 0.3s' }} />
      ))}
    </div>
  );
}

function MapPicker({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstRef = useRef<{ map: unknown; marker: unknown } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return;
    import('leaflet').then(L => {
      const center: [number, number] = lat && lng ? [lat, lng] : [40.4168, -3.7038];
      const map = L.map(mapRef.current!, { center, zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      const marker = L.marker(center, { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = (marker as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
        onPick(pos.lat, pos.lng);
      });
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        (marker as { setLatLng: (l: [number, number]) => void }).setLatLng([e.latlng.lat, e.latlng.lng]);
        onPick(e.latlng.lat, e.latlng.lng);
      });
      mapInstRef.current = { map, marker };
    });
    return () => {
      if (mapInstRef.current) {
        (mapInstRef.current.map as { remove: () => void }).remove();
        mapInstRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstRef.current || !lat || !lng) return;
    const { marker } = mapInstRef.current as { marker: { setLatLng: (l: [number, number]) => void } };
    marker.setLatLng([lat, lng]);
  }, [lat, lng]);

  return <div ref={mapRef} style={{ height: 250, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }} />;
}

export default function SosPublicPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => {
    const saved = localStorage.getItem('sos_form_draft');
    return saved ? { ...initForm(), ...JSON.parse(saved) } : initForm();
  });
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<SosAlert | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: unknown) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      localStorage.setItem('sos_form_draft', JSON.stringify(next));
      return next;
    });
  };

  const isLost = form.tipo === 'lost';
  const primaryColor = isLost ? '#dc2626' : '#2563eb';
  const primaryBg = isLost ? '#fee2e2' : '#dbeafe';

  const handleFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFotos(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 3)) {
        try {
          const url = await api.uploadSosFoto(file);
          urls.push(url);
        } catch {
          // Fallback: use object URL (won't persist)
          urls.push(URL.createObjectURL(file));
        }
      }
      set('fotos', [...form.fotos, ...urls].slice(0, 3));
    } finally { setUploadingFotos(false); }
  };

  const handleGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set('latitud', pos.coords.latitude); set('longitud', pos.coords.longitude); setGpsLoading(false); },
      () => { setGpsLoading(false); alert('No se pudo obtener tu ubicación. Por favor, marca el punto en el mapa.'); }
    );
  };

  const canAdvance = () => {
    if (step === 0) return !!form.tipo;
    if (step === 2) return !!form.especie;
    if (step === 4) return !!form.reportero_telefono;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await api.createSosPublic({
        tipo: form.tipo, urgencia: form.urgencia,
        especie: form.especie, raza: form.raza, color: form.color, tamaño: form.tamaño,
        lleva_collar: form.lleva_collar, señas_particulares: form.señas, nombre_animal: form.nombre,
        descripcion: form.descripcion, fotos: form.fotos,
        latitud: form.latitud, longitud: form.longitud, ubicacion_descripcion: form.ubicacion,
        visto_en: form.fecha,
        reportero_nombre: form.reportero_nombre, reportero_telefono: form.reportero_telefono,
        reportero_email: form.reportero_email, quiere_notificaciones: form.quiere_notificaciones,
      });
      setResultado(r);
      setStep(5);
      localStorage.removeItem('sos_form_draft');
    } catch (e) {
      alert('Error al enviar el aviso. Por favor, inténtalo de nuevo.');
    } finally { setSubmitting(false); }
  };

  const handleWhatsApp = () => {
    if (!resultado) return;
    const texto = encodeURIComponent(
      `${isLost ? '🔴 ANIMAL PERDIDO' : '🔵 ANIMAL ENCONTRADO'}\n` +
      `${form.especie} ${form.raza ? `· ${form.raza}` : ''}\n` +
      `📍 ${form.ubicacion}\n📞 ${form.reportero_telefono}\n\n` +
      `Ver aviso: ${window.location.origin}/sos/${resultado.id}\nRef: ${resultado.codigo_referencia}`
    );
    window.open(`https://wa.me/?text=${texto}`);
  };

  const sectionStyle: React.CSSProperties = { padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 };
  const inp: React.CSSProperties = { width: '100%', padding: '14px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 16, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', maxWidth: 540, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: step === 5 && resultado ? '#16a34a' : isLost ? '#dc2626' : form.tipo === 'found' ? '#2563eb' : '#374151', padding: '20px', color: '#fff' }}>
        <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
          {step === 5 ? '✅ ¡Aviso publicado!' : '🐾 SOS Pet'}
        </div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>
          {step === 5 ? 'Las protectoras ya pueden verlo' : '¿Has perdido o encontrado un animal?'}
        </div>
      </div>

      {step < 5 && <StepProgress step={step} />}

      {/* STEP 0: Tipo */}
      {step === 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', padding: '10px 0' }}>¿Qué ha pasado?</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={btn(form.tipo === 'lost', true)} onClick={() => set('tipo', 'lost')}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🐾</div>
              <div>He perdido a mi animal</div>
            </button>
            <button style={btn(form.tipo === 'found', false)} onClick={() => set('tipo', 'found')}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👁</div>
              <div>He visto un animal perdido</div>
            </button>
          </div>
          {form.tipo === 'lost' && (
            <div>
              <label style={lbl}>Urgencia</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['high', 'medium', 'low'] as const).map(u => (
                  <button key={u} onClick={() => set('urgencia', u)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${form.urgencia === u ? '#dc2626' : '#e5e7eb'}`,
                    background: form.urgencia === u ? '#fee2e2' : '#fff', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: form.urgencia === u ? 700 : 400,
                    color: form.urgencia === u ? '#dc2626' : '#6b7280',
                  }}>
                    {u === 'high' ? '🚨 Alta' : u === 'medium' ? '⚠️ Media' : '📋 Baja'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Fotos */}
      {step === 1 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', padding: '10px 0' }}>
            📷 Fotos del animal
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, color: '#15803d', textAlign: 'center' }}>
            Una buena foto es lo más importante para encontrar al animal
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handleFotos} />
          {form.fotos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {form.fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={f} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '2px solid #e5e7eb' }} />
                  <button onClick={() => set('fotos', form.fotos.filter((_, fi) => fi !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {form.fotos.length < 3 && (
            <button onClick={() => fileRef.current?.click()} disabled={uploadingFotos} style={{
              padding: '20px', border: '2px dashed #d1d5db', borderRadius: 12, background: '#fff',
              cursor: 'pointer', fontSize: 16, fontFamily: "'Inter', sans-serif", width: '100%', color: '#6b7280',
            }}>
              {uploadingFotos ? '⏳ Subiendo...' : '📷 Hacer foto / Elegir de galería'}
            </button>
          )}
          <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
            Puedes añadir hasta 3 fotos · Paso opcional pero muy recomendado
          </div>
        </div>
      )}

      {/* STEP 2: Datos animal */}
      {step === 2 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', padding: '10px 0' }}>🐾 Datos del animal</div>

          <div>
            <label style={lbl}>Especie *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ val: 'perro', emoji: '🐕', label: 'Perro' }, { val: 'gato', emoji: '🐈', label: 'Gato' }, { val: 'otro', emoji: '🐰', label: 'Otro' }].map(s => (
                <button key={s.val} onClick={() => set('especie', s.val)} style={{ ...btn(form.especie === s.val, isLost), flex: 1, textAlign: 'center' as const }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{s.emoji}</div>
                  <div>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Raza</label>
            <input style={inp} value={form.raza} onChange={e => set('raza', e.target.value)} placeholder="Labrador, Europeo, desconocida..." />
          </div>

          <div>
            <label style={lbl}>Color principal</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORES.map(c => (
                <button key={c} onClick={() => set('color', COLORES_LABEL[c])} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c,
                  border: `3px solid ${form.color === COLORES_LABEL[c] ? primaryColor : '#e5e7eb'}`,
                  cursor: 'pointer', boxShadow: form.color === COLORES_LABEL[c] ? `0 0 0 2px ${primaryColor}40` : 'none',
                }} title={COLORES_LABEL[c]} />
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Tamaño</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['pequeño', 'mediano', 'grande'].map(t => (
                <button key={t} onClick={() => set('tamaño', t)} style={{ ...btn(form.tamaño === t, isLost), flex: 1, textTransform: 'capitalize' as const }}>{t}</button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, cursor: 'pointer', padding: '12px', background: '#f9fafb', borderRadius: 10 }}>
            <input type="checkbox" checked={form.lleva_collar} onChange={e => set('lleva_collar', e.target.checked)} style={{ width: 20, height: 20, accentColor: primaryColor }} />
            Lleva collar
          </label>

          {isLost && (
            <div>
              <label style={lbl}>Nombre</label>
              <input style={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="¿Cómo se llama?" />
            </div>
          )}

          <div>
            <label style={lbl}>Señas particulares</label>
            <textarea rows={2} value={form.señas} onChange={e => set('señas', e.target.value)} placeholder="Manchas, cicatrices, marcas especiales..." style={{ ...inp, resize: 'none' } as React.CSSProperties} />
          </div>
        </div>
      )}

      {/* STEP 3: Ubicación */}
      {step === 3 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', padding: '10px 0' }}>📍 ¿Dónde y cuándo?</div>

          <button onClick={handleGPS} disabled={gpsLoading} style={{
            padding: '14px', background: gpsLoading ? '#e5e7eb' : primaryColor, color: gpsLoading ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: gpsLoading ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
          }}>
            {gpsLoading ? '📡 Obteniendo ubicación...' : '📍 Usar mi ubicación actual'}
          </button>

          <MapPicker lat={form.latitud} lng={form.longitud} onPick={(lat, lng) => { set('latitud', lat); set('longitud', lng); }} />

          <div>
            <label style={lbl}>Descripción del lugar</label>
            <input style={inp} value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Parque del Retiro, junto a la puerta principal..." />
          </div>

          <div>
            <label style={lbl}>Fecha y hora</label>
            <input type="datetime-local" style={inp} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>{isLost ? 'Cómo se perdió' : 'Cómo estaba el animal'}</label>
            <textarea rows={4} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder={isLost ? 'Dónde y cómo se escapó, qué llevaba puesto...' : 'Cómo estaba el animal, si parecía asustado, herido...'}
              style={{ ...inp, resize: 'vertical' } as React.CSSProperties} />
          </div>
        </div>
      )}

      {/* STEP 4: Contacto */}
      {step === 4 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', textAlign: 'center', padding: '10px 0' }}>📞 Tus datos de contacto</div>

          <div>
            <label style={lbl}>Nombre</label>
            <input style={inp} value={form.reportero_nombre} onChange={e => set('reportero_nombre', e.target.value)} placeholder="Tu nombre" />
          </div>
          <div>
            <label style={lbl}>Teléfono *</label>
            <input type="tel" style={{ ...inp, borderColor: !form.reportero_telefono ? '#fca5a5' : '#e5e7eb' }} value={form.reportero_telefono} onChange={e => set('reportero_telefono', e.target.value)} placeholder="612 345 678" />
          </div>
          <div>
            <label style={lbl}>Email (opcional)</label>
            <input type="email" style={inp} value={form.reportero_email} onChange={e => set('reportero_email', e.target.value)} placeholder="tu@email.com" />
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, cursor: 'pointer', padding: '12px', background: '#f9fafb', borderRadius: 10 }}>
            <input type="checkbox" checked={form.quiere_notificaciones} onChange={e => set('quiere_notificaciones', e.target.checked)} style={{ width: 20, height: 20, accentColor: primaryColor, marginTop: 2 }} />
            <span>Quiero recibir notificaciones si hay novedades sobre este aviso</span>
          </label>

          <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '0 10px' }}>
            🔒 Tus datos solo serán visibles para las protectoras colaboradoras, nunca al público.
          </div>
        </div>
      )}

      {/* STEP 5: Confirmación */}
      {step === 5 && resultado && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✅</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>¡Aviso publicado!</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Las protectoras de tu zona ya pueden verlo</div>
            <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: primaryColor, background: primaryBg, padding: '8px 20px', borderRadius: 20, display: 'inline-block' }}>
              {resultado.codigo_referencia}
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handleWhatsApp} style={{ padding: '16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              📤 Compartir en WhatsApp
            </button>
            <button onClick={async () => { setGeneratingPdf(true); try { await generatePoster(resultado, `${window.location.origin}/sos/${resultado.id}`); } finally { setGeneratingPdf(false); } }} disabled={generatingPdf} style={{ padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              {generatingPdf ? '⏳ Generando...' : '📄 Descargar cartel de búsqueda'}
            </button>
            <button onClick={() => { setForm(initForm()); setStep(0); setResultado(null); }} style={{ padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
              Crear otro aviso
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div style={{ padding: '16px 20px', marginTop: 'auto', display: 'flex', gap: 10, position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '14px 20px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: 15, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>← Atrás</button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={{
              flex: 1, padding: '14px', border: 'none', borderRadius: 10,
              background: canAdvance() ? primaryColor : '#e5e7eb',
              color: canAdvance() ? '#fff' : '#9ca3af',
              fontSize: 15, fontWeight: 700, cursor: canAdvance() ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif",
            }}>
              Siguiente →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !canAdvance()} style={{
              flex: 1, padding: '14px', border: 'none', borderRadius: 10,
              background: canAdvance() ? primaryColor : '#e5e7eb',
              color: canAdvance() ? '#fff' : '#9ca3af',
              fontSize: 15, fontWeight: 700, cursor: canAdvance() ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif",
            }}>
              {submitting ? '⏳ Publicando...' : '🐾 Publicar aviso'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
