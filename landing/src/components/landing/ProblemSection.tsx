'use client';
import { FolderX, Clock, HeartOff } from 'lucide-react';
import { useReveal } from './useReveal';

const PROBLEMS = [
  {
    icon: FolderX,
    title: 'Expedientes perdidos',
    description:
      'Fichas de animales en carpetas, historiales médicos sin actualizar, documentos que nadie encuentra cuando hacen falta.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: Clock,
    title: 'Horas perdidas en tareas manuales',
    description:
      'Emails uno a uno a las familias de acogida, recordatorios a mano, reportes que llevan días preparar para las subvenciones.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: HeartOff,
    title: 'Adopciones que se escapan',
    description:
      'Familias interesadas sin respuesta rápida, ningún sistema para medir compatibilidad, cero seguimiento post-adopción.',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
];

export function ProblemSection() {
  const { ref, visible } = useReveal();

  return (
    <section className="py-24 bg-gray-950" aria-labelledby="problem-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="text-center mb-16">
          <h2
            id="problem-heading"
            className={`text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            ¿Aún gestionas tu protectora con{' '}
            <span className="text-primary">Excel y WhatsApp</span>?
          </h2>
          <p
            className={`text-lg text-gray-400 max-w-2xl mx-auto transition-all duration-600 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            No es culpa tuya. Simplemente no existía una herramienta diseñada para protectoras.
            Hasta ahora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROBLEMS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`rounded-2xl p-8 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-200 cursor-default ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${i * 100}ms` : '0ms', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out, border-color 0.2s' }}
              >
                <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${p.color}`} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
                <p className="text-gray-400 leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
