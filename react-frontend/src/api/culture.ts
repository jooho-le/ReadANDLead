// src/api/culture.ts
import { ENDPOINTS, apiUrl, apiFetchPublic } from './config';

export type NearbyParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  from?: string; // yyyymmdd (선택)
  to?: string;   // yyyymmdd (선택)
  rows?: number; // (선택)
};

/** 문화포털 근처 전시/행사 래퍼 (백엔드 프록시 기대) */
export async function fetchCultureNearby(p: NearbyParams): Promise<any> {
  const qs = new URLSearchParams({
    lat: String(p.lat),
    lng: String(p.lng),
    radiusKm: String(p.radiusKm),
  });
  if (p.from) qs.set('from', p.from);
  if (p.to) qs.set('to', p.to);
  if (typeof p.rows === 'number') qs.set('rows', String(p.rows));

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 7000);
  try {
    const url = `${apiUrl(ENDPOINTS.cultureNearby)}?${qs.toString()}`;
    const data = await apiFetchPublic(url, { signal: ctrl.signal }).catch(() => ({}));
    return data;
  } finally {
    clearTimeout(to);
  }
}
