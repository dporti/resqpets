import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Animal, FosterFamily } from '../types';
import { api } from '../api/client';
import { AnimalAvatar, Spinner, ErrorState } from '../components/ui';

interface Props {
  familiaId?: number;    // si se abre desde la familia
  animalId?: number;     // si se abre desde el animal
  onClose: () => void;
  onAsignado: () => void;
}

function calcCompatibility(animal: Animal, familia: FosterFamily): number {
  let score = 0;
  if (animal.especie === 'perro' && familia.acepta_perros) score += 30;
  else if (animal.especie === 'gato' && familia.acepta_gatos) score += 30;
  else if (animal.especie === 'otro' && familia.acepta_otros) score += 30;
  const tam = animal.tamaño as string;
  if (tam === 'pequeño' && familia.acepta_pequeño) score += 20;
  else if (tam === 'mediano' && familia.acepta_mediano) score += 20;
  else if (tam === 'grande' && familia.acepta_grande) score += 20;
  else if (!tam) score += 20;
  const goodKids = (animal.soc_niños >= 3);
  if (!familia.ninos_casa || goodKids) score += 15;
  const hasOthers = !!(familia.otros_animales_casa && familia.otros_animales_casa.trim().length > 2);
  if (!hasOthers || (animal.soc_perros >= 3 && animal.soc_gatos >= 3)) score += 15;
  const needsSpecial = !!(animal.estado_salud && animal.estado_salud !== 'Saludable');
  if (!needsSpecial || familia.acepta_necesidades_especiales) score += 20;
  return Math.min(100, score);
}

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' };

