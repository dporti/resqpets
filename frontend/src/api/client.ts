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
  // Generic
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),

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

  // SOS Pet — público
  getSosPublic: () => request<import('../types').SosAlert[]>('GET', '/sos/public'),
  getSosPublicOne: (id: number) => request<import('../types').SosAlert>('GET', `/sos/public/${id}`),
  createSosPublic: (data: object) => request<import('../types').SosAlert>('POST', '/sos/public', data),

  // SOS Pet — privado
  getSosAlertas: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ data: import('../types').SosAlert[]; total: number; page: number; limit: number; totalPages: number }>('GET', `/sos${qs}`);
  },
  getSosAlerta: (id: number) => request<import('../types').SosAlert>('GET', `/sos/${id}`),
  updateSosAlerta: (id: number, data: object) => request<import('../types').SosAlert>('PUT', `/sos/${id}`, data),
  addSosUpdate: (id: number, contenido: string) => request('POST', `/sos/${id}/update`, { contenido }),
  convertirARescate: (id: number) => request<{ ok: boolean; animal_id: number; id_interno: string }>('POST', `/sos/${id}/rescatar`, {}),

  // SOS foto upload (reutiliza uploadFoto pero a bucket sos-photos)
  uploadSosFoto: (file: File) => {
    const token = localStorage.getItem('resqpet_token');
    const fd = new FormData();
    fd.append('file', file);
    // Upload directly to Supabase Storage
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey) return Promise.reject(new Error('VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no configurados'));
    const path = `sos/${Date.now()}_${file.name}`;
    return fetch(`${supabaseUrl}/storage/v1/object/sos-photos/${path}`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': file.type, 'x-upsert': 'true' },
      body: file,
    }).then(async r => {
      if (!r.ok) throw new Error(await r.text());
      return `${supabaseUrl}/storage/v1/object/public/sos-photos/${path}`;
    });
  },

  // Voluntarios
  getVoluntarios: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ data: import('../types').VoluntarioStats[]; total: number; page: number; limit: number; totalPages: number }>('GET', `/voluntarios${qs}`);
  },
  getVoluntario: (id: number) => request<import('../types').VoluntarioStats>('GET', `/voluntarios/${id}`),
  updateVoluntario: (id: number, data: object) => request<import('../types').VoluntarioStats>('PUT', `/voluntarios/${id}`, data),

  // Tareas
  getTasks: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Task[]>('GET', `/tareas${qs}`);
  },
  createTask: (data: object) => request<import('../types').Task>('POST', '/tareas', data),
  updateTask: (id: number, data: object) => request<import('../types').Task>('PUT', `/tareas/${id}`, data),
  completeTask: (id: number) => request<{ ok: boolean; nuevo_estado: string }>('POST', `/tareas/${id}/completar`, {}),
  deleteTask: (id: number) => request('DELETE', `/tareas/${id}`),

  // Rankings
  getRankings: (periodo?: string) => {
    const qs = periodo ? `?periodo=${periodo}` : '';
    return request<{ voluntarios: import('../types').RankingEntry[]; familias: import('../types').RankingEntry[] }>('GET', `/rankings${qs}`);
  },

  // Acogidas — Familias
  getFamilias: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').FosterFamily[]>('GET', `/acogidas/familias${qs}`);
  },
  getFamilia: (id: number) => request<import('../types').FosterFamily>('GET', `/acogidas/familias/${id}`),
  createFamilia: (data: object) => request<import('../types').FosterFamily>('POST', '/acogidas/familias', data),
  updateFamilia: (id: number, data: object) => request<import('../types').FosterFamily>('PUT', `/acogidas/familias/${id}`, data),
  asignarAnimal: (familiaId: number, data: object) =>
    request<import('../types').FosterAssignment>('POST', `/acogidas/familias/${familiaId}/asignar`, data),

  // Acogidas — Activas / historial
  getActivas: () => request<import('../types').FosterAssignment[]>('GET', '/acogidas/activas'),
  getHistorial: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ data: import('../types').FosterAssignment[]; total: number; page: number; limit: number; totalPages: number }>('GET', `/acogidas/historial${qs}`);
  },
  getContactos: (assignmentId: number) =>
    request<import('../types').FosterContact[]>('GET', `/acogidas/assignments/${assignmentId}/contactos`),
  createContacto: (assignmentId: number, data: object) =>
    request<import('../types').FosterContact>('POST', `/acogidas/assignments/${assignmentId}/contacto`, data),
  finalizarAcogida: (assignmentId: number, data: object) =>
    request<{ ok: boolean }>('POST', `/acogidas/assignments/${assignmentId}/finalizar`, data),

  // Adopciones — Solicitudes
  getSolicitudes: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ data: import('../types').AdoptionRequest[]; total: number; page: number; limit: number; totalPages: number }>('GET', `/adopciones/solicitudes${qs}`);
  },
  getSolicitud: (id: number) => request<import('../types').AdoptionRequest>('GET', `/adopciones/solicitudes/${id}`),
  createSolicitud: (data: object) => request<import('../types').AdoptionRequest>('POST', '/adopciones/solicitudes', data),
  updateSolicitud: (id: number, data: object) => request<import('../types').AdoptionRequest>('PUT', `/adopciones/solicitudes/${id}`, data),
  cambiarEstado: (id: number, estado: string, motivo?: string) =>
    request('POST', `/adopciones/solicitudes/${id}/estado`, { estado, motivo_rechazo: motivo }),
  programarEntrevista: (id: number, data: object) =>
    request('POST', `/adopciones/solicitudes/${id}/entrevista`, data),
  aprobarSolicitud: (id: number) =>
    request<{ ok: boolean; expedient_id: number }>('POST', `/adopciones/solicitudes/${id}/aprobar`, {}),

  // Adopciones — Expedientes
  getExpedientes: () => request<import('../types').AdoptionExpedient[]>('GET', '/adopciones/expedientes'),
  getExpediente: (id: number) => request<import('../types').AdoptionExpedient>('GET', `/adopciones/expedientes/${id}`),
  toggleChecklist: (expId: number, itemKey: string, completado: boolean, extra?: object) =>
    request<import('../types').ChecklistItem>('PUT', `/adopciones/expedientes/${expId}/checklist/${itemKey}`, { completado, ...extra }),
  cerrarExpediente: (id: number) =>
    request<{ ok: boolean }>('POST', `/adopciones/expedientes/${id}/cerrar`, {}),

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
