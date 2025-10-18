// src/api/stats.ts
import { apiUrl, ENDPOINTS } from "./config";
// CRA/TS 기본 설정에서는 JSON import 가능( resolveJsonModule )
import booksJson from "../data/book_location_event.json";

/** 좌표 타입 */
export type LatLng = { lat: number; lng: number };

/** 서버에 저장된 사용자 수 */
export async function fetchUsersCount(): Promise<number> {
  const res = await fetch(apiUrl(ENDPOINTS.usersCount), { credentials: "include" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json().catch(() => null);
  if (typeof data === "number") return data;
  // 서버가 {count: n} 형태로 줄 수도 있으니 보정
  if (data && typeof data.count === "number") return data.count;
  return 0;
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
    const res = await fetch(apiUrl(`${ENDPOINTS.cultureNearby}?${qs.toString()}`), {
      credentials: "include",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json().catch(() => ({} as any));

    // 문화포털 응답 형태 보정
    const items = (((data || {}).response || {}).body || {}).items || {};
    const arr = Array.isArray((items as any).item)
      ? (items as any).item
      : (items as any).item
      ? [(items as any).item]
      : [];
    return arr.length;
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
    const res = await fetch(apiUrl(`${ENDPOINTS.kopisPerform}?${qs.toString()}`), {
      credentials: "include",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json().catch(() => ({} as any));

    // KOPIS 응답(dbs->db) 보정
    const list = (((data || {}).dbs || {}).db) || [];
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    return arr.length;
  } catch {
    return 0;
  }
}
