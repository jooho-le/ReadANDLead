// src/api/stats.ts
import { apiUrl, ENDPOINTS, apiFetchPublic } from "./config";
// CRA/TS 기본 설정에서는 JSON import 가능( resolveJsonModule )
import booksJson from "../data/book_location_event.json";

/** 좌표 타입 */
export type LatLng = { lat: number; lng: number };

/** 서버에 저장된 사용자 수 */
export async function fetchUsersCount(): Promise<number> {
  const key = "stats:users-count";
  const ttlMs = 5 * 60 * 1000; // 5분 캐시
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { t, v } = JSON.parse(raw);
      if (Date.now() - t < ttlMs && typeof v === "number") return v;
    }
  } catch {}
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 5000);
  try {
    const data = await apiFetchPublic(apiUrl(ENDPOINTS.usersCount), { signal: ctrl.signal });
    const n = typeof data === "number" ? data : (data && typeof data.count === "number" ? data.count : 0);
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: n })); } catch {}
    return n;
  } finally {
    clearTimeout(to);
  }
}

/** 로컬 JSON 기준 등록된 도서 수 */
export function fetchBooksCountLocal(): number {
  try {
    // book_location_event.json: { [bookTitle: string]: any } 형태라고 가정
    const obj = booksJson as unknown as Record<string, unknown>;
    return Object.keys(obj || {}).length;
  } catch {
    return 0;
  }
}

/** 문화포털(전시 등) 근처 이벤트 개수 — 백엔드 프록시를 통해 조회 */
export async function fetchCultureNearbyCount(p: {
  lat: number;
  lng: number;
  radiusKm?: number;
  from?: string; // YYYYMMDD
  to?: string;   // YYYYMMDD
}): Promise<number> {
  const qs = new URLSearchParams();
  qs.set("lat", String(p.lat));
  qs.set("lng", String(p.lng));
  if (p.radiusKm) qs.set("radiusKm", String(p.radiusKm));
  if (p.from) qs.set("from", p.from);
  if (p.to) qs.set("to", p.to);

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 7000);
    const data = await apiFetchPublic(apiUrl(`${ENDPOINTS.cultureNearby}?${qs.toString()}`), { signal: ctrl.signal }).catch(() => ({} as any));

    // 문화포털 응답 형태 보정
    const items = (((data || {}).response || {}).body || {}).items || {};
    const arr = Array.isArray((items as any).item)
      ? (items as any).item
      : (items as any).item
      ? [(items as any).item]
      : [];
    const count = arr.length;
    clearTimeout(to);
    return count;
  } catch {
    return 0;
  }
}

/** KOPIS(공연) 개수 — 백엔드 프록시를 통해 조회 */
export async function fetchKopisCount(p: {
  city: string;
  from: string; // YYYYMMDD
  to: string;   // YYYYMMDD
  rows?: number;
}): Promise<number> {
  const qs = new URLSearchParams();
  qs.set("city", p.city);
  qs.set("from", p.from);
  qs.set("to", p.to);
  if (typeof p.rows === "number") qs.set("rows", String(p.rows));

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 7000);
    const data = await apiFetchPublic(apiUrl(`${ENDPOINTS.kopisPerform}?${qs.toString()}`), { signal: ctrl.signal }).catch(() => ({} as any));

    // KOPIS 응답(dbs->db) 보정
    const list = (((data || {}).dbs || {}).db) || [];
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    const n = arr.length;
    clearTimeout(to);
    return n;
  } catch {
    return 0;
  }
}
