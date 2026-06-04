import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PublicAnimal } from '../types';
import { SEOHead } from '../components/SEOHead';
import { AdoptionForm } from '../forms/AdoptionForm';
import { AnimalCard } from '../components/AnimalCard';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80';

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [animal, setAnimal] = useState<PublicAnimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getAnimal(Number(id)).then(a => {
      setAnimal(a);
      setLoading(false);
    }).catch(() => setLoading(false));
    window.scrollTo({ top: 0 });
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!animal) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h2>Animal no encontrado</h2>
      <Link to="/adoptar" style={{ color: '#16a34a', fontWeight: 600 }}>← Ver todos los animales</Link>
    </div>
  );

  const fotos: string[] = animal.fotos?.map(f => f.url) ||
    (Array.isArray(animal.fotos_urls) ? animal.fotos_urls : []) ||
    (animal.foto_principal ? [animal.foto_principal] : [PLACEHOLDER]);
  if (fotos.length === 0) fotos.push(PLACEHOLDER);

  const edad = animal.edad_años != null
    ? animal.edad_años === 0 ? `${animal.edad_meses || '?'} meses`
    : `${animal.edad_años} año${animal.edad_años !== 1 ? 's' : ''}`
    : null;

  const share = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Mira a ${animal.nombre}, ¡está en adopción! 🐾`);
    let href = '';
    if (platform === 'whatsapp') href = `https://wa.me/?text=${text}%20${url}`;
    if (platform === 'twitter') href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if (platform === 'facebook') href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'copy') { navigator.clipboard.writeText(window.location.href); return; }
    if (href) window.open(href, '_blank');
    api.trackShare(animal.id).catch(() => {});
  };

  const TRAIT_LABELS: Record<string, string> = {
    nivel_actividad: 'Nivel de actividad',
    soc_perros: 'Con otros perros',
    soc_gatos: 'Con gatos',
    soc_niños: 'Con niños',
  };

  return (
    <>
      <SEOHead
        title={`${animal.nombre}${animal.raza ? `, ${animal.raza}` : ''} en adopción${animal.refugio_ciudad ? ` en ${animal.refugio_ciudad}` : ''}`}
        description={animal.descripcion?.slice(0, 160) || `${animal.nombre} busca un hogar para siempre. Adoptalo en ResQPet.`}
        image={fotos[0]}
      />

      {/* Breadcrumb */}
      <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Inicio</Link>
          {' > '}
          <Link to="/adoptar" style={{ color: '#6b7280', textDecoration: 'none' }}>Adoptar</Link>
          {' > '}
          <span style={{ color: '#111827', fontWeight: 500 }}>{animal.nombre}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }} className="animal-grid">
          {/* Columna izquierda */}
          <div>
            {/* Galería */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                background: '#f3f4f6', position: 'relative', paddingTop: '66%', marginBottom: 10,
              }}>
                <img
                  src={fotos[photoIdx] || PLACEHOLDER}
                  alt={animal.nombre}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {fotos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIdx(i => (i - 1 + fotos.length) % fotos.length)} style={navBtn('left')}>‹</button>
                    <button onClick={() => setPhotoIdx(i => (i + 1) % fotos.length)} style={navBtn('right')}>›</button>
                  </>
                )}
              </div>
              {fotos.length > 1 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {fotos.map((f, i) => (
                    <img key={i} src={f} alt="" onClick={() => setPhotoIdx(i)}
                      style={{
                        width: 72, height: 56, objectFit: 'cover', borderRadius: 8,
                        cursor: 'pointer', border: i === photoIdx ? '2.5px solid #22c55e' : '2.5px solid transparent',
                        flexShrink: 0, opacity: i === photoIdx ? 1 : .7,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sobre el animal */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                Sobre {animal.nombre}
              </h2>
              {animal.descripcion && (
                <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 15, marginBottom: 16 }}>
                  {animal.descripcion}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {animal.vacunado && <HealthBadge label="💉 Vacunado" />}
                {animal.esterilizado && <HealthBadge label="✂️ Esterilizado" />}
                {animal.microchip && <HealthBadge label="📡 Microchip" />}
                {animal.desparasitado && <HealthBadge label="🛡️ Desparasitado" />}
              </div>
            </section>

            {/* Características */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                Características
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { icon: '🎂', label: 'Edad', val: edad || '?' },
                  { icon: '⚖️', label: 'Peso', val: animal.peso_kg ? `${animal.peso_kg} kg` : '?' },
                  { icon: '📏', label: 'Tamaño', val: animal.tamaño || '?' },
                  { icon: '🎨', label: 'Color', val: animal.color || '?' },
                  { icon: animal.sexo === 'macho' ? '♂' : '♀', label: 'Sexo', val: animal.sexo || '?' },
                  { icon: '📍', label: 'Ubicación', val: animal.ubicacion_texto || animal.refugio_ciudad || '?' },
                ].map(c => (
                  <div key={c.label} style={{
                    background: '#f9fafb', borderRadius: 10, padding: '12px 14px',
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.3px' }}>{c.label}</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Personalidad */}
            {(animal.nivel_actividad > 0 || animal.soc_perros > 0 || animal.soc_gatos > 0 || animal.soc_niños > 0) && (
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                  Personalidad
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(['nivel_actividad', 'soc_perros', 'soc_gatos', 'soc_niños'] as const).map(k => {
                    const val = animal[k] as number;
                    if (!val) return null;
                    return (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 14, color: '#374151' }}>{TRAIT_LABELS[k]}</span>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{val}/5</span>
                        </div>
                        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${(val / 5) * 100}%`, height: '100%', background: '#22c55e', borderRadius: 4, transition: 'width .6s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {animal.hogar_ideal && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '12px 14px', marginTop: 16 }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
                      🏠 <strong>Hogar ideal:</strong> {animal.hogar_ideal}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Animales similares */}
            {animal.similar && animal.similar.length > 0 && (
              <section>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                  También te podría gustar...
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                  {animal.similar.map(a => <AnimalCard key={a.id} animal={a} />)}
                </div>
              </section>
            )}
          </div>

          {/* Columna derecha sticky */}
          <aside className="animal-aside">
            <div style={{ position: 'sticky', top: 80 }}>
              {/* Tarjeta protectora */}
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 16,
              }}>
                <Link to={`/protectoras/${animal.refugio_slug || animal.refugio_id}`} style={{
                  display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', marginBottom: 14,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: '#f0fdf4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>
                    {animal.refugio_logo
                      ? <img src={animal.refugio_logo} style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
                      : '🏠'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 15 }}>{animal.refugio_nombre}</p>
                    {animal.refugio_ciudad && <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>📍 {animal.refugio_ciudad}</p>}
                  </div>
                </Link>
                {animal.refugio_animales_en_adopcion != null && (
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>
                    {animal.refugio_animales_en_adopcion} animales en adopción
                  </p>
                )}
                <Link to={`/protectoras/${animal.refugio_slug || animal.refugio_id}`} style={{
                  display: 'block', textAlign: 'center', padding: '8px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', color: '#374151', textDecoration: 'none',
                  fontSize: 13, fontWeight: 500,
                }}>
                  Ver todos sus animales
                </Link>
              </div>

              {/* CTA adopción */}
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 16,
              }}>
                <button onClick={() => setShowForm(true)} style={{
                  width: '100%', padding: '16px', background: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  fontSize: 17, fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(34,197,94,.3)',
                  marginBottom: 14,
                }}>
                  🐾 Solicitar adopción
                </button>
                {[
                  { icon: '✓', text: 'Proceso 100% gratuito' },
                  { icon: '⏱', text: 'Respuesta en menos de 48h' },
                  { icon: '🤝', text: 'Te acompañamos en todo el proceso' },
                ].map(i => (
                  <div key={i.text} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 13, color: '#6b7280' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{i.icon}</span>
                    {i.text}
                  </div>
                ))}
              </div>

              {/* Compartir */}
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20,
              }}>
                <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#374151' }}>Compartir</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { platform: 'whatsapp', label: '💬', color: '#25d366' },
                    { platform: 'facebook', label: 'f', color: '#1877f2' },
                    { platform: 'twitter', label: '𝕏', color: '#000' },
                    { platform: 'copy', label: '🔗', color: '#6b7280' },
                  ].map(s => (
                    <button key={s.platform} onClick={() => share(s.platform)} style={{
                      flex: 1, padding: '10px 0', background: '#f9fafb',
                      border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                      fontSize: 16, transition: 'all .15s',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showForm && <AdoptionForm animal={animal} onClose={() => setShowForm(false)} />}

      <style>{`
        @media (max-width: 860px) {
          .animal-grid { grid-template-columns: 1fr !important; }
          .animal-aside { position: static !important; }
        }
      `}</style>
    </>
  );
}

function HealthBadge({ label }: { label: string }) {
  return (
    <span style={{
      background: '#f0fdf4', color: '#16a34a',
      padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500,
      border: '1px solid #bbf7d0',
    }}>
      {label}
    </span>
  );
}

function navBtn(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: 12,
    background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
    color: '#fff', border: 'none', borderRadius: '50%',
    width: 40, height: 40, fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
        <div>
          <div style={{ paddingTop: '66%', background: '#f3f4f6', borderRadius: 16, marginBottom: 16, ...shimmer }} />
          <div style={{ height: 28, width: '50%', background: '#f3f4f6', borderRadius: 8, marginBottom: 12, ...shimmer }} />
          <div style={{ height: 16, width: '100%', background: '#f3f4f6', borderRadius: 6, marginBottom: 8, ...shimmer }} />
          <div style={{ height: 16, width: '80%', background: '#f3f4f6', borderRadius: 6, ...shimmer }} />
        </div>
        <div style={{ height: 300, background: '#f3f4f6', borderRadius: 16, ...shimmer }} />
      </div>
    </div>
  );
}

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};
