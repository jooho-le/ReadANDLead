// 일정 계획 세우는 부분
import { useState } from 'react';
import { upsertPlace, addStop, type Source } from '../api/trips';
import { Card, SectionTitle, Row, Col, Select, Input, Button, Help, Label } from './ui';


export function StopPlanner({ tripId, onAdded }: { tripId: string; onAdded?: () => void }) {
  const [source, setSource] = useState<Source>('kakao');
  const [externalId, setExternalId] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = !!name && !!externalId && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { id: placeId } = await upsertPlace({ source, externalId, name });
      await addStop(tripId, { placeId, date: date || undefined, startTime: startTime || undefined });
      setExternalId(''); setName(''); setDate(''); setStartTime('');
      onAdded?.();
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <SectionTitle>일정 계획</SectionTitle>
      <Col gap={10}>
        <Row gap={8}>
          <Label style={{minWidth: 56}}>플랫폼</Label>
          <Select value={source} onChange={e=>setSource(e.target.value as Source)} style={{maxWidth:120}}>
            <option value="kakao">Kakao</option>
            <option value="google">Google</option>
            <option value="naver">Naver</option>
          </Select>
          <Input placeholder="Place externalId (예: Kakao place_id)" value={externalId} onChange={e=>setExternalId(e.target.value)} />
        </Row>

        <Row gap={8}>
          <Label style={{minWidth: 56}}>장소</Label>
          <Input placeholder="장소 이름" value={name} onChange={e=>setName(e.target.value)} />
        </Row>

        <Row gap={8}>
          <Label style={{minWidth: 56}}>일시</Label>
          <Row gap={8} style={{flex:1}}>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{maxWidth: 180}} />
            <Input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={{maxWidth: 140}} />
            <div style={{flex:1}} />
            <Button onClick={submit} disabled={!canSubmit}>일정 추가하기</Button>
          </Row>
        </Row>

        <Help>장소 검색 UI는 추후 Kakao/Google 검색으로 교체 예정. 현재는 externalId + 이름 수동 입력.</Help>
      </Col>
    </Card>
  );
}
