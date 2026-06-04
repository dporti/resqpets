'use client';
import { useReveal } from './useReveal';
import { FileX2, Timer, HeartCrack } from 'lucide-react';

const PAIN_POINTS = [
  {
    Icon: FileX2,
    color: 'text-[#D85A30]',
    bg: 'bg-[#D85A30]/10',
    border: 'border-[#D85A30]/20',
    title: 'Fichas que nadie encuentra',
    body: 'El historial médico de Luna está en un Excel, las fotos en WhatsApp y el contrato de acogida en papel. Cada vez que alguien pregunta, es una búsqueda.',
  },
  {
    Icon: Timer,
    color: 'text-[#BA7517]',
    bg: 'bg-[#BA7517]/10',
    border: 'border-[#BA7517]/20',
    title: '3 horas al día en tareas manuales',
    body: 'Emails uno a uno a las familias, recordatorios de vacunas a mano, reportes para la memoria anual que llevan días preparar. Tiempo que debería ir a los animales.',
  },
  {
    Icon: HeartCrack,
    color: 'text-[#E24B4A]',
    bg: 'bg-[#E24B4A]/10',
    border: 'border-[#E24B4A]/20',
    title: 'Familias que no vuelven',
    body: 'Una familia interesada pregunta por Instagram. Se tarda 48h en responder. Para entonces ya adoptaron en otro refugio. Sin sistema, sin seguimiento, sin dato.',
  },
];

export function ProblemSection() {
  const { ref, visible } = useReveal();

  return (
    /* Hard cut from dark to white — the contrast IS the effect */
    <section className="py-28 bg-white" aria-labelledby="problem-heading">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center mb-16" ref={ref}>
        <p className={`text-xs font-bold text-[#999] uppercase tracking-[0.2em] mb-5 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          El problema
        </p>
        <h2
          id="problem-heading"
          className={`font-serif text-section text-[#0a0a0a] mb-8 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '80ms' }}
        >
          ¿Aún gestionas tu protectora
          <br />con Excel y WhatsApp?
        </h2>
        <p
          className={`text-lg text-[#555] leading-[1.8] transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '160ms' }}
        >
          No estás sola. El 78% de las protectoras españolas usa hojas de cálculo para gestionar
          sus animales. Se pierden adopciones, se duplican expedientes y los voluntarios no
          saben qué hacer. No es culpa tuya — es que no existía una herramienta hecha para vosotras.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ Icon, color, bg, border, title, body }, i) => (
            <PainCard key={title} Icon={Icon} color={color} bg={bg} border={border} title={title} body={body} delay={i * 100} />
          ))}
        </div>

        {/* Pull quote */}
        <blockquote className="mt-16 text-center">
          <p className={`font-serif text-[24px] sm:text-[28px] italic text-[#0a0a0a] leading-snug transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '400ms' }}>
            "Cada adopción perdida es un animal que espera más tiempo."
          </p>
        </blockquote>
      </div>
    </section>
  );
}

function PainCard({ Icon, color, bg, border, title, body, delay }: {
  Icon: React.ElementType; color: string; bg: string; border: string;
  title: string; body: string; delay: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref}
      className={`bg-[#fafafa] border border-[#ebebeb] rounded-xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms', transition: 'opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.2s, translate 0.2s' }}
    >
      <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-sm text-[#666] leading-relaxed">{body}</p>
    </div>
  );
}
