import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function getAnimales(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { estado, especie, search, page = 1, limit = 20 } = req.query;
    const refugioId = req.user!.refugioId;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: string[] = ['a.refugio_id = $1'];
    const params: unknown[] = [refugioId];
    let idx = 2;

    if (estado) {
      conditions.push(`a.estado = $${idx++}`);
      params.push(estado);
    }
    if (especie) {
      conditions.push(`a.especie = $${idx++}`);
      params.push(especie);
    }
    if (search) {
      conditions.push(`(a.nombre ILIKE $${idx} OR a.raza ILIKE $${idx} OR a.id_interno ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT a.*,
                f.url as foto_principal,
                EXTRACT(YEAR FROM AGE(a.fecha_nacimiento)) as edad_años,
                EXTRACT(MONTH FROM AGE(a.fecha_nacimiento)) as edad_meses
         FROM animales a
         LEFT JOIN animal_fotos f ON f.animal_id = a.id AND f.es_principal = true
         WHERE ${where}
         ORDER BY a.updated_at DESC
         LIMIT $${idx} OFFSET $${idx+1}`,
        [...params, Number(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM animales a WHERE ${where}`, params),
    ]);

    res.json({
      data: dataRes.rows,
      total: Number(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(Number(countRes.rows[0].count) / Number(limit)),
    });
  } catch (err) {
    console.error('getAnimales error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function getAnimal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;

    const [animalRes, fotosRes, notasRes, actividadRes] = await Promise.all([
      query(
        `SELECT a.* FROM animales a WHERE a.id = $1 AND a.refugio_id = $2`,
        [id, refugioId]
      ),
      query(`SELECT * FROM animal_fotos WHERE animal_id = $1 ORDER BY es_principal DESC`, [id]),
      query(
        `SELECT n.*, u.nombre as autor_nombre, u.avatar_url as autor_avatar
         FROM animal_notas n
         LEFT JOIN usuarios u ON u.id = n.autor_id
         WHERE n.animal_id = $1
         ORDER BY n.pinned DESC, n.created_at DESC`,
        [id]
      ),
      query(
        `SELECT ac.*, u.nombre as usuario_nombre
         FROM actividad ac
         LEFT JOIN usuarios u ON u.id = ac.usuario_id
         WHERE ac.animal_id = $1
         ORDER BY ac.created_at DESC
         LIMIT 10`,
        [id]
      ),
    ]);

    if (animalRes.rows.length === 0) {
      res.status(404).json({ error: 'Animal no encontrado' });
      return;
    }

    res.json({
      ...animalRes.rows[0],
      fotos: fotosRes.rows,
      notas: notasRes.rows,
      actividad: actividadRes.rows,
    });
  } catch (err) {
    console.error('getAnimal error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createAnimal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const refugioId = req.user!.refugioId;
    const {
      nombre, especie = 'perro', raza, sexo, fecha_nacimiento, peso_kg,
      estado = 'en_evaluacion', ubicacion_texto, procedencia, fecha_entrada,
      estado_salud = 'Saludable', esterilizado = false, vacunado = false,
      desparasitado = false, microchip = false, num_microchip, pasaporte = false,
      color, tipo_pelo, ojos, tamaño, señas_particulares,
      nivel_actividad = 0, soc_perros = 0, soc_gatos = 0, soc_niños = 0,
      hogar_ideal, experiencia_previa, descripcion,
    } = req.body;

    if (!nombre) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    // Generate internal ID
    const count = await query('SELECT COUNT(*) FROM animales WHERE refugio_id=$1', [refugioId]);
    const num = String(Number(count.rows[0].count) + 1).padStart(3, '0');
    const year = new Date().getFullYear();
    const idInterno = `HV-${year}-${num}`;

    const result = await query(
      `INSERT INTO animales (
        refugio_id, id_interno, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg,
        estado, ubicacion_texto, procedencia, fecha_entrada,
        estado_salud, esterilizado, vacunado, desparasitado, microchip, num_microchip, pasaporte,
        color, tipo_pelo, ojos, tamaño, señas_particulares,
        nivel_actividad, soc_perros, soc_gatos, soc_niños,
        hogar_ideal, experiencia_previa, descripcion
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,
        $25,$26,$27,$28,
        $29,$30,$31
      ) RETURNING *`,
      [
        refugioId, idInterno, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg,
        estado, ubicacion_texto, procedencia, fecha_entrada,
        estado_salud, esterilizado, vacunado, desparasitado, microchip, num_microchip, pasaporte,
        color, tipo_pelo, ojos, tamaño, señas_particulares,
        nivel_actividad, soc_perros, soc_gatos, soc_niños,
        hogar_ideal, experiencia_previa, descripcion,
      ]
    );

    // Log activity
    await query(
      `INSERT INTO actividad (refugio_id, animal_id, usuario_id, tipo, titulo)
       VALUES ($1, $2, $3, 'otro', $4)`,
      [refugioId, result.rows[0].id, req.user!.userId, `Nuevo animal registrado: ${nombre}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAnimal error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updateAnimal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;

    // Verify ownership
    const exists = await query(
      'SELECT id, nombre FROM animales WHERE id=$1 AND refugio_id=$2',
      [id, refugioId]
    );
    if (exists.rows.length === 0) {
      res.status(404).json({ error: 'Animal no encontrado' });
      return;
    }

    const fields = [
      'nombre','especie','raza','sexo','fecha_nacimiento','peso_kg','estado',
      'ubicacion_texto','procedencia','fecha_entrada','estado_salud','esterilizado',
      'vacunado','desparasitado','microchip','num_microchip','pasaporte',
      'color','tipo_pelo','ojos','tamaño','señas_particulares',
      'nivel_actividad','soc_perros','soc_gatos','soc_niños',
      'hogar_ideal','experiencia_previa','descripcion','web_publicado',
    ];

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }

    values.push(id);
    const result = await query(
      `UPDATE animales SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateAnimal error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function deleteAnimal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;

    const result = await query(
      'DELETE FROM animales WHERE id=$1 AND refugio_id=$2 RETURNING id, nombre',
      [id, refugioId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Animal no encontrado' });
      return;
    }

    res.json({ message: `Animal "${result.rows[0].nombre}" eliminado correctamente` });
  } catch (err) {
    console.error('deleteAnimal error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function addNota(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refugioId = req.user!.refugioId;
    const { texto, pinned = false } = req.body;

    if (!texto) {
      res.status(400).json({ error: 'El texto de la nota es requerido' });
      return;
    }

    const animalCheck = await query('SELECT id FROM animales WHERE id=$1 AND refugio_id=$2', [id, refugioId]);
    if (animalCheck.rows.length === 0) {
      res.status(404).json({ error: 'Animal no encontrado' });
      return;
    }

    const result = await query(
      `INSERT INTO animal_notas (animal_id, autor_id, texto, pinned)
       VALUES ($1, $2, $3, $4)
       RETURNING *, (SELECT nombre FROM usuarios WHERE id=$2) as autor_nombre`,
      [id, req.user!.userId, texto, pinned]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addNota error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
