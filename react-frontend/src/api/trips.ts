// src/api/trips.ts
import { apiFetch } from "./config";

/** 외부 소스 식별자 */
export type Source = "kakao" | "google" | "naver";

/** 여행(Trip) */
export type Trip = {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
};

/** 경유지(Stop) — 화면 코드 호환 위해 placeName 포함 */
export type Stop = {
  id: string;
  tripId: string;
  placeId: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  address?: string;
  date?: string | null;       // yyyy-mm-dd
  startTime?: string | null;  // HH:mm
  notes?: string | null;
};

/** 내 여행 목록 */
export const listMyTrips = (): Promise<Trip[]> =>
  apiFetch<Trip[]>("/api/trips?mine=1");

/** 여행 생성 */
export const createTrip = (data: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<Trip> =>
  apiFetch<Trip>("/api/trips", {
    method: "POST",
    body: JSON.stringify(data),
  });

/** 장소 upsert → 내부 placeId 반환 */
export const upsertPlace = (p: {
  source: Source;
  externalId: string;
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
}): Promise<{ id: string }> =>
  apiFetch<{ id: string }>("/api/places/upsert", {
    method: "POST",
    body: JSON.stringify(p),
  });

/** 경유지 추가 */
export const addStop = (
  tripId: string,
  payload: {
    placeId: string;
    date?: string;
    startTime?: string;
    notes?: string;
  }
): Promise<Stop> =>
  apiFetch<Stop>(`/api/trips/${tripId}/stops`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

/** 특정 여행의 경유지 목록 */
export const listStops = (tripId: string): Promise<Stop[]> =>
  apiFetch<Stop[]>(`/api/trips/${tripId}/stops`);
