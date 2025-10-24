// src/api/config.ts
// 공통 설정 + fetch 래퍼 + 엔드포인트 모음

// 환경변수 → Vite/CRA 둘 다 케어, 기본은 127.0.0.1:8000
import { Capacitor } from "@capacitor/core";

declare global {
  interface Window { __API_BASE__?: string }
}
// Vite (property access만 사용; Webpack 경고 회피)
const VITE_API: string | undefined = (import.meta as any)?.env?.VITE_API_URL;

// CRA: 반드시 정적 접근식으로 읽어야 빌드 타임에 치환됩니다.
// (옵셔널 체이닝/any 캐스팅 없이 정확히 process.env.REACT_APP_* 형태여야 함)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CRA_API: string | undefined = process.env.REACT_APP_API_URL as any;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CRA_API_BASE: string | undefined = process.env.REACT_APP_API_BASE_URL as any;

// Build-time prod detection (kept for potential callers)
// - CRA/Webpack: process.env.NODE_ENV === 'production' (literal replaced at build time)
// - Vite: import.meta.env.PROD
const IS_PROD: boolean =
  ((typeof import.meta !== "undefined" && (import.meta as any)?.env?.PROD) as boolean) ||
  process.env.NODE_ENV === "production";

function resolveBase(): string {
  // 우선순위: 런타임(window.__API_BASE__) > 빌드환경(VITE/CRA)
  // 기본값은 same-origin 사용을 위해 빈 문자열(상대경로)로 둡니다.
  const runtimeBase = (typeof window !== "undefined" && window.__API_BASE__) || "";
  let base = runtimeBase || VITE_API || CRA_API || CRA_API_BASE || "";

  // Emulator helper: if base points to localhost and platform is android, rewrite to 10.0.2.2
  try {
    const platform = Capacitor?.getPlatform?.();
    if (platform === "android" && base) {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(base)) {
        base = base.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)/i, "$1" + "10.0.2.2");
      }
    }
  } catch {}

  // 네이티브 앱에서 명시된 베이스가 없다면(상대경로 상태) API 기본 도메인으로 폴백
  try {
    const isNative = (Capacitor as any)?.isNativePlatform?.() || false;
    if (!base && isNative) {
      base = "https://readandlead-api.onrender.com";
    }
  } catch {}

  return base;
}

export const API_BASE_URL: string = resolveBase();

// 상대경로/절대경로 모두 지원
export function apiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// 공개 GET 전용 가벼운 fetch: Authorization/credentials 미포함 → 브라우저 캐시 효과↑, CORS preflight↓
export async function apiFetchPublic<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = apiUrl(path);
  const headers = new Headers(init.headers || {});
  // JSON 응답 가정은 하지 않음. 필요 시 사용처에서 파싱
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "omit",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

// 공용 엔드포인트(타입오류 방지용으로 다 넣어둠)
export const ENDPOINTS = {
  // 이웃 글
  neighborPosts: "/api/neighbor-posts",

  // 기존 다른 기능들이 참조하던 것들(서버가 없어도 타입 오류는 안 나게)
  cultureNearby: "/api/culture/nearby",
  kopisPerform: "/api/kopis/perform",
  routeDriving: "/api/route/driving",
  usersCount: "/api/users/count",
  // 여행사 연계 상품
  agencyTrips: "/api/agency-trips/list",
} as const;

// 공통 fetch 래퍼: JSON 자동 파싱 + 토큰 자동 부착 + 오류 메시지 정리
export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = apiUrl(path);

  // 헤더 구성
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token =
    (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token"));
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method || "GET").toUpperCase();
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("DEBUG_API") === "1") {
      // eslint-disable-next-line no-console
      console.debug(`[api] ${method} ${url}`);
    }
  } catch {}

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

   // ✅ 204 (No Content) 응답은 body가 없으므로 바로 반환
  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    // 에러 바디가 JSON/문자열인 경우 우선 추출
    const text = await res.text().catch(() => "");
    // 서버가 JSON 에러 메세지를 주는 경우 최대한 보여주기
    try {
      const j = text ? JSON.parse(text) : null;
      const msg = j?.detail || j?.message || j?.error || text || `HTTP ${res.status}`;
      throw new Error(msg);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  // 텍스트/빈 응답 등
  return (await res.text()) as unknown as T;
}
