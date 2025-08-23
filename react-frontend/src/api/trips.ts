
import { apiFetch } from "./config";

export type Trip = {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
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
  source: "kakao" | "google";
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
