import { AnimalsResponse, PublicAnimal, PublicShelter, PublicStats, PublicSosAlert } from '../types';

const BASE = '/api/public';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getAnimals: (params: Record<string, string | number>): Promise<AnimalsResponse> => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return get(`${BASE}/animals${qs ? `?${qs}` : ''}`);
  },

  getAnimal: (id: number): Promise<PublicAnimal> =>
    get(`${BASE}/animals/${id}`),

  getShelters: (params: Record<string, string> = {}): Promise<PublicShelter[]> => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== ''),
    ).toString();
    return get(`${BASE}/shelters${qs ? `?${qs}` : ''}`);
  },

  getShelterBySlug: (slug: string): Promise<PublicShelter> =>
    get(`${BASE}/shelters/${slug}`),

  getStats: (): Promise<PublicStats> =>
    get(`${BASE}/stats`),

  getSosAlerts: (): Promise<PublicSosAlert[]> =>
    get('/api/sos/public'),

  createAdoptionRequest: (data: Record<string, unknown>) =>
    post(`${BASE}/adoption-request`, data),

  trackShare: (animalId: number) =>
    post(`${BASE}/animals/${animalId}/share`, {}),
};
