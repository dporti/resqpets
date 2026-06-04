const SHELTERS = [
  'Huella Viva', 'Patas Unidas', 'Refugio Sol', 'Amigos Felinos',
  'Acoge Madrid', 'Patitas Burgos', 'Can Salvat', 'Gatets BCN',
];

export function LogoBar() {
  const repeated = [...SHELTERS, ...SHELTERS]; // double for seamless loop

  return (
    <div className="py-5 bg-[#0d0d0d] border-y border-[#1f1f1f] overflow-hidden" aria-label="Protectoras colaboradoras">
      <div className="flex items-center gap-10 max-w-7xl mx-auto px-5 sm:px-8 mb-4">
        <p className="text-[11px] text-[#444] font-medium whitespace-nowrap flex-shrink-0">
          Con la confianza de protectoras en toda España
        </p>
        <div className="flex-1 h-px bg-[#1f1f1f]" />
      </div>

      <div className="relative overflow-hidden">
        <div className="flex marquee-track gap-0">
          {repeated.map((name, i) => (
            <div key={i} className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm font-medium text-[#444] hover:text-[#888] transition-colors duration-200 whitespace-nowrap">
                {name}
              </span>
              <span className="text-[#2a2a2a] text-base" aria-hidden="true">·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
