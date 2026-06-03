import { useState, useEffect, FormEvent } from 'react';
import { SosAlert } from '../types';
import { api } from '../api/client';
import { Spinner, formatDate, formatDateTime } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { generatePoster } from '../utils/PosterGenerator';

interface Props {
  alertId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const TIPO_CFG = {
  lost:  { label: 'Perdido',    color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
  found: { label: 'Avistado',   color: '#2563eb', bg: '#dbeafe', emoji: '🔵' },
};
const URG_CFG = {
  high:   { label: 'Alta',  color: '#dc2626', bg: '#fee2e2' },
  medium: { label: 'Media', color: '#d97706', bg: '#fef9c3' },
  low:    { label: 'Baja',  color: '#16a34a', bg: '#dcfce7' },
};
const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Activo',       color: '#dc2626', bg: '#fee2e2' },
  rescued:     { label: 'Rescatado',    color: '#16a34a', bg: '#dcfce7' },
  resolved:    { label: 'Resuelto',     color: '#6b7280', bg: '#f3f4f6' },
  false_alarm: { label: 'Falsa alarma', color: '#9ca3af', bg: '#f3f4f6' },
};

export default function SosAlertPanel({ alertId, onClose, onUpdated }: Props) {
  const { can } = useAuth();
  const [alert, setAlert] = useState<SosAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [nuevoEstado, setNuevoEstado] = useState<string>('');
  const [update, setUpdate] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showConvertirModal, setShowConvertirModal] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const load = () => {
    api.getSosAlerta(alertId).then(a => { setAlert(a); setNuevoEstado(a.estado); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [alertId]);

  const handleUpdateEstado = async () => {
    if (!alert || nuevoEstado === alert.estado) return;
    setSaving(true);
    try { await api.updateSosAlerta(alert.id, { estado: nuevoEstado }); load(); onUpdated(); }
    finally { setSaving(false); }
  };

  const handleAddUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!update.trim() || !alert) return;
    setSaving(true);
    try { await api.addSosUpdate(alert.id, update); setUpdate(''); load(); }
    finally { setSaving(false); }
  };

  const handleConvertir = async () => {
    if (!alert) return;
    setConvirtiendo(true);
    try {
      const r = await api.convertirARescate(alert.id);
      setShowConvertirModal(false); load(); onUpdated();
      alert && window.alert(`✅ Animal registrado con ID: ${r.id_interno}`);
    } finally { setConvirtiendo(false); }
  };

  const handlePdf = async () => {
    if (!alert) return;
    setGeneratingPdf(true);
    try { await generatePoster(alert, `${window.location.origin}/sos/${alert.id}`); }
    catch (e) { console.error(e); }
    finally { setGeneratingPdf(false); }
  };

  const handleWhatsApp = () => {
    if (!alert) return;
    const tipo = TIPO_CFG[alert.tipo];
    const texto = encodeURIComponent(
      `${tipo.emoji} ${alert.tipo === 'lost' ? 'ANIMAL PERDIDO' : 'ANIMAL ENCONTRADO'}\n` +
      `${alert.especie || ''} ${alert.raza || ''} · ${alert.color || ''}\n` +
      `📍 ${alert.ubicacion_descripcion || ''}\n` +
      `📅 ${alert.visto_en ? new Date(alert.visto_en).toLocaleDateString('es-ES') : ''}\n\n` +
      `Ver aviso: ${window.location.origin}/sos/${alert.id}\nRef: ${alert.codigo_referencia}`
    );
    window.open(`https://wa.me/?text=${texto}`);
  };

