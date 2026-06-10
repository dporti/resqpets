import { useState } from 'react';
import { PLANS, PlanId, PLAN_ORDER, FEATURE_LABELS, getUnlockedFeatures, getLostFeatures, isPlanHigher } from '../../lib/billing/plans';
import { usePlan } from '../../lib/billing/PlanContext';
import { api } from '../../api/client';

// ── FEATURE TABLE DATA ────────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    label: 'Límites', rows: [
      { key: 'animals',     label: 'Animales',        type: 'limit' as const },
      { key: 'users',       label: 'Usuarios',         type: 'limit' as const },
      { key: 'storage_gb',  label: 'Almacenamiento',   type: 'limit_gb' as const },
    ],
  },
  {
    label: 'CRM principal', rows: [
      { key: 'animal_profiles', label: 'Fichas de animales', type: 'bool' as const },
      { key: 'adoptions',       label: 'Adopciones',          type: 'bool' as const },
      { key: 'foster_families', label: 'Acogidas',            type: 'bool' as const },
      { key: 'volunteers',      label: 'Voluntarios',         type: 'bool' as const },
      { key: 'calendar',        label: 'Calendario',          type: 'bool' as const },
      { key: 'reports',         label: 'Reportes',            type: 'value' as const },
    ],
  },
  {
    label: 'Portal público', rows: [
      { key: 'public_portal',    label: 'Portal adopciones',    type: 'bool' as const },
      { key: 'sos_pet',          label: 'SOS Pet',              type: 'bool' as const },
      { key: 'compatibility_test',label: 'Test compatibilidad', type: 'bool' as const },
      { key: 'success_wall',     label: 'Mural de éxitos',      type: 'bool' as const },
      { key: 'viral_challenges', label: 'Retos virales',        type: 'bool' as const },
      { key: 'virtual_tour_360', label: 'Tour virtual 360°',    type: 'bool' as const },
    ],
  },
  {
    label: '✨ Inteligencia Artificial', rows: [
      { key: 'ai_descriptions',  label: 'Descripciones con IA',     type: 'bool' as const },
      { key: 'animal_recognition',label: 'Reconocimiento facial',   type: 'bool' as const },
      { key: 'ai_assistant',     label: 'Asistente IA (Ctrl+K)',    type: 'bool' as const },
      { key: 'impact_report_pdf',label: 'Informe impacto PDF',      type: 'bool' as const },
    ],
  },
  {
    label: 'Donaciones', rows: [
      { key: 'basic_donations',  label: 'Donaciones básicas',   type: 'bool' as const },
      { key: 'virtual_sponsors', label: 'Padrinos virtuales',   type: 'bool' as const },
      { key: 'post_adoption_app',label: 'App post-adopción',    type: 'bool' as const },
    ],
  },
  {
    label: 'Comunicaciones', rows: [
      { key: 'email_notifications',label: 'Notificaciones email', type: 'bool' as const },
      { key: 'whatsapp',           label: 'WhatsApp Business',    type: 'bool' as const },
    ],
  },
  {
    label: 'Confianza y visibilidad', rows: [
      { key: 'verified_badge', label: 'Insignia verificada',    type: 'bool' as const },
      { key: 'vet_marketplace',label: 'Marketplace veterinario',type: 'bool' as const },
      { key: 'national_map',   label: 'Mapa nacional',          type: 'bool' as const },
      { key: 'vet_api',        label: 'API veterinaria',         type: 'bool' as const },
    ],
  },
  {
    label: 'Soporte', rows: [
      { key: 'support',         label: 'Tipo de soporte',     type: 'value' as const },
      { key: 'foster_insurance',label: 'Seguro para acogidas',type: 'bool' as const },
    ],
  },
];

const SUPPORT_LABEL: Record<string, string> = { email: 'Email', chat: 'Chat', priority: 'Prioritario', dedicated: 'Dedicado' };
const REPORT_LABEL: Record<string, string>  = { basic: 'Básico', advanced: 'Avanzado', full: 'Completo' };

function renderCell(plan: typeof PLANS[PlanId], rowKey: string, type: 'bool' | 'limit' | 'limit_gb' | 'value') {
  if (type === 'limit' || type === 'limit_gb') {
    const raw = (plan.limits as Record<string, number>)[rowKey];
    if (raw === undefined) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
    if (raw === -1) return <span style={{ color: '#16a34a', fontWeight: 700 }}>∞</span>;
    return <span style={{ fontWeight: 600 }}>{raw}{type === 'limit_gb' ? ' GB' : ''}</span>;
  }
  const val = (plan.features as Record<string, unknown>)[rowKey];
  if (type === 'bool') {
    return val === true
      ? <span style={{ color: '#16a34a', fontSize: 18 }}>✓</span>
      : <span style={{ color: 'var(--text-faint)', fontSize: 18 }}>—</span>;
  }
  // value
  if (rowKey === 'support') return <span style={{ fontSize: 12 }}>{SUPPORT_LABEL[val as string] || String(val)}</span>;
  if (rowKey === 'reports')  return <span style={{ fontSize: 12 }}>{REPORT_LABEL[val as string] || String(val)}</span>;
  return <span style={{ fontSize: 12 }}>{String(val)}</span>;
}

