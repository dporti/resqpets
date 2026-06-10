import { Request, Response } from 'express';
import { query } from '../db/pool';

// ── ANIMALES PÚBLICOS ─────────────────────────────────────────────────

export async function getPublicAnimals(req: Request, res: Response) {
  try {
    const {
      especie, search, tamaño, sexo,
      vacunado, esterilizado, microchip,
      edad_min, edad_max,
      refugio_id, refugio_slug,
      page = '1', limit = '20',
      order = 'reciente',
    } = req.query as Record<string, string>;

    const conditions: string[] = [
      "a.web_publicado = true",
      "a.estado = 'en_adopcion'",
    ];
    const params: unknown[] = [];

    if (especie) {
      params.push(especie);
      conditions.push(`a.especie = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(a.nombre ILIKE $${params.length} OR a.raza ILIKE $${params.length} OR a.descripcion ILIKE $${params.length})`);
    }
    if (tamaño) {
      params.push(tamaño);
      conditions.push(`a.tamaño = $${params.length}`);
    }
    if (sexo) {
      params.push(sexo);
      conditions.push(`a.sexo = $${params.length}`);
    }
    if (vacunado === 'true') conditions.push('a.vacunado = true');
    if (esterilizado === 'true') conditions.push('a.esterilizado = true');
    if (microchip === 'true') conditions.push('a.microchip = true');
    if (edad_min) {
      params.push(Number(edad_min));
      conditions.push(`EXTRACT(YEAR FROM AGE(a.fecha_nacimiento)) >= $${params.length}`);
    }
    if (edad_max) {
      params.push(Number(edad_max));
      conditions.push(`EXTRACT(YEAR FROM AGE(a.fecha_nacimiento)) <= $${params.length}`);
    }
    if (refugio_id) {
      params.push(Number(refugio_id));
      conditions.push(`a.refugio_id = $${params.length}`);
    }
    if (refugio_slug) {
      params.push(refugio_slug);
      conditions.push(`r.slug = $${params.length}`);
    }

    const pageN = Math.max(1, parseInt(page, 10));
    const limitN = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageN - 1) * limitN;

    const orderClause =
      order === 'vistas' ? 'a.veces_visto DESC' :
      order === 'nombre' ? 'a.nombre ASC' :
      'a.created_at DESC';

    const where = conditions.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) FROM animales a
       JOIN refugios r ON a.refugio_id = r.id
       WHERE ${where}`,
      params,
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limitN, offset);
    const dataRes = await query(
      `SELECT
         a.id, a.nombre, a.especie, a.raza, a.sexo,
         EXTRACT(YEAR FROM AGE(a.fecha_nacimiento))  AS edad_años,
         EXTRACT(MONTH FROM AGE(a.fecha_nacimiento)) AS edad_meses,
         a.peso_kg, a.tamaño, a.color,
         a.descripcion, a.hogar_ideal, a.experiencia_previa,
         a.nivel_actividad, a.soc_perros, a.soc_gatos, a.soc_niños,
         a.vacunado, a.esterilizado, a.microchip, a.desparasitado,
         a.ubicacion_texto, a.fecha_entrada,
         a.veces_visto, a.veces_compartido,
         fp.url AS foto_principal,
         r.id   AS refugio_id,
         r.nombre AS refugio_nombre,
         r.ciudad AS refugio_ciudad,
         r.slug AS refugio_slug,
         r.logo_url AS refugio_logo,
         -- fotos adicionales
         (SELECT json_agg(f.url ORDER BY f.es_principal DESC, f.created_at ASC)
          FROM animal_fotos f WHERE f.animal_id = a.id) AS fotos_urls
       FROM animales a
       JOIN refugios r ON a.refugio_id = r.id
       LEFT JOIN animal_fotos fp ON fp.animal_id = a.id AND fp.es_principal = true
       WHERE ${where}
       ORDER BY ${orderClause}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({
      animals: dataRes.rows,
      total,
      page: pageN,
      limit: limitN,
      pages: Math.ceil(total / limitN),
    });
  } catch (e) {
    console.error('getPublicAnimals error:', e);
    res.status(500).json({ error: 'Error al cargar animales' });
  }
}

