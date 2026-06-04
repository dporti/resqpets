import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';

export function ComoFuncionaPage() {
  return (
    <>
      <SEOHead
        title="Cómo funciona la adopción"
        description="Descubre cómo funciona el proceso de adopción en ResQPet. Sencillo, gratuito y con acompañamiento."
      />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b, #065f46)',
        padding: '64px 20px', color: '#fff', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, margin: '0 0 16px' }}>
          ¿Cómo funciona?
        </h1>
        <p style={{ fontSize: 18, opacity: .9, maxWidth: 540, margin: '0 auto' }}>
          Adoptar es más fácil de lo que imaginas. Te explicamos el proceso paso a paso.
        </p>
      </div>

      {/* Para adoptantes */}
      <section style={{ maxWidth: 900, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', background: '#f0fdf4', color: '#16a34a',
            padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12,
          }}>
            Para adoptantes
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: 0 }}>
            Proceso de adopción
          </h2>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Línea conectora */}
          <div style={{
            position: 'absolute', left: 27, top: 0, bottom: 0, width: 2,
            background: '#e5e7eb', zIndex: 0,
          }} />

          {[
            {
              num: '1', emoji: '🔍', title: 'Busca y filtra',
              text: 'Explora nuestra base de datos de animales. Filtra por especie, tamaño, ubicación, edad y características especiales. Guarda tus favoritos con el corazón.',
            },
            {
              num: '2', emoji: '📋', title: 'Rellena el formulario',
              text: 'Cuando encuentres a tu futuro compañero, rellena el formulario de pre-adopción. Te preguntamos sobre tu hogar y estilo de vida para asegurarnos de que es la pareja perfecta.',
            },
            {
              num: '3', emoji: '📞', title: 'La protectora te contacta',
              text: 'La protectora revisará tu solicitud y se pondrá en contacto contigo en menos de 48 horas. Pueden hacer una entrevista para conocerte mejor.',
            },
            {
              num: '4', emoji: '🐾', title: 'Conoce al animal',
              text: 'Si tu perfil encaja, concertaréis un encuentro. Muchas protectoras también ofrecen acogida temporal para que tanto tú como el animal os adaptéis antes de comprometeros.',
            },
            {
              num: '5', emoji: '📝', title: 'Firma el contrato',
              text: 'La protectora preparará un contrato de adopción que protege al animal. Incluye compromiso de cuidado y en algunos casos visitas de seguimiento.',
            },
            {
              num: '6', emoji: '🏠', title: '¡Ya sois familia!',
              text: 'Lleva a tu nuevo compañero a casa y disfrutad. La protectora estará disponible para cualquier duda o problema que pueda surgir.',
            },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, marginBottom: 40, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#22c55e', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18, flexShrink: 0,
                boxShadow: '0 0 0 4px #f0fdf4',
              }}>
                {step.num}
              </div>
              <div style={{ paddingTop: 10 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  {step.emoji} {step.title}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.7, fontSize: 15 }}>{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/adoptar" style={{
            display: 'inline-block', textDecoration: 'none',
            padding: '16px 40px', background: '#22c55e', color: '#fff',
            borderRadius: 14, fontSize: 17, fontWeight: 700,
          }}>
            Empezar a buscar →
          </Link>
        </div>
      </section>

      {/* Para protectoras */}
      <section style={{ background: '#f9fafb', padding: '80px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', background: '#fff7ed', color: '#c2410c',
              padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12,
            }}>
              Para protectoras
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: 0 }}>
              Gestiona tus animales gratis
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { emoji: '📱', title: 'CRM completo', text: 'Gestiona tus animales, acogidas, adopciones y voluntarios desde una sola plataforma.' },
              { emoji: '🌐', title: 'Portal público', text: 'Tus animales aparecen automáticamente en el portal público y son indexados por Google.' },
              { emoji: '🚨', title: 'SOS Pet integrado', text: 'Recibe avisos de animales perdidos y encontrados de tu zona directamente en el sistema.' },
              { emoji: '📊', title: 'Estadísticas', text: 'Sigue el rendimiento de tus publicaciones, solicitudes de adopción y actividad de voluntarios.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#111827' }}>{f.title}</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{f.text}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="http://localhost:5173" style={{
              display: 'inline-block', textDecoration: 'none',
              padding: '14px 32px', background: '#111827', color: '#fff',
              borderRadius: 12, fontSize: 15, fontWeight: 600,
            }}>
              Solicitar acceso gratuito →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 700, margin: '80px auto 80px', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 40 }}>
          Preguntas frecuentes
        </h2>
        {[
          { q: '¿Es gratuito adoptar a través de ResQPet?', a: 'Sí, usar ResQPet es 100% gratuito para los adoptantes. Algunas protectoras pueden solicitar una pequeña cuota de gestión que cubre gastos veterinarios del animal.' },
          { q: '¿Cuánto tarda el proceso de adopción?', a: 'Depende de la protectora, pero generalmente entre 1 y 4 semanas desde que envías la solicitud hasta que el animal llega a tu hogar.' },
          { q: '¿Puedo adoptar si vivo en un piso?', a: '¡Por supuesto! Muchos animales son perfectamente felices en pisos. La protectora evaluará el caso concreto según el tamaño y necesidades del animal.' },
          { q: '¿Qué pasa si no funciona?', a: 'La mayoría de protectoras tienen políticas de devolución. El bienestar del animal es la prioridad, así que siempre podrás contactar con la protectora si necesitas ayuda.' },
        ].map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} />
        ))}
      </section>
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 0 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left', padding: '20px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 16,
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', flex: 1 }}>{question}</span>
        <span style={{ fontSize: 18, color: '#22c55e', fontWeight: 700, transform: open ? 'rotate(45deg)' : '', transition: 'transform .2s' }}>+</span>
      </button>
      {open && (
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>{answer}</p>
      )}
    </div>
  );
}

import { useState } from 'react';
