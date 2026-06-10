'use client';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

const PRODUCT_LINKS = [
  { label: 'Dashboard',         desc: 'Vista global en tiempo real' },
  { label: 'Ficha de animal',   desc: 'Expediente completo + IA' },
  { label: 'Adopciones',        desc: 'Pipeline y seguimiento' },
  { label: 'Asistente IA',      desc: 'Cmd+K — lenguaje natural', badge: 'Pro' },
  { label: 'SOS Pet',           desc: 'Alertas ciudadanas' },
  { label: 'Padrinos virtuales', desc: 'Donaciones recurrentes',   badge: 'Pro' },
];

function PawSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="2.5"/><circle cx="15" cy="6" r="2.5"/>
      <circle cx="5.5" cy="12" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/>
      <path d="M12 12.5c-2.5 0-4.5 1.7-4.5 4s1.8 3.5 4.5 3.5 4.5-1.2 4.5-3.5-2-4-4.5-4z"/>
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/92 backdrop-blur-lg border-b border-[#1f1f1f]' : ''}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <nav className="flex items-center justify-between h-16" aria-label="Navegación principal">
          <a href="#" className="flex items-center gap-2.5 cursor-pointer" aria-label="ResQPet inicio">
            <span className="text-brand"><PawSVG /></span>
            <span className="font-sans font-semibold text-[17px] text-white">ResQPet</span>
          </a>

          <ul className="hidden md:flex items-center gap-0.5" role="list">
            {/* Producto con dropdown */}
            <li className="relative">
              <button onClick={() => setDropOpen(p => !p)}
                onBlur={() => setTimeout(() => setDropOpen(false), 160)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[#999] hover:text-white transition-colors duration-150 rounded-lg hover:bg-white/5 cursor-pointer"
                aria-haspopup="true" aria-expanded={dropOpen}>
                Producto
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {dropOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#111] border border-[#2a2a2a] rounded-xl p-2 shadow-2xl shadow-black/60">
                  {PRODUCT_LINKS.map(pl => (
                    <a key={pl.label} href="#"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors duration-150 cursor-pointer group">
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-brand transition-colors duration-150">{pl.label}</p>
                        <p className="text-xs text-[#555]">{pl.desc}</p>
                      </div>
                      {pl.badge && <span className="px-1.5 py-0.5 bg-brand/20 text-brand text-[10px] font-bold rounded-full">{pl.badge}</span>}
                    </a>
                  ))}
                </div>
              )}
            </li>
            {[{ label: 'Precios', href: '#precios' }, { label: 'Historias', href: '#historias' }].map(l => (
              <li key={l.label}>
                <a href={l.href} className="block px-4 py-2 text-sm text-[#999] hover:text-white transition-colors duration-150 rounded-lg hover:bg-white/5 cursor-pointer">{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="px-4 py-2 text-sm text-[#999] hover:text-white transition-colors duration-150 cursor-pointer">Iniciar sesión</a>
            <a href="/registro" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-dark rounded-full transition-colors duration-150 cursor-pointer">
              Prueba gratis <span aria-hidden="true">→</span>
            </a>
          </div>

          <button onClick={() => setMenuOpen(p => !p)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="w-5 h-5 text-white" aria-hidden="true" /> : <Menu className="w-5 h-5 text-[#999]" aria-hidden="true" />}
          </button>
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#1f1f1f] bg-[#0d0d0d]">
          <div className="max-w-7xl mx-auto px-5 py-4 flex flex-col gap-1">
            {['Producto', 'Precios', 'Historias'].map(l => (
              <a key={l} href="#" onClick={() => setMenuOpen(false)}
                className="px-3 min-h-[44px] flex items-center text-sm text-[#999] hover:text-white transition-colors duration-150 rounded-lg hover:bg-white/5 cursor-pointer">{l}</a>
            ))}
            <div className="mt-3 pt-3 border-t border-[#1f1f1f] flex flex-col gap-2">
              <a href="/login" className="py-3 text-center text-sm text-[#999] border border-[#2a2a2a] rounded-full cursor-pointer">Iniciar sesión</a>
              <a href="/registro" className="py-3 text-center text-sm font-semibold text-white bg-brand rounded-full cursor-pointer">Prueba gratis →</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