export async function getPublicAnimalById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const animalRes = await query(
      `SELECT
         a.*,
         r.id   AS refugio_id,
         r.nombre AS refugio_nombre,
         r.ciudad AS refugio_ciudad,
         r.slug AS refugio_slug,
         r.logo_url AS refugio_logo,
         r.email AS refugio_email,
         r.telefono AS refugio_telefono,
         r.website AS refugio_website,
         r.instagram AS refugio_instagram,
         r.facebook AS refugio_facebook,
         (SELECT COUNT(*) FROM animales a2
          WHERE a2.refugio_id = a.refugio_id
            AND a2.web_publicado = true
            AND a2.estado = 'en_adopcion') AS refugio_animales_en_adopcion,
         (SELECT json_agg(json_build_object('id', f.id, 'url', f.url, 'es_principal', f.es_principal)
                 ORDER BY f.es_principal DESC, f.created_at ASC)
          FROM animal_fotos f WHERE f.animal_id = a.id) AS fotos,
         EXTRACT(YEAR FROM AGE(a.fecha_nacimiento))  AS edad_años,
         EXTRACT(MONTH FROM AGE(a.fecha_nacimiento)) AS edad_meses,
         fp.url AS foto_principal
       FROM animales a
       JOIN refugios r ON a.refugio_id = r.id
       LEFT JOIN animal_fotos fp ON fp.animal_id = a.id AND fp.es_principal = true
       WHERE a.id = $1 AND a.web_publicado = true`,
      [id],
    );

    if (!animalRes.rows[0]) {
      return res.status(404).json({ error: 'Animal no encontrado' });
    }

    const animal = animalRes.rows[0];

    // Animales similares (misma especie, misma protectora, excluyendo este)
    const similarRes = await query(
      `SELECT a.id, a.nombre, a.especie, a.raza, a.tamaño,
              EXTRACT(YEAR FROM AGE(a.fecha_nacimiento)) AS edad_años,
              fp.url AS foto_principal,
              r.nombre AS refugio_nombre, r.slug AS refugio_slug, r.id AS refugio_id
       FROM animales a
       JOIN refugios r ON a.refugio_id = r.id
       LEFT JOIN animal_fotos fp ON fp.animal_id = a.id AND fp.es_principal = true
       WHERE a.web_publicado = true AND a.estado = 'en_adopcion'
         AND a.id != $1
         AND (a.refugio_id = $2 OR a.especie = $3)
       ORDER BY RANDOM()
       LIMIT 3`,
      [id, animal.refugio_id, animal.especie],
    );
    animal.similar = similarRes.rows;

    // Incrementar vistas
    await query(
      `UPDATE animales SET veces_visto = veces_visto + 1 WHERE id = $1`,
      [id],
    ).catch(() => {});
    await query(
      `INSERT INTO animal_analytics(animal_id, unique_visits, last_visited_at, updated_at)
       VALUES($1, 1, NOW(), NOW())
       ON CONFLICT(animal_id) DO UPDATE
         SET unique_visits = animal_analytics.unique_visits + 1,
             last_visited_at = NOW(),
             updated_at = NOW()`,
      [id],
    ).catch(() => {});

    res.json(animal);
  } catch (e) {
    console.error('getPublicAnimalById error:', e);
    res.status(500).json({ error: 'Error al cargar animal' });
  }
}

// ── PROTECTORAS PÚBLICAS ──────────────────────────────────────────────

export async function getPublicShelters(req: Request, res: Response) {
  try {
    const { search, ciudad } = req.query as Record<string, string>;
    const conditions = ['r.is_public = true'];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`r.nombre ILIKE $${params.length}`);
    }
    if (ciudad) {
      params.push(`%${ciudad}%`);
      conditions.push(`r.ciudad ILIKE $${params.length}`);
    }

    const where = conditions.join(' AND ');
    const res2 = await query(
      `SELECT
         r.id, r.nombre, r.ciudad, r.slug, r.logo_url, r.cover_url,
         r.description_public, r.website, r.instagram, r.facebook,
         r.email, r.telefono,
         COUNT(CASE WHEN a.web_publicado = true AND a.estado = 'en_adopcion' THEN 1 END) AS animales_en_adopcion,
         COUNT(CASE WHEN a.estado = 'fallecido' THEN 0 END) AS adopciones_completadas
       FROM refugios r
       LEFT JOIN animales a ON a.refugio_id = r.id
       WHERE ${where}
       GROUP BY r.id
       ORDER BY animales_en_adopcion DESC, r.nombre ASC`,
      params,
    );
    res.json(res2.rows);
  } catch (e) {
    console.error('getPublicShelters error:', e);
    res.status(500).json({ error: 'Error al cargar protectoras' });
  }
}

export async function getPublicShelterBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const shelterRes = await query(
      `SELECT r.*,
         COUNT(CASE WHEN a.web_publicado = true AND a.estado = 'en_adopcion' THEN 1 END) AS animales_en_adopcion
       FROM refugios r
       LEFT JOIN animales a ON a.refugio_id = r.id
       WHERE r.slug = $1 AND r.is_public = true
       GROUP BY r.id`,
      [slug],
    );

    if (!shelterRes.rows[0]) {
      return res.status(404).json({ error: 'Protectora no encontrada' });
    }

    const shelter = shelterRes.rows[0];

    const animalsRes = await query(
      `SELECT a.id, a.nombre, a.especie, a.raza, a.edad_años, a.tamaño,
              a.foto_principal, a.vacunado, a.esterilizado, a.microchip,
              a.ubicacion_texto, a.created_at
       FROM animales a
       WHERE a.refugio_id = $1 AND a.web_publicado = true AND a.estado = 'en_adopcion'
       ORDER BY a.created_at DESC`,
      [shelter.id],
    );
    shelter.animales = animalsRes.rows;

    res.json(shelter);
  } catch (e) {
    console.error('getPublicShelterBySlug error:', e);
    res.status(500).json({ error: 'Error al cargar protectora' });
  }
}

