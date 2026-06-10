import { useState } from 'react';
import { SectionCard, SaveButton, Field, inp, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

interface Goal { label: string; key: keyof ShelterConfig; unit: string; icon: string; current?: number }

export function ObjetivosSection({ config, onSave }: Props) {
  const [adoptions, setAdoptions] = useState(config.goal_adoptions_monthly ?? 0);
  const [donations, setDonations] = useState(config.goal_donations_monthly ?? 0);
  const [foster, setFoster] = useState(config.goal_foster_families_monthly ?? 0);
  const [sos, setSos] = useState(config.goal_sos_resolved_monthly ?? 0);
  const [capacity, setCapacity] = useState(config.max_capacity ?? 50);

  const goals = [
    { label: 'Adopciones mensuales', val: adoptions, set: setAdoptions, unit: 'adopciones', icon: '🏠' },
    { label: 'Recaudación mensual', val: donations, set: setDonations, unit: '€', icon: '💝' },
    { label: 'Nuevas familias de acogida', val: foster, set: setFoster, unit: 'familias', icon: '❤️' },
    { label: 'Avisos SOS resueltos', val: sos, set: setSos, unit: 'avisos', icon: '✅' },
  ];

  return (
    <div>
      <SectionCard title="Objetivos mensuales" description="Estos valores se usan en el dashboard y en el módulo de Reportes para calcular el progreso">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {goals.map(g => (
            <div key={g.label} style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{g.label}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min={0} value={g.val} onChange={e => g.set(Number(e.target.value))}
                  style={{ ...inp, width: 90, textAlign: 'right' }} />
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{g.unit}/mes</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Capacidad del refugio" description="Número máximo de animales que puede albergar. Se usa en el gráfico de evolución de capacidad en Reportes.">
        <Field label="Capacidad máxima (animales)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 200 }}>
            <input type="number" min={1} max={9999} style={inp} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
            <span style={{ fontSize: 13, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>animales</span>
          </div>
        </Field>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onSave={() => onSave({
          goal_adoptions_monthly: adoptions, goal_donations_monthly: donations,
          goal_foster_families_monthly: foster, goal_sos_resolved_monthly: sos,
          max_capacity: capacity,
        })} />
      </div>
    </div>
  );
}
