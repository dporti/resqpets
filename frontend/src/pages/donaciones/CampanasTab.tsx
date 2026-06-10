import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ErrorState } from '../../components/ui';
import { CampanaModal } from './CampanaModal';

interface Campaign {
  id: number; name: string; slug?: string; description_short?: string;
  goal_amount: number; raised_amount: number; status: string;
  starts_at?: string; ends_at?: string; is_public: boolean;
  primary_color: string; donations_count: string; cover_image_url?: string;
}

const STATUS = {
  active:    { label: '🟢 Activa',    bg: '#f0fdf4', color: '#16a34a' },
  draft:     { label: '📝 Borrador',  bg: '#eff6ff', color: '#3b82f6' },
  paused:    { label: '⏸ Pausada',    bg: '#fffbeb', color: '#d97706' },
  completed: { label: '✅ Finalizada', bg: '#f9fafb', color: '#6b7280' },
};

function fmt(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
function pct(v: number, g: number) { return g > 0 ? Math.min(100, Math.round((v / g) * 100)) : 0; }

export function CampanasTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; campaign?: Campaign }>({ open: false });
  const [detail, setDetail] = useState<Campaign & { donations?: unknown[]; evolution?: { dia: string; total: number }[] } | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    return api.get<Campaign[]>('/donations/campaigns').then(c => { setCampaigns(c); setLoading(false); }).catch(e => { console.error(e); setError(true); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/donations/campaigns/${id}`, { status });
    load();
  };

  const openDetail = async (id: number) => {
    const r = await api.get<Campaign & { donations: unknown[]; evolution: { dia: string; total: number }[] }>(`/donations/campaigns/${id}`);
    setDetail(r);
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {Array.from({length:3}).map((_,i)=><div key={i} style={{height:260,borderRadius:14,...sk}}/>)}
    </div>
  );

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setModal({ open: true })} style={{
          padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none',
          borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
        }}>+ Nueva campaña</button>
      </div>

      {campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <p style={{ fontSize: 48 }}>🎯</p>
          <p style={{ fontSize: 16 }}>No hay campañas aún</p>
          <p style={{ fontSize: 13 }}>Crea tu primera campaña para organizar tus donaciones</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {campaigns.map(c => {
          const p = pct(c.raised_amount, c.goal_amount);
          const st = STATUS[c.status as keyof typeof STATUS] || STATUS.draft;
          const daysLeft = c.ends_at ? Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000) : null;
          return (
            <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Cover */}
              <div style={{
                height: 100, flexShrink: 0,
                background: c.cover_image_url ? `url(${c.cover_image_url}) center/cover` : `linear-gradient(135deg, ${c.primary_color}, ${c.primary_color}88)`,
                position: 'relative',
              }}>
                <span style={{ position: 'absolute', top: 10, right: 10, background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {st.label}
                </span>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{c.name}</h3>
                {c.description_short && <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{c.description_short}</p>}

                {/* Progress */}
                {c.goal_amount > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{fmt(c.raised_amount)}</span>
                      <span style={{ color: '#6b7280' }}>de {fmt(c.goal_amount)} ({p}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${p}%`, height: '100%', background: c.primary_color, borderRadius: 4, transition: 'width .5s' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                  <span>💚 {c.donations_count} donaciones</span>
                  {daysLeft !== null && daysLeft > 0 && <span>⏱ {daysLeft} días restantes</span>}
                  {daysLeft !== null && daysLeft <= 0 && c.status === 'active' && <span style={{ color: '#ef4444' }}>⏰ Finalizada</span>}
                  {c.is_public && <span style={{ color: '#16a34a' }}>🌐 Pública</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button onClick={() => openDetail(c.id)} style={{ flex: 1, padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
                    📊 Ver detalle
                  </button>
                  <button onClick={() => setModal({ open: true, campaign: c })} style={{ flex: 1, padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
                    ✏️ Editar
                  </button>
                  {c.status === 'active' && (
                    <button onClick={() => updateStatus(c.id, 'paused')} style={{ padding: '7px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 8, cursor: 'pointer', fontSize: 11 }}>
                      ⏸ Pausar
                    </button>
                  )}
                  {c.status === 'paused' && (
                    <button onClick={() => updateStatus(c.id, 'active')} style={{ padding: '7px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 11 }}>
                      ▶ Activar
                    </button>
                  )}
                  {(c.status === 'active' || c.status === 'paused') && (
                    <button onClick={() => updateStatus(c.id, 'completed')} style={{ padding: '7px 12px', background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 11 }}>
                      ✅ Finalizar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <CampanaModal campaign={modal.campaign} onClose={() => setModal({ open: false })} onSaved={() => { load(); setModal({ open: false }); }} />
      )}

      {/* Detalle campaña */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
            <div style={{ height: 80, background: `linear-gradient(135deg, ${detail.primary_color}, ${detail.primary_color}88)` }} />
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{detail.name}</h2>
                <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { l: 'Recaudado', v: fmt(detail.raised_amount), color: detail.primary_color },
                  { l: 'Objetivo', v: fmt(detail.goal_amount) },
                  { l: 'Donaciones', v: String(detail.donations_count) },
                  { l: 'Progreso', v: `${pct(detail.raised_amount, detail.goal_amount)}%` },
                ].map(s => (
                  <div key={s.l} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.3px' }}>{s.l}</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color || '#111827' }}>{s.v}</p>
                  </div>
                ))}
              </div>
              {detail.slug && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>URL pública</p>
                  <code style={{ fontSize: 13, color: '#374151' }}>resqpet.com/donar/{detail.slug}</code>
                </div>
              )}
              {detail.description_short && <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{detail.description_short}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sk = { background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' };
