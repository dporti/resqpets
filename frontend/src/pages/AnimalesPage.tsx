import { useEffect, useState, useCallback } from 'react';
import { Animal } from '../types';
import { api } from '../api/client';
import { Badge, AnimalAvatar, EmptyState, ErrorState, SkeletonList, formatDateTime } from '../components/ui';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useAnimalList } from '../context/AnimalListContext';
import AnimalForm from './AnimalForm';

interface Props {
  onVerAnimal: (a: Animal) => void;
}

const ESTADOS = [
  { val: '', label: 'Todos' },
  { val: 'en_acogida', label: 'En acogida' },
  { val: 'en_residencia', label: 'En residencia' },
  { val: 'en_adopcion', label: 'En adopción' },
  { val: 'en_proceso', label: 'En proceso' },
  { val: 'en_evaluacion', label: 'En evaluación' },
  { val: 'fallecido', label: 'Fallecido' },
];

const LIMIT = 20;

export default function AnimalesPage({ onVerAnimal }: Props) {
  const { can } = useAuth();
  const { setList } = useAnimalList();
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [especie, setEspecie] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (estado) params.estado = estado;
      if (especie) params.especie = especie;
      const res = await api.getAnimales(params);
      setAnimales(res.data);
      setTotal(res.total);
      setList(res.data.map(a => ({ id: a.id, nombre: a.nombre })));
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search, estado, especie]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleNuevo = () => { setEditAnimal(null); setShowForm(true); };
  const handleEditar = (a: Animal, e: React.MouseEvent) => { e.stopPropagation(); setEditAnimal(a); setShowForm(true); };
  const handleSaved = () => { setShowForm(false); load(); };
  const handleEstado = (val: string) => { setEstado(val); setPage(1); };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f9fafb', minHeight: '100vh' }}>
      <TopBar
        titulo="Animales"
        subtitulo={`${total} registrados`}
        onNew={can('animales:create') ? handleNuevo : undefined}
        showNew={can('animales:create')}
      />

      {/* Filters bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>🔍</span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, raza o ID..."
            style={{
              width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #e5e7eb',
              borderRadius: 8, fontSize: 13.5, background: '#fff', outline: 'none',
              fontFamily: "'Inter', sans-serif", color: '#111', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={especie}
          onChange={e => { setEspecie(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 13.5, background: '#fff', cursor: 'pointer', outline: 'none',
            fontFamily: "'Inter', sans-serif", color: '#374151',
          }}
        >
          <option value="">Todas las especies</option>
          <option value="perro">🐕 Perros</option>
          <option value="gato">🐈 Gatos</option>
          <option value="otro">🐾 Otros</option>
        </select>
      </div>

      {/* Estado tabs */}
      <div style={{ padding: '12px 24px 0', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {ESTADOS.map(e => {
          const active = estado === e.val;
          return (
            <button key={e.val} onClick={() => handleEstado(e.val)} style={{
              padding: '7px 14px', borderRadius: 20, border: '1px solid',
              borderColor: active ? '#16a34a' : '#e5e7eb',
              fontSize: 12.5, fontWeight: active ? 600 : 400, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
              background: active ? '#16a34a' : '#fff',
              color: active ? '#fff' : '#6b7280',
              transition: 'all 0.15s',
            }}>{e.label}</button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : animales.length === 0 ? (
          <EmptyState icon="🐾" title="No hay animales con estos filtros" subtitle="Prueba otros filtros o registra un nuevo animal" />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Animal', 'Estado', 'Especie / Raza', 'Ubicación', 'Salud', 'Actualizado', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 12,
                      color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {animales.map(a => {
                  const raw = a as Animal & { id_interno?: string; updated_at?: string };
                  return (
                    <tr key={a.id}
                      onClick={() => onVerAnimal(a)}
                      style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AnimalAvatar especie={a.especie} id={a.id} size={38} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111' }}>{a.nombre}</div>
                            <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{raw.id_interno || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><Badge estado={a.estado} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{a.especie}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.raza || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                        {(a as Animal & { ubicacion_texto?: string }).ubicacion_texto || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {a.vacunado && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>Vac</span>}
                          {a.esterilizado && <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>Est</span>}
                          {a.microchip && <span style={{ background: '#f3e8ff', color: '#9333ea', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>Chip</span>}
                          {!a.vacunado && !a.esterilizado && !a.microchip && <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {formatDateTime(raw.updated_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {can('animales:update') && (
                          <button
                            onClick={e => handleEditar(a, e)}
                            style={{
                              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                              padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: '#374151',
                              fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                            }}
                          >Editar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 20px', borderTop: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 13, color: '#6b7280',
              }}>
                <span>
                  Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{
                    padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
                    background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, fontFamily: "'Inter', sans-serif",
                  }}>← Anterior</button>
                  <span style={{ padding: '5px 12px', background: '#f0fdf4', borderRadius: 6, color: '#16a34a', fontWeight: 600 }}>
                    {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{
                    padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
                    background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, fontFamily: "'Inter', sans-serif",
                  }}>Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form slide-over */}
      {showForm && (
        <AnimalForm
          animal={editAnimal}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
