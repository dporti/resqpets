import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { DonacionModal } from './DonacionModal';
import { generateReceipt } from './ReceiptGenerator';

interface Donation {
  id: number; amount: number; channel: string; donation_type: string;
  status: string; campaign_name?: string; campaign_color?: string;
  is_anonymous: boolean; donor_name?: string; donor_email?: string;
  concept?: string; internal_reference?: string; receipt_number?: string;
  registered_by_nombre?: string; created_at: string;
}
interface Donor {
  id: number; name: string; email: string; total_donated: number;
  donations_count: number; is_recurring: boolean; last_donation_at: string;
}
interface Campaign { id: number; name: string }

const CHANNEL_ICON: Record<string, string> = { transfer: '🏦', cash: '💵', bizum: '📱', stripe: '💳', other: '🔷' };
const CHANNEL_LABEL: Record<string, string> = { transfer: 'Transferencia', cash: 'Efectivo', bizum: 'Bizum', stripe: 'Online', other: 'Otro' };
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#f0fdf4', color: '#16a34a' },
  pending: { bg: '#fffbeb', color: '#d97706' },
  refunded: { bg: '#fef2f2', color: '#ef4444' },
};
function fmt(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }

export function HistorialTab({ shelterName }: { shelterName: string }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showDonors, setShowDonors] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs: Record<string, string | number> = { page, limit: 25 };
      if (search) qs.search = search;
      if (filterChannel) qs.channel = filterChannel;
      if (filterType) qs.type = filterType;
      if (filterStatus) qs.status = filterStatus;
      if (filterCampaign) qs.campaign = filterCampaign;
      const params = new URLSearchParams(Object.entries(qs).map(([k, v]) => [k, String(v)])).toString();
      const r = await api.get<{ data: Donation[]; total: number; total_amount: number; pages: number }>(`/donations?${params}`);
      setDonations(r.data); setTotal(r.total); setTotalAmount(r.total_amount); setPages(r.pages);
    } finally { setLoading(false); }
  }, [page, search, filterChannel, filterType, filterStatus, filterCampaign]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get<Campaign[]>('/donations/campaigns').then(setCampaigns).catch(() => {});
  }, []);

  const exportCSV = () => {
    const header = ['Fecha','Donante','Importe','Canal','Tipo','Campaña','Estado','Concepto','Referencia'];
    const rows = donations.map(d => [
      new Date(d.created_at).toLocaleDateString('es-ES'),
      d.is_anonymous ? 'Anónimo' : (d.donor_name || ''),
      d.amount.toFixed(2),
      CHANNEL_LABEL[d.channel] || d.channel,
      d.donation_type === 'recurring' ? 'Recurrente' : 'Única',
      d.campaign_name || '',
      d.status,
      d.concept || '',
      d.internal_reference || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv);
    a.download = `donaciones_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const loadDonors = async () => {
    const r = await api.get<Donor[]>('/donations/donors');
    setDonors(r); setShowDonors(true);
  };

  const handleReceipt = (d: Donation) => {
    generateReceipt({
      receiptNumber: d.receipt_number || `REC-${new Date().getFullYear()}-${d.id}`,
      date: d.created_at,
      amount: d.amount,
      donorName: d.is_anonymous ? undefined : d.donor_name,
      shelterName,
      concept: d.concept || undefined,
    });
  };

  const inp: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, background: '#fff' };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input style={{ ...inp, minWidth: 200 }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Buscar donante o concepto..." />
        <select style={inp} value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1); }}>
          <option value="">Todos los canales</option>
          {Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={inp} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">Todos los tipos</option>
          <option value="one_time">Única</option>
          <option value="recurring">Recurrente</option>
        </select>
        <select style={inp} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmada</option>
          <option value="pending">Pendiente</option>
          <option value="refunded">Reembolsada</option>
        </select>
        <select style={inp} value={filterCampaign} onChange={e => { setFilterCampaign(e.target.value); setPage(1); }}>
          <option value="">Todas las campañas</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={loadDonors} style={{ padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>👥 Ver donantes</button>
          <button onClick={exportCSV} style={{ padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>⬇️ CSV</button>
          <button onClick={() => setShowNew(true)} style={{ padding: '7px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Registrar donación</button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Fecha','Donante','Importe','Canal','Tipo','Campaña','Estado','Acciones'].map(h =>
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:5}).map((_,i) => <tr key={i}><td colSpan={8} style={{padding:'12px 14px'}}><div style={{height:20,borderRadius:4,...sk}}/></td></tr>)
                : donations.map(d => (
                  <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDonation(d)}>
                    <td style={td}>{new Date(d.created_at).toLocaleDateString('es-ES')}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                          {(d.is_anonymous ? 'A' : d.donor_name?.[0] || '?')}
                        </div>
                        <span style={{ fontWeight: 500 }}>{d.is_anonymous ? 'Anónimo' : (d.donor_name || '—')}</span>
                      </div>
                    </td>
                    <td style={{ ...td, fontWeight: 800, color: '#16a34a', fontSize: 15 }}>{fmt(d.amount)}</td>
                    <td style={td}>{CHANNEL_ICON[d.channel]} {CHANNEL_LABEL[d.channel] || d.channel}</td>
                    <td style={td}>{d.donation_type === 'recurring' ? '🔄 Recurrente' : '💳 Única'}</td>
                    <td style={td}>
                      {d.campaign_name && (
                        <span style={{ background: (d.campaign_color || '#16a34a') + '20', color: d.campaign_color || '#16a34a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{d.campaign_name}</span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ background: STATUS_STYLE[d.status]?.bg, color: STATUS_STYLE[d.status]?.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {d.status === 'confirmed' ? '✓ Confirmada' : d.status === 'pending' ? '⏳ Pendiente' : '↩ Reembolsada'}
                      </span>
                    </td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleReceipt(d)} style={{ padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11 }}>
                        📄 Recibo
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 700, color: '#374151', borderTop: '1px solid #e5e7eb' }}>Total mostrado:</td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: '#16a34a', fontSize: 15, borderTop: '1px solid #e5e7eb' }}>{fmt(totalAmount)}</td>
                <td colSpan={5} style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 12, borderTop: '1px solid #e5e7eb' }}>{total} donaciones</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {[...Array(Math.min(pages, 7))].map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)} style={{
                padding: '7px 13px', borderRadius: 8, border: '1.5px solid',
                borderColor: page === p ? '#16a34a' : '#e5e7eb',
                background: page === p ? '#16a34a' : '#fff',
                color: page === p ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 400,
              }}>{p}</button>
            );
          })}
        </div>
      )}

      {/* Modal nueva donación */}
      {showNew && <DonacionModal onClose={() => setShowNew(false)} onCreated={() => load()} />}

      {/* Modal detalle donación */}
      {selectedDonation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDonation(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Detalle de donación</h3>
              <button onClick={() => setSelectedDonation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 40, fontWeight: 900, color: '#16a34a', margin: 0 }}>{fmt(selectedDonation.amount)}</p>
            </div>
            {[
              ['Donante', selectedDonation.is_anonymous ? 'Anónimo' : selectedDonation.donor_name || '—'],
              ['Canal', CHANNEL_LABEL[selectedDonation.channel] || selectedDonation.channel],
              ['Tipo', selectedDonation.donation_type === 'recurring' ? 'Recurrente' : 'Única'],
              ['Fecha', new Date(selectedDonation.created_at).toLocaleDateString('es-ES')],
              ['Estado', selectedDonation.status],
              ['Recibo', selectedDonation.receipt_number || '—'],
              ['Campaña', selectedDonation.campaign_name || '—'],
              ['Concepto', selectedDonation.concept || '—'],
              ['Referencia', selectedDonation.internal_reference || '—'],
              ['Registrado por', selectedDonation.registered_by_nombre || 'Sistema'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ fontWeight: 500, color: '#111827' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => handleReceipt(selectedDonation)} style={{ flex: 1, padding: '10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                📄 Emitir recibo PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donantes panel */}
      {showDonors && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDonors(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>👥 Directorio de donantes ({donors.length})</h3>
              <button onClick={() => setShowDonors(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['Donante','Total donado','Donaciones','¿Recurrente?','Última donación'].map(h =>
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 11 }}>{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {donors.map(d => (
                    <tr key={d.id}>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{d.name?.[0] || '?'}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>{d.name || '—'}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 800, color: '#16a34a' }}>{fmt(d.total_donated)}</td>
                      <td style={td}>{d.donations_count}</td>
                      <td style={td}>{d.is_recurring ? <span style={{ color: '#16a34a', fontWeight: 700 }}>🔄 Sí</span> : '—'}</td>
                      <td style={{ ...td, color: '#6b7280' }}>{d.last_donation_at ? new Date(d.last_donation_at).toLocaleDateString('es-ES') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#374151' };
const sk = { background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' };
