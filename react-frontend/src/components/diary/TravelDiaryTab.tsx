// 레이아웃 & 탭

import { useState } from 'react';
import { StopPlanner } from '../StopPlanner';
import { DiaryComposer } from './DiaryComposer';
import { DiaryTimeline } from './DiaryTimeline';
import styled from 'styled-components';
import { Button } from '../ui';

const DesktopGrid = styled.div`
  display: none;
  gap: 16px;
  @media (min-width: 900px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;
const Mobile = styled.div`
  display: grid;
  gap: 12px;
  @media (min-width: 900px) { display: none; }
`;
const Tabs = styled.div`
  display: flex; gap: 8px; margin-bottom: 8px;
`;

export default function TravelDiaryTab({ tripId }: { tripId: string }) {
  const [tab, setTab] = useState<'plan'|'diary'>('plan');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <>
      {/* 데스크톱: 2컬럼 */}
      <DesktopGrid>
        <div><StopPlanner tripId={tripId} onAdded={refresh} /></div>
        <div style={{display:'grid', gap:12}}>
          <DiaryComposer tripId={tripId} onCreated={refresh} />
          <DiaryTimeline key={refreshKey} tripId={tripId} />
        </div>
      </DesktopGrid>

      {/* 모바일: 탭 전환 */}
      <Mobile>
        <Tabs>
          <Button variant={tab==='plan'?'primary':'ghost'} onClick={()=>setTab('plan')}>일정</Button>
          <Button variant={tab==='diary'?'primary':'ghost'} onClick={()=>setTab('diary')}>일기</Button>
        </Tabs>

        {tab === 'plan' ? (
          <StopPlanner tripId={tripId} onAdded={refresh} />
        ) : (
          <>
            <DiaryComposer tripId={tripId} onCreated={refresh} />
            <DiaryTimeline key={refreshKey} tripId={tripId} />
          </>
        )}
      </Mobile>
    </>
  );
}
