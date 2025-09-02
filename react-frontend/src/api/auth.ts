// src/api/auth.ts
import { apiFetch } from "./config";

export type AuthToken = {
  access_token: string;
  token_type?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  display_name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type Me = {
  id: number;            // 서버에서 number로 내려옴
  email: string;
  display_name?: string;
};

// 로컬/세션 저장
function saveToken(token: AuthToken, remember = true) {
  const v = token?.access_token || "";
  if (!v) return;
  if (remember) localStorage.setItem("token", v);
  else sessionStorage.setItem("token", v);
}

// 회원가입 → 토큰 반환
export async function register(
  payload: RegisterInput,
  opts?: { remember?: boolean }
): Promise<AuthToken> {
  const data = await apiFetch<AuthToken>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveToken(data, opts?.remember ?? true);
  return data;
}

// 로그인 → 토큰 반환
export async function login(
  payload: LoginInput,
  opts?: { remember?: boolean }
): Promise<AuthToken> {
  const data = await apiFetch<AuthToken>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveToken(data, opts?.remember ?? true);
  return data;
}

// 내 정보
export async function me(): Promise<Me> {
  return apiFetch<Me>("/api/auth/me");
}

// 로그아웃(클라 로컬만 정리 — 서버에 따로 엔드포인트 두지 않았다면)
export function logoutLocal() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}
