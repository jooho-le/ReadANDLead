// src/api/directions.ts
import { apiFetch, ENDPOINTS } from "./config";

export type DrivingPriority = "RECOMMEND" | "TIME" | "DISTANCE";

export type DrivingParams = {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  /** 우선순위 (백엔드에서 지원하는 값으로 맞추세요) */
  priority?: DrivingPriority;
};

export type PolylinePoint = { lat: number; lng: number };

export type DrivingResult = {
  /** 총 거리(m) */
  distance_m?: number;
  /** 총 소요시간(초) */
  duration_s?: number;
  /** 경로 좌표 리스트 */
  polyline?: PolylinePoint[];
  /** 내부/외부 제공자 식별 (예: 'kakao','naver','google','mock') */
  provider?: string;
  /** 필요시 원본 응답 */
  raw?: any;
};

/**
 * 자동차 경로 조회 (백엔드 프록시 엔드포인트 사용)
 * 프론트에서 직접 외부 API 키를 노출하지 않기 위한 래퍼입니다.
 */
export async function routeDriving(params: DrivingParams): Promise<DrivingResult> {
  const qs = new URLSearchParams();
  qs.set("originLat", String(params.originLat));
  qs.set("originLng", String(params.originLng));
  qs.set("destLat", String(params.destLat));
  qs.set("destLng", String(params.destLng));
  if (params.priority) qs.set("priority", params.priority);

  // apiFetch는 상대경로/절대경로 둘 다 처리하도록 구현되어 있습니다.
  return apiFetch<DrivingResult>(`${ENDPOINTS.routeDriving}?${qs.toString()}`);
}
