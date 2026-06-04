'use client';
import { ArrowRight, ShieldCheck, Clock, CreditCard } from 'lucide-react';
import { useReveal } from './useReveal';

export function CtaSection() {
  const { ref, visible } = useReveal(0.15);
  return (
    <section ref={ref} className="relative py-36 bg-[#0a0a0a] overflow-hidden" aria-labelledby="cta-heading">
      <div className="absolute inset-0 dot-grid" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand rounded-full opacity-[0.07] blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <h2
          id="cta-heading"
          className={`font-serif text-hero text-white mb-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          Tu protectora
          <br /><span className="text-[#a1a1a1]">lo merece.</span>
        </h2>
        <p
          className={`text-xl text-[#666] mb-12 leading-relaxed transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '100ms' }}
        >
          Configuración en 5 minutos.
          <br />Sin tarjeta de crédito. Sin compromisos.
        </p>

        <a
          href="/registro"
          className={`inline-flex items-center gap-2.5 px-12 py-5 text-[17px] font-semibold text-white bg-brand hover:bg-brand-dark rounded-full transition-all duration-200 cursor-pointer shadow-xl shadow-brand/20 hover:scale-[1.02] min-h-[56px] ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '180ms' }}
        >
          Crear cuenta gratis
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </a>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '260ms' }}
        >
          {[
            { Icon: ShieldCheck, text: 'Gratis para siempre en el plan base' },
            { Icon: CreditCard,  text: 'Sin tarjeta de crédito' },
            { Icon: Clock,       text: 'Configura en 5 minutos' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-[#555]">
              <Icon className="w-4 h-4 text-brand" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
