import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SectionCard } from './shared';

interface AuditEntry { id: number; user_nombre: string; action: string; resource_type?: string; resource_name?: string; created_at: string; details?: Record<string, unknown> }

const ACTION_LABELS: Record<string, string> = {
  config_updated: 'Configuración actualizada',
  role_changed: 'Rol cambiado',
  user_activated: 'Usuario activado',
  user_deactivated: 'Usuario desactivado',
  user_removed: 'Miembro eliminado',
};
const ACTION_ICON: Record<string, string> = {
  config_updated: '⚙️', role_changed: '🔑', user_activated: '✅',
  user_deactivated: '🚫', user_removed: '🗑️',
};

export function DatosSection() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [refugioNombre, setRefugioNombre] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get<{ data: AuditEntry[]; total: number }>('/config/audit-log?limit=50').then(r => {
      setAuditLog(r.data);
      setAuditTotal(r.total);
    }).finally(() => setLoading(false));
    api.get<{ refugio: { nombre: string } }>('/config').then(r => setRefugioNombre(r.refugio?.nombre || '')).catch(() => {});
  }, []);

  const exportData = async () => {
    setExporting(true);
    try {
      const JSZip = (await import('jszip')).default;
      const data = await api.get<Record<string, unknown[]>>('/reportes/export?period=anio');
      const zip = new JSZip();
      for (const [k, rows] of Object.entries(data)) {
        if (!Array.isArray(rows) || !rows.length) continue;
        const headers = Object.keys(rows[0] as object);
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(','))].join('\n');
        zip.file(`${k}.csv`, csv);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `ResQPet_Datos_${new Date().toISOString().slice(0,10)}.zip`; a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  return (
    <div>
      {/* Exportación */}
      <SectionCard title="Exportación de datos">
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
          Descarga todos los datos de tu protectora en formato CSV comprimido en ZIP. Incluye animales, adopciones, acogidas, avisos SOS y más.
        </p>
        <button onClick={exportData} disabled={exporting} style={{
          padding: '10px 22px', background: '#111827', color: '#fff', border: 'none',
          borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>
          {exporting ? '⏳ Generando ZIP...' : '⬇️ Exportar todos mis datos'}
        </button>
      </SectionCard>

      {/* Política retención */}
      <SectionCard title="Política de retención de datos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Fichas de animales adoptados', '5 años'],
            ['Mensajes y comunicaciones', '2 años'],
            ['Logs de auditoría', '3 años'],
            ['Datos de solicitudes de adopción', '5 años'],
            ['Eventos del calendario', '3 años'],
          ].map(([item, period]) => (
            <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
              <span style={{ color: '#374151' }}>{item}</span>
              <span style={{ fontWeight: 600, color: '#6b7280' }}>{period}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Audit log */}
      <SectionCard title={`Registro de auditoría (${auditTotal} entradas)`}>
        {loading ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Cargando...</p> : (
          <>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {auditLog.length === 0 && <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin entradas en el log</p>}
              {auditLog.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ACTION_ICON[e.action] || '📝'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#111827' }}>
                      <strong>{e.user_nombre}</strong> — {ACTION_LABELS[e.action] || e.action}
                      {e.resource_name && <span style={{ color: '#6b7280' }}> en {e.resource_name}</span>}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                      {new Date(e.created_at).toLocaleString('es-ES')}
                      {e.details?.fields && ` · Campos: ${(e.details.fields as string[]).join(', ')}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {auditLog.length > 0 && (
              <button onClick={() => {
                const csv = ['Fecha,Usuario,Acción,Recurso'].concat(
                  auditLog.map(e => `"${e.created_at}","${e.user_nombre}","${e.action}","${e.resource_name || ''}"`)
                ).join('\n');
                const a = document.createElement('a');
                a.href = 'data:text/csv,' + encodeURIComponent(csv);
                a.download = 'audit_log.csv'; a.click();
              }} style={{ marginTop: 12, padding: '7px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                📥 Exportar audit log CSV
              </button>
            )}
          </>
        )}
      </SectionCard>

      {/* Zona de peligro */}
      <SectionCard title="⚠️ Zona de peligro" danger>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
          Esta acción eliminará permanentemente todos los datos del refugio del sistema. Esta acción no se puede deshacer.
          Las cuentas de usuario no se eliminarán pero quedarán desvinculadas.
        </p>
        <button onClick={() => setDeleteModal(true)} style={{
          padding: '10px 22px', background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13,
        }}>
          🗑️ Eliminar todos los datos del refugio
        </button>
      </SectionCard>

      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 12px', color: '#ef4444' }}>⚠️ Confirmar eliminación</h3>
            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 16px', lineHeight: 1.6 }}>
              Esta acción es irreversible. Escribe el nombre de la protectora para confirmar:
              <strong style={{ display: 'block', marginTop: 4 }}>{refugioNombre}</strong>
            </p>
            <input style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #ef4444', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }}
              value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={refugioNombre} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button disabled={deleteConfirm !== refugioNombre} style={{
                flex: 1, padding: '10px', background: deleteConfirm === refugioNombre ? '#ef4444' : '#fca5a5', color: '#fff',
                border: 'none', borderRadius: 8, cursor: deleteConfirm === refugioNombre ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13,
              }}>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
