// 일기 작성

import { useEffect, useMemo, useState } from 'react';
import {createDiary} from "../../api/diary";
import { useStops } from '../../hooks/useStops';
import { Card, SectionTitle, Row, Button, Input, Textarea, Label } from '../ui';

type Props = {
  tripId: string;
  date?: string;          // 'YYYY-MM-DD' 선택 날짜(옵션)
  onCreated?: () => void;
};

export function DiaryComposer({ tripId, date, onCreated }: Props) {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');      // 'HH:MM'
  const [stopId, setStopId] = useState('');  // 연결할 일정
  const [loading, setLoading] = useState(false);

  // 같은 날짜의 stop만 가져옴(클라 필터)
  const { stops } = useStops(tripId, date);

  // 시간/스톱 자동매칭(±60분 내 가장 가까운 stop)
  useEffect(() => {
    if (!date || !stops.length) { setStopId(''); return; }
    const target = time || '00:00';
    const tMin = toMinutes(target);
    let best: any | undefined;
    let bestDiff = Infinity;
    for (const s of stops) {
      if (!s.startTime) continue;
      const diff = Math.abs(toMinutes(s.startTime) - tMin);
      if (diff < bestDiff && diff <= 60) { best = s; bestDiff = diff; }
    }
    setStopId(best?.id || stops[0]?.id || '');
  }, [time, stops, date]);

  const submit = async () => {
    const body: any = { entry_type: 'note', text: text.trim() };
    if (!body.text) return;
    if (date) body.happened_at = new Date(`${date}T${time || '00:00'}:00`).toISOString();
    if (stopId) body.stop_id = stopId;

    setLoading(true);
    try {
      await createDiary(tripId, body);
      setText(''); setTime(''); // stopId는 유지
      onCreated?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionTitle>기록</SectionTitle>

      {/* 날짜/시간 + 일정 선택 */}
      <Row style={{ gap: 8, marginBottom: 8 }}>
        <Label style={{ minWidth: 48 }}>일시</Label>
        <Input type="date" disabled value={date || ''} onChange={() => {}} style={{ maxWidth: 160 }} />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ maxWidth: 140 }} />

        <Label style={{ marginLeft: 12 }}>일정</Label>
        <select
          value={stopId}
          onChange={(e) => setStopId(e.target.value)}
          style={{ minWidth: 220, padding: '8px', borderRadius: 12, border: '1px solid #e5e7eb' }}
        >
          <option value="">(선택 안 함)</option>
          {stops.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.placeName}{s.startTime ? ` · ${s.startTime}` : ''}
            </option>
          ))}
        </select>
      </Row>

      <Textarea
        placeholder="여행 중/후 메모를 남겨보세요…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Row style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <Button onClick={submit} disabled={loading || !text.trim()}>
          {loading ? '저장 중…' : '기록'}
        </Button>
      </Row>
    </Card>
  );
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}