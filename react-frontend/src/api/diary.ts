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

export type ListParams = {
  type?: DiaryEntry["entry_type"] | "all";
  cursor?: string;
  limit?: number;
};

/** 일기 목록 조회 */
export async function listDiary(
  tripId: string,
  params?: ListParams
): Promise<DiaryEntry[]> {
  const q = new URLSearchParams();
  if (params?.type && params.type !== "all") q.set("type", params.type);
  if (params?.cursor) q.set("cursor", params.cursor);
  if (typeof params?.limit === "number") q.set("limit", String(params.limit));
  const qs = q.toString();

  return apiFetch<DiaryEntry[]>(
    `/api/trips/${encodeURIComponent(tripId)}/diary${qs ? `?${qs}` : ""}`
  );
}

/** 일기 생성 */
export async function createDiary(
  tripId: string,
  payload: {
    entry_type?: DiaryEntry["entry_type"];
    text?: string;
    stop_id?: string;
    happened_at?: string; // ISO
    content?: Record<string, any>;
  }
): Promise<DiaryEntry> {
  return apiFetch<DiaryEntry>(`/api/trips/${encodeURIComponent(tripId)}/diary`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 일기 수정 */
export async function updateDiary(
  tripId: string,
  entryId: string,
  payload: Partial<{
    entry_type: DiaryEntry["entry_type"];
    text: string;
    stop_id: string | null;
    happened_at: string | null;
    content: Record<string, any>;
  }>
): Promise<DiaryEntry> {
  return apiFetch<DiaryEntry>(
    `/api/trips/${encodeURIComponent(tripId)}/diary/${encodeURIComponent(
      entryId
    )}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

/** 일기 삭제 */
export async function deleteDiary(
  tripId: string,
  entryId: string
): Promise<void> {
  await apiFetch<void>(
    `/api/trips/${encodeURIComponent(tripId)}/diary/${encodeURIComponent(
      entryId
    )}`,
    { method: "DELETE" }
  );
}

// -------------------- 여행 일정 (GPT 기반) --------------------

export type StopItem = {
  time?: string | null;
  title: string;
  place?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  mission?: string | null;
};

export type DayPlan = {
  day: number;
  theme?: string | null;
  stops: StopItem[];
};

export type TravelPlan = {
  summary: string;
  days: DayPlan[];
};

/** GPT 여행 계획 생성 */
export async function generatePlan(
  tripId: string,
  payload: {
    bookTitle: string;
    travelers: number;
    days: number;
    theme?: string;
  }
): Promise<TravelPlan> {
  return apiFetch<TravelPlan>(
    `/api/trips/${encodeURIComponent(tripId)}/plan`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
