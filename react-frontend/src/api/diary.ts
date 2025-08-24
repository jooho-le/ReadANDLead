import { apiFetch } from "./config";

export type DiaryEntry = {
  id: string;
  trip_id: string;
  stop_id?: string | null;
  author_id: string;
  entry_type: "note" | "photo" | "checkin" | "system";
  text?: string | null;
  content: Record<string, any>;
  happened_at?: string | null;
  created_at: string;
};

export const listDiary = (tripId: string, params?: { type?: string; cursor?: string; limit?: number; }) => {
  const q = new URLSearchParams();
  if (params?.type) q.set("type", params.type);
  if (params?.cursor) q.set("cursor", params.cursor);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetch(`/api/trips/${tripId}/diary${qs ? `?${qs}` : ''}`);
};

export const createDiary = (tripId: string, payload: {
  entry_type?: "note" | "photo" | "checkin" | "system";
  text?: string;
  stop_id?: string;
  happened_at?: string;
  content?: Record<string, any>;
}) => apiFetch(`/api/trips/${tripId}/diary`, {
  method: 'POST', body: JSON.stringify(payload) });