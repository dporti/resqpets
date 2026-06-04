import { useEffect, useState, useRef } from 'react';
import { PublicSosAlert } from '../types';
import { api } from '../api/client';
import { SEOHead } from '../components/SEOHead';
import { Link } from 'react-router-dom';

const SOS_FORM_URL = 'http://localhost:5173/sos';

export function SosPage() {
  const [alerts, setAlerts] = useState<PublicSosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [selected, setSelected] = useState<PublicSosAlert | null>(null);

  useEffect(() => {
    api.getSosAlerts().then(data => {
      const active = data.filter((a: PublicSosAlert) => a.estado === 'active');
      setAlerts(active);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = alerts.filter(a => filter === 'all' ? true : a.tipo === filter);

  return (
    <>
      <SEOHead
        title="SOS Pet — Animales perdidos y avistados"
        description="Portal de avisos de animales perdidos y encontrados. Ayuda a reunir animales con sus familias."
      />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        padding: '48px 20px', color: '#fff', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 12px' }}>
          🚨 SOS Pet
        </h1>
        <p style={{ fontSize: 16, opacity: .9, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Portal de animales perdidos y avistados. Tu ayuda puede reunir una familia.
        </p>
        <a href={SOS_FORM_URL} style={{
          display: 'inline-block', textDecoration: 'none',
          padding: '14px 32px', background: '#fff', color: '#991b1b',
          borderRadius: 12, fontWeight: 700, fontSize: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,.2)',
        }}>
          + Publicar aviso SOS
        </a>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <QuickStat value={alerts.filter(a => a.tipo === 'lost').length} label="Perdidos activos" color="#ef4444" />
          <QuickStat value={alerts.filter(a => a.tipo === 'found').length} label="Avistados activos" color="#3b82f6" />
          <QuickStat value={alerts.length} label="Avisos totales" color="#6b7280" />
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { val: 'all', label: 'Todos', color: '#6b7280' },
            { val: 'lost', label: '🔴 Perdidos', color: '#ef4444' },
            { val: 'found', label: '🔵 Avistados', color: '#3b82f6' },
          ].map(f => (
            <button key={f.val} onClick={() => setFilter(f.val as typeof filter)} style={{
              padding: '8px 20px', borderRadius: 20, cursor: 'pointer',
              border: '2px solid',
              borderColor: filter === f.val ? f.color : '#e5e7eb',
              background: filter === f.val ? `${f.color}15` : '#fff',
              color: filter === f.val ? f.color : '#6b7280',
              fontWeight: filter === f.val ? 700 : 400, fontSize: 14,
              transition: 'all .15s',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ height: 140, borderRadius: 14, ...shimmer }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <p style={{ fontSize: 18 }}>No hay avisos activos con este filtro</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(a => (
              <SosAlertCard key={a.id} alert={a} onClick={() => setSelected(a)} />
            ))}
          </div>
        )}

        {/* Cómo ayudar */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fef3c7',
          borderRadius: 16, padding: 28, marginTop: 48,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#92400e', margin: '0 0 12px' }}>
            💡 ¿Cómo puedo ayudar?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '👀', text: 'Comparte los avisos en tus redes sociales' },
              { icon: '📸', text: 'Si ves al animal, haz una foto y contacta con el teléfono del aviso' },
              { icon: '🐾', text: 'Si encuentras un animal, publícalo aquí para que su familia lo vea' },
              { icon: '🏥', text: 'Lleva el animal encontrado al veterinario para escanear el microchip' },
            ].map(t => (
              <div key={t.text} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                <p style={{ margin: 0, fontSize: 14, color: '#78350f', lineHeight: 1.5 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal detalle */}
      {selected && <SosDetailModal alert={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function SosAlertCard({ alert, onClick }: { alert: PublicSosAlert; onClick: () => void }) {
  const foto = alert.fotos?.[0];
  const hace = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60));
  const hacel = hace < 24 ? `Hace ${hace}h` : `Hace ${Math.floor(hace / 24)} días`;
  const esUrgente = alert.urgencia === 'high';

  return (
    <div onClick={onClick} style={{
      background: '#fff', border: `2px solid ${esUrgente ? '#fecaca' : '#e5e7eb'}`,
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
      display: 'flex', gap: 0, transition: 'box-shadow .15s',
      position: 'relative',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      {esUrgente && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: '#ef4444',
          animation: 'pulse 2s infinite',
        }} />
      )}
      <div style={{ width: 110, flexShrink: 0, background: '#f3f4f6' }}>
        {foto
          ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🐾</div>
        }
      </div>
      <div style={{ padding: '14px 14px' }}>
        <span style={{
          display: 'inline-block', marginBottom: 6,
          background: alert.tipo === 'lost' ? '#ef4444' : '#3b82f6',
          color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '2px 10px', borderRadius: 20,
        }}>
          {alert.tipo === 'lost' ? '🔴 PERDIDO' : '🔵 AVISTADO'}
        </span>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#111827', fontSize: 15 }}>
          {alert.nombre_animal || `${alert.especie || 'Animal'}${alert.color ? ` ${alert.color}` : ''}`}
        </p>
        <p style={{ margin: '0 0 4px', color: '#6b7280', fontSize: 13 }}>
          {[alert.raza, alert.tamaño].filter(Boolean).join(' · ')}
        </p>
        {alert.ubicacion_descripcion && (
          <p style={{ margin: '0 0 4px', color: '#9ca3af', fontSize: 12 }}>📍 {alert.ubicacion_descripcion}</p>
        )}
        <p style={{ margin: 0, color: '#9ca3af', fontSize: 11 }}>{hacel}</p>
      </div>
    </div>
  );
}

function SosDetailModal({ alert, onClose }: { alert: PublicSosAlert; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,.3)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: alert.tipo === 'lost' ? '#ef4444' : '#3b82f6',
            color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          }}>
            {alert.tipo === 'lost' ? '🔴 ANIMAL PERDIDO' : '🔵 ANIMAL AVISTADO'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {alert.fotos?.length > 0 && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, paddingTop: '60%', position: 'relative', background: '#f3f4f6' }}>
              <img src={alert.fotos[0]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
            {alert.nombre_animal || `${alert.especie || 'Animal'}${alert.color ? ` ${alert.color}` : ''}`}
          </h2>

          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Especie', val: alert.especie },
              { label: 'Raza', val: alert.raza },
              { label: 'Color', val: alert.color },
              { label: 'Tamaño', val: alert.tamaño },
              { label: 'Ubicación', val: alert.ubicacion_descripcion },
            ].filter(r => r.val).map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: '#111827' }}>{r.val}</span>
              </div>
            ))}
          </div>

          {alert.descripcion && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{alert.descripcion}</p>
            </div>
          )}

          {alert.codigo_referencia && (
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Ref: {alert.codigo_referencia}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { const t = encodeURIComponent(`He encontrado este aviso SOS en ResQPet: ${window.location.href}`); window.open(`https://wa.me/?text=${t}`, '_blank'); }}
              style={{
                flex: 1, padding: '12px', background: '#25d366', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}
            >
              💬 Compartir por WhatsApp
            </button>
            <button onClick={onClose} style={{
              padding: '12px 20px', background: '#f3f4f6', color: '#374151',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 14,
            }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{label}</p>
    </div>
  );
}

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
};
