// src/api/culture.ts
import { ENDPOINTS, apiUrl } from './config';

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

  const url = `${apiUrl(ENDPOINTS.cultureNearby)}?${qs.toString()}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // 백엔드가 그대로 문화포털 JSON을 리턴한다고 가정
  return res.json().catch(() => ({}));
}
