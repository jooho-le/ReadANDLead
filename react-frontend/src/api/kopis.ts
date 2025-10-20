// src/api/kopis.ts
import { apiUrl, ENDPOINTS, apiFetchPublic } from "./config";

/** KOPIS 공연 조회 쿼리 */
export type Query = {
  /** 시/도 명칭 (예: '서울특별시', '광주광역시') */
  city: string;
  /** 조회 시작일(YYYYMMDD) */
  from: string;
  /** 조회 종료일(YYYYMMDD) */
  to: string;
  /** (선택) 최대 행 수 */
  rows?: number;
};

/** 서버가 프록시로 그대로 전달하는 KOPIS 원본 형태(느슨한 타입) */
export type KopisRaw = any;

/**
 * 공연 목록 조회
 * - 백엔드 프록시(`/api/kopis/perform`)를 호출합니다.
 * - 응답은 KOPIS 원형을 그대로 넘겨주므로 사용처(DiscoveryPanelKakao)에서
 *   ((r||{}).dbs||{}).db 형식으로 파싱합니다.
 */
export async function fetchKopisPerformances(q: Query): Promise<KopisRaw> {
  const qs = new URLSearchParams();
  qs.set("city", q.city);
  qs.set("from", q.from);
  qs.set("to", q.to);
  if (typeof q.rows === "number") qs.set("rows", String(q.rows));

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 7000);
  try {
    const url = apiUrl(`${ENDPOINTS.kopisPerform}?${qs.toString()}`);
    return await apiFetchPublic(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(to);
  }
}