// ── UPGRADE / DOWNGRADE MODAL ─────────────────────────────────────────
function PlanChangeModal({
  from, to, onConfirm, onClose, saving,
}: {
  from: PlanId; to: PlanId; onConfirm: () => void; onClose: () => void; saving: boolean;
}) {
  const isUpgrade = isPlanHigher(to, from);
  const diff = isUpgrade ? getUnlockedFeatures(from, to) : getLostFeatures(from, to);
  const fromPlan = PLANS[from];
  const toPlan = PLANS[to];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,.25)',
      }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>
          {isUpgrade ? '🚀 Confirmar upgrade' : '⬇️ Confirmar cambio de plan'}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted)' }}>
          Pasas de <strong>{fromPlan.name}</strong> ({fromPlan.price === 0 ? 'Gratuito' : `${fromPlan.price.toFixed(2).replace('.', ',')}€/mes`}) a{' '}
          <strong>{toPlan.name}</strong> ({toPlan.price === 0 ? 'Gratuito' : `${toPlan.price.toFixed(2).replace('.', ',')}€/mes`})
        </p>

        {diff.length > 0 && (
          <div style={{
            background: isUpgrade ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isUpgrade ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 20,
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: isUpgrade ? '#16a34a' : '#ef4444' }}>
              {isUpgrade ? '✓ Funciones que se activan:' : '⚠️ Funciones que perderás:'}
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              {diff.slice(0, 8).map(f => (
                <li key={f} style={{ marginBottom: 2 }}>{FEATURE_LABELS[f as keyof typeof FEATURE_LABELS] || f}</li>
              ))}
              {diff.length > 8 && <li style={{ color: 'var(--text-faint)' }}>...y {diff.length - 8} más</li>}
            </ul>
          </div>
        )}

        {!isUpgrade && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
              ℹ️ El cambio se aplicará al final del período de facturación actual.
            </p>
          </div>
        )}

        <p style={{ margin: '0 0 20px', fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>
          TODO: Integrar Stripe Checkout para pago real. Por ahora el cambio es inmediato (modo demo).
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', background: 'var(--bg-subtle-2)', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>Cancelar</button>
          <button onClick={onConfirm} disabled={saving} style={{
            flex: 2, padding: '11px',
            background: isUpgrade ? '#16a34a' : '#ef4444',
            color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontWeight: 700, fontSize: 14, opacity: saving ? .7 : 1,
          }}>
            {saving ? 'Procesando...' : isUpgrade ? `Activar plan ${toPlan.name}` : `Cambiar a ${toPlan.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN TAB ──────────────────────────────────────────────────────────
export function BillingTab() {
  const { planId, plan, usage, limits, planExpiresAt, refreshPlan } = usePlan();
  const [annual, setAnnual] = useState(false);
  const [modal, setModal] = useState<{ to: PlanId } | null>(null);
  const [saving, setSaving] = useState(false);

  const confirmChange = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await api.put('/billing/plan', { plan_id: modal.to });
      refreshPlan();
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const usagePct = (current: number, max: number | -1) => (max as number) === -1 ? 0 : Math.min(100, Math.round((current / (max as number)) * 100));
  const barColor = (pct: number) => pct >= 95 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#16a34a';

  return (
    <div>
      {/* Current plan card */}
      <div style={{
        background: 'var(--bg-surface)', border: `2px solid ${plan.color}40`,
        borderRadius: 16, padding: '24px', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Plan {plan.name}</h2>
              <span style={{ background: plan.color + '20', color: plan.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                Activo
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
              {plan.price === 0 ? 'Gratuito' : `${plan.price.toFixed(2).replace('.', ',')}€/mes`}
              {planExpiresAt && ` · Renueva el ${new Date(planExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <button style={{
            padding: '9px 20px', border: '1.5px solid var(--border)', borderRadius: 9,
            background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
          }}>
            Gestionar facturación {/* TODO: Stripe portal */}
          </button>
        </div>

        {/* Usage bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Animales', current: usage.animals, max: limits.animals, unit: '' },
            { label: 'Usuarios', current: usage.users, max: limits.users, unit: '' },
            { label: 'Almacenamiento', current: usage.storage_gb, max: limits.storage_gb, unit: ' GB' },
          ].map(item => {
            const pct = usagePct(item.current, item.max);
            const color = barColor(pct);
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.current}{item.unit} {(item.max as number) === -1 ? '/ ∞' : `/ ${item.max}${item.unit}`}
                    {(item.max as number) !== -1 && <span style={{ color, marginLeft: 4 }}>({pct}%)</span>}
                  </span>
                </div>
                <div style={{ height: 7, background: 'var(--bg-subtle-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(item.max as number) === -1 ? 5 : pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle anual/mensual */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: annual ? 'var(--text-faint)' : 'var(--text-primary)', fontWeight: annual ? 400 : 700 }}>Mensual</span>
        <div onClick={() => setAnnual(!annual)} style={{
          width: 48, height: 26, borderRadius: 13, background: annual ? '#16a34a' : 'var(--border)',
          position: 'relative', cursor: 'pointer', transition: 'background .2s',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-surface)',
            position: 'absolute', top: 3, left: annual ? 25 : 3, transition: 'left .2s',
            boxShadow: '0 1px 3px rgba(0,0,0,.3)',
          }} />
        </div>
        <span style={{ fontSize: 14, color: annual ? 'var(--text-primary)' : 'var(--text-faint)', fontWeight: annual ? 700 : 400 }}>
          Anual <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>2 meses gratis</span>
        </span>
      </div>

      {/* Plan columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {PLAN_ORDER.map(pid => {
          const p = PLANS[pid];
          const isCurrent = pid === planId;
          const isHigher = isPlanHigher(pid, planId);
          const price = annual ? +(p.price * 10).toFixed(2) : p.price;
          return (
            <div key={pid} style={{
              border: `2px solid ${isCurrent ? p.color : 'var(--border)'}`,
              borderRadius: 14, padding: '20px 16px', textAlign: 'center',
              background: isCurrent ? p.color + '06' : 'var(--bg-surface)',
              position: 'relative',
            }}>
              {pid === 'pro' && !isCurrent && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>⭐ Recomendado</div>
              )}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: p.color, color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>Tu plan actual</div>
              )}
              <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 16, color: p.color }}>{p.name}</p>
              <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>
                {price === 0 ? 'Gratis' : `${price.toString().replace('.', ',')}€`}
              </p>
              {price > 0 && (
                <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--text-faint)' }}>/{annual ? 'año' : 'mes'}</p>
              )}
              <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.description}</p>
              <button
                disabled={isCurrent}
                onClick={() => !isCurrent && setModal({ to: pid })}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 9, cursor: isCurrent ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: isCurrent ? 'var(--bg-subtle-2)' : isHigher ? p.color : 'var(--bg-surface)',
                  color: isCurrent ? 'var(--text-faint)' : isHigher ? '#fff' : '#ef4444',
                  border: (isCurrent || isHigher) ? 'none' : '1.5px solid #fecaca',
                }}
              >
                {isCurrent ? 'Plan actual' : isHigher ? `Actualizar a ${p.name}` : `Cambiar a ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border)', width: '32%', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Característica
              </th>
              {PLAN_ORDER.map(pid => (
                <th key={pid} style={{
                  padding: '12px 8px', textAlign: 'center', fontWeight: 700,
                  background: pid === planId ? PLANS[pid].color + '10' : 'var(--bg-subtle)',
                  borderBottom: `2px solid ${pid === planId ? PLANS[pid].color : 'var(--border)'}`,
                  color: pid === planId ? PLANS[pid].color : 'var(--text-secondary)',
                  fontSize: 13,
                }}>
                  {PLANS[pid].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_GROUPS.map(group => (
              <>
                <tr key={group.label}>
                  <td colSpan={5} style={{
                    padding: '8px 16px', background: 'var(--bg-subtle-2)',
                    fontWeight: 700, fontSize: 11, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '.5px',
                  }}>
                    {group.label}
                  </td>
                </tr>
                {group.rows.map(row => (
                  <tr key={row.key}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {row.label}
                    </td>
                    {PLAN_ORDER.map(pid => (
                      <td key={pid} style={{
                        padding: '10px 8px', textAlign: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: pid === planId ? PLANS[pid].color + '06' : 'transparent',
                      }}>
                        {renderCell(PLANS[pid], row.key, row.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change modal */}
      {modal && (
        <PlanChangeModal
          from={planId}
          to={modal.to}
          onConfirm={confirmChange}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
