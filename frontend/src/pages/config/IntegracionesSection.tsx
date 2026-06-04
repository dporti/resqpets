import { useState } from 'react';
import { SectionCard, SaveButton, Toggle, Field, SecretField, inp, ShelterConfig } from './shared';

interface Props { config: ShelterConfig; onSave: (d: Partial<ShelterConfig>) => Promise<void> }

export function IntegracionesSection({ config, onSave }: Props) {
  const [stripePub, setStripePub] = useState(config.stripe_publishable_key || '');
  const [stripeSecret, setStripeSecret] = useState(config.stripe_secret_key || '');
  const [donEnabled, setDonEnabled] = useState(config.donations_enabled);
  const [amounts, setAmounts] = useState<number[]>(config.donation_amounts || [5, 10, 25, 50]);
  const [newAmt, setNewAmt] = useState('');

  const [resendKey, setResendKey] = useState(config.resend_api_key || '');
  const [resendFrom, setResendFrom] = useState(config.resend_from_email || '');
  const [resendName, setResendName] = useState(config.resend_from_name || '');
  const [testSending, setTestSending] = useState(false);

  const addAmount = () => {
    const n = parseInt(newAmt, 10);
    if (n > 0 && !amounts.includes(n)) setAmounts(prev => [...prev, n].sort((a, b) => a - b));
    setNewAmt('');
  };

  const sendTestEmail = async () => {
    setTestSending(true);
    setTimeout(() => { setTestSending(false); alert('Email de prueba enviado (simulado)'); }, 1500);
  };

  const isStripeConnected = !!(stripePub && stripeSecret);
  const isResendConnected = !!resendKey;

  return (
    <div>
      {/* Stripe */}
      <SectionCard title="💳 Stripe — Donaciones online">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: isStripeConnected ? '#f0fdf4' : '#f9fafb',
            color: isStripeConnected ? '#16a34a' : '#9ca3af',
            border: `1px solid ${isStripeConnected ? '#bbf7d0' : '#e5e7eb'}`,
          }}>
            {isStripeConnected ? '● Configurado' : '○ No configurado'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Field label="Publishable Key">
            <input style={inp} value={stripePub} onChange={e => setStripePub(e.target.value)} placeholder="pk_live_..." />
          </Field>
          <Field label="Secret Key">
            <SecretField value={stripeSecret} onChange={setStripeSecret} placeholder="sk_live_..." />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: '#374151' }}>Mostrar botón de donación en el portal público</span>
          <Toggle checked={donEnabled} onChange={setDonEnabled} />
        </div>
        <Field label="Importes predefinidos del widget (€)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {amounts.map(a => (
              <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {a}€
                <button onClick={() => setAmounts(prev => prev.filter(x => x !== a))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" min={1} value={newAmt} onChange={e => setNewAmt(e.target.value)} style={{ width: 70, padding: '4px 8px', borderRadius: 20, border: '1.5px solid #e5e7eb', fontSize: 12 }} placeholder="€" />
              <button onClick={addAmount} style={{ padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, cursor: 'pointer', fontSize: 12 }}>+ Añadir</button>
            </div>
          </div>
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton onSave={() => onSave({ stripe_publishable_key: stripePub, stripe_secret_key: stripeSecret, donations_enabled: donEnabled, donation_amounts: amounts })} />
        </div>
      </SectionCard>

      {/* Resend */}
      <SectionCard title="📧 Email transaccional — Resend">
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>
          Actualmente se usa Supabase Auth para los emails de sistema. Configura Resend para usar tu propio dominio.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: isResendConnected ? '#f0fdf4' : '#f9fafb',
            color: isResendConnected ? '#16a34a' : '#9ca3af',
            border: `1px solid ${isResendConnected ? '#bbf7d0' : '#e5e7eb'}`,
          }}>
            {isResendConnected ? '● Configurado' : '○ No configurado'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Field label="API Key de Resend">
            <SecretField value={resendKey} onChange={setResendKey} placeholder="re_..." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Email remitente">
              <input style={inp} type="email" value={resendFrom} onChange={e => setResendFrom(e.target.value)} placeholder="hola@tuprotectora.org" />
            </Field>
            <Field label="Nombre remitente">
              <input style={inp} value={resendName} onChange={e => setResendName(e.target.value)} placeholder="Huella Viva" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={sendTestEmail} disabled={testSending || !resendKey} style={{
            padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 9, background: '#fff',
            cursor: resendKey ? 'pointer' : 'not-allowed', fontSize: 13, color: '#374151',
          }}>
            {testSending ? '⏳ Enviando...' : '📧 Enviar email de prueba'}
          </button>
          <SaveButton onSave={() => onSave({ resend_api_key: resendKey, resend_from_email: resendFrom, resend_from_name: resendName })} />
        </div>
      </SectionCard>

      {/* Google Calendar */}
      <SectionCard title="📅 Google Calendar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
            ○ No conectado
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
          Sincroniza los eventos del CRM con tu Google Calendar para que el equipo los vea en su calendario personal.
        </p>
        <button style={{ padding: '9px 18px', background: '#4285f4', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          🔗 Conectar Google Calendar
        </button>
      </SectionCard>

      {/* WhatsApp */}
      <SectionCard title="💬 WhatsApp Business">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: '#fef9c3', color: '#92400e', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Próximamente</span>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '10px 0' }}>
          Envía notificaciones automáticas por WhatsApp a adoptantes y familias de acogida: confirmaciones, recordatorios de citas veterinarias, actualizaciones de solicitudes.
        </p>
        <button style={{ padding: '9px 18px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          📋 Unirse a la lista de espera
        </button>
      </SectionCard>
    </div>
  );
}
