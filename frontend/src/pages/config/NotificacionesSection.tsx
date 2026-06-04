import { useState } from 'react';
import { SectionCard, SaveButton, Toggle, Field, inp, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

interface NotifPrefs {
  app_sos: boolean; app_adoption: boolean; app_task: boolean;
  app_task_overdue: boolean; app_message: boolean; app_no_update: boolean;
  email_sos: boolean; email_adoption: boolean; email_task: boolean;
  email_frequency: string; email_alt: string;
}

const DEFAULT_PREFS: NotifPrefs = {
  app_sos: true, app_adoption: true, app_task: true,
  app_task_overdue: true, app_message: true, app_no_update: true,
  email_sos: true, email_adoption: true, email_task: false,
  email_frequency: 'immediate', email_alt: '',
};

export function NotificacionesSection({ config, onSave }: Props) {
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('resqpet_notif_prefs') || '{}') }; }
    catch { return DEFAULT_PREFS; }
  });
  const [alertDays, setAlertDays] = useState(config.alert_days_no_update);
  const [alertCap, setAlertCap] = useState(config.alert_capacity_percent);
  const [alertDon, setAlertDon] = useState(config.alert_donations_percent);

  const set = (k: keyof NotifPrefs, v: boolean | string) =>
    setPrefs(p => { const n = { ...p, [k]: v }; localStorage.setItem('resqpet_notif_prefs', JSON.stringify(n)); return n; });

  return (
    <div>
      <SectionCard title="Notificaciones en la app" description="Qué eventos generan notificaciones dentro del CRM">
        {[
          { k: 'app_sos' as const,         label: 'Nuevo aviso SOS en mi zona' },
          { k: 'app_adoption' as const,    label: 'Nueva solicitud de adopción' },
          { k: 'app_task' as const,        label: 'Tarea asignada a mí' },
          { k: 'app_task_overdue' as const,label: 'Tarea vencida' },
          { k: 'app_message' as const,     label: 'Nuevo mensaje recibido' },
          { k: 'app_no_update' as const,   label: `Animal sin actualización en más de ${alertDays} días` },
        ].map(row => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#374151' }}>{row.label}</span>
            <Toggle checked={prefs[row.k] as boolean} onChange={v => set(row.k, v)} />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Notificaciones por email">
        {[
          { k: 'email_sos' as const,      label: 'Nuevo aviso SOS' },
          { k: 'email_adoption' as const, label: 'Nueva solicitud de adopción' },
          { k: 'email_task' as const,     label: 'Tarea asignada a mí' },
        ].map(row => (
          <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#374151' }}>{row.label}</span>
            <Toggle checked={prefs[row.k] as boolean} onChange={v => set(row.k, v)} />
          </div>
        ))}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Frecuencia de resumen">
            <select value={prefs.email_frequency} onChange={e => set('email_frequency', e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="immediate">Inmediata</option>
              <option value="daily">Diaria (resumen)</option>
              <option value="weekly">Semanal</option>
              <option value="never">Nunca</option>
            </select>
          </Field>
          <Field label="Email alternativo (opcional)">
            <input type="email" style={inp} value={prefs.email_alt} onChange={e => set('email_alt', e.target.value)} placeholder="otro@email.com" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Alertas automáticas del sistema" description="Umbrales que activan alertas visibles en el dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Días sin actualización del animal">
            <input type="number" min={1} max={365} style={inp} value={alertDays} onChange={e => setAlertDays(Number(e.target.value))} />
          </Field>
          <Field label="% capacidad para alertar">
            <input type="number" min={1} max={100} style={inp} value={alertCap} onChange={e => setAlertCap(Number(e.target.value))} />
          </Field>
          <Field label="% donaciones bajo objetivo">
            <input type="number" min={1} max={100} style={inp} value={alertDon} onChange={e => setAlertDon(Number(e.target.value))} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <SaveButton onSave={() => onSave({ alert_days_no_update: alertDays, alert_capacity_percent: alertCap, alert_donations_percent: alertDon })} />
        </div>
      </SectionCard>
    </div>
  );
}
