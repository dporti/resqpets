'use client';
import { Play, ArrowRight } from 'lucide-react';
import { useReveal } from './useReveal';

const SHELTER_LOGOS = [
  'Huella Viva',
  'Patas Unidas',
  'Refugio Sol',
  'Amigos Felinos',
  'Acoge Madrid',
];

export function Hero() {
  const { ref, visible } = useReveal(0.05);

  return (
    <section
      className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden"
      aria-label="Sección principal"
    >
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary-50/60 via-white to-white pointer-events-none"
        aria-hidden="true"
      />
      {/* Decorative blur orbs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-40 right-1/4 w-56 h-56 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={ref} className="text-center">
          {/* Pill badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-primary bg-primary-light border border-primary/20 mb-8 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            Ahora con inteligencia artificial integrada
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl sm:text-6xl md:text-[72px] font-extrabold text-gray-900 tracking-tight leading-[1.08] mb-6 transition-all duration-600 delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            El CRM que tu{' '}
            <span className="text-primary">protectora</span>{' '}
            merece.
          </h1>

          {/* Subtitle */}
          <p
            className={`text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10 transition-all duration-600 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            Gestiona animales, acogidas, adopciones y voluntarios desde un solo lugar.
            Con inteligencia artificial integrada.{' '}
            <span className="text-gray-700 font-medium">Gratis para empezar.</span>
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-600 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <a
              href="/registro"
              className="flex items-center gap-2 px-7 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-700 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 cursor-pointer"
            >
              Empieza gratis hoy
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="#demo"
              className="flex items-center gap-2.5 px-6 py-4 text-base font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Play className="w-3.5 h-3.5 text-primary fill-primary" aria-hidden="true" />
              </span>
              Ver demo en 2 minutos
            </a>
          </div>

          {/* Dashboard mockup */}
          <div
            className={`relative mx-auto max-w-5xl transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xl shadow-gray-900/12 bg-white">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="w-3 h-3 rounded-full bg-red-400" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-green-400" aria-hidden="true" />
                <div className="ml-4 flex-1 h-5 bg-gray-200 rounded-md max-w-xs text-xs text-gray-400 flex items-center px-2">
                  app.resqpet.com
                </div>
              </div>

              <DashboardMockup />
            </div>

            {/* Floating badges */}
            <div
              className="absolute -left-4 top-1/4 bg-white rounded-xl px-4 py-3 shadow-lg shadow-black/8 border border-gray-100 hidden sm:block"
              aria-hidden="true"
            >
              <p className="text-xs text-gray-400 font-medium mb-0.5">Nuevas solicitudes</p>
              <p className="text-xl font-bold text-gray-900">+9 <span className="text-primary text-sm font-semibold">adopciones</span></p>
            </div>
            <div
              className="absolute -right-4 top-1/3 bg-white rounded-xl px-4 py-3 shadow-lg shadow-black/8 border border-gray-100 hidden sm:block"
              aria-hidden="true"
            >
              <p className="text-xs text-gray-400 font-medium mb-0.5">Tiempo ahorrado</p>
              <p className="text-xl font-bold text-gray-900">3.2h <span className="text-primary text-sm font-semibold">/semana</span></p>
            </div>
          </div>

          {/* Social proof logos */}
          <div
            className={`mt-16 transition-all duration-600 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <p className="text-sm text-gray-400 font-medium mb-6">
              +200 protectoras confían en ResQPet
            </p>
            <div
              className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
              role="list"
              aria-label="Protectoras colaboradoras"
            >
              {SHELTER_LOGOS.map(name => (
                <div key={name} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-default" role="listitem">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <PawSmall />
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PawSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="2.5"/><circle cx="15" cy="6" r="2.5"/>
      <circle cx="5.5" cy="12" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/>
      <path d="M12 12.5c-2.5 0-4.5 1.7-4.5 4s1.8 3.5 4.5 3.5 4.5-1.2 4.5-3.5-2-4-4.5-4z"/>
    </svg>
  );
}

function DashboardMockup() {
  const animals = [
    { name: 'Max',   species: 'Perro',  breed: 'Border Collie',  status: 'En acogida',  vac: true, chip: true },
    { name: 'Luna',  species: 'Gata',   breed: 'Mestiza',        status: 'En adopción', vac: true, chip: true },
    { name: 'Rocky', species: 'Perro',  breed: 'Labrador',       status: 'En acogida',  vac: true, chip: false },
    { name: 'Mimi',  species: 'Gata',   breed: 'Siamés',         status: 'En adopción', vac: true, chip: true },
    { name: 'Nala',  species: 'Perra',  breed: 'Golden Retriever', status: 'En evaluación', vac: false, chip: true },
  ];

  const STATUS_COLOR: Record<string, string> = {
    'En acogida':    'bg-orange-100 text-orange-700',
    'En adopción':   'bg-green-100 text-green-700',
    'En evaluación': 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="flex bg-gray-50 min-h-[420px]" aria-hidden="true">
      {/* Sidebar */}
      <div className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <PawSmall />
        </div>
        {['🏠','🐾','❤️','🏡','👥'].map((icon, i) => (
          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${i === 0 ? 'bg-primary/10' : 'hover:bg-gray-100'}`}>{icon}</div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">A</div>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-hidden">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Animales', value: '68',  color: 'text-gray-900' },
              { label: 'En acogida', value: '14', color: 'text-orange-600' },
              { label: 'Adopciones', value: '9',  color: 'text-primary' },
              { label: 'Avisos SOS', value: '12', color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {/* Table */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Animales recientes</span>
                <span className="text-xs text-primary font-medium cursor-pointer">Ver todos</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50/60">
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Nombre</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium hidden sm:table-cell">Raza</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Estado</th>
                    <th className="text-left px-4 py-2 text-gray-400 font-medium hidden md:table-cell">Salud</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map(a => (
                    <tr key={a.name} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-100 cursor-pointer">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                            {a.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{a.name}</p>
                            <p className="text-gray-400 text-[10px]">{a.species}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{a.breed}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[a.status]}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        <div className="flex gap-1">
                          {a.vac  && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-medium">Vac</span>}
                          {a.chip && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-medium">Chip</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mini donut + activity */}
            <div className="w-36 flex flex-col gap-3 flex-shrink-0 hidden lg:flex">
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] text-gray-400 font-medium mb-2">Por estado</p>
                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 64 64" width="56" height="56">
                    <circle cx="32" cy="32" r="20" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle cx="32" cy="32" r="20" fill="none" stroke="#1D9E75" strokeWidth="10" strokeDasharray="50 75" strokeDashoffset="25" />
                    <circle cx="32" cy="32" r="20" fill="none" stroke="#f97316" strokeWidth="10" strokeDasharray="20 105" strokeDashoffset="-25" />
                    <circle cx="32" cy="32" r="20" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="18 107" strokeDashoffset="-45" />
                  </svg>
                </div>
                <div className="space-y-1 mt-1">
                  {[['#1D9E75','En adopción'],['#f97316','En acogida'],['#3b82f6','Residencia']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="text-[9px] text-gray-500">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3 flex-1">
                <p className="text-[10px] text-gray-400 font-medium mb-2">Actividad</p>
                <div className="space-y-2">
                  {['Nueva solicitud: Max','Acogida finalizada','Tarea: vacuna Luna'].map(a => (
                    <div key={a} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                      <p className="text-[9px] text-gray-500 leading-tight">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
