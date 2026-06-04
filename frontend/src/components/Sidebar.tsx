import { useAuth } from '../context/AuthContext';
import { usePlan } from '../lib/billing/PlanContext';
import { PlanFeatures } from '../lib/billing/plans';

interface Props {
  vista: string;
  setVista: (v: string) => void;
  unreadMsgs?: number;
}

const NAV_ITEMS: {
  id: string; icon: string; label: string;
  permiso?: string; planFeature?: keyof PlanFeatures;
}[] = [
  { id: 'inicio',        icon: '🏠', label: 'Inicio' },
  { id: 'animales',      icon: '🐾', label: 'Animales' },
  { id: 'adopciones',    icon: '❤️', label: 'Adopciones',  permiso: 'adopciones:read' },
  { id: 'acogidas',      icon: '🏡', label: 'Acogidas',    planFeature: 'foster_families' },
  { id: 'voluntarios',   icon: '👥', label: 'Voluntarios', permiso: 'usuarios:read', planFeature: 'volunteers' },
  { id: 'avisos',        icon: '🔔', label: 'Avisos' },
  { id: 'donaciones',    icon: '💝', label: 'Donaciones',  permiso: 'donaciones:read' },
  { id: 'reportes',      icon: '📊', label: 'Reportes',    permiso: 'reportes:read' },
  { id: 'calendario',    icon: '📅', label: 'Calendario',  planFeature: 'calendar' },
  { id: 'mensajes',      icon: '✉️',  label: 'Mensajes' },
  { id: 'configuracion', icon: '⚙️',  label: 'Config',      permiso: 'config:manage' },
];

export default function Sidebar({ vista, setVista, unreadMsgs = 0 }: Props) {
  const { can: canPermiso, user, logout } = useAuth();
  const { can: canFeature } = usePlan();

  return (
    <div style={{
      width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 14px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: '#16a34a', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🐾</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.2 }}>ResQPet</div>
          <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.2 }}>{user?.refugioNombre || 'Protectora'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          if (item.permiso && !canPermiso(item.permiso)) return null;
          const active = vista === item.id;
          const locked = item.planFeature ? !canFeature(item.planFeature) : false;

          const handleClick = () => {
            if (locked) {
              // Navigate to billing tab instead
              setVista('configuracion');
            } else {
              setVista(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              title={locked ? `Requiere plan superior` : item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: active ? '#f0fdf4' : 'transparent',
                color: active ? '#16a34a' : locked ? '#9ca3af' : '#374151',
                fontWeight: active ? 600 : 400, fontSize: 13.5,
                fontFamily: "'Inter', sans-serif", marginBottom: 2,
                transition: 'background 0.15s',
                opacity: locked ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {locked && (
                <span style={{
                  fontSize: 11, background: '#fef3c7', color: '#92400e',
                  padding: '1px 6px', borderRadius: 8, fontWeight: 600,
                }}>🔒</span>
              )}
              {item.id === 'mensajes' && !locked && unreadMsgs > 0 && (
                <span style={{
                  background: '#16a34a', color: '#fff', fontSize: 10,
                  minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {unreadMsgs > 99 ? '99+' : unreadMsgs}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 12px', borderTop: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 16, background: '#dcfce7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#16a34a', flexShrink: 0,
        }}>
          {user?.nombre?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nombre}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.rol}
          </div>
        </div>
        <button onClick={logout} title="Cerrar sesión" style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
          color: '#9ca3af', padding: 4, borderRadius: 4, flexShrink: 0,
        }}>⏻</button>
      </div>
    </div>
  );
}
