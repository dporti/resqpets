import { AuthRequest } from '../middleware/auth';
import { query } from '../db/pool';

export function getRefugioId(req: AuthRequest): number {
  return req.user!.refugioId;
}

/**
 * Verifica que el recurso `resourceId` de `table` pertenece a `refugioId`.
 * Usar SOLO con nombres de tabla constantes (no input de usuario).
 */
export async function assertRefugioOwnership(
  table: string,
  resourceId: string | number,
  refugioId: number,
): Promise<boolean> {
  const r = await query(`SELECT id FROM ${table} WHERE id=$1 AND refugio_id=$2`, [resourceId, refugioId]);
  return r.rows.length > 0;
}
