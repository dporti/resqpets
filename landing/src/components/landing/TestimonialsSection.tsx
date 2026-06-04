'use client';
import { useReveal } from './useReveal';

const TESTIMONIALS = [
  {
    quote:
      'Antes tardaba 3 horas en preparar el informe mensual. Ahora lo genero en 30 segundos con el botón de PDF.',
    name: 'María T.',
    role: 'Coordinadora',
    org: 'Huella Viva',
    city: 'Madrid',
    initials: 'MT',
    color: 'bg-primary',
  },
  {
    quote:
      'El test de compatibilidad ha multiplicado por 2 las solicitudes de adopción en nuestro portal. No lo cambiaría por nada.',
    name: 'Ana R.',
    role: 'Directora',
    org: 'Patas Unidas',
    city: 'Barcelona',
    initials: 'AR',
    color: 'bg-violet-500',
  },
  {
    quote:
      'El reconocimiento facial encontró a un perro perdido que llevaba 3 semanas en nuestro refugio sin saber que tenía un aviso SOS activo. Increíble.',
    name: 'Carlos M.',
    role: 'Veterinario',
    org: 'Refugio Sol',
    city: 'Valencia',
    initials: 'CM',
    color: 'bg-blue-500',
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 estrellas de 5" role="img">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, visible } = useReveal();

  return (
    <section id="historias" className="py-24 bg-white" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="text-center mb-16">
          <h2
            id="testimonials-heading"
            className={`text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            Lo que dicen las{' '}
            <span className="text-primary">protectoras que ya usan ResQPet</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`flex flex-col bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: visible ? `${i * 100}ms` : '0ms', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, border-color 0.2s, box-shadow 0.2s' }}
            >
              <StarRating />
              <blockquote className="flex-1 mt-5 mb-6">
                <p className="text-gray-700 leading-relaxed text-[15px]">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">
                    {t.role} · {t.org}, {t.city}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
