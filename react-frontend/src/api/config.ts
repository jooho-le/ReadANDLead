// src/api/config.ts

// CRA(.env) 기준 API 베이스 URL (예: http://127.0.0.1:8000)
// 비워두면 프록시(/api)만으로도 동작 가능
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

// 레거시 호환을 위해 default export 유지
const API_BASE = API_BASE_URL;
export default API_BASE;

// 프론트에서 쓰는 모든 엔드포인트를 한 곳에서 정의
export const ENDPOINTS = {
  // 통계/카운트
  stats:        `${API_BASE}/api/stats`,
  booksCount:   `${API_BASE}/api/books/count`,
  placesCount:  `${API_BASE}/api/places/count`,
  eventsCount:  `${API_BASE}/api/events/count`,
  usersCount:   `${API_BASE}/api/users/count`,

  // 문화포털/공연 (프록시)
  cultureNearby: `${API_BASE}/api/culture/nearby`,
  kopisPerform:  `${API_BASE}/api/kopis/performances`,

  // 여행/일기
  trips:         `${API_BASE}/api/trips`,
  diary:         `${API_BASE}/api/diary`,

  // 🚗 앱 내 길찾기(카카오모빌리티 REST 프록시)
  routeDriving:  `${API_BASE}/api/route/driving`,
};

// 상대/절대 경로 모두 처리하는 fetch 래퍼
export async function apiFetch(path: string, init?: RequestInit) {
  const base = API_BASE || '';
  const url = /^https?:\/\//i.test(path) ? path : `${base}${path}`;
  const res = await fetch(url, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}
