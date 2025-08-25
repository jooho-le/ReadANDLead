import { useEffect, useMemo, useState } from 'react';
import { listDiary, type DiaryEntry } from '../../api/diary';
import { DiaryEntryCard } from './DiaryEntryCard';
import { useStops } from '../../hooks/useStops';

export function DiaryTimeline({ tripId, date }: { tripId: string; date?: string }) {
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const { byId: stopsById } = useStops(tripId, date);

  useEffect(() => {
    (async () => {
      const data = await listDiary(tripId, { limit: 100 }); // ≤100
      setItems(data);
    })();
  }, [tripId]);

  const groups = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {};
    for (const e of items) {
      const d = new Date(e.happened_at || e.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (date && k !== date) continue;
      (map[k] ??= []).push(e);
    }
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1)); // 최신 날짜 먼저
  }, [items, date]);

  return (
    <div className="space-y-4">
      {groups.map(([day, arr]) => (
        <div key={day}>
          <div className="text-xs text-slate-500 mb-2">{day}</div>
          <div className="space-y-3">
            {arr.map((e) => (
              <DiaryEntryCard
                key={e.id}
                e={e}
                placeName={e.stop_id ? stopsById[e.stop_id]?.placeName : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}