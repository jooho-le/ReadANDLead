// 일기 작성

import { useState } from 'react';
import { createDiary } from '../../api/diary';
import { Card, SectionTitle, Textarea, Row, Button } from '../ui';

export function DiaryComposer({ tripId, onCreated }: { tripId: string; onCreated?: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await createDiary(tripId, { entry_type: 'note', text });
      setText('');
      onCreated?.();
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <SectionTitle>기록</SectionTitle>
      <Textarea placeholder="여행일기 적기..." value={text} onChange={(e)=>setText(e.target.value)} />
      <Row style={{justifyContent:'flex-end', marginTop: 8}}>
        <Button onClick={submit} disabled={loading}>기록</Button>
      </Row>
    </Card>
  );
}
