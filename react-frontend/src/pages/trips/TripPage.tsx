import { useParams } from 'react-router-dom';
import TravelDiaryTab from '../../components/diary/TravelDiaryTab';

export default function TripPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <div>잘못된 접근입니다. (trip id 없음)</div>;

  return (
    <div className="grid gap-6">
      {/* 기존 지도/일정 UI가 있다면 위쪽 섹션에 배치 */}

      <section>
        <h2 className="text-lg font-semibold mb-2">여행일기</h2>
        <TravelDiaryTab tripId={id} />
      </section>
    </div>
  );
}
