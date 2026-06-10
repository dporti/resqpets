import { useEffect, useState, useRef, FormEvent } from 'react';
import { Animal, HealthEvent, BehaviorEvaluation, AnimalDocument, AnimalFotoFull } from '../types';
import { api } from '../api/client';
import { Badge, DotsBar, formatDate, formatDateTime, Spinner, ErrorState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../context/AnimalListContext';
import AnimalForm from './AnimalForm';

interface Props {
  animalId: number;
  onVolver: () => void;
  onNavigate: (id: number) => void;
}

const TABS = ['Información', 'Salud', 'Comportamiento', 'Documentos', 'Historia', 'Redes'];

const HEALTH_TIPOS = [
  { val: 'vacuna', label: 'Vacunación', icon: '💉' },
  { val: 'desparasitacion', label: 'Desparasitación', icon: '🪱' },
  { val: 'revision', label: 'Revisión veterinaria', icon: '🩺' },
  { val: 'cirugia', label: 'Cirugía', icon: '🔪' },
  { val: 'analisis', label: 'Análisis', icon: '🧪' },
  { val: 'incidencia', label: 'Incidencia', icon: '⚠️' },
  { val: 'otro', label: 'Otro', icon: '📋' },
];

const DOC_TIPOS = [
  'Contrato de acogida', 'Contrato de adopción', 'Analítica',
  'Radiografía', 'DNI adoptante', 'Cartilla sanitaria', 'Otros',
];

const inp: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7,
  fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 3, display: 'block' };
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };

function calcEdad(fechaNac?: string): string {
  if (!fechaNac) return '';
  const d = new Date(fechaNac);
  const now = new Date();
  const años = now.getFullYear() - d.getFullYear();
  const meses = now.getMonth() - d.getMonth();
  const total = años * 12 + meses;
  if (total < 12) return `${total} mes${total !== 1 ? 'es' : ''}`;
  const a = Math.floor(total / 12);
  const m = total % 12;
  return m > 0 ? `${a} año${a !== 1 ? 's' : ''} y ${m} mes${m !== 1 ? 'es' : ''}` : `${a} año${a !== 1 ? 's' : ''}`;
}

function HealthIcon({ tipo }: { tipo: string }) {
  const t = HEALTH_TIPOS.find(t => t.val === tipo);
  return <span>{t?.icon || '📋'}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 14, width: 500, maxHeight: '90vh', overflowY: 'auto',
        zIndex: 70, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </>
  );
}

function SliderInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const labels = ['No testado', 'Baja', 'Media-baja', 'Media', 'Alta', 'Excelente'];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={lbl}>{label}</span>
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{labels[value]}</span>
      </div>
      <input type="range" min={0} max={5} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#16a34a' }} />
    </div>
  );
}

