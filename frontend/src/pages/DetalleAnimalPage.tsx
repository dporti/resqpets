import { useEffect, useState } from 'react';
import { Animal } from '../types';
import { api } from '../api/client';
import { Badge, DotsBar, formatDate, formatDateTime, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

interface Props {
  animalId: number;
  onVolver: () => void;
}

const TABS = ['Información', 'Salud', 'Comportamiento', 'Documentos', 'Historia', 'Redes y difusión'];

export default function DetalleAnimalPage({ animalId, onVolver }: Props) {
  const { can } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Información');
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAnimal(animalId)
      .then(setAnimal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [animalId]);

  const handleAddNota = async () => {
    if (!nuevaNota.trim() || !animal) return;
    setGuardandoNota(true);
    try {
      await api.addNota(animal.id, nuevaNota.trim());
      const updated = await api.getAnimal(animal.id);
      setAnimal(updated);
      setNuevaNota('');
    } catch (e) {
      console.error(e);
    } finally {
      setGuardandoNota(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Spinner size={40} />
    </div>
  );

  if (!animal) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: '#9ca3af' }}>
      Animal no encontrado
    </div>
  );

  const comportamiento = [
    { icon: '⚡', label: 'Nivel de actividad', val: animal.nivel_actividad },
    { icon: '🐕', label: 'Sociabilidad con perros', val: animal.soc_perros },
    { icon: '🐈', label: 'Sociabilidad con gatos', val: animal.soc_gatos },
    { icon: '👶', label: 'Sociabilidad con niños', val: animal.soc_niños },
  ];

  const nivelLabel = (v: number) => {
    const m: Record<number, string> = { 0: 'No testado', 1: 'Baja', 2: 'Media', 3: 'Buena', 4: 'Alta', 5: 'Excelente' };
    return m[v] ?? '—';
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        height: 56, padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', background: '#fff',
        borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onVolver} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', fontSize: 13, color: '#374151', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontWeight: 500,
        }}>← Volver al listado</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {can('animales:update') && (
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7,
              padding: '7px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: '#374151', fontFamily: "'Inter', sans-serif",
            }}>✏️ Editar</button>
          )}
          <button style={{
            background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
            padding: '7px 12px', fontSize: 13, cursor: 'pointer', color: '#374151',
            fontFamily: "'Inter', sans-serif",
          }}>Más acciones ▾</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', minHeight: 'calc(100vh - 56px)' }}>

        {/* MAIN */}
        <div style={{ padding: '22px 24px', borderRight: '1px solid #e5e7eb' }}>

          {/* Foto + info */}
          <div style={{ display: 'flex', gap: 22, marginBottom: 22 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 210, height: 200, borderRadius: 12,
                background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 90, border: '1px solid #e5e7eb',
              }}>
                {animal.especie === 'perro' ? '🐕' : animal.especie === 'gato' ? '🐈' : '🐾'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 40, height: 40, borderRadius: 7,
                    background: i === 0 ? '#dcfce7' : '#f3f4f6',
                    border: i === 0 ? '2px solid #16a34a' : '1px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {animal.especie === 'perro' ? '🐕' : '🐈'}
                  </div>
                ))}
                <div style={{
                  width: 40, height: 40, borderRadius: 7, background: '#f3f4f6',
                  border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280',
                }}>+3</div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0 }}>{animal.nombre}</h1>
                <Badge estado={animal.estado} />
              </div>
              <div style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 18, display: 'flex', gap: 8 }}>
                <span>{animal.sexo}</span><span style={{ color: '#d1d5db' }}>•</span>
                <span>{animal.raza}</span><span style={{ color: '#d1d5db' }}>•</span>
                <span>{animal.peso_kg} kg</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                {[
                  { icon: '🏷️', label: 'ID interno', val: animal.id_interno },
                  { icon: '📅', label: 'Fecha de entrada', val: formatDate(animal.fecha_entrada) },
                  { icon: '📍', label: 'Procedencia', val: animal.procedencia },
                  { icon: '🏠', label: 'Ubicación actual', val: animal.ubicacion_texto },
                  { icon: '❤️', label: 'Estado de salud', val: animal.estado_salud, verde: animal.estado_salud === 'Saludable' },
                  { icon: '✂️', label: 'Esterilizado', val: animal.esterilizado ? 'Sí' : 'No' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 2 }}>{f.icon} {f.label}</div>
                    <div style={{ fontSize: 13.5, color: '#111', fontWeight: 500 }}>
                      {f.val} {f.verde && '✅'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
                {animal.vacunado && <Tag>Vacunado</Tag>}
                {animal.desparasitado && <Tag>Desparasitado</Tag>}
                {animal.microchip && <Tag>Microchip</Tag>}
                {animal.pasaporte && <Tag>Pasaporte</Tag>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', marginBottom: 20 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '9px 12px', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid #16a34a' : '2px solid transparent',
                marginBottom: -2, fontSize: 12.5, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#16a34a' : '#6b7280', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}>{t}</button>
            ))}
          </div>

          {tab === 'Información' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 10 }}>Sobre {animal.nombre}</h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: 20 }}>
                  {animal.descripcion || 'Sin descripción'}
                </p>

                {comportamiento.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>{r.icon}</span>
                    <span style={{ fontSize: 13, color: '#4b5563', flex: 1 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: '#111', fontWeight: 500, marginRight: 8 }}>{nivelLabel(r.val)}</span>
                    {r.val > 0 && <DotsBar val={r.val} />}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, width: 20 }}>🏡</span>
                  <span style={{ fontSize: 13, color: '#4b5563', flex: 1 }}>Tipo de hogar ideal</span>
                  <span style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{animal.hogar_ideal || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, width: 20 }}>🎓</span>
                  <span style={{ fontSize: 13, color: '#4b5563', flex: 1 }}>Experiencia previa</span>
                  <span style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{animal.experiencia_previa || '—'}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 10 }}>Características físicas</h3>
                <div style={{ background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6', marginBottom: 20 }}>
                  {[
                    { label: 'Color', val: animal.color },
                    { label: 'Tipo de pelo', val: animal.tipo_pelo },
                    { label: 'Ojos', val: animal.ojos },
                    { label: 'Tamaño', val: animal.tamaño },
                    { label: 'Señas particulares', val: animal.señas_particulares },
                  ].map((f, i, arr) => (
                    <div key={f.label} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '9px 14px',
                      borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{f.label}</span>
                      <span style={{ fontSize: 13, color: '#111', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{f.val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab !== 'Información' && (
            <div style={{
              background: '#f9fafb', borderRadius: 10, padding: 32, textAlign: 'center',
              color: '#9ca3af', fontSize: 13, border: '1px dashed #e5e7eb',
            }}>
              Sección <strong>"{tab}"</strong> — disponible próximamente
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding: '22px 18px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Actividad reciente */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', fontWeight: 600, fontSize: 14, color: '#111', borderBottom: '1px solid #f3f4f6' }}>
              Actividad reciente
            </div>
            {(animal.actividad || []).map((a, i, arr) => (
              <div key={a.id} style={{
                display: 'flex', gap: 10, padding: '11px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14,
                }}>
                  {a.tipo === 'vacunacion' ? '💉' : a.tipo === 'adopcion' ? '❤️' : a.tipo === 'acogida' ? '🏠' : '📋'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>{a.titulo}</div>
                  {a.descripcion && <div style={{ fontSize: 12, color: '#6b7280' }}>{a.descripcion}</div>}
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {formatDateTime(a.created_at)}
                </div>
              </div>
            ))}
            {(!animal.actividad || animal.actividad.length === 0) && (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Sin actividad registrada</div>
            )}
          </div>

          {/* Notas internas */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', fontWeight: 600, fontSize: 14, color: '#111', borderBottom: '1px solid #f3f4f6' }}>
              Notas internas
            </div>
            {(animal.notas || []).map((n, i) => (
              <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                    {formatDate(n.created_at)} · {n.autor_nombre}
                  </span>
                  {n.pinned && <span title="Fijada" style={{ fontSize: 12 }}>📌</span>}
                </div>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{n.texto}</p>
              </div>
            ))}
            {can('animales:read') && (
              <div style={{ padding: 12 }}>
                <textarea
                  value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)}
                  placeholder="Añadir nota..."
                  style={{
                    width: '100%', minHeight: 64, padding: '8px 10px', borderRadius: 7,
                    border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical',
                    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddNota}
                  disabled={guardandoNota || !nuevaNota.trim()}
                  style={{
                    marginTop: 6, width: '100%', padding: '8px 0',
                    background: guardandoNota || !nuevaNota.trim() ? '#e5e7eb' : '#16a34a',
                    color: guardandoNota || !nuevaNota.trim() ? '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                    cursor: guardandoNota || !nuevaNota.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {guardandoNota ? 'Guardando...' : 'Añadir nota'}
                </button>
              </div>
            )}
          </div>

          {/* Difusión */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Difusión y visibilidad</span>
              {can('animales:publish') && (
                <span style={{ fontSize: 12.5, color: '#374151', cursor: 'pointer', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 9px' }}>Editar</span>
              )}
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#374151' }}>🌐 Estado en la web</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: animal.web_publicado ? '#16a34a' : '#6b7280' }}>
                    {animal.web_publicado ? 'Publicado' : 'No publicado'}
                  </span>
                  <div style={{
                    width: 34, height: 19, borderRadius: 10,
                    background: animal.web_publicado ? '#16a34a' : '#d1d5db',
                    position: 'relative', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2, left: animal.web_publicado ? 17 : 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
              </div>
              {[
                { icon: '📡', label: 'Veces compartido', val: `${animal.veces_compartido} veces` },
                { icon: '👁️', label: 'Veces visto', val: animal.veces_visto.toLocaleString('es-ES') },
                { icon: '✉️', label: 'Contactos recibidos', val: animal.contactos_recibidos },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{s.icon} {s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{s.val}</span>
                </div>
              ))}
              <button style={{
                width: '100%', padding: '10px 0', background: '#111827', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                Ver en el perfil público ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      padding: '4px 11px', borderRadius: 20, fontSize: 12,
      background: '#f0f9ff', color: '#0369a1',
      border: '1px solid #bae6fd', fontWeight: 500,
    }}>{children}</span>
  );
}
