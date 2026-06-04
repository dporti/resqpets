import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PublicShelter } from '../types';
import { SEOHead } from '../components/SEOHead';
import { AnimalCard, AnimalCardSkeleton } from '../components/AnimalCard';

export function ProtectoraDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shelter, setShelter] = useState<PublicShelter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getShelterBySlug(slug).then(s => { setShelter(s); setLoading(false); }).catch(() => setLoading(false));
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ height: 200, borderRadius: 16, marginBottom: 20, ...shimmer }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => <AnimalCardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (!shelter) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
      <h2>Protectora no encontrada</h2>
      <Link to="/protectoras" style={{ color: '#16a34a', fontWeight: 600 }}>← Ver todas las protectoras</Link>
    </div>
  );

  return (
    <>
      <SEOHead
        title={shelter.nombre}
        description={shelter.description_public || `${shelter.nombre} tiene ${shelter.animales_en_adopcion} animales en adopción en ResQPet`}
        image={shelter.cover_url}
      />

      {/* Cover + header */}
      <div style={{
        height: 200, background: shelter.cover_url
          ? `url(${shelter.cover_url}) center/cover`
          : 'linear-gradient(135deg, #064e3b, #059669)',
        position: 'relative',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex', gap: 24, alignItems: 'flex-end',
          marginTop: -40, marginBottom: 32, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 88, height: 88, borderRadius: 18,
            background: '#fff', border: '4px solid #fff',
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, overflow: 'hidden', flexShrink: 0,
          }}>
            {shelter.logo_url
              ? <img src={shelter.logo_url} alt={shelter.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🏠'}
          </div>
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{shelter.nombre}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {shelter.ciudad && <span style={{ fontSize: 14, color: '#6b7280' }}>📍 {shelter.ciudad}</span>}
              {shelter.email && <a href={`mailto:${shelter.email}`} style={{ fontSize: 14, color: '#16a34a', textDecoration: 'none' }}>✉️ {shelter.email}</a>}
              {shelter.telefono && <span style={{ fontSize: 14, color: '#6b7280' }}>📞 {shelter.telefono}</span>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, paddingBottom: 8, flexWrap: 'wrap' }}>
            {shelter.website && (
              <a href={shelter.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '8px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151' }}>
                🌐 Web
              </a>
            )}
            {shelter.instagram && (
              <a href={`https://instagram.com/${shelter.instagram}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '8px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151' }}>
                📸 Instagram
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatBox value={shelter.animales_en_adopcion} label="animales en adopción" />
          {shelter.adopciones_completadas != null && (
            <StatBox value={shelter.adopciones_completadas} label="adopciones completadas" />
          )}
        </div>

        {shelter.description_public && (
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 14, padding: 24, marginBottom: 40,
          }}>
            <p style={{ margin: 0, color: '#374151', lineHeight: 1.7, fontSize: 15 }}>
              {shelter.description_public}
            </p>
          </div>
        )}

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
          Animales en adopción ({shelter.animales?.length || 0})
        </h2>

        {shelter.animales && shelter.animales.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginBottom: 60 }}>
            {shelter.animales.map(a => (
              <AnimalCard key={a.id} animal={{
                ...a,
                refugio_id: shelter.id,
                refugio_nombre: shelter.nombre,
                refugio_ciudad: shelter.ciudad,
                refugio_slug: shelter.slug,
                nivel_actividad: 0, soc_perros: 0, soc_gatos: 0, soc_niños: 0,
                veces_visto: 0, veces_compartido: 0,
                vacunado: (a as any).vacunado || false,
                esterilizado: (a as any).esterilizado || false,
                microchip: (a as any).microchip || false,
                desparasitado: (a as any).desparasitado || false,
                created_at: (a as any).created_at || '',
              }} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', marginBottom: 60 }}>
            <p style={{ fontSize: 18 }}>Esta protectora no tiene animales publicados actualmente</p>
            <Link to="/adoptar" style={{ color: '#16a34a', fontWeight: 600 }}>Ver todos los animales →</Link>
          </div>
        )}
      </div>
    </>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      borderRadius: 12, padding: '16px 24px', textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{label}</p>
    </div>
  );
}

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
};
