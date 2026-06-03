import { useEffect, useState, useCallback, useRef } from 'react';
import { SosAlert } from '../types';
import { api } from '../api/client';
import { Spinner, EmptyState, formatDateTime } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import SosAlertPanel from './SosAlertPanel';

// Leaflet CSS
import 'leaflet/dist/leaflet.css';

const TIPO_CFG = {
  lost:  { label: 'Perdido',  color: '#dc2626', bg: '#fee2e2', emoji: '🔴', markerColor: '#dc2626' },
  found: { label: 'Avistado', color: '#2563eb', bg: '#dbeafe', emoji: '🔵', markerColor: '#2563eb' },
};
const URG_CFG = {
  high:   { label: 'Alta',  color: '#dc2626', bg: '#fee2e2' },
  medium: { label: 'Media', color: '#d97706', bg: '#fef9c3' },
  low:    { label: 'Baja',  color: '#16a34a', bg: '#dcfce7' },
};
const ESTADO_OPTS = [
  { val: 'todos', label: 'Todos' },
  { val: 'active', label: 'Activos' },
  { val: 'rescued', label: 'Rescatados' },
  { val: 'resolved', label: 'Resueltos' },
];

function MapView({ alertas, onSelectAlert }: { alertas: SosAlert[]; onSelectAlert: (id: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, { center: [40.4168, -3.7038], zoom: 11 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      mapInstanceRef.current = { map, L, markers: [] as unknown[] };
      return { map, L };
    }).catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        const { map } = mapInstanceRef.current as { map: { remove: () => void } };
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, L, markers } = mapInstanceRef.current as { map: unknown; L: typeof import('leaflet'); markers: unknown[] };

    // Remove existing markers
    (markers as { remove: () => void }[]).forEach(m => m.remove());
    (mapInstanceRef.current as { markers: unknown[] }).markers = [];

    alertas.filter(a => a.latitud && a.longitud).forEach(a => {
      const cfg = TIPO_CFG[a.tipo];
      const urgCfg = URG_CFG[a.urgencia];
      const size = a.urgencia === 'high' ? 38 : a.urgencia === 'medium' ? 32 : 26;
      const pulse = a.urgencia === 'high' && a.estado === 'active' ? 'animation:pulse 1.5s infinite' : '';

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;background:${cfg.markerColor};border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:${size * 0.5}px;box-shadow:0 2px 8px rgba(0,0,0,0.35);${pulse}">${cfg.emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size],
        popupAnchor: [0, -size],
      });

      const marker = L.marker([a.latitud!, a.longitud!], { icon }).addTo(map as unknown as import('leaflet').Map);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:200px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${a.nombre_animal || (a.especie || 'Animal')} ${cfg.emoji}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${a.ubicacion_descripcion || ''}</div>
          <div style="font-size:11px;margin-bottom:8px">
            <span style="background:${urgCfg.bg};color:${urgCfg.color};padding:2px 6px;border-radius:10px;font-weight:600">Urgencia ${urgCfg.label}</span>
          </div>
          <div style="font-size:11px;color:#9ca3af">${formatDateTime(a.created_at)}</div>
          <button onclick="window.__sosSelectAlert(${a.id})" style="margin-top:8px;width:100%;padding:6px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12.5px;font-weight:600">Ver detalle →</button>
        </div>
      `);
      (mapInstanceRef.current as { markers: unknown[] }).markers.push(marker);
    });

    (window as unknown as Record<string, unknown>).__sosSelectAlert = (id: number) => {
      onSelectAlert(id);
    };
  }, [alertas]);

  return (
    <div ref={mapRef} style={{ flex: 1, minHeight: 400 }}>
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 2px 8px rgba(220,38,38,0.4)} 50%{box-shadow:0 2px 20px rgba(220,38,38,0.8)} }`}</style>
    </div>
  );
}

