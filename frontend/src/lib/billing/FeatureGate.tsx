import { ReactNode, useState } from 'react';
import { usePlan } from './PlanContext';
import { PlanFeatures, FEATURE_LABELS } from './plans';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  fallback?: 'hide' | 'blur' | 'upgrade-prompt';
  children: ReactNode;
  onUpgradeClick?: () => void;
}

export function FeatureGate({
  feature,
  fallback = 'upgrade-prompt',
  children,
  onUpgradeClick,
}: FeatureGateProps) {
  const { can, requiredPlanFor } = usePlan();

  if (can(feature)) return <>{children}</>;

  const required = requiredPlanFor(feature);
  const featureLabel = FEATURE_LABELS[feature] || feature;

  if (fallback === 'hide') return null;

  if (fallback === 'blur') {
    return (
      <div style={{ position: 'relative', userSelect: 'none' }}>
        <div style={{ filter: 'blur(3px)', pointerEvents: 'none', opacity: .6 }}>
          {children}
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,.6)',
        }}>
          <LockBadge planName={required?.name} featureLabel={featureLabel} onUpgradeClick={onUpgradeClick} />
        </div>
      </div>
    );
  }

  // upgrade-prompt (default)
  return (
    <UpgradePromptCard
      featureLabel={featureLabel}
      required={required}
      onUpgradeClick={onUpgradeClick}
    />
  );
}

// ── LOCK ICON (for inline/button use) ────────────────────────────────
export function LockBadge({
  planName,
  featureLabel,
  onUpgradeClick,
}: {
  planName?: string;
  featureLabel?: string;
  onUpgradeClick?: () => void;
}) {
  const [tooltip, setTooltip] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={onUpgradeClick}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        style={{
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8,
          padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: '#92400e', display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        🔒 {planName && <span style={{ fontSize: 11, opacity: .8 }}>Plan {planName}</span>}
      </button>
      {tooltip && planName && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: '#fff', fontSize: 11, padding: '5px 10px',
          borderRadius: 6, whiteSpace: 'nowrap', zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,.2)',
        }}>
          {featureLabel} requiere Plan {planName}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #111827',
          }} />
        </div>
      )}
    </div>
  );
}

// ── UPGRADE PROMPT CARD ───────────────────────────────────────────────
function UpgradePromptCard({
  featureLabel,
  required,
  onUpgradeClick,
}: {
  featureLabel: string;
  required?: { name: string; price: number; color: string };
  onUpgradeClick?: () => void;
}) {
  const color = required?.color || '#16a34a';
  return (
    <div style={{
      background: color + '08',
      border: `1.5px solid ${color}30`,
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#111827' }}>
          Función exclusiva del plan {required?.name || 'superior'}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          {featureLabel} está disponible{required ? ` desde el plan ${required.name} (${required.price.toFixed(2).replace('.', ',')}€/mes)` : ''}
        </p>
      </div>
      <button
        onClick={onUpgradeClick || (() => window.dispatchEvent(new CustomEvent('crm-navigate', { detail: { vista: 'configuracion' } })))}
        style={{
          padding: '8px 16px', background: color, color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Ver planes
      </button>
    </div>
  );
}
