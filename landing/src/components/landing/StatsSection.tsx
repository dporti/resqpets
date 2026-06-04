'use client';
import { useEffect, useRef, useState } from 'react';
import { useReveal } from './useReveal';

function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, started]);

  return value;
}

const STATS = [
  { label: 'Protectoras activas',      value: 200,  suffix: '+',   note: 'En 8 países' },
  { label: 'Tasa de adopción media',   value: 87,   suffix: '%',   note: 'vs 42% sector' },
  { label: 'Ahorro semanal por gestora', value: 3.2, suffix: 'h', note: 'En tareas manuales', decimal: true },
  { label: 'Financiación cubierta/mes', value: 62,  suffix: '%',   note: 'Via donaciones y padrinos' },
];

export function StatsSection() {
  const { ref, visible } = useReveal(0.2);

  return (
    <section className="py-24 bg-gray-950" aria-labelledby="stats-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <h2 id="stats-heading" className="sr-only">Estadísticas de impacto</h2>
        <div className="text-center mb-14">
          <p
            className={`text-sm font-bold tracking-widest text-primary uppercase mb-4 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            Impacto real
          </p>
          <h3
            className={`text-4xl sm:text-5xl font-extrabold text-white tracking-tight transition-all duration-600 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            Números que importan
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map((s, i) => {
            const val = useCountUp(s.value, 1800, visible);
            return (
              <div
                key={s.label}
                className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${i * 120}ms` : '0ms' }}
              >
                <p className="text-5xl sm:text-6xl font-black text-white mb-2 tabular-nums" aria-live="polite">
                  {s.decimal ? val.toFixed(0) : val}{s.suffix}
                </p>
                <p className="text-base font-semibold text-gray-300 mb-1">{s.label}</p>
                <p className="text-sm text-gray-500">{s.note}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
