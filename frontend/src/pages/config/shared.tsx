import React, { useState } from 'react';

// ── CONFIG TYPE ────────────────────────────────────────────────────────
export interface ShelterConfig {
  // Config table
  adoption_fee: number; requires_home_visit: boolean; requires_interview: boolean;
  max_response_days: number; email_confirmation_text?: string;
  email_rejection_text?: string; email_approval_text?: string;
  requires_family_visit: boolean; max_foster_days: number;
  follow_up_frequency: string; karma_points_per_week: number;
  karma_bonus_adoption: number; foster_welcome_text?: string;
  goal_adoptions_monthly: number; goal_donations_monthly: number;
  goal_foster_families_monthly: number; goal_sos_resolved_monthly: number;
  max_capacity: number;
  alert_days_no_update: number; alert_capacity_percent: number;
  alert_donations_percent: number;
  stripe_publishable_key?: string; stripe_secret_key?: string; stripe_account_id?: string;
  resend_api_key?: string; resend_from_email?: string; resend_from_name?: string;
  donations_enabled: boolean; donation_amounts: number[];
  primary_color: string; crm_display_name?: string; interface_density: string;
}
export interface Refugio {
  id: number; nombre: string; email?: string; telefono?: string;
  direccion?: string; ciudad?: string; logo_url?: string; cover_url?: string;
  website?: string; instagram?: string; facebook?: string; slug?: string;
  description_public?: string;
}

// ── COLORS ────────────────────────────────────────────────────────────
export const PRESET_COLORS = [
  '#22c55e','#16a34a','#3b82f6','#2563eb',
  '#f97316','#ef4444','#8b5cf6','#ec4899',
  '#f59e0b','#0891b2','#111827','#374151',
];

// ── SAVE BUTTON ───────────────────────────────────────────────────────
export function SaveButton({ onSave, disabled }: { onSave: () => Promise<void>; disabled?: boolean }) {
  const [state, setState] = useState<'idle'|'saving'|'saved'>('idle');
  const handle = async () => {
    setState('saving');
    try { await onSave(); setState('saved'); setTimeout(() => setState('idle'), 2000); }
    catch { setState('idle'); }
  };
  return (
    <button onClick={handle} disabled={disabled || state === 'saving'} style={{
      padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
      background: state === 'saved' ? '#16a34a' : state === 'saving' ? '#9ca3af' : '#16a34a',
      color: '#fff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7,
      transition: 'background .2s',
    }}>
      {state === 'saving' ? '⏳ Guardando...' : state === 'saved' ? '✓ Guardado' : 'Guardar cambios'}
    </button>
  );
}

// ── SECTION CARD ──────────────────────────────────────────────────────
export function SectionCard({ title, description, children, danger }: {
  title: string; description?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div style={{
      background: danger ? '#fff5f5' : 'var(--bg-surface)',
      border: `1px solid ${danger ? '#fecaca' : 'var(--border)'}`,
      borderRadius: 14, padding: '24px', marginBottom: 20,
    }}>
      <div style={{ marginBottom: description ? 4 : 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: danger ? '#dc2626' : 'var(--text-primary)' }}>{title}</h3>
        {description && <p style={{ margin: '4px 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ── FIELD ─────────────────────────────────────────────────────────────
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ margin: '-2px 0 6px', fontSize: 11, color: 'var(--text-faint)' }}>{hint}</p>}
      {children}
    </div>
  );
}

// ── INPUT STYLES ──────────────────────────────────────────────────────
export const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};
export const inp2: React.CSSProperties = { ...inp, background: 'var(--bg-surface)' };

// ── TOGGLE ────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 42, height: 24, borderRadius: 12, background: checked ? '#16a34a' : 'var(--border)',
        position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-surface)',
          position: 'absolute', top: 3, left: checked ? 21 : 3, transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  );
}

// ── SECRET FIELD ──────────────────────────────────────────────────────
export function SecretField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'} style={{ ...inp, flex: 1 }} />
      <button onClick={() => setShow(!show)} style={{
        padding: '0 12px', border: '1.5px solid var(--border)', borderRadius: 8,
        background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
      }}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────
export function Skel({ h = 48, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w,
      background: 'linear-gradient(90deg,var(--bg-subtle-2) 25%,var(--bg-subtle-2) 50%,var(--bg-subtle-2) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 8,
    }} />
  );
}
