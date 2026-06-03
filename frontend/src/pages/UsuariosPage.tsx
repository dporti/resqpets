import { useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../api/client';
import { RolBadge, Spinner, EmptyState } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

export default function UsuariosPage() {
  const { can } = useAuth();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'voluntario' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getUsuarios().then(setUsuarios).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!form.nombre || !form.email || !form.password) {
      setError('Todos los campos son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createUsuario(form);
      setShowForm(false);
      setForm({ nombre: '', email: '', password: '', rol: 'voluntario' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (u: User) => {
    try {
      await api.updateUsuario(u.id, { activo: !u.activo });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  if (!can('usuarios:read')) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <TopBar titulo="Usuarios" showNew={false} />
        <EmptyState icon="🔒" title="Sin acceso" subtitle="No tienes permiso para ver esta sección" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar
        titulo="Usuarios"
        subtitulo="Gestión de usuarios y roles"
        showNew={can('usuarios:manage')}
        onNew={() => setShowForm(true)}
        newLabel="Nuevo usuario"
      />

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Usuario', 'Email', 'Rol', 'Estado', 'Último acceso', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 12,
                      color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 13,
                        }}>{u.nombre.charAt(0)}</div>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: '#111' }}>{u.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}><RolBadge rol={u.rol} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                        background: u.activo ? '#dcfce7' : '#f3f4f6',
                        color: u.activo ? '#15803d' : '#6b7280',
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>
                      {u.ultimoAcceso
                        ? new Date(u.ultimoAcceso).toLocaleDateString('es-ES')
                        : 'Nunca'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {can('usuarios:manage') && (
                        <button
                          onClick={() => handleToggleActivo(u)}
                          style={{
                            fontSize: 12, padding: '5px 10px', borderRadius: 6,
                            border: '1px solid #e5e7eb', background: '#fff',
                            cursor: 'pointer', color: u.activo ? '#dc2626' : '#16a34a',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowForm(false)}>
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: 28, width: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>Nuevo usuario</h2>
            {['nombre', 'email', 'password'].map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'capitalize' }}>
                  {field === 'password' ? 'Contraseña' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 13,
                    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Rol</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <option value="voluntario">Voluntario</option>
                <option value="coordinador">Coordinador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb',
                  background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}
              >Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: '#16a34a', color: '#fff', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}
              >{saving ? 'Guardando...' : 'Crear usuario'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
