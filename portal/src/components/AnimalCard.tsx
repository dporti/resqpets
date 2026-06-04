import { Link } from 'react-router-dom';
import { PublicAnimal } from '../types';
import { useState } from 'react';
import { api } from '../api/client';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80';

function getFavorites(): number[] {
  try { return JSON.parse(localStorage.getItem('resqpet_favs') || '[]'); } catch { return []; }
}
function toggleFav(id: number) {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
  localStorage.setItem('resqpet_favs', JSON.stringify(next));
  return next.includes(id);
}

const MESES_EN_PROTECTORA = (fechaEntrada?: string) => {
  if (!fechaEntrada) return 0;
  return Math.floor((Date.now() - new Date(fechaEntrada).getTime()) / (1000 * 60 * 60 * 24 * 30));
};

export function AnimalCard({ animal }: { animal: PublicAnimal }) {
  const [fav, setFav] = useState(() => getFavorites().includes(animal.id));
  const meses = MESES_EN_PROTECTORA(animal.fecha_entrada);
  const urgente = meses >= 6;

  const foto = animal.foto_principal ||
    (Array.isArray(animal.fotos_urls) ? animal.fotos_urls[0] : undefined) ||
    PLACEHOLDER;

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    const isNowFav = toggleFav(animal.id);
    setFav(isNowFav);
  };

  const edad = animal.edad_años != null
    ? animal.edad_años === 0
      ? `${animal.edad_meses || '?'} meses`
      : `${animal.edad_años} año${animal.edad_años !== 1 ? 's' : ''}`
    : null;

  return (
    <Link to={`/adoptar/${animal.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        transition: 'transform .2s, box-shadow .2s',
        cursor: 'pointer',
        position: 'relative',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.1)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        {/* Foto */}
        <div style={{ position: 'relative', paddingTop: '66%', background: '#f3f4f6' }}>
          <img
            src={foto}
            alt={animal.nombre}
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
          {/* Badge especie */}
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
            color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12,
          }}>
            {animal.especie === 'perro' ? '🐕' : animal.especie === 'gato' ? '🐈' : '🐾'}{' '}
            {animal.especie.charAt(0).toUpperCase() + animal.especie.slice(1)}
          </span>
          {/* Badge urgente */}
          {urgente && (
            <span style={{
              position: 'absolute', top: 10, right: 42,
              background: '#f97316', color: '#fff',
              borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
            }}>
              ⏰ Urgente
            </span>
          )}
          {/* Favorito */}
          <button onClick={handleFav} style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,.9)',
            border: 'none', borderRadius: '50%',
            width: 34, height: 34, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,.15)',
          }}>
            {fav ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
              {animal.nombre}
            </h3>
            {animal.sexo && (
              <span style={{ fontSize: 14 }}>{animal.sexo === 'macho' ? '♂' : '♀'}</span>
            )}
          </div>

          <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: 13 }}>
            {[animal.raza, edad, animal.tamaño].filter(Boolean).join(' · ')}
          </p>

          {animal.ubicacion_texto && (
            <p style={{ margin: '0 0 10px', color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
              📍 {animal.ubicacion_texto}
            </p>
          )}

          {/* Chips sanitarios */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {animal.vacunado && <Chip label="Vac ✓" />}
            {animal.esterilizado && <Chip label="Est ✓" />}
            {animal.microchip && <Chip label="Chip ✓" />}
          </div>

          <p style={{ margin: '0 0 12px', color: '#9ca3af', fontSize: 11 }}>
            {animal.refugio_nombre}
          </p>

          <div style={{
            background: '#22c55e', color: '#fff',
            padding: '9px 0', borderRadius: 10,
            textAlign: 'center', fontWeight: 600, fontSize: 14,
          }}>
            Conocer a {animal.nombre} →
          </div>
        </div>
      </div>
    </Link>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      background: '#f0fdf4', color: '#16a34a',
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      border: '1px solid #bbf7d0',
    }}>
      {label}
    </span>
  );
}

export function AnimalCardSkeleton() {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ paddingTop: '66%', background: '#f3f4f6', position: 'relative' }}>
        <div style={{ ...shimmerStyle, position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ ...shimmerStyle, height: 20, borderRadius: 6, width: '60%', marginBottom: 8 }} />
        <div style={{ ...shimmerStyle, height: 14, borderRadius: 6, width: '80%', marginBottom: 12 }} />
        <div style={{ ...shimmerStyle, height: 36, borderRadius: 10 }} />
      </div>
    </div>
  );
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};
