import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/adoptar', label: 'Adoptar' },
  { to: '/sos', label: 'SOS Pet' },
  { to: '/protectoras', label: 'Protectoras' },
  { to: '/como-funciona', label: 'Cómo funciona' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 20px',
        display: 'flex', alignItems: 'center',
        height: 64, gap: 32,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 26 }}>🐾</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#16a34a', letterSpacing: '-0.5px' }}>
            ResQ<span style={{ color: '#22c55e' }}>Pet</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }} className="desktop-nav">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} style={{
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 14, fontWeight: 500,
              color: loc.pathname.startsWith(n.to) ? '#16a34a' : '#374151',
              background: loc.pathname.startsWith(n.to) ? '#f0fdf4' : 'transparent',
              transition: 'all .15s',
            }}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* CTAs desktop */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="desktop-ctas">
          <Link to="/sos" style={{
            textDecoration: 'none',
            padding: '8px 18px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            🚨 Aviso SOS
          </Link>
          <a href="http://localhost:5173" style={{
            textDecoration: 'none',
            padding: '8px 16px',
            border: '1.5px solid #d1d5db',
            color: '#374151',
            borderRadius: 10,
            fontSize: 13, fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            CRM →
          </a>
        </div>

        {/* Hamburguesa móvil */}
        <button
          onClick={() => setOpen(!open)}
          className="mobile-menu-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, marginLeft: 'auto',
            display: 'none',
          }}
          aria-label="Menú"
        >
          <span style={{ fontSize: 22 }}>{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '12px 20px 20px',
          background: '#fff',
        }}>
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '12px 8px',
                textDecoration: 'none',
                fontSize: 15, fontWeight: 500,
                color: loc.pathname.startsWith(n.to) ? '#16a34a' : '#374151',
                borderBottom: '1px solid #f3f4f6',
              }}>
              {n.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link to="/sos" onClick={() => setOpen(false)} style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '10px', background: '#22c55e', color: '#fff',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
            }}>
              🚨 Aviso SOS
            </Link>
            <a href="http://localhost:5173" style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '10px', border: '1.5px solid #d1d5db', color: '#374151',
              borderRadius: 10, fontSize: 13,
            }}>
              Acceder al CRM
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-ctas { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
