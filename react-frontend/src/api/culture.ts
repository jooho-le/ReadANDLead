// src/api/culture.ts
import { ENDPOINTS } from './config';

export type CultureItem = {
  id?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  lat?: number;
  lng?: number;
  url?: string;
  category?: string; // 전시 등
};

type NearbyBase = {
  lat: number;
  lng: number;
  radiusKm: number;
  keyword?: string;
};

type NearbyRaw = NearbyBase & {
  from?: string;
  to?: string;
  rows?: number;
  raw?: true;
};

// ---------- helpers ----------
function toNum(n: any): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) ? v : undefined;
}

function normalizeItem(raw: any): CultureItem {
  const id =
    raw?.id ?? raw?.eventId ?? raw?.DOCID ?? raw?.uid ?? raw?.seq ?? undefined;

  const title =
    raw?.title ?? raw?.eventTitle ?? raw?.TITLE ?? raw?.name ?? raw?.subject;

  const startDate =
    raw?.startDate ??
    raw?.eventStartDate ??
    raw?.STRTDATE ??
    raw?.beginDate ??
    raw?.from;

  const endDate =
    raw?.endDate ??
    raw?.eventEndDate ??
    raw?.ENDDATE ??
    raw?.endDate ??
    raw?.to;

  const place =
    raw?.place ??
    raw?.placeName ??
    raw?.PLACE ??
    raw?.location ??
    raw?.venue ??
    raw?.fcltynm;

  const lat =
    toNum(raw?.lat) ??
    toNum(raw?.LAT) ??
    toNum(raw?.latitude) ??
    toNum(raw?.Y) ??
    toNum(raw?.mapy);

  const lng =
    toNum(raw?.lng) ??
    toNum(raw?.LNG) ??
    toNum(raw?.longitude) ??
    toNum(raw?.X) ??
    toNum(raw?.mapx);

  const url =
    raw?.url ?? raw?.detailUrl ?? raw?.link ?? raw?.HOMEPAGE ?? raw?.homepage;

  const category =
    raw?.category ?? raw?.type ?? raw?.genre ?? raw?.GUBUN ?? '전시';

  return { id, title, startDate, endDate, place, lat, lng, url, category };
}

// ---------- overloads ----------
export function fetchCultureNearby(p: NearbyBase): Promise<CultureItem[]>;
export function fetchCultureNearby(p: NearbyRaw): Promise<any>;
export async function fetchCultureNearby(p: NearbyBase | NearbyRaw): Promise<any> {
  const qs = new URLSearchParams({
    lat: String(p.lat),
    lng: String(p.lng),
    radiusKm: String(p.radiusKm),
  });
  if ('keyword' in p && p.keyword) qs.set('keyword', p.keyword);
  if ('from' in p && p.from) qs.set('from', p.from);
  if ('to' in p && p.to) qs.set('to', p.to);
  if ('rows' in p && typeof p.rows === 'number') qs.set('rows', String(p.rows));

  const url = `${ENDPOINTS.cultureNearby}?${qs.toString()}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json().catch(() => null);

  // raw 형태를 기대하는 호출(from/to/rows 전달) → 그대로 반환
  if ('from' in p || 'to' in p || p['raw']) return data;

  // 배열 정규화 (Home 등에서 사용)
  const arr: any[] =
    (Array.isArray(data) && data) ||
    (Array.isArray((data as any)?.items) && (data as any).items) ||
    (Array.isArray((data as any)?.data) && (data as any).data) ||
    [];
  return arr.map(normalizeItem);
}
