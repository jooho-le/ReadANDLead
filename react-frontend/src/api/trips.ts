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

export interface StopItem {
  time?: string;
  title: string;
  notes?: string;
  mission?: string;

  // Kakao Places로 확정된 필드 (백엔드가 채워줌)
  place?: string;
  address?: string;
  phone?: string;
  url?: string;
  hours?: string;
  source?: string;
  place_id?: string;
  lat?: number;
  lng?: number;
}

// react-frontend/src/api/trips.ts
export type PlanInput = {
  bookTitle: string;
  travelers: number;
  days: number;
  theme: string;
};

export async function createTripPlan(tripId: string, payload: PlanInput){
  const res = await fetch(`/api/trips/${tripId}/plan`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error('failed to create plan');
  return res.json(); // { summary, days:[{ day, stops:[{place,address,lat,lng,url,...}]}] }
}

// 계획 영속화: 서버에 저장하여 stop_id를 부여받음
export async function persistPlan(tripId: string, data: {
  bookTitle: string; theme?: string; days: number; stops: Array<{ day: number; stops: StopItem[] }>
}): Promise<{ trip_id: string; stop_ids: Array<{day:number; idx:number; id:number}> }>{
  return apiFetch(`/api/trips/${tripId}/persist`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// 내 계획/진행 불러오기
export async function fetchMyTrip(tripId: string): Promise<{
  trip_id: string; book_title: string; theme?: string; days: number; stops: Array<any>
}> {
  return apiFetch(`/api/trips/${tripId}/mine`);
}

// 미션 인증(증빙 URL)
export async function completeMission(tripId: string, stopId: number, proofUrl: string){
  return apiFetch(`/api/trips/${tripId}/stops/${stopId}/proof`, {
    method: 'POST',
    body: JSON.stringify({ proof_url: proofUrl })
  });
}

// 진행률
export async function fetchProgress(tripId: string): Promise<{ total:number; succeeded:number; percent:number; book_title:string; all_cleared:boolean }>{
  return apiFetch(`/api/trips/${tripId}/progress`);
}

// 리워드 수령
export async function claimReward(tripId: string){
  return apiFetch(`/api/trips/${tripId}/claim-reward`, { method: 'POST' });
}

// 책 컨텍스트(팝업용)
export async function getBookContext(title: string): Promise<{ title:string; author?:string; background?:string; content?:string; cover_url?: string }>{
  return apiFetch(`/api/trips/book-context?title=${encodeURIComponent(title)}`);
}

// 내 요약(마이페이지)
export async function fetchTripSummary(): Promise<Array<{trip_id:string; book_title:string; total:number; succeeded:number; percent:number; proofs:string[]}>>{
  return apiFetch(`/api/trips/summary`);
}

export async function deleteTrip(tripId: string){
  return apiFetch(`/api/trips/${encodeURIComponent(tripId)}`, { method: 'DELETE' });
}

// 획득 리워드(배지) 목록
export async function fetchRewards(): Promise<Array<{trip_id:string; book_title:string; claimed_at:string}>>{
  return apiFetch(`/api/trips/rewards`);
}
