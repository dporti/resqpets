import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PublicShelter } from '../types';
import { SEOHead } from '../components/SEOHead';

export function ProtectorasPage() {
  const [shelters, setShelters] = useState<PublicShelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getShelters().then(s => { setShelters(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = shelters.filter(s =>
    !search || s.nombre.toLowerCase().includes(search.toLowerCase()) || (s.ciudad || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <SEOHead title="Protectoras colaboradoras" description="Directorio de protectoras y refugios de animales colaboradores de ResQPet" />

      <div style={{
        background: 'linear-gradient(135deg, #064e3b, #065f46)',
        padding: '48px 20px 40px', color: '#fff', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 12px' }}>
          Protectoras colaboradoras
        </h1>
        <p style={{ fontSize: 16, opacity: .85, margin: '0 0 24px' }}>
          Organizaciones comprometidas con dar una segunda oportunidad a cada animal
        </p>
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Busca por nombre o ciudad..."
            style={{
              width: '100%', padding: '13px 18px', borderRadius: 12,
              border: 'none', fontSize: 15, outline: 'none',
              boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '48px auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 180, borderRadius: 16, ...shimmer }} />
            ))}
          </div>
        ) : (
          <>
            <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
              {filtered.length} protectoras {search ? 'encontradas' : 'colaboradoras'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map(s => <ShelterCard key={s.id} shelter={s} />)}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                <p style={{ fontSize: 18 }}>No se encontraron protectoras con ese nombre</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        maxWidth: 700, margin: '0 auto 80px', borderRadius: 20,
        padding: '40px 32px', textAlign: 'center', marginLeft: 'auto', marginRight: 'auto',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#14532d', margin: '0 0 10px' }}>
          ¿Tienes una protectora?
        </h2>
        <p style={{ color: '#16a34a', margin: '0 0 20px' }}>
          Únete a ResQPet y gestiona tus animales gratis
        </p>
        <a href="http://localhost:5173" style={{
          textDecoration: 'none', display: 'inline-block',
          padding: '12px 28px', background: '#22c55e', color: '#fff',
          borderRadius: 10, fontWeight: 600, fontSize: 15,
        }}>
          Solicitar acceso →
        </a>
      </div>
    </>
  );
}

function ShelterCard({ shelter }: { shelter: PublicShelter }) {
  const slug = shelter.slug || String(shelter.id);
  return (
    <Link to={`/protectoras/${slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
        overflow: 'hidden', transition: 'transform .2s, box-shadow .2s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.1)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        {/* Cover */}
        <div style={{ height: 80, background: shelter.cover_url ? `url(${shelter.cover_url}) center/cover` : 'linear-gradient(135deg,#064e3b,#059669)', position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: -20, left: 20,
            width: 48, height: 48, borderRadius: 12,
            background: '#fff', border: '3px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, overflow: 'hidden',
          }}>
            {shelter.logo_url
              ? <img src={shelter.logo_url} alt={shelter.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🏠'}
          </div>
        </div>

        <div style={{ padding: '28px 20px 20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>{shelter.nombre}</h3>
          {shelter.ciudad && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>📍 {shelter.ciudad}</p>
          )}
          {shelter.description_public && (
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {shelter.description_public}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              background: '#f0fdf4', color: '#16a34a',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}>
              {shelter.animales_en_adopcion} en adopción
            </span>
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Ver animales →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};
