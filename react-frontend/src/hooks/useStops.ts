import { useEffect, useMemo, useState } from 'react';
import { listStops } from '../api/trips';

export function useStops(tripId: string, date?: string) {
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // NOTE: listStops(tripId) 만 호출 (API 인자 1개)
        const data = await listStops(tripId);
        if (!mounted) return;
        // 날짜가 있으면 클라에서 필터링
        const filtered = date
          ? data.filter((s: any) => s.date === date)
          : data;
        setStops(filtered);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [tripId, date]);

  const byId = useMemo(
    () => Object.fromEntries(stops.map((s: any) => [s.id, s])),
    [stops]
  );

  return { stops, byId, loading };
}
