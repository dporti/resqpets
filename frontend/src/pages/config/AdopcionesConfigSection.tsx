import { useState } from 'react';
import { SectionCard, SaveButton, Toggle, Field, inp, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

export function AdopcionesConfigSection({ config, onSave }: Props) {
  const [fee, setFee] = useState(config.adoption_fee ?? 0);
  const [homeVisit, setHomeVisit] = useState(config.requires_home_visit);
  const [interview, setInterview] = useState(config.requires_interview);
  const [days, setDays] = useState(config.max_response_days ?? 7);
  const [confirmText, setConfirmText] = useState(config.email_confirmation_text || '');
  const [rejectText, setRejectText] = useState(config.email_rejection_text || '');
  const [approveText, setApproveText] = useState(config.email_approval_text || '');

  const VARS = ['{{nombre_animal}}', '{{nombre_adoptante}}', '{{nombre_protectora}}'];

  return (
    <div>
      <SectionCard title="Proceso de adopción">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
          <Field label="Cuota de adopción (€)" hint="0 = adopción gratuita">
            <input type="number" min={0} style={inp} value={fee} onChange={e => setFee(Number(e.target.value))} />
          </Field>
          <Field label="Tiempo máximo de respuesta (días)" hint="Se muestra en el portal público">
            <input type="number" min={1} max={60} style={inp} value={days} onChange={e => setDays(Number(e.target.value))} />
          </Field>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>Requiere visita al hogar</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Un coordinador visita la vivienda del adoptante antes de aprobar</p>
            </div>
            <Toggle checked={homeVisit} onChange={setHomeVisit} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>Requiere entrevista</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Entrevista telefónica o presencial antes de aprobar</p>
            </div>
            <Toggle checked={interview} onChange={setInterview} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Textos de email" description={`Variables disponibles: ${VARS.join(', ')}`}>
        {[
          { label: 'Email de confirmación de solicitud', val: confirmText, set: setConfirmText, ph: 'Hola {{nombre_adoptante}}, hemos recibido tu solicitud para adoptar a {{nombre_animal}}...' },
          { label: 'Email de rechazo', val: rejectText, set: setRejectText, ph: 'Lamentamos comunicarte que tu solicitud para {{nombre_animal}} no ha sido aprobada...' },
          { label: 'Email de aprobación', val: approveText, set: setApproveText, ph: '¡Enhorabuena! Tu solicitud para adoptar a {{nombre_animal}} ha sido aprobada...' },
        ].map(row => (
          <Field key={row.label} label={row.label}>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
              value={row.val} onChange={e => row.set(e.target.value)} placeholder={row.ph} />
          </Field>
        ))}
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onSave={() => onSave({
          adoption_fee: fee, requires_home_visit: homeVisit, requires_interview: interview,
          max_response_days: days, email_confirmation_text: confirmText,
          email_rejection_text: rejectText, email_approval_text: approveText,
        })} />
      </div>
    </div>
  );
}
