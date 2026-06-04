import { Instagram, Linkedin, Twitter } from 'lucide-react';

const FOOTER_COLS = [
  {
    heading: 'Producto',
    links: ['Funcionalidades', 'Precios', 'Changelog', 'Roadmap'],
  },
  {
    heading: 'Recursos',
    links: ['Blog', 'Guías', 'API docs', 'Estado del sistema'],
  },
  {
    heading: 'Empresa',
    links: ['Sobre nosotros', 'Contacto', 'Prensa', 'Trabaja con nosotros'],
  },
  {
    heading: 'Legal',
    links: ['Privacidad', 'Términos', 'Cookies', 'RGPD'],
  },
];

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-4 cursor-pointer" aria-label="ResQPet inicio">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <PawIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">ResQPet</span>
            </a>
            <p className="text-sm leading-relaxed mb-6 max-w-[200px]">
              El CRM para protectoras que salvan vidas.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, label: 'Instagram', href: '#' },
                { Icon: Linkedin,  label: 'LinkedIn',  href: '#' },
                { Icon: Twitter,   label: 'Twitter',   href: '#' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5" role="list">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm hover:text-gray-200 transition-colors duration-150 cursor-pointer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2025 ResQPet · Hecho con ❤️ para los animales</p>
          <p className="text-gray-600">Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="2.5" /><circle cx="15" cy="6" r="2.5" />
      <circle cx="5.5" cy="12" r="2.5" /><circle cx="18.5" cy="12" r="2.5" />
      <path d="M12 12.5c-2.5 0-4.5 1.7-4.5 4s1.8 3.5 4.5 3.5 4.5-1.2 4.5-3.5-2-4-4.5-4z" />
    </svg>
  );
}