export default function AsignarAcogidaModal({ familiaId, animalId: propAnimalId, onClose, onAsignado }: Props) {
  const [step, setStep] = useState(1);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [familias, setFamilias] = useState<FosterFamily[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedFamilia, setSelectedFamilia] = useState<FosterFamily | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    iniciada_at: new Date().toISOString().slice(0, 10),
    fin_estimado_at: '',
    notas_coordinador: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (familiaId) {
        const [famRes, animRes] = await Promise.all([
          api.getFamilia(familiaId),
          api.getAnimales({ limit: '100' }),
        ]);
        setSelectedFamilia(famRes);
        setAnimales(animRes.data.filter(a => a.estado === 'en_residencia' || a.estado === 'en_evaluacion'));
        setStep(1);
      } else if (propAnimalId) {
        const [animalRes, famRes] = await Promise.all([
          api.getAnimal(propAnimalId),
          api.getFamilias({ estado: 'available' }),
        ]);
        setSelectedAnimal(animalRes);
        setFamilias(famRes.filter(f => f.animales_actuales < f.max_animales));
        setStep(2);
      }
    } catch (e) { console.error(e); setError(true); } finally { setLoading(false); }
  }, [familiaId, propAnimalId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFamilia || !selectedAnimal) return;
    setSaving(true);
    try {
      await api.asignarAnimal(selectedFamilia.id, {
        animal_id: selectedAnimal.id,
        ...form,
      });
      onAsignado(); onClose();
    } finally { setSaving(false); }
  };

  const filteredAnimals = animales.filter(a =>
    a.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (a.raza || '').toLowerCase().includes(search.toLowerCase())
  );

  const sortedFamilias = familiaId ? [] : [...familias].sort((a, b) => {
    if (!selectedAnimal) return 0;
    return calcCompatibility(selectedAnimal, b) - calcCompatibility(selectedAnimal, a);
  });

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-surface)', borderRadius: 14, width: 540, maxHeight: '90vh', overflowY: 'auto', zIndex: 70, fontFamily: "'Inter', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Asignar animal a acogida</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {['Seleccionar animal', 'Seleccionar familia', 'Confirmar'].map((label, i) => (
                <span key={i} style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                  background: step === i + 1 ? '#16a34a' : step > i + 1 ? '#dcfce7' : 'var(--bg-subtle-2)',
                  color: step === i + 1 ? '#fff' : step > i + 1 ? '#15803d' : 'var(--text-faint)',
                }}>{i + 1}. {label}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-faint)' }}>×</button>
        </div>

        <div style={{ padding: 22 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={32} /></div>
          ) : error ? (
            <ErrorState onRetry={loadData} />
          ) : step === 1 ? (
            /* ── STEP 1: Seleccionar animal ── */
            <div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o raza..."
                style={{ ...inp, marginBottom: 14 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {filteredAnimals.map(a => {
                  const score = selectedFamilia ? calcCompatibility(a, selectedFamilia) : null;
                  return (
                    <div key={a.id} onClick={() => { setSelectedAnimal(a); if (familiaId) setStep(3); else setStep(2); }}
                      style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 9, border: `2px solid ${selectedAnimal?.id === a.id ? '#16a34a' : 'var(--border)'}`, background: selectedAnimal?.id === a.id ? '#f0fdf4' : '#fff', cursor: 'pointer', alignItems: 'center' }}>
                      <AnimalAvatar especie={a.especie} id={a.id} size={40} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{a.especie} · {a.raza || '—'} · {a.tamaño || '—'}</div>
                      </div>
                      {score !== null && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626' }}>{score}%</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>compat.</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredAnimals.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 32 }}>Sin animales disponibles</div>}
              </div>
            </div>
          ) : step === 2 ? (
            /* ── STEP 2: Seleccionar familia ── */
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                Familias ordenadas por compatibilidad con <strong>{selectedAnimal?.nombre}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {sortedFamilias.map(f => {
                  const score = selectedAnimal ? calcCompatibility(selectedAnimal, f) : 0;
                  const slotsLibres = f.max_animales - f.animales_actuales;
                  return (
                    <div key={f.id} onClick={() => { setSelectedFamilia(f); setStep(3); }}
                      style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 9, border: `2px solid ${selectedFamilia?.id === f.id ? '#16a34a' : 'var(--border)'}`, background: selectedFamilia?.id === f.id ? '#f0fdf4' : '#fff', cursor: 'pointer', alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1d4ed8', flexShrink: 0 }}>
                        {f.nombre.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{f.zona || f.ciudad || '—'} · {slotsLibres} slot{slotsLibres !== 1 ? 's' : ''} libre{slotsLibres !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626' }}>{score}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>compat.</div>
                      </div>
                    </div>
                  );
                })}
                {sortedFamilias.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 32 }}>Sin familias disponibles</div>}
              </div>
              <button onClick={() => setStep(1)} style={{ marginTop: 12, padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 12.5, fontFamily: "'Inter', sans-serif" }}>← Cambiar animal</button>
            </div>
          ) : (
            /* ── STEP 3: Confirmar ── */
            <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Resumen */}
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 10 }}>Resumen de asignación</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Animal</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{selectedAnimal?.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{selectedAnimal?.especie} · {selectedAnimal?.raza}</div>
                  </div>
                  <div style={{ fontSize: 20, alignSelf: 'center', color: '#16a34a' }}>→</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Familia de acogida</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{selectedFamilia?.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{selectedFamilia?.zona || selectedFamilia?.ciudad}</div>
                  </div>
                </div>
                {selectedAnimal && selectedFamilia && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: '#15803d' }}>
                    Compatibilidad: <strong>{calcCompatibility(selectedAnimal, selectedFamilia)}%</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Fecha de inicio</label><input type="date" style={inp} value={form.iniciada_at} onChange={e => setForm(f => ({ ...f, iniciada_at: e.target.value }))} /></div>
                <div><label style={lbl}>Fin estimado (opcional)</label><input type="date" style={inp} value={form.fin_estimado_at} onChange={e => setForm(f => ({ ...f, fin_estimado_at: e.target.value }))} /></div>
              </div>
              <div>
                <label style={lbl}>Notas para la familia</label>
                <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.notas_coordinador} onChange={e => setForm(f => ({ ...f, notas_coordinador: e.target.value }))} placeholder="Instrucciones especiales, medicación, horarios, etc." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <button type="button" onClick={() => setStep(familiaId ? 1 : 2)} style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>← Cambiar</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving ? <><Spinner size={14} /> Asignando...</> : '🐾 Confirmar asignación'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