export default function DetalleAnimalPage({ animalId, onVolver, onNavigate }: Props) {
  const { can, user } = useAuth();
  const { prevId, nextId } = useAnimalList();
  const fileRef = useRef<HTMLInputElement>(null);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [fotos, setFotos] = useState<AnimalFotoFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('Información');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Notes
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  // Health tab
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthForm, setHealthForm] = useState({ tipo: 'vacuna', fecha: new Date().toISOString().slice(0,10), titulo: '', descripcion: '' });
  const [savingHealth, setSavingHealth] = useState(false);

  // Behavior tab
  const [evaluaciones, setEvaluaciones] = useState<BehaviorEvaluation[]>([]);
  const [behaviorLoaded, setBehaviorLoaded] = useState(false);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [behaviorForm, setBehaviorForm] = useState({
    fecha: new Date().toISOString().slice(0,10), evaluador: '',
    nivel_actividad: 0, soc_perros: 0, soc_gatos: 0, soc_niños: 0,
    hogar_ideal: '', experiencia_previa: '', notas: '',
  });
  const [savingBehavior, setSavingBehavior] = useState(false);

  // Documents tab
  const [docs, setDocs] = useState<AnimalDocument[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ tipo: 'Otros', nombre: '', file_url: '' });
  const [savingDoc, setSavingDoc] = useState(false);

  // Instagram
  const [instaCopy, setInstaCopy] = useState('');
  const [generatingInsta, setGeneratingInsta] = useState(false);
  const [instaCopied, setInstaCopied] = useState(false);

  // Web toggle
  const [togglingWeb, setTogglingWeb] = useState(false);

  // Photo upload
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const loadAnimal = () => {
    setLoading(true);
    setError(false);
    api.getAnimal(animalId)
      .then(a => {
        setAnimal(a);
        const f = ((a as Animal & { fotos?: AnimalFotoFull[] }).fotos || []) as AnimalFotoFull[];
        setFotos(f);
        const pi = f.findIndex(x => x.es_principal);
        setPhotoIdx(pi >= 0 ? pi : 0);
      })
      .catch(e => { console.error(e); setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnimal(); }, [animalId]);

  useEffect(() => {
    if (tab === 'Salud' && !healthLoaded) {
      api.getHealthEvents(animalId).then(e => { setHealthEvents(e); setHealthLoaded(true); });
    }
    if (tab === 'Comportamiento' && !behaviorLoaded) {
      api.getBehaviorEvaluations(animalId).then(e => { setEvaluaciones(e); setBehaviorLoaded(true); });
    }
    if (tab === 'Documentos' && !docsLoaded) {
      api.getDocuments(animalId).then(d => { setDocs(d); setDocsLoaded(true); });
    }
  }, [tab]);

  const handleAddNota = async () => {
    if (!nuevaNota.trim() || !animal) return;
    setGuardandoNota(true);
    try {
      await api.addNota(animal.id, nuevaNota.trim());
      const updated = await api.getAnimal(animal.id);
      setAnimal(updated);
      setNuevaNota('');
    } catch (e) { console.error(e); }
    finally { setGuardandoNota(false); }
  };

  const handleHealthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!healthForm.titulo || !healthForm.fecha) return;
    setSavingHealth(true);
    try {
      const ev = await api.createHealthEvent(animalId, healthForm);
      setHealthEvents(prev => [ev, ...prev]);
      setShowHealthModal(false);
      setHealthForm({ tipo: 'vacuna', fecha: new Date().toISOString().slice(0,10), titulo: '', descripcion: '' });
    } catch (e) { console.error(e); }
    finally { setSavingHealth(false); }
  };

  const handleBehaviorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!behaviorForm.fecha) return;
    setSavingBehavior(true);
    try {
      const ev = await api.createBehaviorEvaluation(animalId, behaviorForm);
      setEvaluaciones(prev => [ev, ...prev]);
      setShowBehaviorModal(false);
      const updated = await api.getAnimal(animalId);
      setAnimal(updated);
    } catch (e) { console.error(e); }
    finally { setSavingBehavior(false); }
  };

  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docForm.nombre || !docForm.file_url) return;
    setSavingDoc(true);
    try {
      const doc = await api.createDocument(animalId, docForm);
      setDocs(prev => [doc, ...prev]);
      setShowDocModal(false);
      setDocForm({ tipo: 'Otros', nombre: '', file_url: '' });
    } catch (e) { console.error(e); }
    finally { setSavingDoc(false); }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !animal) return;
    setUploadingFoto(true);
    try {
      const result = await api.uploadFoto(animal.id, file);
      if (result.url) {
        setFotos(prev => [...prev, result]);
        if (fotos.length === 0) setPhotoIdx(0);
      } else if (result.error) {
        alert(`Error: ${result.error}`);
      }
    } catch (e) { console.error(e); }
    finally { setUploadingFoto(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleToggleWeb = async () => {
    if (!animal) return;
    setTogglingWeb(true);
    try {
      await api.updateAnimal(animal.id, { web_publicado: !animal.web_publicado } as Partial<Animal>);
      setAnimal(prev => prev ? { ...prev, web_publicado: !prev.web_publicado } : prev);
    } catch (e) { console.error(e); }
    finally { setTogglingWeb(false); }
  };

  const handleGenerateInsta = async () => {
    setGeneratingInsta(true);
    setInstaCopy('');
    try {
      const r = await api.generateInstagram(animalId);
      setInstaCopy(r.texto);
    } catch (e) { console.error(e); }
    finally { setGeneratingInsta(false); }
  };

  const pId = prevId(animalId);
  const nId = nextId(animalId);

  const raw = animal as Animal & {
    id_interno?: string; updated_at?: string; created_at?: string;
    fecha_nacimiento?: string; fecha_entrada?: string;
    veces_compartido?: number; contactos_recibidos?: number;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Spinner size={44} />
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <ErrorState onRetry={loadAnimal} />
    </div>
  );

  if (!animal) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ fontSize: 48 }}>🐾</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Animal no encontrado</div>
      <button onClick={onVolver} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>← Volver al listado</button>
    </div>
  );

  const espEmoji = animal.especie === 'perro' ? '🐕' : animal.especie === 'gato' ? '🐈' : '🐾';
  const edad = calcEdad(raw.fecha_nacimiento);
  const fechaNacLabel = raw.fecha_nacimiento ? new Date(raw.fecha_nacimiento).toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' }) : '';
  const notas = (animal as Animal & { notas?: import('../types').AnimalNota[] }).notas || [];
  const actividad = (animal as Animal & { actividad?: import('../types').Actividad[] }).actividad || [];

  const compatibilidades: string[] = [];
  if (animal.soc_perros >= 3) compatibilidades.push('Puede vivir con perros');
  if (animal.soc_gatos >= 3) compatibilidades.push('Puede vivir con gatos');
  if (animal.soc_niños >= 3) compatibilidades.push('Apto para familias con niños');
  if (animal.nivel_actividad >= 4) compatibilidades.push('Para personas activas');
  if ((animal.hogar_ideal || '').toLowerCase().includes('jardín')) compatibilidades.push('Mejor con jardín o espacio exterior');
  if (animal.esterilizado) compatibilidades.push('Esterilizado / listo para adopción');

  const nivelLabel = (v: number) => ['No testado','Baja','Media','Buena','Alta','Excelente'][v] ?? '—';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }} onClick={() => setShowActionsMenu(false)}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        height: 54, padding: '0 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: '#fff',
        borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 30,
        gap: 12,
      }}>
        <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontSize: 13, color: '#6b7280', cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
          ← Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{animal.nombre}</span>
          <Badge estado={animal.estado} />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => pId && onNavigate(pId)} disabled={!pId} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: pId ? 'pointer' : 'not-allowed', opacity: pId ? 1 : 0.4, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>← Anterior</button>
          <button onClick={() => nId && onNavigate(nId)} disabled={!nId} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: nId ? 'pointer' : 'not-allowed', opacity: nId ? 1 : 0.4, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>Siguiente →</button>
          {can('animales:update') && (
            <button onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: "'Inter', sans-serif" }}>✏️ Editar</button>
          )}
          {can('animales:update') && (
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setShowActionsMenu(v => !v); }} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer', color: '#374151', fontFamily: "'Inter', sans-serif" }}>Más ▾</button>
              {showActionsMenu && (
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 36, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 180, zIndex: 50 }}>
                  {[
                    { label: '📤 Registrar salida', action: () => {} },
                    { label: '🕊️ Marcar fallecido', action: () => {} },
                    { label: '🖨️ Imprimir ficha', action: () => window.print() },
                  ].map(item => (
                    <button key={item.label} onClick={() => { item.action(); setShowActionsMenu(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13.5, cursor: 'pointer', color: '#374151', fontFamily: "'Inter', sans-serif' " }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 54px)', alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ padding: '20px 22px', borderRight: '1px solid #e5e7eb', background: '#fff' }}>

          {/* ── BLOQUE IDENTITARIO ─────────────────────────── */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>

            {/* Gallery */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 280, height: 220, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', position: 'relative' }}>
                {fotos.length > 0 && fotos[photoIdx] ? (
                  <img src={fotos[photoIdx].url} alt={animal.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 80 }}>{espEmoji}</span>
                )}
                {uploadingFoto && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner size={32} />
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {fotos.slice(0, 4).map((f, i) => (
                  <div key={f.id} onClick={() => setPhotoIdx(i)} style={{ width: 52, height: 44, borderRadius: 7, overflow: 'hidden', border: `2px solid ${i === photoIdx ? '#16a34a' : '#e5e7eb'}`, cursor: 'pointer', background: '#f3f4f6', flexShrink: 0 }}>
                    <img src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                {fotos.length > 4 && (
                  <div style={{ width: 52, height: 44, borderRadius: 7, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 600, color: '#6b7280' }}>+{fotos.length - 4}</div>
                )}
                {can('animales:update') && (
                  <label style={{ width: 52, height: 44, borderRadius: 7, background: '#f0fdf4', border: '2px dashed #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: '#16a34a', flexShrink: 0 }}>
                    {uploadingFoto ? <Spinner size={16} /> : '+'}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>{animal.nombre}</h1>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {animal.sexo && <span style={{ textTransform: 'capitalize' }}>{animal.sexo}</span>}
                {animal.sexo && animal.raza && <span style={{ color: '#d1d5db' }}>·</span>}
                {animal.raza && <span>{animal.raza}</span>}
                {edad && <><span style={{ color: '#d1d5db' }}>·</span><span>{edad}{fechaNacLabel && ` (${fechaNacLabel})`}</span></>}
                {animal.peso_kg && <><span style={{ color: '#d1d5db' }}>·</span><span>{animal.peso_kg} kg</span></>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 14 }}>
                {[
                  { icon: '🏷️', label: 'ID interno', val: raw.id_interno || '—' },
                  { icon: '📅', label: 'Fecha de entrada', val: formatDate(raw.fecha_entrada) },
                  { icon: '📍', label: 'Procedencia', val: animal.procedencia || '—' },
                  { icon: '🏠', label: 'Ubicación actual', val: (animal as Animal & { ubicacion_texto?: string }).ubicacion_texto || '—' },
                  { icon: '❤️', label: 'Estado de salud', val: animal.estado_salud || '—', green: animal.estado_salud === 'Saludable' },
                  { icon: '✂️', label: 'Esterilizado', val: animal.esterilizado ? 'Sí' : 'No' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>{f.icon} {f.label}</div>
                    <div style={{ fontSize: 13, color: (f as { green?: boolean }).green ? '#16a34a' : '#111', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Health pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: '💉 Vacunado', ok: !!animal.vacunado },
                  { label: '🐛 Desparasitado', ok: !!animal.desparasitado },
                  { label: `📡 Microchip${animal.num_microchip ? ` · ${animal.num_microchip}` : ''}`, ok: !!animal.microchip },
                  { label: '📋 Pasaporte', ok: !!animal.pasaporte },
                ].map(p => (
                  <span key={p.label} title={p.label} style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
                    background: p.ok ? '#dcfce7' : '#f3f4f6',
                    color: p.ok ? '#15803d' : '#9ca3af',
                    border: `1px solid ${p.ok ? '#bbf7d0' : '#e5e7eb'}`,
                  }}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── TABS ───────────────────────────────────────── */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', marginBottom: 20, gap: 2, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '8px 14px', background: 'none', border: 'none',
                borderBottom: `2px solid ${tab === t ? '#16a34a' : 'transparent'}`,
                marginBottom: -2, fontSize: 12.5, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#16a34a' : '#6b7280', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
              }}>{t}</button>
            ))}
          </div>

          {/* ── TAB: INFORMACIÓN ───────────────────────────── */}
          {tab === 'Información' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10 }}>Sobre {animal.nombre}</div>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: 20 }}>
                  {animal.descripcion || <span style={{ color: '#9ca3af' }}>Sin descripción</span>}
                </p>

                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10 }}>Nivel de rasgos</div>
                {[
                  { icon: '⚡', label: 'Nivel de actividad', val: animal.nivel_actividad },
                  { icon: '🐕', label: 'Sociabilidad con perros', val: animal.soc_perros },
                  { icon: '🐈', label: 'Sociabilidad con gatos', val: animal.soc_gatos },
                  { icon: '👶', label: 'Sociabilidad con niños', val: animal.soc_niños },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 18, flexShrink: 0 }}>{r.icon}</span>
                    <span style={{ fontSize: 12.5, color: '#4b5563', flex: 1 }}>{r.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111', marginRight: 6 }}>{nivelLabel(r.val)}</span>
                    {r.val > 0 && <DotsBar val={r.val} />}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 18 }}>🏡</span>
                  <span style={{ fontSize: 12.5, color: '#4b5563', flex: 1 }}>Hogar ideal</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111' }}>{animal.hogar_ideal || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18 }}>🎓</span>
                  <span style={{ fontSize: 12.5, color: '#4b5563', flex: 1 }}>Experiencia previa</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111' }}>{animal.experiencia_previa || '—'}</span>
                </div>

                {compatibilidades.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10 }}>Compatibilidades</div>
                    {compatibilidades.map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 13, color: '#15803d' }}>
                        <span style={{ color: '#16a34a', fontSize: 14 }}>✓</span> {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10 }}>Características físicas</div>
                <div style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                  {[
                    { label: 'Color', val: animal.color },
                    { label: 'Tipo de pelo', val: animal.tipo_pelo },
                    { label: 'Ojos', val: animal.ojos },
                    { label: 'Tamaño', val: animal.tamaño as string },
                    { label: 'Señas particulares', val: animal.señas_particulares },
                  ].map((f, i, arr) => (
                    <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 14px', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{f.label}</span>
                      <span style={{ fontSize: 13, color: '#111', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{f.val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: SALUD ─────────────────────────────────── */}
          {tab === 'Salud' && (
            <div>
              {can('animales:update') && (
                <button onClick={() => setShowHealthModal(true)} style={{ marginBottom: 18, padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  + Registrar evento médico
                </button>
              )}
              {!healthLoaded ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div> : healthEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Sin eventos médicos registrados</div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: '#e5e7eb' }} />
                  {healthEvents.map(ev => {
                    const tipo = HEALTH_TIPOS.find(t => t.val === ev.tipo);
                    return (
                      <div key={ev.id} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, zIndex: 1 }}>
                          <HealthIcon tipo={ev.tipo} />
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{ev.titulo}</span>
                            <span style={{ fontSize: 11.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDate(ev.fecha)}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#6b7280', marginBottom: ev.descripcion ? 6 : 0 }}>
                            {tipo?.label} {ev.usuario_nombre && `· ${ev.usuario_nombre}`}
                          </div>
                          {ev.descripcion && <div style={{ fontSize: 13, color: '#4b5563' }}>{ev.descripcion}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: COMPORTAMIENTO ────────────────────────── */}
          {tab === 'Comportamiento' && (
            <div>
              {can('animales:update') && (
                <button onClick={() => setShowBehaviorModal(true)} style={{ marginBottom: 18, padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  + Nueva evaluación
                </button>
              )}
              {!behaviorLoaded ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div> : evaluaciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
                  Sin evaluaciones de comportamiento. {can('animales:update') && 'Registra la primera evaluación.'}
                </div>
              ) : evaluaciones.map((ev, idx) => (
                <div key={ev.id} style={{ background: idx === 0 ? '#fff' : '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{idx === 0 ? 'Evaluación más reciente' : `Evaluación ${idx + 1}`}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(ev.fecha)}{ev.evaluador ? ` · ${ev.evaluador}` : ''}</div>
                    </div>
                    {idx === 0 && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Vigente</span>}
                  </div>
                  {[
                    { label: '⚡ Actividad', val: ev.nivel_actividad },
                    { label: '🐕 Con perros', val: ev.soc_perros },
                    { label: '🐈 Con gatos', val: ev.soc_gatos },
                    { label: '👶 Con niños', val: ev.soc_niños },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 12.5, color: '#4b5563', flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#111', marginRight: 6 }}>{nivelLabel(r.val)}</span>
                      <DotsBar val={r.val} />
                    </div>
                  ))}
                  {ev.notas && <p style={{ fontSize: 13, color: '#4b5563', marginTop: 10, lineHeight: 1.6, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>{ev.notas}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: DOCUMENTOS ────────────────────────────── */}
          {tab === 'Documentos' && (
            <div>
              {can('animales:update') && (
                <button onClick={() => setShowDocModal(true)} style={{ marginBottom: 18, padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  + Añadir documento
                </button>
              )}
              {!docsLoaded ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div> : docs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Sin documentos adjuntos</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {docs.map(doc => (
                    <div key={doc.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{doc.file_url.includes('.pdf') ? '📄' : '🖼️'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</div>
                        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{doc.tipo} · {formatDate(doc.created_at)}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>↓ Descargar</a>
                          {can('animales:update') && (
                            <button onClick={async () => { await api.deleteDocument(animalId, doc.id); setDocs(p => p.filter(d => d.id !== doc.id)); }} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Inter', sans-serif" }}>🗑 Eliminar</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: HISTORIA ──────────────────────────────── */}
          {tab === 'Historia' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 14 }}>Línea de tiempo</div>
              {actividad.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Sin historial registrado</div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: '#e5e7eb' }} />
                  {actividad.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 14, marginBottom: 16, position: 'relative' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, zIndex: 1 }}>
                        {a.tipo === 'vacunacion' ? '💉' : a.tipo === 'adopcion' ? '❤️' : a.tipo === 'acogida' ? '🏠' : a.tipo === 'rescate' ? '🚨' : '📋'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{a.titulo}</div>
                        {a.descripcion && <div style={{ fontSize: 12, color: '#6b7280' }}>{a.descripcion}</div>}
                        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>
                          {formatDateTime(a.created_at)}{a.usuario_nombre && ` · ${a.usuario_nombre}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: REDES ─────────────────────────────────── */}
          {tab === 'Redes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Web status */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 14 }}>Publicación en el portal</div>
                {!animal.fotos || (fotos.length === 0) ? (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 14 }}>
                    ⚠️ Sin foto principal. Añade al menos una foto para poder publicar.
                  </div>
                ) : null}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 10, padding: '14px 16px', border: '1px solid #e5e7eb', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111' }}>🌐 Estado en la web</div>
                    <div style={{ fontSize: 12, color: animal.web_publicado ? '#16a34a' : '#9ca3af', marginTop: 2 }}>
                      {animal.web_publicado ? 'Publicado y visible al público' : 'No publicado'}
                    </div>
                  </div>
                  <button onClick={handleToggleWeb} disabled={togglingWeb || (fotos.length === 0 && !animal.web_publicado)} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: animal.web_publicado ? '#16a34a' : '#d1d5db', position: 'relative', opacity: togglingWeb ? 0.6 : 1, transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: animal.web_publicado ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                    </div>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { icon: '📡', label: 'Compartido', val: raw.veces_compartido ?? 0 },
                    { icon: '👁️', label: 'Visitas', val: animal.veces_visto },
                    { icon: '✉️', label: 'Contactos', val: raw.contactos_recibidos ?? 0 },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 20 }}>{s.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '4px 0 2px' }}>{s.val.toLocaleString('es-ES')}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instagram generator */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 14 }}>Generador para Instagram</div>
                <button onClick={handleGenerateInsta} disabled={generatingInsta} style={{
                  width: '100%', padding: '10px 0', background: generatingInsta ? '#e5e7eb' : 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)',
                  color: generatingInsta ? '#9ca3af' : '#fff', border: 'none', borderRadius: 9, fontSize: 13.5,
                  fontWeight: 600, cursor: generatingInsta ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
                  marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {generatingInsta ? <><Spinner size={14} /> Generando...</> : '📸 Generar descripción para Instagram'}
                </button>
                {instaCopy && (
                  <>
                    <textarea readOnly value={instaCopy} style={{ width: '100%', minHeight: 200, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 13, fontFamily: "'Inter', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#374151', lineHeight: 1.65 }} />
                    <button onClick={() => { navigator.clipboard.writeText(instaCopy); setInstaCopied(true); setTimeout(() => setInstaCopied(false), 2000); }} style={{
                      width: '100%', padding: '8px 0', marginTop: 8, background: instaCopied ? '#16a34a' : '#111827',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>{instaCopied ? '✓ ¡Copiado!' : '📋 Copiar texto'}</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────── */}
        <div style={{ padding: '18px 16px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'calc(100vh - 54px)' }}>

          {/* Actividad */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13.5, color: '#111', borderBottom: '1px solid #f3f4f6' }}>Actividad reciente</div>
            {actividad.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Sin actividad</div>
            ) : actividad.slice(0, 8).map((a, i, arr) => (
              <div key={a.id} style={{ display: 'flex', gap: 9, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
                  {a.tipo === 'vacunacion' ? '💉' : a.tipo === 'adopcion' ? '❤️' : a.tipo === 'acogida' ? '🏠' : '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titulo}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDateTime(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Notas internas */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13.5, color: '#111', borderBottom: '1px solid #f3f4f6' }}>Notas internas</div>
            {notas.map(n => (
              <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', borderLeft: n.pinned ? '3px solid #16a34a' : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{n.autor_nombre} · {formatDate(n.created_at)}</span>
                  {n.pinned && <span style={{ fontSize: 12 }}>📌</span>}
                </div>
                <p style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{n.texto}</p>
              </div>
            ))}
            {can('animales:read') && (
              <div style={{ padding: 10 }}>
                <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Añadir nota interna..."
                  style={{ width: '100%', minHeight: 56, padding: '7px 9px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12.5, resize: 'vertical', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none' }}
                />
                <button onClick={handleAddNota} disabled={guardandoNota || !nuevaNota.trim()} style={{
                  marginTop: 5, width: '100%', padding: '7px 0',
                  background: guardandoNota || !nuevaNota.trim() ? '#e5e7eb' : '#16a34a',
                  color: guardandoNota || !nuevaNota.trim() ? '#9ca3af' : '#fff',
                  border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                  cursor: guardandoNota || !nuevaNota.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
                }}>{guardandoNota ? 'Guardando...' : 'Añadir nota'}</button>
              </div>
            )}
          </div>

          {/* Difusión */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', fontWeight: 600, fontSize: 13.5, color: '#111', borderBottom: '1px solid #f3f4f6' }}>Difusión</div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#374151' }}>🌐 Estado en la web</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: animal.web_publicado ? '#16a34a' : '#9ca3af' }}>
                  {animal.web_publicado ? 'Publicado' : 'No publicado'}
                </span>
              </div>
              {[
                { icon: '📡', label: 'Veces compartido', val: raw.veces_compartido ?? 0 },
                { icon: '👁️', label: 'Veces visto', val: animal.veces_visto },
                { icon: '✉️', label: 'Contactos', val: raw.contactos_recibidos ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: '#374151' }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{s.val.toLocaleString('es-ES')}</span>
                </div>
              ))}
              <button style={{ width: '100%', padding: '8px 0', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
                Ver en portal público ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────── */}
      {showEdit && (
        <AnimalForm animal={animal} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadAnimal(); }} />
      )}

      {showHealthModal && (
        <Modal title="Registrar evento médico" onClose={() => setShowHealthModal(false)}>
          <form onSubmit={handleHealthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={row2}>
              <div>
                <label style={lbl}>Tipo *</label>
                <select style={inp} value={healthForm.tipo} onChange={e => setHealthForm(f => ({ ...f, tipo: e.target.value }))}>
                  {HEALTH_TIPOS.map(t => <option key={t.val} value={t.val}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Fecha *</label>
                <input type="date" style={inp} value={healthForm.fecha} onChange={e => setHealthForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Título *</label>
              <input style={inp} value={healthForm.titulo} onChange={e => setHealthForm(f => ({ ...f, titulo: e.target.value }))} placeholder="ej: Vacunación Tetravalente + Rabia" />
            </div>
            <div>
              <label style={lbl}>Notas (opcional)</label>
              <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={healthForm.descripcion} onChange={e => setHealthForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Observaciones adicionales..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowHealthModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={savingHealth} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {savingHealth ? 'Guardando...' : 'Guardar evento'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBehaviorModal && (
        <Modal title="Nueva evaluación de comportamiento" onClose={() => setShowBehaviorModal(false)}>
          <form onSubmit={handleBehaviorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={row2}>
              <div>
                <label style={lbl}>Fecha *</label>
                <input type="date" style={inp} value={behaviorForm.fecha} onChange={e => setBehaviorForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Etólogo / Evaluador</label>
                <input style={inp} value={behaviorForm.evaluador} onChange={e => setBehaviorForm(f => ({ ...f, evaluador: e.target.value }))} placeholder="Nombre del evaluador" />
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
              <SliderInput label="⚡ Nivel de actividad" value={behaviorForm.nivel_actividad} onChange={v => setBehaviorForm(f => ({ ...f, nivel_actividad: v }))} />
              <SliderInput label="🐕 Sociabilidad con perros" value={behaviorForm.soc_perros} onChange={v => setBehaviorForm(f => ({ ...f, soc_perros: v }))} />
              <SliderInput label="🐈 Sociabilidad con gatos" value={behaviorForm.soc_gatos} onChange={v => setBehaviorForm(f => ({ ...f, soc_gatos: v }))} />
              <SliderInput label="👶 Sociabilidad con niños" value={behaviorForm.soc_niños} onChange={v => setBehaviorForm(f => ({ ...f, soc_niños: v }))} />
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Hogar ideal</label>
                <input style={inp} value={behaviorForm.hogar_ideal} onChange={e => setBehaviorForm(f => ({ ...f, hogar_ideal: e.target.value }))} placeholder="ej: Casa con jardín" />
              </div>
              <div>
                <label style={lbl}>Experiencia previa</label>
                <select style={inp} value={behaviorForm.experiencia_previa} onChange={e => setBehaviorForm(f => ({ ...f, experiencia_previa: e.target.value }))}>
                  <option value="">Sin especificar</option>
                  <option value="No requerida">No requerida</option>
                  <option value="Recomendada">Recomendada</option>
                  <option value="Necesaria">Necesaria</option>
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>Observaciones</label>
              <textarea rows={4} style={{ ...inp, resize: 'vertical' }} value={behaviorForm.notas} onChange={e => setBehaviorForm(f => ({ ...f, notas: e.target.value }))} placeholder="Descripción detallada del comportamiento..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowBehaviorModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={savingBehavior} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {savingBehavior ? 'Guardando...' : 'Guardar evaluación'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDocModal && (
        <Modal title="Añadir documento" onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Tipo de documento</label>
              <select style={inp} value={docForm.tipo} onChange={e => setDocForm(f => ({ ...f, tipo: e.target.value }))}>
                {DOC_TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Nombre descriptivo *</label>
              <input style={inp} value={docForm.nombre} onChange={e => setDocForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Contrato de acogida firmado 2024" />
            </div>
            <div>
              <label style={lbl}>URL del documento *</label>
              <input type="url" style={inp} value={docForm.file_url} onChange={e => setDocForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>Sube el fichero a tu almacenamiento (Supabase Storage, Google Drive, etc.) y pega la URL pública aquí.</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowDocModal(false)} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={savingDoc || !docForm.nombre || !docForm.file_url} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {savingDoc ? 'Guardando...' : 'Guardar documento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
