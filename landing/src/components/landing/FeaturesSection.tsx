'use client';
import { Sparkles, Globe, HeartHandshake, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useReveal } from './useReveal';

function SectionHeading({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`text-center mb-16 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  );
}

function FeatureBlock({
  reversed = false,
  badge,
  title,
  description,
  bullets,
  visual,
  index,
}: {
  reversed?: boolean;
  badge?: React.ReactNode;
  title: string;
  description?: string;
  bullets?: string[];
  visual: React.ReactNode;
  index: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16 py-16 border-b border-gray-100 last:border-0 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Text */}
      <div className="flex-1 max-w-xl">
        {badge}
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">{title}</h3>
        {description && <p className="text-gray-500 leading-relaxed mb-6">{description}</p>}
        {bullets && (
          <ul className="space-y-3" role="list">
            {bullets.map(b => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: b }} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Visual */}
      <div className="flex-1 w-full max-w-xl">{visual}</div>
    </div>
  );
}

/* ── Mockup components ──────────────────────────────── */
function AnimalCardMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-900/8 bg-white">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-400">
        <span>Fichas</span><span className="text-gray-300">/</span><span className="font-medium text-gray-600">Max — Border Collie</span>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🐕</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-lg">Max</h4>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">En acogida</span>
            </div>
            <p className="text-sm text-gray-500">Border Collie · Macho · 3 años · 18 kg</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {['Información','Salud','Comportamiento','Documentos'].map(t => (
            <button key={t} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer ${t === 'Salud' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{t}</button>
          ))}
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Vacunas', value: 'Antirrábica · DHPPI · Bordetella', ok: true },
            { label: 'Microchip', value: '941000024XXXXX', ok: true },
            { label: 'Esterilizado', value: 'Sí — 12/03/2024', ok: true },
            { label: 'Próxima revisión', value: '15/08/2024', ok: false },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">{r.value}</span>
                <div className={`w-2 h-2 rounded-full ${r.ok ? 'bg-primary' : 'bg-amber-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIAssistantMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-900/8 bg-white">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-sm text-white font-bold flex-shrink-0">✦</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Asistente ResQPet</p>
          <p className="text-xs text-gray-400">IA · Ctrl+K</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-end">
          <div className="bg-primary text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
            ¿Qué animales llevan más de 90 días sin movimiento?
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-sm flex-shrink-0">✦</div>
          <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-2">He encontrado 4 animales:</p>
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400">{['Nombre','Días','Estado'].map(h=><th key={h} className="text-left pb-1.5">{h}</th>)}</tr></thead>
              <tbody className="space-y-1">
                {[['Rocky','142','En acogida'],['Mimi','118','En evaluación'],['Toro','97','En residencia'],['Cleo','91','En acogida']].map(([n,d,s])=>(
                  <tr key={n} className="border-t border-gray-100">
                    <td className="py-1 font-medium text-gray-800">{n}</td>
                    <td className="py-1 text-red-600 font-semibold">{d}d</td>
                    <td className="py-1"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{s}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button className="w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors duration-150 cursor-pointer">
                Crear tarea de revisión para todos →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalMockup() {
  const animals = [
    { name: 'Luna',  breed: 'Mestiza', age: '2 años',  emoji: '🐈', status: 'En adopción' },
    { name: 'Rocco', breed: 'Labrador',age: '4 años',  emoji: '🐕', status: 'En adopción' },
    { name: 'Misu',  breed: 'Persa',   age: '1 año',   emoji: '🐱', status: 'En adopción' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-900/8 bg-white">
      <div className="px-5 py-3 bg-gradient-to-r from-primary to-emerald-600 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-white font-bold">ResQPet · Portal de adopciones</p>
          <p className="text-white/70 text-xs">protectora.resqpet.com</p>
        </div>
        <div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-white/30" />)}</div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-9 bg-gray-100 rounded-xl flex items-center px-3 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <span className="text-sm text-gray-400">Busca por raza, especie...</span>
          </div>
          <div className="h-9 px-3 bg-primary/10 text-primary text-xs font-semibold rounded-xl flex items-center">🐕 Perros</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {animals.map(a => (
            <div key={a.name} className="rounded-xl border border-gray-100 overflow-hidden hover:border-primary/30 transition-colors duration-150 cursor-pointer">
              <div className="h-20 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-3xl">{a.emoji}</div>
              <div className="p-2">
                <p className="font-bold text-gray-900 text-sm">{a.name}</p>
                <p className="text-gray-400 text-[10px]">{a.breed} · {a.age}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-semibold">En adopción</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-primary font-medium text-center cursor-pointer hover:bg-primary/10 transition-colors duration-150">
          Test de compatibilidad — ¿Qué animal es para ti? →
        </div>
      </div>
    </div>
  );
}

function SponsorMockup() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-900/8 bg-white">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-3xl flex-shrink-0">🐕</div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Apadrina a Tobi</p>
            <p className="text-sm text-gray-500">Labrador · 5 años · Refugio Sol, Valencia</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(s=><span key={s} className="text-amber-400 text-xs">★</span>)}
              <span className="text-xs text-gray-400 ml-1">24 padrinos</span>
            </div>
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Objetivo mensual</span>
            <span className="font-bold text-primary">187€ / 250€</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700" style={{ width: '74.8%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">74% — faltan 63€ para el mes</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['5€/mes','10€/mes','15€/mes'].map(p => (
            <button key={p} className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-150 cursor-pointer ${p === '10€/mes' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary/40'}`}>{p}</button>
          ))}
        </div>
        <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors duration-150 cursor-pointer">
          Apadrinar a Tobi
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Recibirás fotos y actualizaciones cada mes</p>
      </div>
    </div>
  );
}

function CommunicationsMockup() {
  const msgs = [
    { time: '09:14', type: 'WhatsApp', icon: '💬', msg: 'Hola María, Tobi ha pasado su revisión veterinaria. Todo perfecto! 🐕', status: '✓✓', color: 'text-green-600' },
    { time: '09:15', type: 'Email', icon: '📧', msg: 'Recordatorio: visita de seguimiento a la familia Pérez esta tarde a las 17h.', status: 'Enviado', color: 'text-blue-600' },
    { time: '10:32', type: 'WhatsApp', icon: '💬', msg: '¡Muchas gracias! Tobi está encantado con nosotros 🥰', status: 'Recibido', color: 'text-gray-400' },
  ];
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl shadow-gray-900/8 bg-white">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Centro de comunicaciones</p>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Automatizado</span>
      </div>
      <div className="p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-xl flex-shrink-0">{m.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500">{m.type}</span>
                <span className="text-xs text-gray-400">{m.time}</span>
              </div>
              <p className="text-sm text-gray-700 leading-snug">{m.msg}</p>
              <p className={`text-xs mt-1 ${m.color}`}>{m.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 bg-white" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading>
          <h2 id="features-heading" className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Todo lo que necesita tu protectora,{' '}
            <span className="text-primary">en un solo lugar</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Cada funcionalidad diseñada con y para protectoras reales. Sin complejidad innecesaria.
          </p>
        </SectionHeading>

        <FeatureBlock
          index={0}
          title="Fichas completas. Todo bajo control."
          description="Cada animal tiene su expediente digital con historial médico, documentos, fotos, estado actual y responsable asignado. Accede desde cualquier dispositivo, en cualquier momento."
          visual={<AnimalCardMockup />}
        />

        <FeatureBlock
          index={1}
          reversed
          badge={
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold mb-4 border border-violet-200">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Exclusivo ResQPet · Ningún CRM del sector lo tiene
            </div>
          }
          title="La IA que trabaja contigo, no contra ti."
          bullets={[
            '<strong>Reconocimiento facial de animales</strong> — compara fotos de rescates con avisos SOS activos automáticamente',
            '<strong>Asistente interno (Ctrl+K)</strong> — pregunta en lenguaje natural y obtén respuestas al instante con datos reales',
            '<strong>Descripciones automáticas</strong> — genera el texto del portal público con un clic a partir de la ficha del animal',
            '<strong>Informe de impacto anual</strong> — PDF profesional generado automáticamente para solicitudes de subvenciones',
          ]}
          visual={<AIAssistantMockup />}
        />

        <FeatureBlock
          index={2}
          title="Tu protectora, visible para todo el mundo."
          description="Portal público incluido en todos los planes. Test de compatibilidad gamificado que aumenta las solicitudes de adopción. Muro de adopciones exitosas que genera confianza. SOS Pet integrado para animales perdidos."
          visual={<PortalMockup />}
        />

        <FeatureBlock
          index={3}
          reversed
          badge={
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mb-4 border border-amber-200">
              <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
              Plan Pro y Enterprise
            </div>
          }
          title="Recaudación recurrente sin esfuerzo."
          description="Los padrinos virtuales donan entre 5 y 15€/mes vinculados a un animal concreto. Reciben actualizaciones automáticas con fotos y novedades. Si el animal es adoptado, el sistema ofrece apadrinar otro automáticamente."
          visual={<SponsorMockup />}
        />

        <FeatureBlock
          index={4}
          badge={
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-4 border border-green-200">
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              WhatsApp + Email
            </div>
          }
          title="Comunicaciones. Automatizadas."
          description="Notificaciones automáticas a familias de acogida, adoptantes y voluntarios por WhatsApp Business y email. Sin copiar y pegar. Sin olvidarse de nadie. Cada mensaje en el momento justo."
          visual={<CommunicationsMockup />}
        />
      </div>
    </section>
  );
}
