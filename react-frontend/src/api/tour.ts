// src/api/tour.ts
import { apiFetch } from './config';

export async function fetchTourByKeyword(keyword: string, opts?: { rows?: number; page?: number }) {
  const rows = opts?.rows ?? 10;
  const page = opts?.page ?? 1;
  const qs = new URLSearchParams({ keyword, numOfRows: String(rows), pageNo: String(page) });
  return apiFetch<any>(`/api/tour/search?${qs.toString()}`);
}

