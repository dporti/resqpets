const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('resqpet_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('resqpet_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: import('../types').User }>('POST', '/auth/login', { email, password }),
  me: () => request<import('../types').User>('GET', '/auth/me'),
  permisos: () => request<{ rol: string; permisos: Record<string, boolean> }>('GET', '/permisos'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('PUT', '/auth/password', { currentPassword, newPassword }),

  // Dashboard
  dashboard: () => request<import('../types').DashboardData>('GET', '/dashboard'),

  // Animales
  getAnimales: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ data: import('../types').Animal[]; total: number; totalPages: number }>('GET', `/animales${qs}`);
  },
  getAnimal: (id: number) => request<import('../types').Animal>('GET', `/animales/${id}`),
  createAnimal: (data: Partial<import('../types').Animal>) => request('POST', '/animales', data),
  updateAnimal: (id: number, data: Partial<import('../types').Animal>) => request('PUT', `/animales/${id}`, data),
  deleteAnimal: (id: number) => request('DELETE', `/animales/${id}`),
  addNota: (animalId: number, texto: string, pinned?: boolean) =>
    request('POST', `/animales/${animalId}/notas`, { texto, pinned }),

  // Usuarios (solo admin/coordinador)
  getUsuarios: () => request<import('../types').User[]>('GET', '/usuarios'),
  createUsuario: (data: { nombre: string; email: string; password: string; rol: string }) =>
    request('POST', '/usuarios', data),
  updateUsuario: (id: number, data: Partial<{ nombre: string; rol: string; activo: boolean }>) =>
    request('PUT', `/usuarios/${id}`, data),
  deleteUsuario: (id: number) => request('DELETE', `/usuarios/${id}`),

  // Fotos
  uploadFoto: (animalId: number, file: File) => {
    const token = localStorage.getItem('resqpet_token');
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`/api/animales/${animalId}/fotos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(r => r.json());
  },
  deleteFoto: (animalId: number, fotoId: number) =>
    request('DELETE', `/animales/${animalId}/fotos/${fotoId}`),
  setPrincipal: (animalId: number, fotoId: number) =>
    request('PUT', `/animales/${animalId}/fotos/${fotoId}/principal`, {}),

  // Eventos médicos
  getHealthEvents: (animalId: number) =>
    request<import('../types').HealthEvent[]>('GET', `/animales/${animalId}/health`),
  createHealthEvent: (animalId: number, data: object) =>
    request<import('../types').HealthEvent>('POST', `/animales/${animalId}/health`, data),
  deleteHealthEvent: (animalId: number, eventId: number) =>
    request('DELETE', `/animales/${animalId}/health/${eventId}`),

  // Evaluaciones de comportamiento
  getBehaviorEvaluations: (animalId: number) =>
    request<import('../types').BehaviorEvaluation[]>('GET', `/animales/${animalId}/behavior`),
  createBehaviorEvaluation: (animalId: number, data: object) =>
    request<import('../types').BehaviorEvaluation>('POST', `/animales/${animalId}/behavior`, data),

  // Documentos
  getDocuments: (animalId: number) =>
    request<import('../types').AnimalDocument[]>('GET', `/animales/${animalId}/documents`),
  createDocument: (animalId: number, data: object) =>
    request<import('../types').AnimalDocument>('POST', `/animales/${animalId}/documents`, data),
  deleteDocument: (animalId: number, docId: number) =>
    request('DELETE', `/animales/${animalId}/documents/${docId}`),

  // Instagram copy
  generateInstagram: (animalId: number) =>
    request<{ texto: string }>('POST', `/animales/${animalId}/instagram`),

  // Avisos
  getAvisos: () => request<import('../types').Aviso[]>('GET', '/avisos'),

  // Eventos
  getEventos: () => request<import('../types').Evento[]>('GET', '/eventos'),
};
