'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

/* ── Dot grid SVG background ───────────────────────────── */
function DotGrid() {
  return (
    <div className="absolute inset-0 dot-grid opacity-100 pointer-events-none" aria-hidden="true" />
  );
}

/* ── Browser chrome wrapper ─────────────────────────────── */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/60 bg-[#111]">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" /><span className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="ml-4 h-5 bg-[#2a2a2a] rounded-md w-48 flex items-center px-2">
          <span className="text-[11px] text-[#555]">app.resqpet.com</span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Mini dashboard mockup ──────────────────────────────── */
function DashboardMockup() {
  const ANIMALS = [
    { name: 'Max',   breed: 'Border Collie', status: 'En acogida',    statusColor: 'text-orange-400', dot: 'bg-orange-400' },
    { name: 'Luna',  breed: 'Europea',       status: 'En residencia', statusColor: 'text-blue-400',   dot: 'bg-blue-400'   },
    { name: 'Rocky', breed: 'Border Collie', status: 'En proceso',    statusColor: 'text-yellow-400', dot: 'bg-yellow-400' },
  ];
  const STATS = [
    { label: 'Animales',  value: '68',  delta: '+3',  color: 'text-brand' },
    { label: 'Acogida',   value: '14',  delta: '+1',  color: 'text-orange-400' },
    { label: 'Adopción',  value: '9',   delta: '+2',  color: 'text-brand' },
    { label: 'Avisos',    value: '12',  delta: '-1',  color: 'text-red-400' },
    { label: 'Rescates',  value: '2',   delta: '=',   color: 'text-purple-400' },
  ];
  return (
    <div className="bg-[#111] text-white" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f1f1f]">
        <div>
          <p className="text-[13px] font-semibold text-white">¡Buenos días, Laura!</p>
          <p className="text-[11px] text-[#555]">Viernes, 17 de mayo</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[10px] font-bold text-brand">L</div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 p-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-[#555] mt-0.5">{s.label}</p>
            <p className={`text-[9px] mt-1 ${s.delta.startsWith('+') ? 'text-brand' : s.delta.startsWith('-') ? 'text-red-400' : 'text-[#555]'}`}>{s.delta} hoy</p>
          </div>
        ))}
      </div>
      {/* Table + Panel */}
      <div className="flex gap-3 px-4 pb-4">
        {/* Table */}
        <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
            <span className="text-[10px] font-semibold text-[#888]">ANIMALES</span>
            <span className="text-[9px] text-brand cursor-pointer">Ver todos →</span>
          </div>
          {ANIMALS.map(a => (
            <div key={a.name} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#222] hover:bg-white/3 transition-colors duration-100 cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[9px] font-bold text-brand flex-shrink-0">{a.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white">{a.name}</p>
                <p className="text-[9px] text-[#555]">{a.breed}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                <span className={`text-[9px] ${a.statusColor}`}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Side panel */}
        <div className="w-36 flex-shrink-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[#2a2a2a]">
            <span className="text-[9px] font-semibold text-[#888]">AVISOS ACTIVOS</span>
          </div>
          {[
            { dog: 'Pastor',  loc: 'Retiro',  t: '15 min' },
            { dog: 'Labrador',loc: 'Sol',     t: '1h' },
            { dog: 'Gata',    loc: 'Tetuán',  t: '2h' },
          ].map((a, i) => (
            <div key={i} className="px-3 py-2.5 border-b border-[#222]">
              <p className="text-[10px] font-medium text-white">{a.dog}</p>
              <p className="text-[9px] text-[#555]">📍 {a.loc}</p>
              <p className="text-[9px] text-red-400 mt-0.5">● {a.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-[#0a0a0a]" aria-labelledby="hero-heading">
      <DotGrid />

      {/* Green glow behind mockup — opacity only, no layout cost */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand rounded-full opacity-[0.06] blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT: Text ── */}
          <div ref={ref}>
            {/* Eyebrow */}
            <p className={`text-xs font-bold text-brand uppercase tracking-[0.2em] mb-6 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
              CRM para protectoras de animales
            </p>

            {/* H1 — Instrument Serif editorial */}
            <h1
              id="hero-heading"
              className={`font-serif text-hero text-white mb-6 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: '80ms' }}
            >
              La protectora
              <br />que sueñas
              <br /><span className="text-[#a1a1a1]">dirigir.</span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg text-[#a1a1a1] leading-relaxed max-w-xl mb-10 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: '160ms' }}
            >
              Gestiona animales, acogidas, adopciones y voluntarios desde un solo lugar.
              Con inteligencia artificial integrada.{' '}
              <span className="text-white font-medium">Gratis para empezar.</span>
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row gap-4 mb-10 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: '240ms' }}
            >
              <a
                href="/registro"
                className="flex items-center justify-center gap-2 px-7 py-4 text-[15px] font-semibold text-white bg-brand hover:bg-brand-dark rounded-full transition-colors duration-200 cursor-pointer shadow-lg shadow-brand/20 min-h-[52px]"
              >
                Empieza gratis — es gratis para siempre
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="#demo"
                className="flex items-center justify-center gap-3 px-6 py-4 text-[15px] font-medium text-[#a1a1a1] hover:text-white border border-[#2a2a2a] hover:border-[#444] rounded-full transition-all duration-200 cursor-pointer min-h-[52px]"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/8 border border-[#333]">
                  <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                </span>
                Ver demo de 2 min
              </a>
            </div>

            {/* Social proof */}
            <div
              className={`flex items-center gap-3 transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '320ms' }}
            >
              {/* Stacked avatars */}
              <div className="flex -space-x-2" aria-hidden="true">
                {['MG','AL','PR','TS','CM'].map((init, i) => (
                  <div key={init} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand/40 to-brand/20 border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] font-bold text-brand" style={{ zIndex: 5 - i }}>
                    {init}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#666]">
                <span className="text-white font-medium">+200 protectoras</span> ya usan ResQPet
              </p>
            </div>
          </div>

          {/* ── RIGHT: Mockup ── */}
          <div
            className={`relative transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <BrowserFrame>
              <DashboardMockup />
            </BrowserFrame>

            {/* Floating notification card — iOS style */}
            <div
              className="notification-enter absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 max-w-[220px] border border-gray-100"
              aria-hidden="true"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center flex-shrink-0 text-white text-sm">🐾</div>
                <div>
                  <p className="text-[12px] font-bold text-gray-900 leading-tight">Nueva solicitud de adopción</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Marta quiere adoptar a Rocky · <span className="text-brand">hace 2 min</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
