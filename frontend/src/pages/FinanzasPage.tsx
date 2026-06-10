import { useEffect, useState, useCallback, FormEvent } from 'react';
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import TopBar from '../components/TopBar';
import { Spinner, ErrorState, formatDate } from '../components/ui';
import { FinancialSummary, AnimalExpense } from '../types';

const CATEGORY_LABEL: Record<string, string> = {
  veterinario: 'Veterinario', alimentacion: 'Alimentación', medicacion: 'Medicación',
  alojamiento: 'Alojamiento', transporte: 'Transporte', esterilizacion: 'Esterilización', otros: 'Otros',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL);
const PIE_COLORS = ['#16a34a', '#3b82f6', '#f97316', '#8b5cf6', '#dc2626', '#0ea5e9', '#6b7280'];

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 };

function fmt(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }

export default function FinanzasPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [gastos, setGastos] = useState<AnimalExpense[]>([]);
  const [gastosTotal, setGastosTotal] = useState(0);
  const [gastosPages, setGastosPages] = useState(1);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getFinancialSummary().then(setSummary).catch(e => { console.error(e); setError(true); }).finally(() => setLoading(false));
  }, []);

  const loadGastos = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 10 };
    if (categoryFilter) params.category = categoryFilter;
    api.getGastos(params).then(r => {
      setGastos(r.data);
      setGastosTotal(r.total);
      setGastosPages(r.pages);
    }).catch(console.error);
  }, [page, categoryFilter]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadGastos(); }, [loadGastos]);

  const handleDelete = async (g: AnimalExpense) => {
    await api.deleteGasto(g.id);
    loadGastos();
    loadSummary();
  };

  const handleCreated = () => {
    setShowModal(false);
    setPage(1);
    loadGastos();
    loadSummary();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-subtle)', minHeight: '100vh' }}>
      <TopBar titulo="Finanzas" subtitulo="Gastos e ingresos del refugio" showNew onNew={() => setShowModal(true)} newLabel="+ Registrar gasto" />

      <div style={{ padding: 28, maxWidth: 1300, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner /></div>
        ) : error || !summary ? (
          <ErrorState onRetry={loadSummary} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>Gastos este mes</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#dc2626' }}>{fmt(summary.this_month.expenses)}</p>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>Ingresos este mes</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#16a34a' }}>{fmt(summary.this_month.income)}</p>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-faint)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>Balance este mes</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: summary.this_month.balance >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(summary.this_month.balance)}</p>
              </div>
            </div>

            {/* Evolución */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>Evolución mensual (12 meses)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={summary.evolution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" fontSize={11} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={11} tick={{ fill: '#9ca3af' }} width={50} tickFormatter={v => `${v}€`} />
                  <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), n === 'expenses' ? 'Gastos' : 'Ingresos']} />
                  <Legend formatter={(n: unknown) => n === 'expenses' ? 'Gastos' : 'Ingresos'} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="expenses" name="expenses" fill="#dc2626" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="income" name="income" stroke="#16a34a" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Gastos por categoría */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Gastos por categoría (este año)</h3>
              {summary.by_category.length === 0 ? <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin datos</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={summary.by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {summary.by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: unknown, n: unknown) => [fmt(v as number), CATEGORY_LABEL[n as string] || (n as string)]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {summary.by_category.map((c, i) => (
                      <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: '#4b5563' }}>{CATEGORY_LABEL[c.category] || c.category}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Listado de gastos */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Gastos registrados ({gastosTotal})</h3>
                <select style={{ ...inp, width: 'auto' }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                  <option value="">Todas las categorías</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </div>

              {gastos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)', fontSize: 13 }}>Sin gastos registrados</div>
              ) : (
                <div>
                  {gastos.map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {CATEGORY_LABEL[g.category] || g.category}{g.animal_nombre ? ` · ${g.animal_nombre}` : ''}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                          {formatDate(g.expense_date)}{g.description ? ` · ${g.description}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>-{fmt(parseFloat(String(g.amount)))}</span>
                        <button onClick={() => handleDelete(g)} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Inter', sans-serif" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {gastosPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: page <= 1 ? 'default' : 'pointer', fontSize: 12.5, opacity: page <= 1 ? 0.5 : 1, fontFamily: "'Inter', sans-serif" }}>← Anterior</button>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)', alignSelf: 'center' }}>Página {page} de {gastosPages}</span>
                  <button disabled={page >= gastosPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: page >= gastosPages ? 'default' : 'pointer', fontSize: 12.5, opacity: page >= gastosPages ? 0.5 : 1, fontFamily: "'Inter', sans-serif" }}>Siguiente →</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && <GastoModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}

function GastoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ category: 'otros', description: '', amount: '', expense_date: new Date().toISOString().slice(0,10), receipt_url: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    try {
      await api.createGasto({ ...form, amount: parseFloat(form.amount) });
      onCreated();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--bg-surface)', borderRadius: 14, width: 480, maxHeight: '90vh', overflowY: 'auto',
        zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Registrar gasto</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-faint)' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Categoría</label>
              <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Importe (€) *</label>
              <input type="number" step="0.01" min="0" style={inp} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label style={lbl}>Fecha</label>
            <input type="date" style={inp} value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Descripción</label>
            <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="ej: Pienso para el refugio" />
          </div>
          <div>
            <label style={lbl}>URL de la factura/recibo</label>
            <input type="url" style={inp} value={form.receipt_url} onChange={e => setForm(f => ({ ...f, receipt_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving || !form.amount} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
