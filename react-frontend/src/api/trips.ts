
import { apiFetch } from "./config";

export type Source = 'kakao' | 'google' | 'naver';

export type Trip = {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type Stop = {
  id: string;
  placeName: string;   // 백엔드 필드명에 맞춰 수정 가능 (name/title 등)
  date?: string;       // 'YYYY-MM-DD'
  startTime?: string;  // 'HH:MM'
};

export const listMyTrips = () =>
  apiFetch("/trips?mine=1") as Promise<Trip[]>;

export const createTrip = (data: {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
}) =>
  apiFetch("/trips", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Trip>;

export const upsertPlace = (p: {
  source: "kakao" | "google" | "naver";
  externalId: string;
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
}) =>
  apiFetch("/places/upsert", {
    method: "POST",
    body: JSON.stringify(p),
  }) as Promise<{ id: string }>;

export const addStop = (tripId: string, payload: {
  placeId: string;
  date?: string;
  startTime?: string;
}) =>
  apiFetch(`/trips/${tripId}/stops`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listStops = (tripId: string) =>
  apiFetch(`/api/trips/${tripId}/stops`);