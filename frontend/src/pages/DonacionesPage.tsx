import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { ResumenTab } from './donaciones/ResumenTab';
import { HistorialTab } from './donaciones/HistorialTab';
import { CampanasTab } from './donaciones/CampanasTab';

const TABS = [
  { id: 'resumen',    label: '📊 Resumen' },
  { id: 'historial',  label: '💚 Donaciones' },
  { id: 'campanas',   label: '🎯 Campañas' },
];

export default function DonacionesPage() {
  const { user, can } = useAuth();
  const [tab, setTab] = useState('resumen');

  if (!can('donaciones:read')) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
        <TopBar titulo="Donaciones" showNew={false} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', color: '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 48 }}>🔒</p>
            <h2 style={{ color: '#374151' }}>Sin acceso</h2>
            <p>No tienes permisos para ver las donaciones.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar titulo="Donaciones" showNew={false} />

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? '#16a34a' : '#6b7280',
              borderBottom: tab === t.id ? '2.5px solid #16a34a' : '2.5px solid transparent',
              transition: 'all .15s', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px', maxWidth: 1300, margin: '0 auto' }}>
        {tab === 'resumen'   && <ResumenTab />}
        {tab === 'historial' && <HistorialTab shelterName={user?.refugioNombre || 'ResQPet'} />}
        {tab === 'campanas'  && <CampanasTab />}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
