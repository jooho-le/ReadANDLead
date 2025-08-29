// src/api/kopis.ts
import { ENDPOINTS } from './config';

export type PerformanceItem = {
  id?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  lat?: number;
  lng?: number;
  url?: string;
  genre?: string;
};

type QueryBase = {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  daysFromNow?: number;
};

type QueryRaw = QueryBase & {
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

function normPerf(raw: any): PerformanceItem {
  const id =
    raw?.id ?? raw?.mt20id ?? raw?.eventId ?? raw?.DOCID ?? raw?.uid ?? raw?.seq;

  const title =
    raw?.title ?? raw?.prfnm ?? raw?.eventTitle ?? raw?.TITLE ?? raw?.name;

  const startDate =
    raw?.startDate ?? raw?.prfpdfrom ?? raw?.STRTDATE ?? raw?.from;

  const endDate =
    raw?.endDate ?? raw?.prfpdto ?? raw?.ENDDATE ?? raw?.to;

  const place =
    raw?.place ?? raw?.fcltynm ?? raw?.venue ?? raw?.PLACE ?? raw?.location;

  const lat =
    toNum(raw?.lat) ?? toNum(raw?.LAT) ?? toNum(raw?.latitude) ?? toNum(raw?.Y) ?? toNum(raw?.gpsY);

  const lng =
    toNum(raw?.lng) ?? toNum(raw?.LNG) ?? toNum(raw?.longitude) ?? toNum(raw?.X) ?? toNum(raw?.gpsX);

  const url =
    raw?.url ?? raw?.detailUrl ?? raw?.link ?? raw?.HOMEPAGE ?? raw?.homepage;

  const genre = raw?.genrenm ?? raw?.genre ?? raw?.GUBUN;

  return { id, title, startDate, endDate, place, lat, lng, url, genre };
}

// ---------- overloads ----------
export function fetchKopisPerformances(q: QueryBase): Promise<PerformanceItem[]>;
export function fetchKopisPerformances(q: QueryRaw): Promise<any>;
export async function fetchKopisPerformances(q: QueryBase | QueryRaw): Promise<any> {
  const qs = new URLSearchParams();
  if (q.city) qs.set('city', q.city);
  if (q.lat != null) qs.set('lat', String(q.lat));
  if (q.lng != null) qs.set('lng', String(q.lng));
  if (q.radiusKm != null) qs.set('radiusKm', String(q.radiusKm));
  if ('daysFromNow' in q && q.daysFromNow != null) qs.set('daysFromNow', String(q.daysFromNow));

  if ('from' in q && q.from) qs.set('from', q.from);
  if ('to' in q && q.to) qs.set('to', q.to);
  if ('rows' in q && typeof q.rows === 'number') qs.set('rows', String(q.rows));

  const url = `${ENDPOINTS.kopisPerform}?${qs.toString()}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json().catch(() => null);

  // raw 기대(from/to/rows 전달) → 그대로 반환
  if ('from' in q || 'to' in q || q['raw']) return data;

  // 배열 정규화
  const arr: any[] =
    (Array.isArray(data) && data) ||
    (Array.isArray((data as any)?.items) && (data as any).items) ||
    (Array.isArray((data as any)?.data) && (data as any).data) ||
    [];
  return arr.map(normPerf);
}
