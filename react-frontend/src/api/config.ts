// CRA(react-scripts) 전용: import.meta 사용하지 말고 process.env만 사용
const API_BASE = (process.env.REACT_APP_API_BASE ?? 'http://127.0.0.1:8000')
  .replace(/\/+$/, ''); // 끝 슬래시 제거

export default API_BASE;

// 혹시 또 TS1208 뜨면 아래 한 줄을 남겨둬도 됩니다.
// export {};

// path 앞에 /가 없으면 자동으로 붙여주고,
// JSON 헤더/쿠키도 기본으로 넣습니다.

export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('[apiFetch] ->', url); // 실제 요청 URL 확인
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${body || res.statusText}`);
  }
  return res.json();
}