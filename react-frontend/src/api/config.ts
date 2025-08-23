// CRA(react-scripts) 전용: import.meta 사용하지 말고 process.env만 사용
const API_BASE = process.env.REACT_APP_API_BASE || '';

export default API_BASE;

// 혹시 또 TS1208 뜨면 아래 한 줄을 남겨둬도 됩니다.
// export {};

// path 앞에 /가 없으면 자동으로 붙여주고,
// JSON 헤더/쿠키도 기본으로 넣습니다.
export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    credentials: "include",                         // 세션/쿠키 쓰면 유지
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

  // JSON 응답만 JSON으로 파싱
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}