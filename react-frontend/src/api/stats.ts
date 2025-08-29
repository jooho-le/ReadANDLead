import { ENDPOINTS } from './config';

/** GET /api/users/count  → 2031 또는 {count:2031} 같은 응답을 숫자로 파싱 */
export async function fetchUsersCount(): Promise<number> {
  try {
    const res = await fetch(ENDPOINTS.usersCount, { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json().catch(() => null);
    if (typeof data === 'number') return data;
    if (data && typeof data.count === 'number') return data.count;
    if (data && typeof data.total === 'number') return data.total;
    return 0;
  } catch {
    return 0;
  }
}
  