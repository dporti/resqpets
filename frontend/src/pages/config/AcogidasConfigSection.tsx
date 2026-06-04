import { useState } from 'react';
import { SectionCard, SaveButton, Toggle, Field, inp, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

export function AcogidasConfigSection({ config, onSave }: Props) {
  const [familyVisit, setFamilyVisit] = useState(config.requires_family_visit);
  const [maxDays, setMaxDays] = useState(config.max_foster_days ?? 90);
  const [freq, setFreq] = useState(config.follow_up_frequency || 'weekly');
  const [kpw, setKpw] = useState(config.karma_points_per_week ?? 1);
  const [kba, setKba] = useState(config.karma_bonus_adoption ?? 10);
  const [welcome, setWelcome] = useState(config.foster_welcome_text || '');

  return (
    <div>
      <SectionCard title="Proceso de acogida">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Requiere visita previa a la familia</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Un coordinador visita el hogar antes de asignar un animal</p>
          </div>
          <Toggle checked={familyVisit} onChange={setFamilyVisit} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Duración máxima recomendada (días)">
            <input type="number" min={1} max={730} style={inp} value={maxDays} onChange={e => setMaxDays(Number(e.target.value))} />
          </Field>
          <Field label="Frecuencia de contacto de seguimiento">
            <select style={{ ...inp, background: '#fff' }} value={freq} onChange={e => setFreq(e.target.value)}>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Sistema de karma" description="Puntos otorgados automáticamente a las familias de acogida">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Puntos por semana de acogida activa" hint="Default: 1 punto / semana">
            <input type="number" min={0} max={100} style={inp} value={kpw} onChange={e => setKpw(Number(e.target.value))} />
          </Field>
          <Field label="Bonus karma si el animal es adoptado desde el hogar" hint="Default: +10 puntos">
            <input type="number" min={0} max={200} style={inp} value={kba} onChange={e => setKba(Number(e.target.value))} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Email de bienvenida" description="Se envía a las nuevas familias al confirmar su primera acogida">
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }}
          value={welcome} onChange={e => setWelcome(e.target.value)}
          placeholder="Bienvenida a la familia ResQPet. Gracias por abrir tu hogar..." />
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onSave={() => onSave({
          requires_family_visit: familyVisit, max_foster_days: maxDays,
          follow_up_frequency: freq, karma_points_per_week: kpw,
          karma_bonus_adoption: kba, foster_welcome_text: welcome,
        })} />
      </div>
    </div>
  );
}
