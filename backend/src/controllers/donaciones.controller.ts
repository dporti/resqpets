import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// ── RESUMEN / SUMMARY ─────────────────────────────────────────────────
export async function getSummary(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;

    const [thisM, prevMR, historical, evolution, byChannel, byType, topDonors, latest, goal] =
      await Promise.all([
        query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count,
                COUNT(DISTINCT COALESCE(donor_email,'anon_'||id)) AS unique_donors
               FROM donations WHERE shelter_id=$1 AND status='confirmed'
               AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3`,
          [rid, y, m]),
        query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
               FROM donations WHERE shelter_id=$1 AND status='confirmed'
               AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3`,
          [rid, prevY, prevM]),
        query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
               FROM donations WHERE shelter_id=$1 AND status='confirmed'`, [rid]),
        query(`
          SELECT TO_CHAR(DATE_TRUNC('month', m.mes), 'Mon YY') AS label,
            DATE_TRUNC('month', m.mes) AS mes_date,
            COALESCE(d.total,0) AS amount,
            COALESCE(d.count,0) AS count
          FROM generate_series(
            (NOW() - INTERVAL '11 months')::date,
            NOW()::date, '1 month') AS m(mes)
          LEFT JOIN (
            SELECT DATE_TRUNC('month', created_at) AS mes,
              SUM(amount) AS total, COUNT(*) AS count
            FROM donations WHERE shelter_id=$1 AND status='confirmed'
            GROUP BY mes) d ON d.mes = m.mes
          ORDER BY m.mes`, [rid]),
        query(`SELECT channel, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
               FROM donations WHERE shelter_id=$1 AND status='confirmed'
               AND EXTRACT(YEAR FROM created_at)=$2 GROUP BY channel`, [rid, y]),
        query(`SELECT donation_type AS type, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
               FROM donations WHERE shelter_id=$1 AND status='confirmed'
               AND EXTRACT(YEAR FROM created_at)=$2 GROUP BY donation_type`, [rid, y]),
        query(`SELECT COALESCE(donor_name,'Anónimo') AS name, donor_email,
                SUM(amount) AS total, COUNT(*) AS count
               FROM donations WHERE shelter_id=$1 AND status='confirmed'
               AND EXTRACT(YEAR FROM created_at)=$2 AND EXTRACT(MONTH FROM created_at)=$3
               GROUP BY donor_name, donor_email ORDER BY total DESC LIMIT 5`, [rid, y, m]),
        query(`SELECT d.*, dc.name AS campaign_name
               FROM donations d LEFT JOIN donation_campaigns dc ON d.campaign_id=dc.id
               WHERE d.shelter_id=$1 AND d.status='confirmed'
               ORDER BY d.created_at DESC LIMIT 5`, [rid]),
        query(`SELECT goal_donations_monthly FROM shelter_config WHERE shelter_id=$1`, [rid]),
      ]);

    res.json({
      this_month: { ...thisM.rows[0], total: parseFloat(thisM.rows[0].total) },
      prev_month:  { ...prevMR.rows[0], total: parseFloat(prevMR.rows[0].total) },
      historical:  { ...historical.rows[0], total: parseFloat(historical.rows[0].total) },
      evolution: evolution.rows,
      by_channel: byChannel.rows,
      by_type: byType.rows,
      top_donors: topDonors.rows,
      latest: latest.rows,
      goal: parseFloat(goal.rows[0]?.goal_donations_monthly || '0'),
    });
  } catch (e) {
    console.error('getSummary error:', e);
    res.status(500).json({ error: 'Error al cargar resumen de donaciones' });
  }
}

// ── LIST DONATIONS ────────────────────────────────────────────────────
export async function getDonations(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { search, channel, type, campaign, status, date_from, date_to,
      amount_min, amount_max, page = '1', limit = '25' } = req.query as Record<string, string>;

    const conditions = ['d.shelter_id=$1'];
    const params: unknown[] = [rid];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(d.donor_name ILIKE $${params.length} OR d.concept ILIKE $${params.length} OR d.internal_reference ILIKE $${params.length})`);
    }
    if (channel) { params.push(channel); conditions.push(`d.channel=$${params.length}`); }
    if (type)    { params.push(type);    conditions.push(`d.donation_type=$${params.length}`); }
    if (status)  { params.push(status);  conditions.push(`d.status=$${params.length}`); }
    if (campaign){ params.push(campaign);conditions.push(`d.campaign_id=$${params.length}`); }
    if (date_from){ params.push(date_from); conditions.push(`d.created_at >= $${params.length}`); }
    if (date_to)  { params.push(date_to);   conditions.push(`d.created_at <= $${params.length}::date + 1`); }
    if (amount_min){ params.push(amount_min); conditions.push(`d.amount >= $${params.length}`); }
    if (amount_max){ params.push(amount_max); conditions.push(`d.amount <= $${params.length}`); }

    const where = conditions.join(' AND ');
    const pageN = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageN - 1) * limitN;

    const [dataRes, countRes, totalRes] = await Promise.all([
      query(`SELECT d.*, dc.name AS campaign_name, dc.primary_color AS campaign_color,
               u.nombre AS registered_by_nombre
             FROM donations d
             LEFT JOIN donation_campaigns dc ON d.campaign_id=dc.id
             LEFT JOIN usuarios u ON d.registered_by=u.id
             WHERE ${where}
             ORDER BY d.created_at DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitN, offset]),
      query(`SELECT COUNT(*) FROM donations d WHERE ${where}`, params),
      query(`SELECT COALESCE(SUM(d.amount),0) AS total FROM donations d WHERE ${where} AND d.status='confirmed'`, params),
    ]);

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      total_amount: parseFloat(totalRes.rows[0].total),
      page: pageN, limit: limitN,
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limitN),
    });
  } catch (e) {
    console.error('getDonations error:', e);
    res.status(500).json({ error: 'Error al cargar donaciones' });
  }
}

// ── CREATE DONATION ───────────────────────────────────────────────────
export async function createDonation(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const userId = req.user!.userId;
    const {
      amount, channel = 'transfer', donation_type = 'one_time', recurrence_frequency,
      next_donation_date, status = 'confirmed', campaign_id,
      is_anonymous = false, donor_name, donor_email, donor_phone, donor_nif,
      concept, internal_reference,
    } = req.body;

    if (!amount || isNaN(parseFloat(amount))) return res.status(400).json({ error: 'Importe requerido' });

    // Generate receipt number
    const rcptRes = await query(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(receipt_number, '-', 3) AS INTEGER)), 0) + 1 AS next
       FROM donations WHERE shelter_id=$1 AND receipt_number LIKE $2`,
      [rid, `REC-${new Date().getFullYear()}-%`],
    );
    const receiptNum = `REC-${new Date().getFullYear()}-${String(rcptRes.rows[0].next).padStart(4, '0')}`;

    const r = await query(`
      INSERT INTO donations (shelter_id, amount, channel, donation_type, recurrence_frequency,
        next_donation_date, status, campaign_id, is_anonymous, donor_name, donor_email,
        donor_phone, donor_nif, concept, internal_reference, receipt_number, registered_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [rid, parseFloat(amount), channel, donation_type, recurrence_frequency || null,
        next_donation_date || null, status, campaign_id || null,
        is_anonymous, is_anonymous ? null : (donor_name || null),
        is_anonymous ? null : (donor_email || null),
        is_anonymous ? null : (donor_phone || null),
        is_anonymous ? null : (donor_nif || null),
        concept || null, internal_reference || null, receiptNum, userId]);

    // Update campaign raised_amount
    if (campaign_id && status === 'confirmed') {
      await query('UPDATE donation_campaigns SET raised_amount=raised_amount+$1, updated_at=NOW() WHERE id=$2',
        [parseFloat(amount), campaign_id]).catch(() => {});
    }

    // Upsert donor
    if (!is_anonymous && donor_email) {
      await query(`
        INSERT INTO donors (shelter_id, name, email, phone, nif, total_donated, donations_count,
          is_recurring, first_donation_at, last_donation_at)
        VALUES ($1,$2,$3,$4,$5,$6,1,$7,NOW(),NOW())
        ON CONFLICT(shelter_id, email) DO UPDATE SET
          total_donated = donors.total_donated + $6,
          donations_count = donors.donations_count + 1,
          is_recurring = CASE WHEN $7 THEN true ELSE donors.is_recurring END,
          last_donation_at = NOW(),
          name = COALESCE($2, donors.name),
          updated_at = NOW()`,
        [rid, donor_name || null, donor_email, donor_phone || null, donor_nif || null,
          parseFloat(amount), donation_type === 'recurring']).catch(() => {});
    }

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('createDonation error:', e);
    res.status(500).json({ error: 'Error al registrar donación' });
  }
}

// ── UPDATE DONATION STATUS ─────────────────────────────────────────────
export async function updateDonation(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const { status } = req.body;
    const r = await query(
      'UPDATE donations SET status=$1, updated_at=NOW() WHERE id=$2 AND shelter_id=$3 RETURNING *',
      [status, id, rid],
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────
export async function getCampaigns(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const r = await query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM donations d WHERE d.campaign_id=c.id AND d.status='confirmed') AS donations_count
      FROM donation_campaigns c WHERE c.shelter_id=$1
      ORDER BY CASE c.status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, c.created_at DESC`,
      [rid]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Error al cargar campañas' }); }
}

export async function getCampaign(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const [cRes, donRes, evRes] = await Promise.all([
      query(`SELECT c.*,
               (SELECT COUNT(*) FROM donations d WHERE d.campaign_id=c.id AND d.status='confirmed') AS donations_count,
               (SELECT COUNT(DISTINCT COALESCE(d.donor_email,'anon_'||d.id)) FROM donations d WHERE d.campaign_id=c.id AND d.status='confirmed') AS unique_donors
             FROM donation_campaigns c WHERE c.id=$1 AND c.shelter_id=$2`, [id, rid]),
      query(`SELECT * FROM donations WHERE campaign_id=$1 AND shelter_id=$2 AND status='confirmed' ORDER BY created_at DESC LIMIT 20`, [id, rid]),
      query(`SELECT DATE(created_at) AS dia, SUM(amount) AS total FROM donations
             WHERE campaign_id=$1 AND status='confirmed' GROUP BY DATE(created_at) ORDER BY dia`, [id]),
    ]);
    if (!cRes.rows.length) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ ...cRes.rows[0], donations: donRes.rows, evolution: evRes.rows });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
}

