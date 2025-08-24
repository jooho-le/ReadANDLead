import { useParams } from 'react-router-dom';
import TravelDiaryTab from '../components/diary/TravelDiaryTab';

export default function DiaryTripPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>잘못된 접근 (trip id 없음)</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>여행 계획 & 일기</h2>
      <TravelDiaryTab tripId={id} />
    </div>
  );
}
