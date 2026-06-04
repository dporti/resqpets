'use client';
import { useReveal } from './useReveal';

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 estrellas" role="img">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className="w-4 h-4 text-brand fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, visible } = useReveal();
  return (
    <section id="historias" className="py-28 bg-white" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="mb-16">
          <h2
            id="testimonials-heading"
            className={`font-serif text-section text-[#0a0a0a] transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            Las protectoras hablan.
          </h2>
        </div>

        {/* Bento layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Large card */}
          <figure
            className={`md:col-span-1 bg-[#0a0a0a] rounded-2xl p-8 flex flex-col justify-between transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: visible ? '80ms' : '0ms' }}
          >
            <div>
              <Stars />
              <blockquote className="mt-5">
                <p className="font-serif text-2xl italic text-white leading-snug">
                  "Antes tardaba 3 horas en preparar el informe mensual. Ahora lo genero en 30 segundos."
                </p>
              </blockquote>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-brand/15 border border-brand/25 rounded-full">
                <span className="text-brand text-xs font-bold">→ 94% de tiempo ahorrado en reportes</span>
              </div>
            </div>
            <figcaption className="mt-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">MT</div>
              <div>
                <p className="font-semibold text-white text-sm">María T.</p>
                <p className="text-[#666] text-xs">Coordinadora · Huella Viva, Madrid</p>
              </div>
            </figcaption>
          </figure>

          {/* Two smaller cards stacked */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                quote: 'El reconocimiento facial encontró a un perro perdido que llevaba 3 semanas con nosotros sin que supiéramos que tenía un aviso SOS activo. Increíble.',
                name: 'Carlos M.', role: 'Veterinario', org: 'Refugio Sol, Valencia', initials: 'CM', color: 'bg-blue-500',
                delay: 160,
              },
              {
                quote: 'El test de compatibilidad ha multiplicado por 2 las solicitudes de adopción en nuestro portal. No lo cambiaría por nada.',
                name: 'Ana R.', role: 'Directora', org: 'Patas Unidas, Barcelona', initials: 'AR', color: 'bg-violet-500',
                delay: 240,
              },
            ].map(t => (
              <figure
                key={t.name}
                className={`bg-[#fafafa] border border-[#ebebeb] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: visible ? `${t.delay}ms` : '0ms', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.2s, translate 0.2s' }}
              >
                <div>
                  <Stars />
                  <blockquote className="mt-4">
                    <p className="text-[#333] text-sm leading-relaxed">"{t.quote}"</p>
                  </blockquote>
                </div>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{t.initials}</div>
                  <div>
                    <p className="font-semibold text-[#0a0a0a] text-sm">{t.name}</p>
                    <p className="text-[#888] text-xs">{t.role} · {t.org}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
