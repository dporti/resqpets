import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { PublicAnimal } from '../types';
import { AnimalCard, AnimalCardSkeleton } from '../components/AnimalCard';
import { SEOHead } from '../components/SEOHead';

const ESPECIES = [
  { val: '', label: 'Todos', emoji: '🐾' },
  { val: 'perro', label: 'Perros', emoji: '🐕' },
  { val: 'gato', label: 'Gatos', emoji: '🐈' },
  { val: 'otro', label: 'Otros', emoji: '🐰' },
];
const TAMAÑOS = [
  { val: '', label: 'Todos' },
  { val: 'pequeño', label: 'Pequeño' },
  { val: 'mediano', label: 'Mediano' },
  { val: 'grande', label: 'Grande' },
];

export function AdoptarPage() {
  const [params, setParams] = useSearchParams();
  const [animals, setAnimals] = useState<PublicAnimal[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const especie = params.get('especie') || '';
  const search = params.get('search') || '';
  const tamaño = params.get('tamaño') || '';
  const sexo = params.get('sexo') || '';
  const vacunado = params.get('vacunado') || '';
  const esterilizado = params.get('esterilizado') || '';
  const page = parseInt(params.get('page') || '1', 10);
  const order = params.get('order') || 'reciente';

  const setParam = useCallback((key: string, val: string) => {
    setParams(prev => {
      const n = new URLSearchParams(prev);
      if (val) n.set(key, val); else n.delete(key);
      n.delete('page');
      return n;
    });
  }, [setParams]);

  const clearFilters = () => setParams({});

  useEffect(() => {
    setLoading(true);
    const q: Record<string, string | number> = { page, limit: 20, order };
    if (especie) q.especie = especie;
    if (search) q.search = search;
    if (tamaño) q.tamaño = tamaño;
    if (sexo) q.sexo = sexo;
    if (vacunado) q.vacunado = vacunado;
    if (esterilizado) q.esterilizado = esterilizado;

    api.getAnimals(q).then(r => {
      setAnimals(r.animals);
      setTotal(r.total);
      setPages(r.pages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [especie, search, tamaño, sexo, vacunado, esterilizado, page, order]);

  const metaTitle = `Adoptar ${especie ? (especie === 'perro' ? 'perros' : especie === 'gato' ? 'gatos' : 'animales') : 'animales'}`;
  const hasFilters = !!(especie || search || tamaño || sexo || vacunado || esterilizado);

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={`${total > 0 ? `${total} animales` : 'Animales'} en adopción te esperan en ResQPet`}
      />

      {/* Hero pequeño */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b, #065f46)',
        padding: '48px 20px 40px', color: '#fff', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px' }}>
          Encuentra a tu compañero perfecto
        </h1>
        {/* Buscador */}
        <div style={{ maxWidth: 540, margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={e => setParam('search', e.target.value)}
            placeholder="Busca por raza, nombre o descripción..."
            style={{
              width: '100%', padding: '14px 50px 14px 18px',
              borderRadius: 12, border: 'none', fontSize: 15,
              outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            }}
          />
          <span style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, opacity: .5,
          }}>🔍</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', gap: 28 }}>

          {/* SIDEBAR FILTROS */}
          <aside style={{
            width: 240, flexShrink: 0,
            display: filterOpen ? 'block' : undefined,
          }} className="filters-sidebar">
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 14, padding: '20px', position: 'sticky', top: 80,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Filtros</h3>
                {hasFilters && (
                  <button onClick={clearFilters} style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  }}>
                    Limpiar
                  </button>
                )}
              </div>

              {/* Especie */}
              <FilterSection title="Especie">
                {ESPECIES.map(e => (
                  <button key={e.val} onClick={() => setParam('especie', e.val)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: especie === e.val ? '#22c55e' : '#e5e7eb',
                    background: especie === e.val ? '#f0fdf4' : '#fff',
                    color: especie === e.val ? '#16a34a' : '#374151',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    marginBottom: 6, transition: 'all .15s',
                  }}>
                    <span>{e.emoji}</span> {e.label}
                  </button>
                ))}
              </FilterSection>

              {/* Tamaño */}
              <FilterSection title="Tamaño">
                {TAMAÑOS.map(t => (
                  <button key={t.val} onClick={() => setParam('tamaño', t.val)} style={{
                    display: 'inline-block',
                    padding: '6px 14px', borderRadius: 20,
                    border: '1.5px solid',
                    borderColor: tamaño === t.val ? '#22c55e' : '#e5e7eb',
                    background: tamaño === t.val ? '#f0fdf4' : '#fff',
                    color: tamaño === t.val ? '#16a34a' : '#374151',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    marginRight: 6, marginBottom: 6, transition: 'all .15s',
                  }}>
                    {t.label}
                  </button>
                ))}
              </FilterSection>

              {/* Sexo */}
              <FilterSection title="Sexo">
                {[{ val: '', label: 'Indiferente' }, { val: 'macho', label: '♂ Macho' }, { val: 'hembra', label: '♀ Hembra' }].map(s => (
                  <button key={s.val} onClick={() => setParam('sexo', s.val)} style={{
                    display: 'inline-block',
                    padding: '6px 14px', borderRadius: 20,
                    border: '1.5px solid',
                    borderColor: sexo === s.val ? '#22c55e' : '#e5e7eb',
                    background: sexo === s.val ? '#f0fdf4' : '#fff',
                    color: sexo === s.val ? '#16a34a' : '#374151',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    marginRight: 6, marginBottom: 6,
                  }}>
                    {s.label}
                  </button>
                ))}
              </FilterSection>

              {/* Características */}
              <FilterSection title="Características">
                <CheckFilter
                  label="✓ Vacunado"
                  active={vacunado === 'true'}
                  onToggle={() => setParam('vacunado', vacunado === 'true' ? '' : 'true')}
                />
                <CheckFilter
                  label="✓ Esterilizado"
                  active={esterilizado === 'true'}
                  onToggle={() => setParam('esterilizado', esterilizado === 'true' ? '' : 'true')}
                />
              </FilterSection>
            </div>
          </aside>

          {/* RESULTADOS */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Barra superior resultados */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                  {loading ? '...' : `${total} animales encontrados`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* Botón filtros en móvil */}
                <button onClick={() => setFilterOpen(!filterOpen)} className="mobile-filter-btn" style={{
                  padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  display: 'none',
                }}>
                  🔧 Filtros {hasFilters ? '(activos)' : ''}
                </button>
                <select
                  value={order}
                  onChange={e => setParam('order', e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                    fontSize: 13, background: '#fff', cursor: 'pointer',
                  }}
                >
                  <option value="reciente">Más reciente</option>
                  <option value="vistas">Más visto</option>
                  <option value="nombre">Por nombre</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 18,
            }}>
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <AnimalCardSkeleton key={i} />)
                : animals.map(a => <AnimalCard key={a.id} animal={a} />)
              }
            </div>

            {/* Sin resultados */}
            {!loading && animals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontSize: 20, color: '#374151', marginBottom: 8 }}>
                  No encontramos animales con estos filtros
                </h3>
                <p style={{ marginBottom: 24 }}>Prueba ajustando la búsqueda</p>
                <button onClick={clearFilters} style={{
                  padding: '10px 24px', background: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: 15,
                }}>
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Paginación */}
            {!loading && pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                <PageBtn
                  label="← Anterior"
                  disabled={page <= 1}
                  onClick={() => setParams(p => { const n = new URLSearchParams(p); n.set('page', String(page - 1)); return n; })}
                />
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <PageBtn key={p} label={String(p)} active={p === page}
                      onClick={() => setParams(prev => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}
                    />
                  );
                })}
                <PageBtn
                  label="Siguiente →"
                  disabled={page >= pages}
                  onClick={() => setParams(p => { const n = new URLSearchParams(p); n.set('page', String(page + 1)); return n; })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filters-sidebar { display: none !important; }
          .mobile-filter-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#9ca3af', letterSpacing: '.5px', textTransform: 'uppercase' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function CheckFilter({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', padding: '6px 0', background: 'none', border: 'none',
      cursor: 'pointer', fontSize: 13, color: active ? '#16a34a' : '#374151',
      marginBottom: 4,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4, border: '2px solid',
        borderColor: active ? '#22c55e' : '#d1d5db',
        background: active ? '#22c55e' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#fff', flexShrink: 0,
      }}>
        {active ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}

function PageBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 14px', borderRadius: 8,
      border: '1.5px solid',
      borderColor: active ? '#22c55e' : '#e5e7eb',
      background: active ? '#22c55e' : '#fff',
      color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 14, fontWeight: active ? 600 : 400,
    }}>
      {label}
    </button>
  );
}
