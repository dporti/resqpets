import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ShelterConfig, Refugio, Skel } from './config/shared';
import { ErrorState } from '../components/ui';
import { PerfilSection } from './config/PerfilSection';
import { EquipoSection } from './config/EquipoSection';
import { NotificacionesSection } from './config/NotificacionesSection';
import { AdopcionesConfigSection } from './config/AdopcionesConfigSection';
import { AcogidasConfigSection } from './config/AcogidasConfigSection';
import { ObjetivosSection } from './config/ObjetivosSection';
import { IntegracionesSection } from './config/IntegracionesSection';
import { AparienciaSection } from './config/AparienciaSection';
import { DatosSection } from './config/DatosSection';
import { PlanSection } from './config/PlanSection';
import { BillingTab } from './config/BillingTab';

const SECTIONS = [
  { id: 'perfil',        icon: '🏠', label: 'Perfil de la Protectora' },
  { id: 'equipo',        icon: '👥', label: 'Equipo y Permisos' },
  { id: 'notificaciones',icon: '🔔', label: 'Notificaciones' },
  { id: 'adopciones',    icon: '❤️', label: 'Adopciones' },
  { id: 'acogidas',      icon: '🏡', label: 'Acogidas' },
  { id: 'objetivos',     icon: '🎯', label: 'Objetivos y KPIs' },
  { id: 'integraciones', icon: '🔗', label: 'Integraciones' },
  { id: 'apariencia',    icon: '🎨', label: 'Apariencia' },
  { id: 'datos',         icon: '🗄️', label: 'Datos y Privacidad' },
  { id: 'facturacion',   icon: '💳', label: 'Plan y Facturación' },
];

interface ConfigData { config: ShelterConfig; refugio: Refugio; stats: Record<string, string> }

const DEFAULT_CONFIG: ShelterConfig = {
  adoption_fee: 0, requires_home_visit: false, requires_interview: true,
  max_response_days: 7, requires_family_visit: false, max_foster_days: 90,
  follow_up_frequency: 'weekly', karma_points_per_week: 1, karma_bonus_adoption: 10,
  goal_adoptions_monthly: 0, goal_donations_monthly: 0,
  goal_foster_families_monthly: 0, goal_sos_resolved_monthly: 0, max_capacity: 50,
  alert_days_no_update: 30, alert_capacity_percent: 80, alert_donations_percent: 30,
  donations_enabled: false, donation_amounts: [5, 10, 25, 50],
  primary_color: '#22c55e', interface_density: 'normal',
};

export default function ConfiguracionPage() {
  const { user, can } = useAuth();
  const [section, setSection] = useState('perfil');
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await api.get<ConfigData>('/config');
      setData(d);
      // Apply primary color
      if (d.config?.primary_color) {
        document.documentElement.style.setProperty('--color-primary', d.config.primary_color);
      }
    } catch (e) { console.error(e); setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async (updates: Partial<ShelterConfig | Refugio>) => {
    await api.post('/config', updates);
    setData(prev => prev ? {
      ...prev,
      config: { ...prev.config, ...updates },
      refugio: { ...prev.refugio, ...updates },
    } : prev);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Re-apply color if changed
    const c = (updates as Partial<ShelterConfig>).primary_color;
    if (c) document.documentElement.style.setProperty('--color-primary', c);
  };

  const isAdmin = user?.rol === 'admin';

  const config = data?.config || DEFAULT_CONFIG;
  const refugio = data?.refugio || {} as Refugio;
  const stats = data?.stats || {};

  const renderSection = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={80} />)}
      </div>
    );
    if (error) return <ErrorState onRetry={loadConfig} />;

    switch (section) {
      case 'perfil':        return <PerfilSection refugio={refugio} onSave={handleSave} loading={loading} />;
      case 'equipo':        return <EquipoSection />;
      case 'notificaciones':return <NotificacionesSection config={config} onSave={handleSave} />;
      case 'adopciones':    return <AdopcionesConfigSection config={config} onSave={handleSave} />;
      case 'acogidas':      return <AcogidasConfigSection config={config} onSave={handleSave} />;
      case 'objetivos':     return <ObjetivosSection config={config} onSave={handleSave} />;
      case 'integraciones': return <IntegracionesSection config={config} onSave={handleSave} />;
      case 'apariencia':    return <AparienciaSection config={config} onSave={handleSave} />;
      case 'datos':         return <DatosSection />;
      case 'facturacion':   return <BillingTab />;
      case 'plan':          return <PlanSection stats={stats as { animales: string; usuarios: string }} />;
      default:              return null;
    }
  };

  const activeSection = SECTIONS.find(s => s.id === section);

  // Solo admin puede ver Configuración
  if (!isAdmin && !can('config:manage')) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48 }}>🔒</p>
          <h2 style={{ color: '#374151' }}>Acceso restringido</h2>
          <p>Solo los administradores pueden acceder a la configuración.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>

      {/* Sub-sidebar */}
      <div style={{
        width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb',
        overflowY: 'auto', padding: '16px 8px',
      }} className="config-sidebar">
        <p style={{ margin: '0 8px 12px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Configuración
        </p>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => { setSection(s.id); setMobileOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: section === s.id ? '#f0fdf4' : 'transparent',
            color: section === s.id ? '#16a34a' : '#374151',
            fontWeight: section === s.id ? 700 : 400, fontSize: 13,
            fontFamily: "'Inter', sans-serif", marginBottom: 2, textAlign: 'left',
            transition: 'background .1s',
          }}>
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 60, padding: '0 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #e5e7eb',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>{activeSection?.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{activeSection?.label}</span>
          </div>
          {saved && (
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '4px 12px', borderRadius: 20 }}>
              ✓ Cambios guardados
            </span>
          )}
        </div>

        <div style={{ padding: 28, maxWidth: 860, margin: '0 auto' }}>
          {renderSection()}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @media (max-width: 768px) { .config-sidebar { display: none; } }
      `}</style>
    </div>
  );
}