export async function createCampaign(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const userId = req.user!.userId;
    const { name, slug, description_short, description_long, cover_image_url,
      goal_amount, status = 'draft', starts_at, ends_at, is_public = true,
      show_on_animal_profiles = false, related_animal_id, primary_color = '#16a34a' } = req.body;

    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const r = await query(`
      INSERT INTO donation_campaigns (shelter_id, name, slug, description_short, description_long,
        cover_image_url, goal_amount, status, starts_at, ends_at, is_public,
        show_on_animal_profiles, related_animal_id, primary_color, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [rid, name, autoSlug, description_short || null, description_long || null,
        cover_image_url || null, parseFloat(goal_amount) || 0, status,
        starts_at || null, ends_at || null, is_public,
        show_on_animal_profiles, related_animal_id || null, primary_color, userId]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error al crear campaña' }); }
}

export async function updateCampaign(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const fields = ['name','slug','description_short','description_long','cover_image_url',
      'goal_amount','status','starts_at','ends_at','is_public','show_on_animal_profiles',
      'related_animal_id','primary_color'];
    const updates: string[] = [];
    const params: unknown[] = [id, rid];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin cambios' });
    updates.push('updated_at=NOW()');
    const r = await query(
      `UPDATE donation_campaigns SET ${updates.join(',')} WHERE id=$1 AND shelter_id=$2 RETURNING *`,
      params,
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
}

// ── DONORS ────────────────────────────────────────────────────────────
export async function getDonors(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { search, type } = req.query as Record<string, string>;
    const conds = ['shelter_id=$1'];
    const params: unknown[] = [rid];
    if (search) { params.push(`%${search}%`); conds.push(`name ILIKE $${params.length} OR email ILIKE $${params.length}`); }
    if (type === 'recurring') conds.push('is_recurring=true');
    if (type === 'one_time')  conds.push('is_recurring=false');
    const r = await query(
      `SELECT * FROM donors WHERE ${conds.join(' AND ')} ORDER BY total_donated DESC`,
      params,
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
}

export async function getDonorHistory(req: AuthRequest, res: Response) {
  try {
    const rid = req.user!.refugioId;
    const { id } = req.params;
    const [donor, history] = await Promise.all([
      query('SELECT * FROM donors WHERE id=$1 AND shelter_id=$2', [id, rid]),
      query(`SELECT d.*, dc.name AS campaign_name FROM donations d
             LEFT JOIN donation_campaigns dc ON d.campaign_id=dc.id
             WHERE d.shelter_id=$1 AND d.donor_email=(SELECT email FROM donors WHERE id=$2)
             ORDER BY d.created_at DESC`, [rid, id]),
    ]);
    if (!donor.rows.length) return res.status(404).json({ error: 'Donante no encontrado' });
    res.json({ ...donor.rows[0], history: history.rows });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
}
