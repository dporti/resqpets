import { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface Campaign { id: number; name: string }
interface Props {
  onClose: () => void;
  onCreated: (d: Record<string, unknown>) => void;
}

const CHANNELS = [
  { v: 'transfer', label: '🏦 Transferencia' },
  { v: 'bizum',    label: '📱 Bizum' },
  { v: 'cash',     label: '💵 Efectivo' },
  { v: 'other',    label: '🔷 Otro' },
];

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };

import React from 'react';

export function DonacionModal({ onClose, onCreated }: Props) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState('transfer');
  const [donationType, setDonationType] = useState('one_time');
  const [frequency, setFrequency] = useState('monthly');
  const [isAnon, setIsAnon] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorNif, setDonorNif] = useState('');
  const [concept, setConcept] = useState('');
  const [reference, setReference] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Campaign[]>('/donations/campaigns').then(c => setCampaigns(c.filter(x => x.status === 'active' || x.status === 'draft'))).catch(() => {});
  }, []);

  const submit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Introduce un importe válido'); return;
    }
    setLoading(true); setError('');
    try {
      const r = await api.post('/donations', {
        amount: parseFloat(amount),
        channel,
        donation_type: donationType,
        recurrence_frequency: donationType === 'recurring' ? frequency : undefined,
        is_anonymous: isAnon,
        donor_name: isAnon ? undefined : donorName || undefined,
        donor_email: isAnon ? undefined : donorEmail || undefined,
        donor_phone: isAnon ? undefined : donorPhone || undefined,
        donor_nif: isAnon ? undefined : donorNif || undefined,
        concept: concept || undefined,
        internal_reference: reference || undefined,
        campaign_id: campaignId ? parseInt(campaignId) : undefined,
        created_at: date,
      });
      onCreated(r as Record<string, unknown>);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,.25)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>💚 Registrar donación manual</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Importe y fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Importe (€) *</label>
              <input type="number" min="0.01" step="0.01" style={{ ...inp, fontSize: 20, fontWeight: 700, color: '#16a34a' }}
                value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={lbl}>Fecha de recepción</label>
              <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Canal */}
          <div>
            <label style={lbl}>Canal</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CHANNELS.map(c => (
                <button key={c.v} onClick={() => setChannel(c.v)} style={{
                  padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                  border: '1.5px solid', borderColor: channel === c.v ? '#16a34a' : '#e5e7eb',
                  background: channel === c.v ? '#f0fdf4' : '#fff', color: channel === c.v ? '#16a34a' : '#374151',
                  fontWeight: channel === c.v ? 700 : 400,
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'one_time', l: '💳 Única' }, { v: 'recurring', l: '🔄 Recurrente' }].map(t => (
                <button key={t.v} onClick={() => setDonationType(t.v)} style={{
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                  border: '1.5px solid', borderColor: donationType === t.v ? '#16a34a' : '#e5e7eb',
                  background: donationType === t.v ? '#f0fdf4' : '#fff', color: donationType === t.v ? '#16a34a' : '#374151',
                  fontWeight: donationType === t.v ? 700 : 400,
                }}>{t.l}</button>
              ))}
              {donationType === 'recurring' && (
                <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ ...inp, width: 'auto', padding: '6px 10px' }}>
                  <option value="monthly">Mensual</option>
                  <option value="annual">Anual</option>
                </select>
              )}
            </div>
          </div>

          {/* Donante */}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} style={{ accentColor: '#16a34a' }} />
            Donación anónima
          </label>

          {!isAnon && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Nombre</label><input style={inp} value={donorName} onChange={e => setDonorName(e.target.value)} /></div>
                <div><label style={lbl}>Email</label><input type="email" style={inp} value={donorEmail} onChange={e => setDonorEmail(e.target.value)} /></div>
                <div><label style={lbl}>Teléfono</label><input style={inp} value={donorPhone} onChange={e => setDonorPhone(e.target.value)} /></div>
                <div><label style={lbl}>NIF (para recibos)</label><input style={inp} value={donorNif} onChange={e => setDonorNif(e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Campaña y concepto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Campaña asociada</label>
              <select style={{ ...inp, background: '#fff' }} value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                <option value="">Sin campaña</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Referencia interna</label>
              <input style={inp} value={reference} onChange={e => setReference(e.target.value)} placeholder="Nº transferencia..." />
            </div>
          </div>
          <div>
            <label style={lbl}>Concepto / Notas</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} value={concept} onChange={e => setConcept(e.target.value)} placeholder="Descripción de la donación..." />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{error}</p>}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={submit} disabled={loading || !amount} style={{
            flex: 2, padding: '11px', background: loading || !amount ? '#d1d5db' : '#16a34a',
            color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            {loading ? '⏳ Registrando...' : '💚 Registrar donación'}
          </button>
        </div>
      </div>
    </div>
  );
}
