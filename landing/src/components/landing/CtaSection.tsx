'use client';
import { ArrowRight, Shield } from 'lucide-react';
import { useReveal } from './useReveal';

export function CtaSection() {
  const { ref, visible } = useReveal(0.2);

  return (
    <section
      ref={ref}
      className="py-28 bg-gradient-to-br from-primary-dark via-primary to-emerald-500 relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2
          id="cta-heading"
          className={`text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-5 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          Tu protectora lo merece.{' '}
          <span className="text-white/80">Empieza hoy.</span>
        </h2>
        <p
          className={`text-xl text-white/80 mb-10 transition-all duration-600 delay-100 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          Configuración en 5 minutos. Sin tarjeta de crédito.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 transition-all duration-600 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <a
            href="/registro"
            className="flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl text-base hover:bg-gray-50 transition-colors duration-150 shadow-xl shadow-black/20 cursor-pointer min-h-[44px]"
          >
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="#demo"
            className="flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl text-base hover:border-white/50 hover:bg-white/10 transition-all duration-150 cursor-pointer min-h-[44px]"
          >
            Ver demo en vivo
          </a>
        </div>

        <div
          className={`flex items-center justify-center gap-2 text-white/70 text-sm transition-all duration-500 delay-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <Shield className="w-4 h-4" aria-hidden="true" />
          Plan gratuito siempre disponible. Actualiza cuando quieras. Sin permanencia.
        </div>
      </div>
    </section>
  );
}
