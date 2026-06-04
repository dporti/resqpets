import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer style={{ background: '#111827', color: '#d1d5db', marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40, marginBottom: 48,
        }}>
          {/* Logo + descripción */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>🐾</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>ResQPet</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9ca3af', maxWidth: 220 }}>
              La plataforma que conecta animales en busca de hogar con familias dispuestas a darles una segunda oportunidad.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {['𝕏', 'f', 'ig', 'in'].map((s, i) => (
                <a key={i} href="#" style={{
                  width: 36, height: 36, background: '#1f2937',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', textDecoration: 'none',
                  color: '#9ca3af', fontSize: 13, fontWeight: 700,
                  transition: 'background .15s',
                }}>{s}</a>
              ))}
            </div>
          </div>

          {/* Adoptar */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>ADOPTAR</h4>
            {[
              { to: '/adoptar', label: 'Buscar animales' },
              { to: '/adoptar?especie=perro', label: 'Adoptar un perro' },
              { to: '/adoptar?especie=gato', label: 'Adoptar un gato' },
              { to: '/protectoras', label: 'Ver protectoras' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'block', color: '#9ca3af', textDecoration: 'none',
                fontSize: 14, marginBottom: 10,
              }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* ResQPet */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>RESQPET</h4>
            {[
              { to: '/como-funciona', label: 'Cómo funciona' },
              { to: '/sobre-nosotros', label: 'Sobre nosotros' },
              { to: '/sos', label: 'Portal SOS Pet' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'block', color: '#9ca3af', textDecoration: 'none',
                fontSize: 14, marginBottom: 10,
              }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>LEGAL</h4>
            {['Política de privacidad', 'Términos de uso', 'Cookies', 'Contacto'].map(l => (
              <a key={l} href="#" style={{
                display: 'block', color: '#9ca3af', textDecoration: 'none',
                fontSize: 14, marginBottom: 10,
              }}>
                {l}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #1f2937',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            © {new Date().getFullYear()} ResQPet. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Hecho con ❤️ para los animales
          </p>
        </div>
      </div>
    </footer>
  );
}
