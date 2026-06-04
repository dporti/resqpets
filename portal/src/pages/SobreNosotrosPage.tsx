import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

export function SobreNosotrosPage() {
  return (
    <>
      <SEOHead
        title="Sobre nosotros"
        description="ResQPet es la plataforma de adopción animal que conecta protectoras y familias. Conoce nuestra historia y misión."
      />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b, #065f46)',
        padding: '80px 20px', color: '#fff', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, margin: '0 0 20px' }}>
          Sobre ResQPet
        </h1>
        <p style={{ fontSize: 20, opacity: .9, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
          Nacimos con una misión simple: que ningún animal se quede sin hogar por falta de visibilidad.
        </p>
      </div>

      {/* Misión */}
      <section style={{ maxWidth: 800, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 20px' }}>
          Nuestra misión
        </h2>
        <p style={{ fontSize: 17, color: '#374151', lineHeight: 1.8, margin: '0 0 20px' }}>
          ResQPet es una plataforma tecnológica diseñada para <strong>protectoras de animales</strong>. Proporcionamos las herramientas digitales que necesitan para gestionar sus animales, publicar adopciones y conectar con voluntarios y familias de acogida.
        </p>
        <p style={{ fontSize: 17, color: '#374151', lineHeight: 1.8 }}>
          Para las familias, somos el lugar donde encontrar su próximo compañero: un portal limpio, moderno y fácil de usar donde descubrir miles de animales que esperan un hogar.
        </p>
      </section>

      {/* Valores */}
      <section style={{ background: '#f0fdf4', padding: '80px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 48 }}>
            Lo que nos mueve
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
            {[
              { emoji: '❤️', title: 'El bienestar animal primero', text: 'Cada decisión que tomamos tiene en cuenta el impacto en el bienestar de los animales.' },
              { emoji: '🔓', title: 'Acceso gratuito', text: 'Las protectoras usan ResQPet sin coste. Creemos que la tecnología no debería ser una barrera.' },
              { emoji: '🌍', title: 'Transparencia', text: 'Publicamos estadísticas reales. Las protectoras muestran sus datos abiertamente.' },
              { emoji: '🤝', title: 'Comunidad', text: 'Somos un ecosistema de protectoras, voluntarios, familias de acogida y adoptantes.' },
            ].map(v => (
              <div key={v.title} style={{ textAlign: 'center', padding: '28px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>{v.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{v.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historia */}
      <section style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 24 }}>Nuestra historia</h2>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>
          ResQPet nació de la frustración de ver cómo protectoras increíbles con dedicación ilimitada luchaban con herramientas inadecuadas: hojas de cálculo, grupos de WhatsApp y Excel para gestionar decenas de animales.
        </p>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>
          Decidimos construir el CRM que las protectoras merecen: moderno, intuitivo y completo. Con gestión de acogidas, voluntarios, adopciones y comunicación todo en un mismo lugar.
        </p>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
          Y para las familias, creamos este portal público donde los animales pueden ser vistos y queridos por el mayor número de personas posible.
        </p>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #16a34a, #059669)',
        padding: '80px 20px', textAlign: 'center', color: '#fff',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>
          Únete al movimiento
        </h2>
        <p style={{ fontSize: 17, opacity: .9, margin: '0 0 36px' }}>
          Juntos podemos asegurarnos de que cada animal encuentre el hogar que merece
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/adoptar" style={{
            textDecoration: 'none', padding: '14px 32px',
            background: '#fff', color: '#16a34a', borderRadius: 12,
            fontWeight: 700, fontSize: 15,
          }}>
            Adoptar un animal
          </Link>
          <a href="http://localhost:5173" style={{
            textDecoration: 'none', padding: '14px 32px',
            border: '2px solid rgba(255,255,255,.5)',
            color: '#fff', borderRadius: 12, fontWeight: 600, fontSize: 15,
          }}>
            Soy una protectora
          </a>
        </div>
      </section>
    </>
  );
}
