import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { SummaryTab } from './reportes/SummaryTab';
import { AnimalesTab } from './reportes/AnimalesTab';
import { AdopcionesTab } from './reportes/AdopcionesTab';
import { AcogidasTab } from './reportes/AcogidasTab';
import { SosPetTab } from './reportes/SosPetTab';
import { FinanzasTab } from './reportes/FinanzasTab';
import { ExportModal } from './reportes/ExportModal';
import { PERIODS, Period } from './reportes/shared';

const ALL_TABS = [
  { id: 'resumen',    label: '📊 Resumen',    component: SummaryTab },
  { id: 'animales',   label: '🐾 Animales',   component: AnimalesTab },
  { id: 'adopciones', label: '🏠 Adopciones', component: AdopcionesTab },
  { id: 'acogidas',   label: '❤️ Acogidas',   component: AcogidasTab },
  { id: 'sos',        label: '🚨 SOS Pet',    component: SosPetTab },
  { id: 'finanzas',   label: '💰 Finanzas',   component: FinanzasTab, permiso: 'finanzas:read' },
];

export default function ReportesPage() {
  const { user, can } = useAuth();
  const TABS = ALL_TABS.filter(t => !t.permiso || can(t.permiso));
  const [tab, setTab] = useState('resumen');
  const [period, setPeriod] = useState<Period>(PERIODS[0]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showExport, setShowExport] = useState(false);

  const activePeriod: Period = period.period === 'custom'
    ? { ...period, date_from: customFrom, date_to: customTo }
    : period;

  const ActiveTab = TABS.find(t => t.id === tab)?.component;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar titulo="Reportes" showNew={false} />

      {/* Header con controles */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 28px',
      }}>
        {/* Period selector + export */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 0', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Período:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PERIODS.map(p => (
                <button key={p.period} onClick={() => setPeriod(p)} style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                  border: '1.5px solid',
                  borderColor: period.period === p.period ? '#16a34a' : '#e5e7eb',
                  background: period.period === p.period ? '#f0fdf4' : '#fff',
                  color: period.period === p.period ? '#16a34a' : '#374151',
                  fontWeight: period.period === p.period ? 600 : 400,
                  transition: 'all .15s',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
            {period.period === 'custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
                <span style={{ color: '#9ca3af' }}>—</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
              </div>
            )}
          </div>

          <button onClick={() => setShowExport(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            ⬇️ Exportar informe
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#16a34a' : '#6b7280',
              borderBottom: tab === t.id ? '2.5px solid #16a34a' : '2.5px solid transparent',
              whiteSpace: 'nowrap', transition: 'all .15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px', maxWidth: 1400, margin: '0 auto' }}>
        {ActiveTab && <ActiveTab period={activePeriod} />}
      </div>

      {showExport && (
        <ExportModal
          period={activePeriod}
          refugioNombre={user?.refugioNombre || 'ResQPet'}
          onClose={() => setShowExport(false)}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
