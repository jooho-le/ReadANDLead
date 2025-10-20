import { apiFetch, ENDPOINTS, apiFetchPublic } from './config';

export type AgencyTrip = {
  id: string;
  title: string;
  operator: string;
  phone?: string;
  link?: string;
  cover?: string;
  intro?: string;
  author_note?: string;
  itinerary?: string[];
};

export async function listAgencyTrips(): Promise<AgencyTrip[]> {
  const key = 'agency:trips:list';
  const ttlMs = 10 * 60 * 1000; // 10분 캐시
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t < ttlMs && Array.isArray(v)) return v as AgencyTrip[];
    }
  } catch {}
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 5000);
  try {
    const rows = await apiFetchPublic<AgencyTrip[]>(ENDPOINTS.agencyTrips, { signal: ctrl.signal });
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: rows })); } catch {}
    return rows;
  } finally {
    clearTimeout(to);
  }
}
