import { useEffect, useState } from 'react';
import { listDiary, type DiaryEntry } from '../../api/diary';
import { DiaryEntryCard } from './DiaryEntryCard';
import { Col } from '../ui';

export function DiaryTimeline({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<DiaryEntry[]>([]);

  const refresh = async () => {
    const data = await listDiary(tripId, { limit: 50 });
    setItems(data);
  };

  useEffect(() => { refresh(); }, [tripId]);

  return (
    <Col gap={12}>
      {items.map((e) => <DiaryEntryCard key={e.id} e={e} />)}
    </Col>
  );
}
