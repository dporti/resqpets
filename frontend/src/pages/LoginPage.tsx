import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 16, padding: '40px 36px',
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#16a34a,#22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🐾</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>ResQPet</div>
          <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>Gestión de Protectoras</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', fontSize: 14, outline: 'none',
                fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, color: '#dc2626', marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 0',
              background: loading ? '#86efac' : 'linear-gradient(135deg,#16a34a,#22c55e)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24, padding: '12px 14px', background: 'var(--bg-subtle)',
          borderRadius: 8, border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Usuarios de demo
          </div>
          {[
            { email: 'admin@resqpet.com', pass: 'Admin1234!', rol: 'Admin' },
            { email: 'laura@huellaviva.org', pass: 'Laura1234!', rol: 'Coordinadora' },
            { email: 'marta@huellaviva.org', pass: 'Marta1234!', rol: 'Voluntaria' },
          ].map(u => (
            <div
              key={u.email}
              onClick={() => { setEmail(u.email); setPassword(u.pass); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 0', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{u.email}</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 6 }}>/ {u.pass}</span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: u.rol === 'Admin' ? '#fee2e2' : u.rol === 'Coordinadora' ? '#dbeafe' : '#f3e8ff',
                color: u.rol === 'Admin' ? '#dc2626' : u.rol === 'Coordinadora' ? '#1d4ed8' : '#7e22ce',
              }}>{u.rol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
