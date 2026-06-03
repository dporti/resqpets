export type UserRole = 'admin' | 'coordinador' | 'voluntario';

export interface JwtPayload {
  userId: number;
  email: string;
  rol: UserRole;
  refugioId: number;
}

export const PERMISOS: Record<string, UserRole[]> = {
  'animales:read':     ['admin', 'coordinador', 'voluntario'],
  'animales:create':   ['admin', 'coordinador'],
  'animales:update':   ['admin', 'coordinador'],
  'animales:delete':   ['admin'],
  'animales:publish':  ['admin', 'coordinador'],
  'adopciones:read':   ['admin', 'coordinador'],
  'adopciones:manage': ['admin', 'coordinador'],
  'donaciones:read':   ['admin', 'coordinador'],
  'reportes:read':     ['admin', 'coordinador'],
  'avisos:read':       ['admin', 'coordinador', 'voluntario'],
  'usuarios:read':     ['admin', 'coordinador'],
  'usuarios:manage':   ['admin'],
  'config:manage':     ['admin'],
};

export function canDo(rol: UserRole, permiso: string): boolean {
  const allowed = PERMISOS[permiso];
  if (!allowed) return false;
  return allowed.includes(rol);
}
