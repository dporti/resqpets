import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SectionCard, SaveButton, Skel } from './shared';

interface Member { id: number; nombre: string; email: string; rol: string; activo: boolean; avatar_url?: string; ultimo_acceso?: string }
interface Invitation { id: number; email: string; rol: string; expires_at: string; invited_by_nombre?: string; token: string }

const ROL_COLOR: Record<string, string> = { admin: '#ef4444', coordinador: '#3b82f6', voluntario: '#16a34a' };

const PERMISOS_MATRIX = [
  ['Ver animales',        true,  true,  true ],
  ['Editar animales',     true,  true,  false],
  ['Eliminar animales',   true,  false, false],
  ['Ver adopciones',      true,  true,  true ],
  ['Gestionar adopciones',true,  true,  false],
  ['Ver reportes',        true,  true,  false],
  ['Exportar datos',      true,  true,  false],
  ['Acceder a Config',    true,  false, false],
  ['Gestionar equipo',    true,  false, false],
] as [string, boolean, boolean, boolean][];

export function EquipoSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRol, setInvRol] = useState('voluntario');
  const [invMsg, setInvMsg] = useState('');
  const [invLoading, setInvLoading] = useState(false);
  const [invLink, setInvLink] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        api.get<Member[]>('/config/team'),
        api.get<Invitation[]>('/config/invitations'),
      ]);
      setMembers(m);
      setInvitations(i);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id: number, rol: string) => {
    await api.post(`/config/team/${id}/role`, { rol });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, rol } : m));
  };

  const toggleStatus = async (id: number) => {
    const r = await api.post<{ activo: boolean }>(`/config/team/${id}/status`, {});
    setMembers(prev => prev.map(m => m.id === id ? { ...m, activo: r.activo } : m));
  };

  const removeMember = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre} del equipo?`)) return;
    await api.delete?.(`/config/team/${id}`).catch(() =>
      fetch(`/api/config/team/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('resqpet_token')}` } }),
    );
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const sendInvitation = async () => {
    setInvLoading(true);
    try {
      const r = await api.post<{ link: string }>('/config/invitations', { email: invEmail, rol: invRol, message: invMsg });
      setInvLink(r.link);
      load();
    } finally { setInvLoading(false); }
  };

  const cancelInv = async (id: number) => {
    await fetch(`/api/config/invitations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('resqpet_token')}` } });
    setInvitations(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({length:4}).map((_,i)=><Skel key={i} />)}</div>;

  return (
    <div>
      <SectionCard title="Miembros del equipo" description="Gestiona los usuarios que tienen acceso al CRM de esta protectora">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setShowInviteModal(true)} style={{
            padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none',
            borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>+ Invitar miembro</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['', 'Nombre', 'Email', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map(h =>
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontSize: 12, background: '#f9fafb' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
                      {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : m.nombre.charAt(0)}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827' }}>{m.nombre}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>{m.email}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <select value={m.rol} onChange={e => changeRole(m.id, e.target.value)} style={{
                      padding: '4px 8px', borderRadius: 6, border: '1.5px solid #e5e7eb',
                      background: ROL_COLOR[m.rol] + '15', color: ROL_COLOR[m.rol],
                      fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    }}>
                      <option value="admin">Admin</option>
                      <option value="coordinador">Coordinador</option>
                      <option value="voluntario">Voluntario</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <button onClick={() => toggleStatus(m.id)} style={{
                      padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      background: m.activo ? '#f0fdf4' : '#f9fafb', color: m.activo ? '#16a34a' : '#9ca3af',
                    }}>
                      {m.activo ? '● Activo' : '○ Inactivo'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af', fontSize: 12 }}>
                    {m.ultimo_acceso ? new Date(m.ultimo_acceso).toLocaleDateString('es-ES') : 'Nunca'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <button onClick={() => removeMember(m.id, m.nombre)} style={{
                      padding: '4px 10px', background: '#fef2f2', color: '#ef4444',
                      border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {invitations.length > 0 && (
        <SectionCard title="Invitaciones pendientes">
          {invitations.map(inv => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{inv.email}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                  Rol: {inv.rol} · Expira: {new Date(inv.expires_at).toLocaleDateString('es-ES')} · Invitado por: {inv.invited_by_nombre || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(inv.token)} style={{ padding: '4px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11 }}>📋 Copiar link</button>
                <button onClick={() => cancelInv(inv.id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Cancelar</button>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Matriz de permisos" description="Los permisos están definidos por rol y no son modificables individualmente">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Acción</th>
                {['Admin','Coordinador','Voluntario'].map(r => (
                  <th key={r} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: ROL_COLOR[r.toLowerCase()] || '#374151', borderBottom: '1px solid #e5e7eb' }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISOS_MATRIX.map(([action, admin, coord, vol]) => (
                <tr key={action}>
                  <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{action}</td>
                  {[admin, coord, vol].map((v, i) => (
                    <td key={i} style={{ padding: '7px 12px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ color: v ? '#16a34a' : '#d1d5db', fontSize: 16, fontWeight: 700 }}>{v ? '✓' : '✗'}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Modal invitación */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowInviteModal(false); setInvLink(''); } }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Invitar miembro</h3>
              <button onClick={() => { setShowInviteModal(false); setInvLink(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>✕</button>
            </div>
            {invLink ? (
              <div>
                <p style={{ color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>✓ Invitación creada</p>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', fontSize: 12, wordBreak: 'break-all', marginBottom: 16, color: '#374151' }}>{invLink}</div>
                <button onClick={() => navigator.clipboard.writeText(invLink)} style={{ width: '100%', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>📋 Copiar enlace</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Rol</label>
                  <select value={invRol} onChange={e => setInvRol(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff' }}>
                    <option value="voluntario">Voluntario</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mensaje personalizado (opcional)</label>
                  <textarea value={invMsg} onChange={e => setInvMsg(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <button onClick={sendInvitation} disabled={invLoading || !invEmail} style={{ width: '100%', padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  {invLoading ? 'Creando...' : 'Crear enlace de invitación'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
