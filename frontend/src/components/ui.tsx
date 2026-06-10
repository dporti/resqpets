import React from 'react';

// ── BADGE ──────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  en_acogida:    { label: 'En acogida',    bg: '#dcfce7', color: '#16a34a' },
  en_residencia: { label: 'En residencia', bg: '#dbeafe', color: '#2563eb' },
  en_adopcion:   { label: 'En adopción',   bg: '#f3e8ff', color: '#9333ea' },
  en_proceso:    { label: 'En proceso',    bg: '#e0e7ff', color: '#4338ca' },
  en_evaluacion: { label: 'En evaluación', bg: '#fef9c3', color: '#b45309' },
  fallecido:     { label: 'Fallecido',     bg: '#f3f4f6', color: '#9ca3af' },
};

export function Badge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
}

// ── ROL BADGE ──────────────────────────────────────────
const ROL_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  admin:       { label: 'Admin',       bg: '#fee2e2', color: '#dc2626' },
  coordinador: { label: 'Coordinador', bg: '#dbeafe', color: '#2563eb' },
  voluntario:  { label: 'Voluntario',  bg: '#dcfce7', color: '#16a34a' },
};

export function RolBadge({ rol }: { rol: string }) {
  const cfg = ROL_CONFIG[rol] || { label: rol, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600,
    }}>{cfg.label}</span>
  );
}

// ── ANIMAL AVATAR ──────────────────────────────────────
const ESPECIE_EMOJI: Record<string, string> = { perro: '🐕', gato: '🐈', otro: '🐾' };
const AVATAR_COLORS = ['#dcfce7', '#dbeafe', '#f3e8ff', '#fef9c3', '#fee2e2', '#e0e7ff'];

export function AnimalAvatar({ especie, id, size = 40 }: { especie: string; id: number; size?: number }) {
  const bg = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, flexShrink: 0,
    }}>
      {ESPECIE_EMOJI[especie] || '🐾'}
    </div>
  );
}

// ── SPINNER ────────────────────────────────────────────
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, border: `${size * 0.1}px solid #e5e7eb`,
      borderTop: `${size * 0.1}px solid #16a34a`, borderRadius: '50%',
      animation: 'resqpet-spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes resqpet-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── EMPTY STATE ────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 64, color: '#9ca3af', gap: 12,
    }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}

// ── ERROR STATE ────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 64, color: '#9ca3af', gap: 12,
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Error al cargar los datos</div>
      {message && <div style={{ fontSize: 13 }}>{message}</div>}
      {onRetry && (
        <button onClick={onRetry} style={{
          marginTop: 4, padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}>Reintentar</button>
      )}
    </div>
  );
}

// ── SKELETON LIST ──────────────────────────────────────
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
      <style>{`@keyframes resqpet-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{
          height: 48, borderRadius: 8, background: '#f3f4f6',
          animation: 'resqpet-pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
    </div>
  );
}

// ── CARD ───────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

// ── CARD HEADER ────────────────────────────────────────
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{title}</span>
      {action}
    </div>
  );
}

// ── DOTS BAR ───────────────────────────────────────────
export function DotsBar({ value, val, max = 5 }: { value?: number; val?: number; max?: number }) {
  const v = value ?? val ?? 0;
  if (v === 0) return <span style={{ fontSize: 12, color: '#9ca3af' }}>No testado</span>;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: 2,
          background: i < v ? '#16a34a' : '#e5e7eb',
        }} />
      ))}
    </div>
  );
}

// ── FORMAT HELPERS ─────────────────────────────────────
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays}d`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
