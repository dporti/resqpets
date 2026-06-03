import { Response } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from '../middleware/auth';
import Anthropic from '@anthropic-ai/sdk';

export async function generateInstagram(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const refugioId = req.user!.refugioId;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY no configurada en .env' });
    return;
  }

  try {
    const result = await query(
      `SELECT nombre, especie, raza, sexo, estado, descripcion,
              nivel_actividad, soc_perros, soc_gatos, soc_niños,
              hogar_ideal, experiencia_previa, peso_kg,
              EXTRACT(YEAR FROM AGE(fecha_nacimiento)) as edad
       FROM animales WHERE id=$1 AND refugio_id=$2`,
      [id, refugioId]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'Animal no encontrado' }); return; }
    const a = result.rows[0];

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Genera un post de Instagram para promocionar la adopción de este animal en una protectora española.

Animal: ${a.nombre} (${a.especie}, ${a.raza || 'raza desconocida'}, ${a.sexo || ''}, ${a.edad ? Math.round(a.edad) + ' años' : ''}, ${a.peso_kg ? a.peso_kg + ' kg' : ''})
Estado: ${a.estado}
Descripción: ${a.descripcion || 'Sin descripción'}
Actividad: ${a.nivel_actividad}/5, Con perros: ${a.soc_perros}/5, Con gatos: ${a.soc_gatos}/5, Con niños: ${a.soc_niños}/5
Hogar ideal: ${a.hogar_ideal || '—'}

Requisitos:
- Tono emotivo, cálido y positivo en español
- Máximo 200 palabras
- Incluye 8-10 hashtags relevantes al final
- No uses asteriscos ni markdown
- Empieza con un emoji llamativo`
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    res.json({ texto: text });
  } catch (err) {
    console.error('generateInstagram error:', err);
    res.status(500).json({ error: 'Error al generar el contenido' });
  }
}
