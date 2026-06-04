import { SectionCard } from './shared';

const PLANS = [
  { name: 'Gratuito', price: '0€/mes', color: '#6b7280', features: { animales: 50, voluntarios: 5, storage: '1 GB', portal: '✓', sos: '✓', reportes: 'Básico', soporte: 'Email' } },
  { name: 'Básico',   price: '29€/mes', color: '#3b82f6', features: { animales: 200, voluntarios: 20, storage: '10 GB', portal: '✓', sos: '✓', reportes: 'Avanzado', soporte: 'Chat' } },
  { name: 'Pro',      price: '79€/mes', color: '#16a34a', features: { animales: '∞', voluntarios: '∞', storage: '100 GB', portal: '✓', sos: '✓', reportes: 'Completo', soporte: 'Dedicado' }, recommended: true },
];

interface Stats { animales: string; usuarios: string }

export function PlanSection({ stats }: { stats: Stats }) {
  const animals = parseInt(stats?.animales || '0', 10);
  const users = parseInt(stats?.usuarios || '0', 10);

  return (
    <div>
      <SectionCard title="Plan actual: Gratuito">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Animales', current: animals, max: 50, icon: '🐾' },
            { label: 'Voluntarios', current: users, max: 5, icon: '👥' },
            { label: 'Almacenamiento', current: 0, max: 1, unit: 'GB', icon: '💾' },
          ].map(item => {
            const pct = Math.min(100, Math.round((item.current / item.max) * 100));
            return (
              <div key={item.label} style={{ background: '#f9fafb', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span>{item.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label}</p>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
                  {item.current}<span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 400 }}>/{item.max}{item.unit || ''}</span>
                </p>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#ef4444' : '#16a34a', borderRadius: 3, transition: 'width .5s' }} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>{pct}% usado</p>
              </div>
            );
          })}
        </div>
        <a href="mailto:hola@resqpet.com?subject=Actualizar plan ResQPet" style={{
          display: 'inline-block', padding: '10px 22px', background: '#16a34a', color: '#fff',
          borderRadius: 9, fontWeight: 600, fontSize: 13, textDecoration: 'none',
        }}>
          ✉️ Contactar para actualizar plan
        </a>
      </SectionCard>

      <SectionCard title="Comparativa de planes">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>Característica</th>
                {PLANS.map(p => (
                  <th key={p.name} style={{
                    padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e5e7eb',
                    borderTop: p.recommended ? `3px solid ${p.color}` : 'none',
                  }}>
                    {p.recommended && <div style={{ fontSize: 10, color: p.color, fontWeight: 700, marginBottom: 2 }}>RECOMENDADO</div>}
                    <div style={{ fontWeight: 700, color: p.color, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginTop: 2 }}>{p.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Animales', 'animales'],
                ['Voluntarios', 'voluntarios'],
                ['Almacenamiento', 'storage'],
                ['Portal público', 'portal'],
                ['SOS Pet', 'sos'],
                ['Reportes', 'reportes'],
                ['Soporte', 'soporte'],
              ].map(([label, key]) => (
                <tr key={key}>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{label}</td>
                  {PLANS.map(p => (
                    <td key={p.name} style={{
                      padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #f3f4f6',
                      fontWeight: p.name === 'Pro' ? 600 : 400,
                      color: p.name === 'Gratuito' ? '#374151' : p.color,
                    }}>
                      {(p.features as Record<string, string | number>)[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Historial de facturas">
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
          <p style={{ fontSize: 32 }}>🧾</p>
          <p style={{ fontSize: 14 }}>No hay facturas aún</p>
          <p style={{ fontSize: 12 }}>Estás en el plan gratuito</p>
        </div>
      </SectionCard>
    </div>
  );
}
