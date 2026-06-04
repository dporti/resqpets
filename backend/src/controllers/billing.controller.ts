import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getPlan(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const [refugioRes, usageRes] = await Promise.all([
      query(
        'SELECT plan_id, plan_started_at, plan_expires_at, stripe_customer_id FROM refugios WHERE id=$1',
        [refugioId],
      ),
      query(`
        SELECT
          (SELECT COUNT(*) FROM animales WHERE refugio_id=$1 AND estado!='fallecido') AS animals,
          (SELECT COUNT(*) FROM usuarios WHERE refugio_id=$1 AND activo=true) AS users,
          (SELECT COUNT(*) FROM animal_fotos af JOIN animales a ON af.animal_id=a.id WHERE a.refugio_id=$1) AS fotos
        `, [refugioId]),
    ]);

    const r = refugioRes.rows[0];
    const u = usageRes.rows[0];

    // Estimate storage: assume ~500KB per photo average
    const storage_gb = Math.round((Number(u.fotos) * 0.5) / 1024 * 100) / 100;

    res.json({
      plan_id: r.plan_id || 'free',
      plan_started_at: r.plan_started_at,
      plan_expires_at: r.plan_expires_at,
      stripe_customer_id: r.stripe_customer_id,
      usage: {
        animals: Number(u.animals),
        users: Number(u.users),
        storage_gb,
      },
    });
  } catch (e) {
    console.error('getPlan error:', e);
    res.status(500).json({ error: 'Error al cargar plan' });
  }
}

export async function updatePlan(req: AuthRequest, res: Response) {
  try {
    const refugioId = req.user!.refugioId;
    const { plan_id } = req.body;
    const valid = ['free', 'starter', 'pro', 'enterprise'];
    if (!valid.includes(plan_id)) return res.status(400).json({ error: 'Plan inválido' });

    await query(
      `UPDATE refugios SET plan_id=$1, plan_started_at=NOW(),
        plan_expires_at=NOW() + INTERVAL '30 days'
       WHERE id=$2`,
      [plan_id, refugioId],
    );

    // TODO: integrate Stripe Checkout here for real payments
    res.json({ ok: true, plan_id });
  } catch (e) {
    console.error('updatePlan error:', e);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
}
