'use client';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Precios',         href: '#precios' },
  { label: 'Historias',       href: '#historias' },
  { label: 'Blog',            href: '#' },
];

export function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    /* Floating navbar with edge spacing — skill layout rule */
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'top-0' : 'top-4'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-4 transition-all duration-200 ${
          scrolled ? '' : 'px-6'
        }`}
      >
        <nav
          className={`flex items-center justify-between h-16 rounded-2xl px-5 transition-all duration-200 ${
            scrolled
              ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-black/5 border border-gray-100'
              : 'bg-white/80 backdrop-blur-sm shadow-md shadow-black/4 border border-gray-100/60'
          }`}
          aria-label="Navegación principal"
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 cursor-pointer" aria-label="ResQPet inicio">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <PawIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-[17px] text-gray-900 tracking-tight">
              ResQ<span className="text-primary">Pet</span>
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(link => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
            >
              Iniciar sesión
            </a>
            <a
              href="/registro"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-700 rounded-lg transition-colors duration-150 cursor-pointer shadow-sm"
            >
              Prueba gratis
            </a>
          </div>

          {/* Mobile hamburger — min 44x44px touch target */}
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/8 overflow-hidden">
            <ul className="py-2" role="list">
              {NAV_LINKS.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 p-4 flex flex-col gap-2">
              <a
                href="/login"
                className="block text-center py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              >
                Iniciar sesión
              </a>
              <a
                href="/registro"
                className="block text-center py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-700 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                Prueba gratis
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l-4 4.5 4-4.5m2 0l4 4.5-4-4.5v9" />
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
      <circle cx="6.5" cy="11" r="1.5" />
      <circle cx="17.5" cy="11" r="1.5" />
      <path d="M12 13c-2.33 0-4 1.45-4 3.25S10.5 20 12 20s4-1.5 4-3.75S14.33 13 12 13z" />
    </svg>
  );
}