// ── ESTADÍSTICAS GLOBALES ─────────────────────────────────────────────

export async function getPublicStats(req: Request, res: Response) {
  try {
    const statsRes = await query(
      `SELECT
         (SELECT COUNT(*) FROM animales WHERE estado NOT IN ('fallecido') AND web_publicado = true) AS animales_activos,
         (SELECT COUNT(*) FROM adopciones WHERE estado != 'cancelada') AS adopciones_completadas,
         (SELECT COUNT(*) FROM refugios WHERE is_public = true) AS protectoras,
         (SELECT COUNT(*) FROM sos_alerts WHERE estado IN ('rescued', 'resolved')) AS sos_resueltos`,
    );
    res.json(statsRes.rows[0]);
  } catch (e) {
    console.error('getPublicStats error:', e);
    res.status(500).json({ error: 'Error al cargar estadísticas' });
  }
}

// ── SOLICITUD DE ADOPCIÓN PÚBLICA ─────────────────────────────────────

export async function createPublicAdoptionRequest(req: Request, res: Response) {
  try {
    const {
      animal_id, refugio_id,
      nombre, email, telefono, ciudad,
      tipo_vivienda, tiene_terraza, horas_solo, personas_hogar,
      experiencia_previa, tiene_animales, animales_descripcion,
      tiene_ninos, edades_ninos,
      motivacion, como_conocio,
    } = req.body;

    if (!nombre || !email || !animal_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar que el animal existe y es público
    const animalRes = await query(
      `SELECT id, nombre, refugio_id FROM animales
       WHERE id = $1 AND web_publicado = true AND estado = 'en_adopcion'`,
      [animal_id],
    );
    if (!animalRes.rows[0]) {
      return res.status(404).json({ error: 'Animal no disponible' });
    }

    const animal = animalRes.rows[0];
    const targetRefugioId = refugio_id || animal.refugio_id;

    const result = await query(
      `INSERT INTO adoption_requests (
         refugio_id, animal_id, nombre, email, telefono,
         tipo_vivienda, tiene_terraza, horas_solo,
         experiencia_previa, otros_animales, ninos, edades_ninos,
         motivacion, canal, estado, notas_internas
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'web','pendiente',$14)
       RETURNING id`,
      [
        targetRefugioId, animal_id, nombre, email, telefono || null,
        tipo_vivienda || null, tiene_terraza || false, horas_solo || null,
        experiencia_previa
          ? `${experiencia_previa}${tiene_animales ? `. Animales actuales: ${animales_descripcion || 'sí'}` : ''}`
          : null,
        tiene_animales ? animales_descripcion : null,
        tiene_ninos || false, edades_ninos || null,
        motivacion || null,
        `Ciudad: ${ciudad || '?'} | Personas en hogar: ${personas_hogar || '?'} | Cómo conoció: ${como_conocio || '?'}`,
      ],
    );

    const requestId = result.rows[0].id;

    // Timeline entry
    await query(
      `INSERT INTO adoption_timeline(request_id, tipo, descripcion)
       VALUES($1, 'solicitud_recibida', 'Solicitud recibida desde portal público web')`,
      [requestId],
    ).catch(() => {});

    // Actualizar contador del animal
    await query(
      `UPDATE animales SET contactos_recibidos = contactos_recibidos + 1 WHERE id = $1`,
      [animal_id],
    ).catch(() => {});

    res.status(201).json({
      id: requestId,
      referencia: `REQ-${String(requestId).padStart(5, '0')}`,
      mensaje: 'Solicitud enviada correctamente',
    });
  } catch (e) {
    console.error('createPublicAdoptionRequest error:', e);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
}

// ── TRACK SHARE ───────────────────────────────────────────────────────

export async function trackAnimalShare(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await query(
      `UPDATE animales SET veces_compartido = veces_compartido + 1 WHERE id = $1 AND web_publicado = true`,
      [id],
    );
    await query(
      `INSERT INTO animal_analytics(animal_id, shares, updated_at)
       VALUES($1, 1, NOW())
       ON CONFLICT(animal_id) DO UPDATE
         SET shares = animal_analytics.shares + 1, updated_at = NOW()`,
      [id],
    ).catch(() => {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
}
