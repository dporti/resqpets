'use client';
import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { useReveal } from './useReveal';

const PLANS = [
  {
    id: 'free', name: 'Gratuito', monthlyPrice: 0,
    desc: 'Para empezar a digitalizarse',
    include: ['30 animales','3 usuarios','Portal público','SOS Pet','Email'],
    exclude: ['Acogidas','IA','WhatsApp','Padrinos'],
    btnText: 'Empezar gratis', btnStyle: 'border border-[#2a2a2a] text-[#aaa] hover:border-[#444] hover:text-white',
  },
  {
    id: 'starter', name: 'Starter', monthlyPrice: 29.95,
    desc: 'Para protectoras activas',
    include: ['150 animales','15 usuarios','CRM completo','Test compatibilidad','Muro de éxitos','Certificado verificado'],
    exclude: ['IA','WhatsApp','Padrinos'],
    btnText: 'Elegir Starter', btnStyle: 'border border-[#2a2a2a] text-[#aaa] hover:border-[#444] hover:text-white',
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 59.95,
    desc: 'Para protectoras profesionales',
    include: ['500 animales','50 usuarios','IA completa','Reconocimiento facial','Asistente Cmd+K','Padrinos virtuales','WhatsApp Business','Informe PDF'],
    exclude: [],
    btnText: 'Empezar con Pro', btnStyle: 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20',
    recommended: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', monthlyPrice: 99.95,
    desc: 'Para redes y federaciones',
    include: ['Todo de Pro','Multi-sede','API veterinaria','Seguro de acogida','Soporte dedicado','SLA garantizado'],
    exclude: [],
    btnText: 'Contactar', btnStyle: 'border border-[#2a2a2a] text-[#aaa] hover:border-[#444] hover:text-white',
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const { ref, visible } = useReveal();

  return (
    <section id="precios" className="py-28 bg-[#fafafa]" aria-labelledby="pricing-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-14">
          <h2
            id="pricing-heading"
            className={`font-serif text-section text-[#0a0a0a] mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            Empieza gratis.
            <br />Crece cuando estés lista.
          </h2>
          <div
            className={`inline-flex items-center gap-3 p-1.5 bg-white border border-[#e5e5e5] rounded-full shadow-sm mt-8 transition-opacity duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '120ms' }}
            role="group" aria-label="Frecuencia de facturación"
          >
            <button onClick={() => setAnnual(false)} aria-pressed={!annual}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${!annual ? 'bg-[#0a0a0a] text-white' : 'text-[#888] hover:text-[#333]'}`}>
              Mensual
            </button>
            <button onClick={() => setAnnual(true)} aria-pressed={annual}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${annual ? 'bg-[#0a0a0a] text-white' : 'text-[#888] hover:text-[#333]'}`}>
              Anual
              <span className="px-2 py-0.5 bg-brand text-white rounded-full text-[10px] font-bold">2 meses gratis</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => {
            const price = plan.monthlyPrice === 0 ? 0 : annual ? +(plan.monthlyPrice * 10 / 12).toFixed(2) : plan.monthlyPrice;
            return (
              <div key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 ${
                  plan.recommended
                    ? 'bg-[#0a0a0a] border-2 border-brand shadow-xl shadow-brand/10'
                    : 'bg-white border border-[#e5e5e5] hover:shadow-lg'
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.3s, translate 0.2s' }}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 bg-brand text-white rounded-full text-[10px] font-bold shadow-md whitespace-nowrap">
                    <Zap className="w-3 h-3" aria-hidden="true" />RECOMENDADO
                  </div>
                )}
                <p className={`text-xs font-bold mb-2 ${plan.recommended ? 'text-brand' : 'text-[#888]'}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-black ${plan.recommended ? 'text-white' : 'text-[#0a0a0a]'}`}>
                    {price === 0 ? 'Gratis' : `${price.toString().replace('.', ',')}€`}
                  </span>
                  {price > 0 && <span className={`text-sm mb-1 ${plan.recommended ? 'text-[#888]' : 'text-[#aaa]'}`}>/mes</span>}
                </div>
                <p className={`text-xs mb-6 ${plan.recommended ? 'text-[#777]' : 'text-[#999]'}`}>{plan.desc}</p>

                <ul className="space-y-2.5 flex-1 mb-6" role="list">
                  {plan.include.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.recommended ? 'text-brand' : 'text-[#888]'}`} aria-hidden="true" />
                      <span className={plan.recommended ? 'text-[#ccc]' : 'text-[#444]'}>{f}</span>
                    </li>
                  ))}
                  {plan.exclude.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#333]" aria-hidden="true" />
                      <span className="text-[#444]">{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={`/registro?plan=${plan.id}`}
                  className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center ${plan.btnStyle}`}>
                  {plan.btnText}
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#999] mt-8">
          ¿Tienes más de 5 protectoras?{' '}
          <a href="mailto:hola@resqpet.com" className="text-brand hover:underline cursor-pointer">
            Escríbenos para un precio personalizado.
          </a>
        </p>
      </div>
    </section>
  );
}
