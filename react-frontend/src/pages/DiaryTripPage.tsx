// 여행일기 탭 - 여행 계획 세우기에서 ID 입력 후 시작하기 버튼 누르면 나오는 페이지

import { NavLink, Outlet, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { StopPlanner } from '../components/StopPlanner';
import { DiaryComposer } from '../components/diary/DiaryComposer';
import { DiaryTimeline } from '../components/diary/DiaryTimeline';

import { listStops, type Stop } from '../api/trips';
import { createDiary } from '../api/diary';
import { Card, SectionTitle, Row, Button, Input, Textarea } from '../components/ui';

const Wrap = styled.div`display:grid; gap:16px;`;
const Tabs = styled.div`
  display:flex; gap:8px; border-bottom:1px solid #eef2f7;
  a{ padding:10px 14px; border-radius:12px 12px 0 0; text-decoration:none; color:#475569; }
  a.active{ background:#ffffff; border:1px solid #e5e7eb; border-bottom-color:transparent; color:#111827; }
`;

/* ---------------- Layout ---------------- */

export default function DiaryTripLayout() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>잘못된 접근(Trip ID 없음)</div>;
  return (
    <Wrap>

      <Tabs>
        <NavLink to="plan" end className={({isActive})=>isActive?'active':''}>일정 계획</NavLink>
        <NavLink to="itinerary" className={({isActive})=>isActive?'active':''}>여행 일정</NavLink>
        <NavLink to="journal" className={({isActive})=>isActive?'active':''}>여행 일기</NavLink>
      </Tabs>
      <Outlet />
    </Wrap>
  );
}

/* ---------------- Panels ---------------- */

export function PlanPanel() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{display:'grid', gap:12}}>
      <StopPlanner tripId={id!} onAdded={() => { /* 필요시 토스트 */ }} />
    </div>
  );
}

export function JournalPanel() {
  const { id } = useParams<{ id: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div style={{display:'grid', gap:12}}>
      <DiaryComposer tripId={id!} onCreated={refresh} />
      <DiaryTimeline key={refreshKey} tripId={id!} />
    </div>
  );
}

/*  ItineraryPanel (일정 전체 보기 + 각 일정에 일기 추가) */

function groupByDate(stops: Stop[]) {
  const map: Record<string, Stop[]> = {};
  for (const s of stops) {
    const key = s.date || '날짜 미정';
    (map[key] ??= []).push(s);
  }
  // 날짜 오름차순 + 같은 날은 시간 오름차순
  Object.values(map).forEach(arr =>
    arr.sort((a,b) => (a.startTime||'') < (b.startTime||'') ? -1 : 1)
  );
  return Object.entries(map).sort(([a],[b]) => (a < b ? -1 : 1));
}

export function ItineraryPanel() {
  const { id } = useParams<{ id: string }>();
  const [stops, setStops] = useState<Stop[]>([]);
  const [openId, setOpenId] = useState<string|null>(null);
  const [textById, setTextById] = useState<Record<string,string>>({});
  const [loadingId, setLoadingId] = useState<string|null>(null);

  const fetchStops = async () => {
    try {
      const data = await listStops(id!);
      setStops(data);
    } catch {
      setStops([]); // API 미구현이어도 화면 유지
    }
  };

  useEffect(() => { fetchStops(); }, [id]);

  const addNote = async (s: Stop) => {
    const text = (textById[s.id] || '').trim();
    if (!text) return;
    setLoadingId(s.id);
    try {
      const happened_at = s.date
        ? new Date(`${s.date}T${s.startTime || '00:00'}:00`).toISOString()
        : undefined;
      await createDiary(id!, { entry_type: 'note', text, stop_id: s.id, happened_at });
      setTextById(prev => ({ ...prev, [s.id]: '' }));
      setOpenId(null);
    } finally {
      setLoadingId(null);
    }
  };

  const grouped = useMemo(() => groupByDate(stops), [stops]);

  return (
    <div style={{display:'grid', gap:12}}>
      {grouped.map(([date, items]) => (
        <Card key={date}>
          <SectionTitle>{date}</SectionTitle>
          <div style={{display:'grid', gap:8}}>
            {items.map(s => (
              <div key={s.id} id={`stop-${s.id}`} style={{border:'1px solid #eef2f7', borderRadius:12, padding:12}}>
                <Row style={{justifyContent:'space-between'}}>
                  <div style={{fontWeight:600}}>{(s as any).name || (s as any).placeName || '장소'}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>
                    {[s.date, s.startTime].filter(Boolean).join(' · ')}
                  </div>
                </Row>

                {openId === s.id ? (
                  <>
                    <Textarea
                      placeholder="이 일정에 대한 일기를 적어보세요…"
                      value={textById[s.id] || ''}
                      onChange={(e)=>setTextById({...textById, [s.id]: e.target.value})}
                    />
                    <Row style={{justifyContent:'flex-end', gap:8}}>
                      <Button variant="ghost" onClick={()=>setOpenId(null)}>취소</Button>
                      <Button
                        onClick={()=>addNote(s)}
                        disabled={loadingId===s.id || !(textById[s.id]||'').trim()}
                      >
                        저장
                      </Button>
                    </Row>
                  </>
                ) : (
                  <Row style={{justifyContent:'flex-end'}}>
                    <Button onClick={()=>setOpenId(s.id)}>이 일정에 일기 추가</Button>
                  </Row>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {grouped.length === 0 && (
        <Card><div style={{color:'#64748b'}}>아직 추가된 일정이 없습니다.</div></Card>
      )}
    </div>
  );
}