  if (loading) return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: '#fff', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={36} /></div>
    </>
  );
  if (!alert) return null;

  const tipoCfg = TIPO_CFG[alert.tipo];
  const urgCfg = URG_CFG[alert.urgencia];
  const estadoCfg = ESTADO_CFG[alert.estado] || ESTADO_CFG.active;
  const foto = alert.fotos?.[0];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #e5e7eb' }}>
          {foto && <div style={{ height: 200, overflow: 'hidden' }}><img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, background: tipoCfg.bg, color: tipoCfg.color }}>{tipoCfg.emoji} {tipoCfg.label}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, background: urgCfg.bg, color: urgCfg.color }}>Urgencia: {urgCfg.label}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, background: estadoCfg.bg, color: estadoCfg.color }}>{estadoCfg.label}</span>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            {alert.nombre_animal && <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginTop: 6 }}>{alert.nombre_animal}</div>}
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{alert.codigo_referencia} · {formatDateTime(alert.created_at)}</div>
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Animal info */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 16px' }}>
            {[
              { label: 'Especie', val: alert.especie },
              { label: 'Raza', val: alert.raza },
              { label: 'Color', val: alert.color },
              { label: 'Tamaño', val: alert.tamaño },
              { label: 'Collar', val: alert.lleva_collar ? 'Sí' : 'No' },
              { label: 'Señas', val: alert.señas_particulares },
            ].filter(f => f.val).map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', textTransform: 'capitalize' }}>{f.val}</div>
              </div>
            ))}
          </div>

          {alert.descripcion && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Descripción</div>
              <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.65, margin: 0 }}>{alert.descripcion}</p>
            </div>
          )}

          {/* Ubicación */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Ubicación</div>
            <div style={{ fontSize: 13.5, color: '#111', marginBottom: 4 }}>📍 {alert.ubicacion_descripcion || '—'}</div>
            {alert.latitud && alert.longitud && (
              <a href={`https://maps.google.com/?q=${alert.latitud},${alert.longitud}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12.5, color: '#2563eb', textDecoration: 'none' }}>
                Ver en Google Maps →
              </a>
            )}
          </div>

          {/* Contacto (solo coordinadores/admin) */}
          {can('adopciones:manage') && (
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>🔒 Datos de contacto (solo coordinadores)</div>
              {alert.reportero_nombre && <div style={{ fontSize: 13.5, color: '#111' }}>👤 {alert.reportero_nombre}</div>}
              {alert.reportero_telefono && <div style={{ fontSize: 13.5, color: '#111' }}>📞 {alert.reportero_telefono}</div>}
              {alert.reportero_email && <div style={{ fontSize: 13, color: '#6b7280' }}>✉️ {alert.reportero_email}</div>}
            </div>
          )}

          {/* Coincidencias */}
          {alert.coincidencias && alert.coincidencias.length > 0 && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 8 }}>🤖 Posibles coincidencias</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {alert.coincidencias.map(c => (
                  <div key={c.id} style={{ flexShrink: 0, width: 100, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', margin: '0 auto 4px' }}>
                      {c.fotos?.[0] ? <img src={c.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 28 }}>🐾</div>}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.similitud >= 70 ? '#16a34a' : '#d97706' }}>{c.similitud}% similar</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.codigo_referencia}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de actualizaciones */}
          {alert.updates && alert.updates.length > 0 && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Actualizaciones</div>
              {alert.updates.map(u => (
                <div key={u.id} style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 6, fontSize: 13, borderLeft: '3px solid #16a34a' }}>
                  <div style={{ color: '#4b5563' }}>{u.contenido}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{formatDateTime(u.created_at)}{u.autor && ` · ${u.autor}`}</div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          {can('animales:update') && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111', marginBottom: 2 }}>Acciones</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setShowConvertirModal(true)} style={{ padding: '7px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>🐾 Convertir en rescate</button>
                <button onClick={handlePdf} disabled={generatingPdf} style={{ padding: '7px 12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {generatingPdf ? '...' : '📄 Cartel PDF'}
                </button>
                <button onClick={handleWhatsApp} style={{ padding: '7px 12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>📤 WhatsApp</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }}>
                  <option value="active">Activo</option>
                  <option value="rescued">Rescatado</option>
                  <option value="resolved">Resuelto (dueño encontrado)</option>
                  <option value="false_alarm">Falsa alarma</option>
                </select>
                <button onClick={handleUpdateEstado} disabled={saving || nuevoEstado === alert.estado} style={{ padding: '7px 14px', background: nuevoEstado !== alert.estado ? '#374151' : '#e5e7eb', color: nuevoEstado !== alert.estado ? '#fff' : '#9ca3af', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {saving ? '...' : 'Cambiar'}
                </button>
              </div>
              <form onSubmit={handleAddUpdate} style={{ display: 'flex', gap: 8 }}>
                <input value={update} onChange={e => setUpdate(e.target.value)} placeholder="Añadir actualización..." style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }} />
                <button type="submit" disabled={!update.trim()} style={{ padding: '7px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>+</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal convertir en rescate */}
      {showConvertirModal && (
        <>
          <div onClick={() => setShowConvertirModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 14, width: 400, padding: 24, zIndex: 70, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🐾</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Convertir en rescate</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Se creará una ficha de animal con los datos del aviso y estado "En evaluación". El aviso quedará marcado como rescatado.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setShowConvertirModal(false)} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
              <button onClick={handleConvertir} disabled={convirtiendo} style={{ padding: '9px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                {convirtiendo ? <Spinner size={14} /> : null} Confirmar rescate
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
