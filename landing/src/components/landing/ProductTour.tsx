'use client';
import { useState } from 'react';
import {
  LayoutDashboard, PawPrint, Home, Sparkles, AlertTriangle, Heart,
} from 'lucide-react';
import { useReveal } from './useReveal';

const TABS = [
  { id: 'dashboard',  Icon: LayoutDashboard, label: 'Dashboard',         desc: 'Vista global en tiempo real' },
  { id: 'animal',     Icon: PawPrint,         label: 'Ficha de animal',   desc: 'Expediente completo + historial' },
  { id: 'adoptions',  Icon: Home,             label: 'Proceso de adopción', desc: 'Pipeline de solicitudes' },
  { id: 'ai',         Icon: Sparkles,         label: 'Asistente IA',      desc: 'Lenguaje natural, datos reales', badge: 'Pro' },
  { id: 'sos',        Icon: AlertTriangle,    label: 'SOS Pet',           desc: 'Alertas ciudadanas de animales' },
  { id: 'sponsors',   Icon: Heart,            label: 'Padrinos virtuales', desc: 'Donaciones recurrentes por animal', badge: 'Pro' },
];

/* ── Individual mockups ─────────────────────────────────── */

function DashboardMock() {
  return (
    <div className="p-4 text-xs text-white">
      <p className="text-[11px] text-[#888] mb-3">Vista general · Hoy</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[['68','Animales','text-brand'],['14','Acogida','text-orange-400'],['9','Adopciones','text-brand'],['12','Avisos','text-red-400']].map(([v,l,c])=>(
          <div key={l} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-[10px] text-[#555] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-4">
        <p className="text-[10px] text-[#888] mb-3">Adopciones — últimos 6 meses</p>
        <div className="flex items-end gap-2 h-20">
          {[4,7,5,9,6,9].map((h,i)=>(
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div className="bg-brand rounded-sm" style={{height:`${(h/9)*100}%`,opacity: i===5 ? 1 : 0.5}} />
              <p className="text-[8px] text-[#555] text-center mt-1">{['E','F','M','A','M','J'][i]}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Activity */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
        <p className="text-[10px] text-[#888] mb-2">Actividad reciente</p>
        {[['L','Laura añadió nota en Max','10 min'],['A','Ana cerró expediente Rocky','1h'],['M','Marta aceptó acogida Luna','2h']].map(([init,action,time])=>(
          <div key={action} className="flex items-center gap-2 py-1.5 border-b border-[#222] last:border-0">
            <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[9px] font-bold text-brand flex-shrink-0">{init}</div>
            <p className="text-[10px] text-[#999] flex-1 truncate">{action}</p>
            <p className="text-[9px] text-[#555]">{time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimalMock() {
  return (
    <div className="p-4 text-xs text-white">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-2xl flex-shrink-0">🐕</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold">Max</h3>
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px] font-semibold">En acogida</span>
          </div>
          <p className="text-[11px] text-[#666]">Macho · Border Collie · 4 años · 18 kg</p>
        </div>
      </div>
      <div className="flex gap-1 mb-4">
        {['Información','Salud','Comportamiento','Docs'].map((t,i)=>(
          <button key={t} className={`px-3 py-1.5 text-[10px] rounded-lg cursor-pointer transition-colors duration-150 ${i===0 ? 'bg-brand text-white' : 'text-[#666] hover:text-[#aaa]'}`}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[['Color','Blanco y negro'],['Pelo','Medio'],['Ojos','Marrones'],['Tamaño','Mediano']].map(([k,v])=>(
          <div key={k} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2">
            <p className="text-[9px] text-[#555]">{k}</p>
            <p className="text-[11px] font-medium text-white">{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 mb-3">
        <p className="text-[10px] text-[#888] mb-2">Compatibilidad</p>
        {['Personas activas','Hogares sin gatos','Niños mayores 8 años'].map(c=>(
          <div key={c} className="flex items-center gap-2 py-1">
            <span className="text-brand text-xs">✓</span>
            <span className="text-[10px] text-[#aaa]">{c}</span>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white text-[11px] font-semibold rounded-lg transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        Generar descripción IA
      </button>
    </div>
  );
}

function AdoptionsMock() {
  const COLS = [
    { label: 'Solicitud', color: 'text-[#888]', bg: 'bg-[#1a1a1a]', cards: [['Rocky','Marta S.','3 días'],['Luna','Juan P.','5 días'],['Tobi','Ana R.','1 día']] },
    { label: 'Revisión',  color: 'text-blue-400', bg: 'bg-blue-500/5', cards: [['Max','Carlos M.','8 días'],['Nala','Laura T.','6 días']] },
    { label: 'Visita',    color: 'text-yellow-400', bg: 'bg-yellow-500/5', cards: [['Kira','Pedro R.','12 días']] },
    { label: 'Aprobada',  color: 'text-brand', bg: 'bg-brand/5', cards: [['Sirius','María G.','18 días']] },
  ];
  return (
    <div className="p-3 flex gap-2.5 overflow-x-auto">
      {COLS.map(col=>(
        <div key={col.label} className="flex-1 min-w-[100px]">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-bold ${col.color} uppercase tracking-wide`}>{col.label}</span>
            <span className="text-[9px] text-[#555] bg-[#222] px-1.5 py-0.5 rounded-full">{col.cards.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {col.cards.map(([animal,person,days])=>(
              <div key={animal} className={`${col.bg} border border-[#2a2a2a] rounded-xl p-2.5 cursor-pointer hover:border-[#444] transition-colors duration-150`}>
                <p className="text-[11px] font-semibold text-white">{animal}</p>
                <p className="text-[9px] text-[#666]">{person}</p>
                <p className="text-[9px] text-[#555] mt-1">⏱ {days}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AIMock() {
  return (
    <div className="p-4 flex flex-col gap-3 text-xs">
      {/* User msg */}
      <div className="flex justify-end">
        <div className="bg-brand text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%] text-[12px]">
          ¿Qué animales llevan más de 90 días?
        </div>
      </div>
      {/* AI response */}
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[10px] text-brand flex-shrink-0">✦</div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-3 py-2.5 flex-1">
          <p className="text-[10px] font-semibold text-white mb-2">He encontrado 3 animales:</p>
          <table className="w-full text-[9px]">
            <thead><tr className="text-[#555]">{['Nombre','Días','Estado'].map(h=><th key={h} className="text-left pb-1.5">{h}</th>)}</tr></thead>
            <tbody>{[['Toby','124','Acogida'],['Sirius','103','Evaluación'],['Kira','97','Residencia']].map(([n,d,s])=>(
              <tr key={n} className="border-t border-[#222]">
                <td className="py-1 font-medium text-[#ccc]">{n}</td>
                <td className="py-1 text-red-400 font-semibold">{d}d</td>
                <td className="py-1"><span className="px-1.5 py-0.5 bg-[#222] text-[#888] rounded text-[8px]">{s}</span></td>
              </tr>
            ))}</tbody>
          </table>
          <button className="mt-2.5 w-full py-1.5 bg-brand/20 text-brand text-[10px] font-semibold rounded-lg cursor-pointer">Crear tarea para todos →</button>
        </div>
      </div>
      {/* 2nd exchange */}
      <div className="flex justify-end">
        <div className="bg-brand text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%] text-[12px]">
          Genera un email para el adoptante de Rocky
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[10px] text-brand flex-shrink-0">✦</div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-3 py-2.5 flex-1 text-[10px] text-[#aaa]">
          Aquí tienes el borrador:
          <div className="mt-2 bg-[#222] rounded-lg p-2 text-[9px] text-[#999]">
            <p className="font-semibold text-[#ccc] mb-1">Asunto: Actualización sobre Rocky</p>
            <p>Hola Marta, encantados de informarte que Rocky ha superado todas las evaluaciones y está listo...</p>
          </div>
          <button className="mt-2 w-full py-1.5 bg-[#222] text-[#888] text-[10px] rounded-lg cursor-pointer hover:text-white transition-colors">📋 Copiar email</button>
        </div>
      </div>
      {/* Input */}
      <div className="flex gap-2 mt-1">
        <div className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-2 text-[10px] text-[#555]">Pregunta algo sobre tu protectora...</div>
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-[10px] flex-shrink-0 cursor-pointer">➤</div>
      </div>
    </div>
  );
}

function SOSMock() {
  return (
    <div className="p-4 text-xs text-white">
      {/* Map placeholder */}
      <div className="relative h-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl mb-3 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60" aria-hidden="true" />
        {[[30,40,'🔴'],[55,25,'🔴'],[70,60,'🟠']].map(([x,y,pin],i)=>(
          <div key={i} className="absolute text-lg" style={{left:`${x}%`,top:`${y}%`,transform:'translate(-50%,-50%)'}} aria-hidden="true">{pin}</div>
        ))}
        <button className="absolute bottom-2 right-2 px-3 py-1.5 bg-brand text-white text-[10px] font-semibold rounded-lg cursor-pointer">+ Nuevo aviso</button>
      </div>
      {[
        {label:'Perro visto en Retiro',time:'15 min',urgency:'En búsqueda',color:'text-orange-400'},
        {label:'Gata negra en zona Sol',time:'1h',urgency:'En búsqueda',color:'text-orange-400'},
        {label:'Perro perdido en Tetuán',time:'2h',urgency:'🔴 Urgente',color:'text-red-400'},
      ].map(a=>(
        <div key={a.label} className="flex items-center gap-3 py-2 border-b border-[#1f1f1f]">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-base flex-shrink-0">🐕</div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-white">{a.label}</p>
            <p className={`text-[9px] ${a.color}`}>{a.urgency}</p>
          </div>
          <p className="text-[9px] text-[#555]">{a.time}</p>
        </div>
      ))}
    </div>
  );
}

function SponsorsMock() {
  return (
    <div className="p-4 text-xs text-white">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-2xl flex-shrink-0">🐈</div>
        <div>
          <h3 className="text-base font-bold">Luna</h3>
          <p className="text-[11px] text-[#666]">Europea · 3 años · Huella Viva</p>
          <p className="text-[10px] text-brand mt-1">3 de 5 padrinos · 45€/mes</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-[#888] mb-1.5">
          <span>Progreso del mes</span><span className="text-brand font-semibold">90%</span>
        </div>
        <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-2.5 bg-brand rounded-full" style={{width:'90%'}} />
        </div>
      </div>
      <div className="space-y-2.5 mb-4">
        {[['Ana L.','15€/mes','Marzo'],['Pedro M.','10€/mes','Enero'],['María T.','20€/mes','Abril']].map(([name,amount,since])=>(
          <div key={name} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-[10px] text-brand flex-shrink-0">{name[0]}</div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-white">{name}</p>
              <p className="text-[9px] text-[#555]">Desde {since}</p>
            </div>
            <span className="text-[10px] font-semibold text-brand">{amount}</span>
          </div>
        ))}
      </div>
      <button className="w-full py-3 bg-brand hover:bg-brand-dark text-white text-[12px] font-semibold rounded-xl transition-colors duration-150 cursor-pointer">
        Hazte padrino de Luna
      </button>
    </div>
  );
}

const MOCKUPS: Record<string, React.ReactNode> = {
  dashboard: <DashboardMock />,
  animal:    <AnimalMock />,
  adoptions: <AdoptionsMock />,
  ai:        <AIMock />,
  sos:       <SOSMock />,
  sponsors:  <SponsorsMock />,
};

export function ProductTour() {
  const [active, setActive] = useState('dashboard');
  const { ref, visible } = useReveal(0.05);

  return (
    <section id="producto" className="py-28 bg-[#0a0a0a]" aria-labelledby="tour-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-16">
          <h2
            id="tour-heading"
            className={`font-serif text-section text-white mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          >
            Todo el CRM, en un vistazo
          </h2>
          <p className={`text-lg text-[#666] transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '100ms' }}>
            Haz clic en cada módulo para verlo en acción
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Tabs sidebar */}
          <nav aria-label="Módulos del CRM">
            <ul role="list" className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {TABS.map(({ id, Icon, label, desc, badge }) => {
                const isActive = active === id;
                return (
                  <li key={id} className="flex-shrink-0 lg:flex-shrink">
                    <button
                      onClick={() => setActive(id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? 'bg-[#111] border-[#2a2a2a] border-l-brand border-l-2 text-white'
                          : 'border-transparent text-[#555] hover:text-[#888] hover:bg-white/3'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand' : 'text-[#444]'}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{label}</p>
                          {badge && (
                            <span className="px-1.5 py-0.5 bg-brand/20 text-brand text-[9px] font-bold rounded-full hidden lg:inline">{badge}</span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 hidden lg:block ${isActive ? 'text-[#888]' : 'text-[#444]'}`}>{desc}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mockup frame */}
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#111] shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" /><span className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="ml-4 h-5 bg-[#2a2a2a] rounded-md w-40 flex items-center px-2">
                <span className="text-[11px] text-[#444]">app.resqpet.com</span>
              </div>
            </div>
            <div key={active} className="tab-fade min-h-[380px]" role="region" aria-label={`Mockup de ${active}`}>
              {MOCKUPS[active]}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
