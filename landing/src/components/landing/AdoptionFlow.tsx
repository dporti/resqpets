'use client';
import { Building2, Globe, Heart, FileCheck, HomeIcon } from 'lucide-react';
import { useReveal } from './useReveal';

const STEPS = [
  { Icon: Building2, label: 'Entrada al refugio',     body: 'El animal llega. Creas su ficha con foto, estado de salud y características. El sistema genera su ID interno automáticamente.' },
  { Icon: Globe,     label: 'Publicación en el portal', body: 'Con un clic, el animal aparece en el portal público con descripción generada por IA. Las familias pueden hacer el test de compatibilidad.' },
  { Icon: Heart,     label: 'Solicitud de adopción',  body: 'Una familia solicita la adopción. Entras al pipeline: revisión, visita al refugio, período de acogida temporal si es necesario.' },
  { Icon: FileCheck, label: 'Seguimiento y docs',     body: 'Contrato digital, registro de entrega, avisos automáticos a la familia. Todo queda en el expediente del animal.' },
  { Icon: HomeIcon,  label: 'Hogar para siempre',     body: 'El animal se marca como adoptado. Su foto va al Muro de Adopciones. El sistema ofrece a sus padrinos apadrinar a otro.' },
];

const IMPACT = [
  { value: '87%',   label: 'Tasa media de adopción' },
  { value: '3.2h',  label: 'Ahorradas por semana' },
  { value: '+200',  label: 'Protectoras activas' },
  { value: '62%',   label: 'Financiación vía padrinos' },
];

export function AdoptionFlow() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-28 bg-white" aria-labelledby="flow-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-20">
          <h2
            id="flow-heading"
            className={`font-serif text-section text-[#0a0a0a] mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            De rescate a hogar para siempre.
            <br className="hidden sm:block" />
            Todo en ResQPet.
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-6 left-0 right-0 h-px bg-[#ebebeb]" style={{ zIndex: 0 }} aria-hidden="true" />

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8 relative" style={{ zIndex: 1 }}>
            {STEPS.map(({ Icon, label, body }, i) => {
              const { ref: stepRef, visible: stepVisible } = useReveal();
              return (
                <div key={label} ref={stepRef}
                  className={`flex flex-col items-center text-center transition-all duration-500 ${stepVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                  style={{ transitionDelay: stepVisible ? `${i * 80}ms` : '0ms' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-[#ebebeb] flex items-center justify-center mb-4 relative">
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0a0a0a] mb-2">{label}</h3>
                  <p className="text-xs text-[#888] leading-relaxed">{body}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact numbers */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#ebebeb] pt-16">
          {IMPACT.map(({ value, label }, i) => {
            const { ref: numRef, visible: numVisible } = useReveal();
            return (
              <div key={label} ref={numRef}
                className={`text-center transition-all duration-500 ${numVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: numVisible ? `${i * 80}ms` : '0ms' }}
              >
                <p className="font-serif text-[40px] text-[#0a0a0a] leading-none mb-2">{value}</p>
                <p className="text-sm text-[#888]">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
