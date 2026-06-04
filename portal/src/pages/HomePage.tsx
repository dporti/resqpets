import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PublicAnimal, PublicStats, PublicSosAlert, PublicShelter } from '../types';
import { AnimalCard, AnimalCardSkeleton } from '../components/AnimalCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SEOHead } from '../components/SEOHead';

export function HomePage() {
  const [animals, setAnimals] = useState<PublicAnimal[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sos, setSos] = useState<PublicSosAlert[]>([]);
  const [shelters, setShelters] = useState<PublicShelter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnimals({ limit: 8, order: 'reciente' }),
      api.getStats(),
      api.getSosAlerts(),
      api.getShelters(),
    ]).then(([a, s, sos, sh]) => {
      setAnimals(a.animals);
      setStats(s);
      setSos(sos.filter((x: PublicSosAlert) => x.estado === 'active').slice(0, 3));
      setShelters(sh.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead />

      {/* HERO */}
      <section style={{
        position: 'relative', minHeight: '88vh',
        display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
        overflow: 'hidden',
      }}>
        {/* Imagen de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1600&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.2,
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1200, margin: '0 auto', padding: '80px 20px',
          textAlign: 'center', color: '#fff',
        }}>
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,.15)',
            backdropFilter: 'blur(6px)', padding: '6px 18px', borderRadius: 20,
            fontSize: 13, fontWeight: 500, marginBottom: 24, letterSpacing: '.5px',
          }}>
            🐾 La plataforma de adopción animal #1 en España
          </span>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900,
            margin: '0 0 20px', lineHeight: 1.1,
            textShadow: '0 2px 20px rgba(0,0,0,.3)',
          }}>
            Cada animal merece<br />
            <span style={{ color: '#86efac' }}>un hogar</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 22px)', maxWidth: 640, margin: '0 auto 40px',
            opacity: .9, lineHeight: 1.6,
          }}>
            Conectamos animales en busca de familia con personas dispuestas a darles una segunda oportunidad
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/adoptar" style={{
              textDecoration: 'none',
              padding: '16px 36px',
              background: '#22c55e', color: '#fff',
              borderRadius: 14, fontSize: 17, fontWeight: 700,
              boxShadow: '0 8px 24px rgba(34,197,94,.4)',
              transition: 'transform .15s',
            }}>
              🐾 Quiero adoptar
            </Link>
            <Link to="/sos" style={{
              textDecoration: 'none',
              padding: '16px 36px',
              background: 'rgba(255,255,255,.15)',
              backdropFilter: 'blur(6px)',
              border: '1.5px solid rgba(255,255,255,.4)',
              color: '#fff',
              borderRadius: 14, fontSize: 17, fontWeight: 600,
            }}>
              🚨 He perdido/encontrado un animal
            </Link>
          </div>

          {/* Contadores */}
          {stats && (
            <div style={{
              display: 'flex', gap: 40, justifyContent: 'center',
              flexWrap: 'wrap', marginTop: 64,
              borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 40,
            }}>
              <StatPill value={stats.adopciones_completadas} label="animales encontraron hogar" />
              <StatPill value={stats.protectoras} label="protectoras colaboradoras" />
              <StatPill value={stats.sos_resueltos} label="avisos SOS resueltos" />
            </div>
          )}
        </div>
      </section>

      {/* ANIMALES QUE TE ESPERAN */}
      <section style={{ maxWidth: 1200, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
              Animales que te esperan
            </h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Cada uno tiene una historia única. ¿Será la tuya la próxima?</p>
          </div>
          <Link to="/adoptar" style={{
            textDecoration: 'none', color: '#16a34a',
            fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap',
          }}>
            Ver todos →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <AnimalCardSkeleton key={i} />)
            : animals.map(a => <AnimalCard key={a.id} animal={a} />)
          }
        </div>

        {!loading && animals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <p style={{ fontSize: 18 }}>No hay animales publicados aún.</p>
          </div>
        )}
      </section>

      {/* CÓMO FUNCIONA */}
      <section style={{ background: '#f0fdf4', padding: '80px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Adoptar es fácil
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 56 }}>
            Tres pasos y encontrarás a tu compañero para siempre
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { n: '01', emoji: '🔍', title: 'Encuentra tu compañero', text: 'Busca entre cientos de animales por especie, tamaño y ubicación' },
              { n: '02', emoji: '📝', title: 'Contacta con la protectora', text: 'Rellena el formulario de pre-adopción en menos de 5 minutos' },
              { n: '03', emoji: '🏠', title: 'Dale un hogar para siempre', text: 'La protectora te guía en todo el proceso de adopción' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, margin: '0 auto 16px',
                }}>
                  {s.emoji}
                </div>
                <span style={{
                  display: 'inline-block', background: '#22c55e', color: '#fff',
                  width: 26, height: 26, borderRadius: '50%',
                  fontSize: 12, fontWeight: 700, lineHeight: '26px',
                  textAlign: 'center', marginBottom: 12,
                }}>
                  {s.n}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/como-funciona" style={{
              textDecoration: 'none', color: '#16a34a', fontWeight: 600, fontSize: 15,
            }}>
              Saber más sobre el proceso →
            </Link>
          </div>
        </div>
      </section>

      {/* ÚLTIMOS AVISOS SOS */}
      {sos.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '80px auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Últimos avisos SOS
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>Ayuda a reunir animales perdidos con sus familias</p>
            </div>
            <Link to="/sos" style={{
              textDecoration: 'none', color: '#f97316',
              fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap',
            }}>
              Ver todos →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {sos.map(s => <SosCard key={s.id} alert={s} />)}
          </div>
        </section>
      )}

      {/* PROTECTORAS */}
      {shelters.length > 0 && (
        <section style={{ background: '#f9fafb', padding: '80px 20px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Protectoras colaboradoras
            </h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 48 }}>
              Organizaciones comprometidas con el bienestar animal
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {shelters.map(s => (
                <Link key={s.id} to={`/protectoras/${s.slug || s.id}`} style={{
                  textDecoration: 'none',
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 14, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  minWidth: 200, transition: 'box-shadow .15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: '#f0fdf4', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    {s.logo_url
                      ? <img src={s.logo_url} alt={s.nombre} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                      : '🏠'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827' }}>{s.nombre}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                      {s.animales_en_adopcion} animales en adopción
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section style={{
        background: 'linear-gradient(135deg, #16a34a, #059669)',
        padding: '80px 20px', textAlign: 'center', color: '#fff',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
            ¿Tienes una protectora?
          </h2>
          <p style={{ fontSize: 18, opacity: .9, margin: '0 0 36px', lineHeight: 1.6 }}>
            Gestiona tus animales, publica adopciones y recibe avisos SOS de tu zona, todo gratis
          </p>
          <a href="http://localhost:5173" style={{
            textDecoration: 'none',
            display: 'inline-block',
            padding: '16px 40px',
            background: '#fff', color: '#16a34a',
            borderRadius: 14, fontSize: 17, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          }}>
            Solicitar acceso gratuito →
          </a>
        </div>
      </section>
    </>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#86efac' }}>
        <AnimatedCounter target={value} />+
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 14, opacity: .8 }}>{label}</p>
    </div>
  );
}

function SosCard({ alert }: { alert: PublicSosAlert }) {
  const foto = alert.fotos?.[0];
  const hace = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60));
  const hacel = hace < 24 ? `Hace ${hace}h` : `Hace ${Math.floor(hace / 24)} días`;
  return (
    <Link to="/sos" style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
        overflow: 'hidden', display: 'flex', gap: 0,
        transition: 'box-shadow .15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
      >
        <div style={{ width: 100, flexShrink: 0, background: '#f3f4f6', position: 'relative' }}>
          {foto
            ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🐾</div>
          }
          <span style={{
            position: 'absolute', top: 8, left: 8,
            background: alert.tipo === 'lost' ? '#ef4444' : '#3b82f6',
            color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {alert.tipo === 'lost' ? 'PERDIDO' : 'AVISTADO'}
          </span>
        </div>
        <div style={{ padding: '14px 16px', flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827', fontSize: 15 }}>
            {alert.nombre_animal || `${alert.especie || 'Animal'} ${alert.color ? `(${alert.color})` : ''}`}
          </p>
          <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: 13 }}>
            {alert.raza} {alert.tamaño ? `· ${alert.tamaño}` : ''}
          </p>
          {alert.ubicacion_descripcion && (
            <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: 12 }}>
              📍 {alert.ubicacion_descripcion}
            </p>
          )}
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>{hacel}</p>
        </div>
      </div>
    </Link>
  );
}
