'use client';
import { Camera, MessageSquare, Wand2, FileText } from 'lucide-react';
import { useReveal } from './useReveal';

const AI_FEATURES = [
  {
    Icon: Camera,
    title: 'Reconocimiento facial de animales',
    body: 'Sube la foto de un rescate y el sistema compara automáticamente con todos los avisos SOS activos. Encuentra coincidencias en segundos, no días.',
    tag: 'Exclusivo · ningún CRM del sector lo tiene',
    visual: <FacialRecognitionVisual />,
  },
  {
    Icon: MessageSquare,
    title: 'Pregúntale al CRM en lenguaje natural',
    body: '¿Qué animales llevan más de 90 días? ¿Qué familias tienen plaza? Genera emails, informes y resúmenes con solo preguntar. Accede con Cmd+K.',
    tag: 'Disponible en todos los dispositivos',
    visual: <ChatVisual />,
  },
  {
    Icon: Wand2,
    title: 'Genera la ficha pública en 1 clic',
    body: 'El sistema toma la raza, edad, rasgos de comportamiento e historia del animal y genera un texto optimizado para el portal de adopciones.',
    tag: '50 generaciones/mes en plan Starter',
    visual: <TypewriterVisual />,
  },
  {
    Icon: FileText,
    title: 'Informe anual PDF en 30 segundos',
    body: 'El informe de impacto que antes tardabas días en preparar para solicitar subvenciones. Generado automáticamente con métricas reales.',
    tag: 'Diseño profesional incluido',
    visual: <PDFVisual />,
  },
];

function FacialRecognitionVisual() {
  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xl flex-shrink-0">🐕</div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1.5 bg-brand rounded-full" style={{width:'80%'}} />
        <div className="h-1.5 bg-[#2a2a2a] rounded-full" style={{width:'60%'}} />
        <div className="h-1.5 bg-[#2a2a2a] rounded-full" style={{width:'40%'}} />
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-brand/20 border border-brand/30 rounded-full flex-shrink-0">
        <span className="text-brand text-[10px] font-bold">92%</span>
      </div>
    </div>
  );
}
function ChatVisual() {
  return (
    <div className="mt-3 flex gap-2 items-end">
      <div className="bg-brand text-white text-[10px] rounded-xl rounded-br-sm px-3 py-1.5 flex-1">¿Qué familias tienen plaza disponible?</div>
      <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[10px] text-brand flex-shrink-0">✦</div>
    </div>
  );
}
function TypewriterVisual() {
  return (
    <div className="mt-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-[10px] text-[#888]">
      <p className="typewriter whitespace-nowrap overflow-hidden">Max es un Border Collie de 4 años, muy activo y cariñoso...</p>
    </div>
  );
}
function PDFVisual() {
  return (
    <div className="mt-3 w-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden flex-shrink-0">
      <div className="bg-brand h-4 flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">INFORME</span>
      </div>
      <div className="p-1.5 space-y-1">
        {[80,60,90,50,70].map((w,i)=><div key={i} className="h-1 bg-[#2a2a2a] rounded-full" style={{width:`${w}%`}} />)}
      </div>
    </div>
  );
}

export function AISection() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-28 bg-gradient-to-b from-[#0a0a0a] to-[#0d1a0f]" aria-labelledby="ai-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/25 rounded-full text-brand text-xs font-bold mb-6 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand pulse-glow" aria-hidden="true" />
            Inteligencia Artificial · Solo en ResQPet
          </div>
          <h2
            id="ai-heading"
            className={`font-serif text-section text-white mb-4 transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ transitionDelay: '80ms' }}
          >
            La IA que ningún otro
            <br />CRM para protectoras tiene.
          </h2>
          <p className={`text-lg text-[#666] transition-all duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '160ms' }}>
            Tecnología de última generación aplicada al sector del rescate animal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_FEATURES.map(({ Icon, title, body, tag, visual }, i) => {
            const { ref: cardRef, visible: cardVisible } = useReveal();
            return (
              <div key={title} ref={cardRef}
                className={`bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all duration-300 cursor-default ${cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: cardVisible ? `${i * 80}ms` : '0ms', transition: 'opacity 0.55s ease-out, transform 0.55s ease-out, border-color 0.3s' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white mb-1.5">{title}</h3>
                    <p className="text-sm text-[#777] leading-relaxed">{body}</p>
                  </div>
                </div>
                {visual}
                <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                  <span className="text-[10px] text-[#555] font-medium">{tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
