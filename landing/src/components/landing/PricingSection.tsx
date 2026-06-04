'use client';
import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useReveal } from './useReveal';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    monthlyPrice: 0,
    description: 'Para protectoras que empiezan',
    color: 'text-gray-500',
    borderColor: 'border-gray-200',
    btnClass: 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
    features: [
      '30 animales',
      '3 usuarios',
      'Portal público de adopciones',
      'SOS Pet',
      'Donaciones básicas',
      'Soporte por email',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29.95,
    description: 'Para protectoras en crecimiento',
    color: 'text-blue-600',
    borderColor: 'border-blue-200',
    btnClass: 'border border-blue-500 text-blue-600 hover:bg-blue-50',
    features: [
      '150 animales',
      '15 usuarios',
      'Módulo Acogidas y Voluntarios',
      'Test de compatibilidad',
      'Certificado verificado',
      '50 descripciones IA/mes',
      'Soporte por chat',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 59.95,
    description: 'Para protectoras con alto impacto',
    color: 'text-primary',
    borderColor: 'border-primary',
    btnClass: 'bg-primary text-white hover:bg-primary-700 shadow-lg shadow-primary/25',
    recommended: true,
    features: [
      '500 animales',
      '50 usuarios',
      'IA completa (asistente Ctrl+K)',
      'Reconocimiento facial animal',
      'Padrinos virtuales',
      'WhatsApp Business',
      'Informe impacto PDF',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99.95,
    description: 'Para redes y grandes organizaciones',
    color: 'text-violet-600',
    borderColor: 'border-violet-200',
    btnClass: 'border border-violet-400 text-violet-700 hover:bg-violet-50',
    features: [
      'Animales ilimitados',
      'Usuarios ilimitados',
      'Multi-sede',
      'API veterinaria',
      'Mapa nacional',
      'Seguro para acogidas',
      'Soporte dedicado',
      'SLA garantizado',
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const { ref, visible } = useReveal();

  return (
    <section id="precios" className="py-24 bg-gray-50" aria-labelledby="pricing-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="text-center mb-14">
          <h2
            id="pricing-heading"
            className={`text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            Empieza gratis.{' '}
            <span className="text-primary">Crece cuando estés lista.</span>
          </h2>
          <p
            className={`text-lg text-gray-500 mb-8 transition-all duration-600 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            Sin permanencia. Sin tarjeta de crédito para el plan gratuito.
          </p>

          {/* Annual/monthly toggle */}
          <div
            className={`inline-flex items-center gap-4 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm transition-all duration-500 delay-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
            role="group"
            aria-label="Frecuencia de facturación"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${!annual ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              aria-pressed={!annual}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${annual ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              aria-pressed={annual}
            >
              Anual
              <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-bold">
                2 meses gratis
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => {
            const displayPrice = plan.monthlyPrice === 0 ? 0
              : annual ? +(plan.monthlyPrice * 10 / 12).toFixed(2)
              : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-white rounded-2xl border-2 ${plan.borderColor} p-6 transition-all duration-600 hover:shadow-lg hover:-translate-y-0.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms' }}
              >
                {plan.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                    <Zap className="w-3 h-3" aria-hidden="true" />
                    Recomendado
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-sm font-bold ${plan.color} mb-1`}>{plan.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-black text-gray-900">
                      {displayPrice === 0 ? 'Gratis' : `${displayPrice.toString().replace('.', ',')}€`}
                    </span>
                    {displayPrice > 0 && (
                      <span className="text-gray-400 text-sm mb-1">/mes{annual ? '*' : ''}</span>
                    )}
                  </div>
                  {annual && displayPrice > 0 && (
                    <p className="text-xs text-gray-400">Facturado {(displayPrice * 12).toFixed(0)}€/año</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6" role="list">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <Check className={`w-4 h-4 ${plan.recommended ? 'text-primary' : 'text-gray-400'} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.monthlyPrice === 0 ? '/registro' : `/registro?plan=${plan.id}`}
                  className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200 cursor-pointer ${plan.btnClass}`}
                >
                  {plan.monthlyPrice === 0 ? 'Empezar gratis' : `Elegir ${plan.name}`}
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          ¿Tienes dudas?{' '}
          <a href="mailto:hola@resqpet.com" className="text-primary font-medium hover:underline cursor-pointer">
            Escríbenos y te ayudamos a elegir.
          </a>
        </p>
      </div>
    </section>
  );
}
