import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

const CATEGORIES = ['veterinario', 'alimentacion', 'medicacion', 'alojamiento', 'transporte', 'esterilizacion', 'otros'];

// ── LIST EXPENSES ──────────────────────────────────────────────────────
export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { animal_id, category, date_from, date_to, page = '1', limit = '25' } = req.query as Record<string, string>;

    const conditions = ['e.shelter_id=$1'];
    const params: unknown[] = [rid];

    if (animal_id) { params.push(animal_id); conditions.push(`e.animal_id=$${params.length}`); }
    if (category)  { params.push(category);  conditions.push(`e.category=$${params.length}`); }
    if (date_from) { params.push(date_from); conditions.push(`e.expense_date >= $${params.length}`); }
    if (date_to)   { params.push(date_to);   conditions.push(`e.expense_date <= $${params.length}`); }

    const where = conditions.join(' AND ');
    const pageN = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageN - 1) * limitN;

    const [dataRes, countRes, totalRes] = await Promise.all([
      query(`SELECT e.*, a.nombre AS animal_nombre
             FROM animal_expenses e
             LEFT JOIN animales a ON e.animal_id=a.id
             WHERE ${where}
             ORDER BY e.expense_date DESC, e.id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitN, offset]),
      query(`SELECT COUNT(*) FROM animal_expenses e WHERE ${where}`, params),
      query(`SELECT COALESCE(SUM(e.amount),0) AS total FROM animal_expenses e WHERE ${where}`, params),
    ]);

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      total_amount: parseFloat(totalRes.rows[0].total),
      page: pageN, limit: limitN,
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limitN),
    });
  } catch (e) {
    console.error('getExpenses error:', e);
    res.status(500).json({ error: 'Error al cargar gastos' });
  }
}

// ── CREATE EXPENSE ───────────────────────────────────────────────────
export async function createExpense(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const userId = req.user!.userId;
    const { animal_id, category = 'otros', description, amount, expense_date, receipt_url } = req.body;

    if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Importe requerido' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Categoría inválida' });

    if (animal_id) {
      const a = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [animal_id, rid]);
      if (!a.rows.length) return res.status(404).json({ error: 'Animal no encontrado' });
    }

    const r = await query(`
      INSERT INTO animal_expenses (shelter_id, animal_id, category, description, amount, expense_date, receipt_url, created_by)
      VALUES ($1,$2,$3,$4,$5,COALESCE($6, CURRENT_DATE),$7,$8)
      RETURNING *`,
      [rid, animal_id || null, category, description || null, parseFloat(amount), expense_date || null, receipt_url || null, userId]);

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('createExpense error:', e);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
}

// ── UPDATE EXPENSE ───────────────────────────────────────────────────
export async function updateExpense(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const fields = ['animal_id', 'category', 'description', 'amount', 'expense_date', 'receipt_url'];
    const updates: string[] = [];
    const params: unknown[] = [id, rid];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'category' && !CATEGORIES.includes(req.body[f])) {
          return res.status(400).json({ error: 'Categoría inválida' });
        }
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin cambios' });
    updates.push('updated_at=NOW()');

    const r = await query(
      `UPDATE animal_expenses SET ${updates.join(',')} WHERE id=$1 AND shelter_id=$2 RETURNING *`,
      params,
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('updateExpense error:', e);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
}

// ── DELETE EXPENSE ───────────────────────────────────────────────────
export async function deleteExpense(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const r = await query('DELETE FROM animal_expenses WHERE id=$1 AND shelter_id=$2 RETURNING id', [id, rid]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteExpense error:', e);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
}

// ── FINANCIAL SUMMARY (refugio) ───────────────────────────────────────
export async function getFinancialSummary(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    const [expensesM, incomeM, byCategory, evolution] = await Promise.all([
      query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
             FROM animal_expenses WHERE shelter_id=$1
             AND EXTRACT(YEAR FROM expense_date)=$2 AND EXTRACT(MONTH FROM expense_date)=$3`,
        [rid, y, m]),
      query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
             FROM donations WHERE shelter_id=$1 AND status='confirmed'
             AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3`,
        [rid, y, m]),
      query(`SELECT category, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
             FROM animal_expenses WHERE shelter_id=$1
             AND EXTRACT(YEAR FROM expense_date)=$2 GROUP BY category`,
        [rid, y]),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS label,
          DATE_TRUNC('month', m.mes) AS mes_date,
          COALESCE(exp.total,0) AS expenses,
          COALESCE(inc.total,0) AS income
        FROM generate_series(
          (NOW() - INTERVAL '11 months')::date,
          NOW()::date, '1 month') AS m(mes)
        LEFT JOIN (
          SELECT DATE_TRUNC('month', expense_date) AS mes, SUM(amount) AS total
          FROM animal_expenses WHERE shelter_id=$1 GROUP BY mes) exp ON exp.mes = m.mes
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) AS mes, SUM(amount) AS total
          FROM donations WHERE shelter_id=$1 AND status='confirmed' GROUP BY mes) inc ON inc.mes = m.mes
        ORDER BY m.mes`, [rid]),
    ]);

    const expensesTotal = parseFloat(expensesM.rows[0].total);
    const incomeTotal = parseFloat(incomeM.rows[0].total);

    res.json({
      this_month: {
        expenses: expensesTotal,
        income: incomeTotal,
        balance: incomeTotal - expensesTotal,
      },
      by_category: byCategory.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
      evolution: evolution.rows.map(r => ({ ...r, expenses: parseFloat(r.expenses), income: parseFloat(r.income) })),
    });
  } catch (e) {
    console.error('getFinancialSummary error:', e);
    res.status(500).json({ error: 'Error al cargar resumen financiero' });
  }
}

// ── ANIMAL FINANCIALS (gastos + ingresos vinculados) ──────────────────
export async function getAnimalFinancials(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;

    const animal = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, rid]);
    if (!animal.rows.length) return res.status(404).json({ error: 'Animal no encontrado' });

    const [expenses, expensesTotal, incomeTotal] = await Promise.all([
      query(`SELECT * FROM animal_expenses WHERE animal_id=$1 AND shelter_id=$2 ORDER BY expense_date DESC, id DESC`, [id, rid]),
      query(`SELECT COALESCE(SUM(amount),0) AS total FROM animal_expenses WHERE animal_id=$1 AND shelter_id=$2`, [id, rid]),
      query(`SELECT COALESCE(SUM(amount),0) AS total FROM donations WHERE animal_id=$1 AND shelter_id=$2 AND status='confirmed'`, [id, rid]),
    ]);

    const totalExpenses = parseFloat(expensesTotal.rows[0].total);
    const totalIncome = parseFloat(incomeTotal.rows[0].total);

    res.json({
      expenses: expenses.rows,
      total_expenses: totalExpenses,
      total_income: totalIncome,
      balance: totalIncome - totalExpenses,
    });
  } catch (e) {
    console.error('getAnimalFinancials error:', e);
    res.status(500).json({ error: 'Error al cargar finanzas del animal' });
  }
}
