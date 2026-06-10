import { Instagram, Linkedin, Twitter } from 'lucide-react';

const COLS = [
  { h: 'Producto',  links: ['Funcionalidades','Precios','Changelog','Roadmap'] },
  { h: 'Recursos',  links: ['Blog','Guías','API docs','Estado del sistema'] },
  { h: 'Empresa',   links: ['Sobre nosotros','Contacto','Prensa','Trabaja con nosotros'] },
  { h: 'Legal',     links: ['Privacidad','Términos','Cookies','RGPD'] },
];

function PawSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="2.5"/><circle cx="15" cy="6" r="2.5"/>
      <circle cx="5.5" cy="12" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/>
      <path d="M12 12.5c-2.5 0-4.5 1.7-4.5 4s1.8 3.5 4.5 3.5 4.5-1.2 4.5-3.5-2-4-4.5-4z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0d0d0d] border-t border-[#1f1f1f] text-[#555]" role="contentinfo">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-5 cursor-pointer" aria-label="ResQPet">
              <span className="text-brand"><PawSVG /></span>
              <span className="font-sans font-semibold text-[16px] text-white">ResQPet</span>
            </a>
            <p className="text-sm leading-relaxed mb-6 max-w-[180px]">El CRM para protectoras que salvan vidas.</p>
            <div className="flex gap-3">
              {[{ Icon: Instagram, label: 'Instagram' }, { Icon: Linkedin, label: 'LinkedIn' }, { Icon: Twitter, label: 'Twitter/X' }].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#333] transition-colors duration-150 cursor-pointer">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.h}>
              <h3 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-4">{col.h}</h3>
              <ul className="space-y-3" role="list">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-[#ccc] transition-colors duration-150 cursor-pointer">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#1f1f1f] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} ResQPet · Hecho con ❤️ para los animales</p>
          <p className="text-[#333]">Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}