export default function AvisosPage() {
  const { can } = useAuth();
  const [alertas, setAlertas] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'mapa' | 'lista'>('mapa');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('active');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado !== 'todos') params.estado = filtroEstado;
      setAlertas(await api.getSosAlertas(params));
    } finally { setLoading(false); }
  }, [filtroTipo, filtroEstado]);

  useEffect(() => { load(); }, [load]);

  const activos = alertas.filter(a => a.estado === 'active').length;
  const altaUrgencia = alertas.filter(a => a.urgencia === 'high' && a.estado === 'active').length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        titulo="Avisos SOS Pet"
        subtitulo={`${activos} activos`}
        showNew={can('animales:update')}
        newLabel="+ Crear aviso"
        onNew={() => window.open('/sos', '_blank')}
        avisosCount={altaUrgencia}
      />

      {/* Sub-nav */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, padding: '10px 0' }}>
          {(['mapa', 'lista'] as const).map(v => (
            <button key={v} onClick={() => setVista(v)} style={{
              padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13,
              background: vista === v ? '#111827' : '#fff', color: vista === v ? '#fff' : '#6b7280',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>{v === 'mapa' ? '🗺️ Mapa' : '≡ Lista'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
            <option value="">Todos los tipos</option>
            <option value="lost">🔴 Perdidos</option>
            <option value="found">🔵 Avistados</option>
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }}>
            {ESTADO_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
          <a href="/sos" target="_blank" rel="noreferrer" style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, background: '#fff', color: '#374151', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>
            Ver portal público →
          </a>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size={36} /></div>
      ) : vista === 'mapa' ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 140px)' }}>
          {/* Mapa */}
          <MapView alertas={alertas} onSelectAlert={setSelectedId} />

          {/* Panel lateral */}
          <div style={{ width: 300, borderLeft: '1px solid #e5e7eb', background: '#fff', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {alertas.length} avisos{filtroEstado === 'active' ? ' activos' : ''}
            </div>
            {alertas.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Sin avisos con estos filtros</div>
            ) : alertas.map(a => {
              const cfg = TIPO_CFG[a.tipo];
              const urgCfg = URG_CFG[a.urgencia];
              return (
                <div key={a.id} onClick={() => setSelectedId(a.id)}
                  style={{ padding: '12px 14px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {a.fotos?.[0] ? <img src={a.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>{cfg.emoji}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 20, background: urgCfg.bg, color: urgCfg.color, fontWeight: 600 }}>{urgCfg.label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.nombre_animal || `${a.especie || 'Animal'} ${a.raza || ''}`}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ubicacion_descripcion}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{formatDateTime(a.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vista Lista */
        alertas.length === 0 ? (
          <div style={{ padding: 24 }}><EmptyState icon="🔔" title="Sin avisos" subtitle="Los avisos SOS aparecerán aquí" /></div>
        ) : (
          <div style={{ margin: '16px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Animal', 'Tipo', 'Ubicación', 'Reportado', 'Urgencia', 'Estado', 'Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertas.map(a => {
                  const cfg = TIPO_CFG[a.tipo];
                  const urgCfg = URG_CFG[a.urgencia];
                  const estadoCfg = { active: '#fee2e2', rescued: '#dcfce7', resolved: '#f3f4f6', false_alarm: '#f3f4f6' }[a.estado] || '#f3f4f6';
                  return (
                    <tr key={a.id} onClick={() => setSelectedId(a.id)} style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 7, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                            {a.fotos?.[0] ? <img src={a.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 18 }}>{cfg.emoji}</div>}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{a.nombre_animal || (a.especie ? `${a.especie} ${a.raza || ''}` : 'Animal')}</div>
                            <div style={{ fontSize: 11.5, color: '#9ca3af', textTransform: 'capitalize' }}>{a.especie} · {a.color}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span></td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ubicacion_descripcion || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDateTime(a.created_at)}</td>
                      <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: urgCfg.bg, color: urgCfg.color }}>{urgCfg.label}</span></td>
                      <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 12, background: estadoCfg, color: '#374151' }}>{a.estado}</span></td>
                      <td style={{ padding: '11px 14px' }}>
                        <button onClick={e => { e.stopPropagation(); setSelectedId(a.id); }} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {selectedId && (
        <SosAlertPanel alertId={selectedId} onClose={() => setSelectedId(null)} onUpdated={load} />
      )}
    </div>
  );
}
