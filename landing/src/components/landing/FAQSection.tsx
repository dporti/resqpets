'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useReveal } from './useReveal';

const FAQS = [
  {
    q: '¿Es realmente gratis para siempre el plan gratuito?',
    a: 'Sí, sin límite de tiempo. El plan gratuito siempre será gratuito. Incluye 30 animales, portal público, SOS Pet y notificaciones por email.',
  },
  {
    q: '¿Cuánto tiempo lleva configurar ResQPet?',
    a: 'Menos de 5 minutos. Creas tu cuenta, importas tus animales (CSV o manualmente) y ya tienes el portal público activo con las fichas de tus animales visibles para todo el mundo.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Infraestructura en Supabase (PostgreSQL), servidores en Europa (RGPD compliant), backups diarios automáticos y encriptación en tránsito y en reposo.',
  },
  {
    q: '¿Puedo importar los datos que tengo en Excel?',
    a: 'Sí, acepta CSV con cualquier estructura y hace el mapeo de columnas de forma inteligente. También puedes importar desde otras herramientas populares de protectoras.',
  },
  {
    q: '¿La IA tiene coste adicional?',
    a: 'No. La IA está incluida en el plan Pro y Enterprise sin límites de uso adicionales. En el plan Starter tienes 50 descripciones generadas por IA al mes.',
  },
  {
    q: '¿Qué pasa si crezco y necesito más?',
    a: 'Puedes cambiar de plan en cualquier momento desde Configuración. El sistema calcula la diferencia prorrateada automáticamente. Sin permanencia, sin complicaciones.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#ebebeb] last:border-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium text-[#0a0a0a] group-hover:text-brand transition-colors duration-150 pr-8">
          {q}
        </span>
        <span className="flex-shrink-0 text-[#999] group-hover:text-brand transition-colors duration-150">
          {open
            ? <Minus className="w-4 h-4" aria-hidden="true" />
            : <Plus className="w-4 h-4" aria-hidden="true" />
          }
        </span>
      </button>
      {open && (
        <div className="pb-5 pr-8">
          <p className="text-sm text-[#666] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-24 bg-[#fafafa]" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="mb-12">
          <h2
            id="faq-heading"
            className={`font-serif text-section text-[#0a0a0a] transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            Preguntas frecuentes
          </h2>
        </div>
        <div className={`transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '120ms' }}>
          {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
        </div>
      </div>
    </section>
  );
}
