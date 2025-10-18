// 여행일기 탭 - 여행 계획 세우기에서 ID 입력 후 시작하기 버튼 누르면 나오는 페이지

import { NavLink, Outlet, useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { StopPlanner } from '../components/StopPlanner';
// 일기 기능은 현재 숨김 처리 (요청에 따라 제거)

import { listStops, type Stop } from '../api/trips';
import { createDiary, generatePlan, type TravelPlan } from '../api/diary';
import { persistPlan, completeMission, getBookContext } from '../api/trips';
import bookLocationData from '../data/book_location_event.json';
import { apiUrl } from '../api/config';
import { Card, SectionTitle, Row, Button, Input, Textarea } from '../components/ui';

const Wrap = styled.div`display:grid; gap:16px;`;
const Tabs = styled.div`
  display:flex; gap:8px; border-bottom:1px solid #eef2f7;
  a{ padding:10px 14px; border-radius:12px 12px 0 0; text-decoration:none; color:#475569; }
  a.active{ background:#ffffff; border:1px solid #e5e7eb; border-bottom-color:transparent; color:#111827; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  display: block;
  flex-direction: column;
`;

const LavenderSection = styled.div`
  background: linear-gradient(
    180deg,
    #f7f4ff 0%,    /* 연한 라벤더 */
    #eee7ff 30%,   /* 중간톤 */
    #e2dbff 100%   /* 살짝 푸른 보라로 내려감 */
  );
  padding: 24px;
  border-radius: 16px;
  display: grid;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(128, 90, 213, 0.06);  /* 연보라 그림자 */
  border: 1px solid #e9e5ff;                        /* 아주 옅은 테두리 */
`;


/* ---------------- Layout ---------------- */

export default function DiaryTripLayout() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>잘못된 접근(Trip ID 없음)</div>;
  return (
    <Wrap>
      <Tabs>
        <NavLink to="plan" end className={({isActive})=>isActive?'active':''}>일정 계획</NavLink>
        <NavLink to="itinerary" className={({isActive})=>isActive?'active':''}>미션 인증하기</NavLink>
      </Tabs>
      <Outlet />
    </Wrap>
  );
}

/* ---------------- Plan Form (GPT 여행 계획 생성) ---------------- */

function PlanForm({ tripId }: { tripId: string }) {
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const initialBook = qs.get("book") || "";

  const [bookTitle, setBookTitle] = useState(initialBook);
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(2);
  const [theme, setTheme] = useState("");

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxData, setCtxData] = useState<{title:string; author?:string; background?:string; content?:string; cover_url?:string} | null>(null);

  // 초기 로드 시 저장된 계획 복구
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tripPlan:${tripId}`);
      if (raw) setPlan(JSON.parse(raw));
    } catch {}
  }, [tripId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 0) 책 컨텍스트 팝업 표시
      try {
        const ctx = await getBookContext(bookTitle);
        // 로컬 데이터(book_location_event.json) 우선 사용: event/loc → content/background
        let localContent: string | undefined;
        let localBackground: string | undefined;
        try {
          const keys = Object.keys(bookLocationData as any);
          const lower = bookTitle.trim().toLowerCase();
          const hit = keys.find(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()));
          const arr:any = hit ? (bookLocationData as any)[hit] : undefined;
          if (Array.isArray(arr) && arr[0]) {
            localContent = arr[0].event;
            localBackground = arr[0].location;
          }
        } catch {}
        setCtxData({
          title: ctx.title,
          author: ctx.author,
          background: localBackground || ctx.background,
          content: localContent || ctx.content,
          cover_url: ctx.cover_url,
        });
        setCtxOpen(true);
      } catch {}
      const res = await generatePlan(tripId, { bookTitle, travelers, days, theme });
      setPlan(res);
      // 서버에 영속 저장(Stop ID 부여)
      const stopsForPersist = (res.days || []).map((d: any) => ({ day: d.day, stops: d.stops || [] }));
      try { await persistPlan(tripId, { bookTitle, theme, days, stops: stopsForPersist }); } catch {}
      // 로컬에도 보존(페이지 이동/새로고침 후 유지)
      try { localStorage.setItem(`tripPlan:${tripId}`, JSON.stringify(res)); } catch {}
    } catch (err: any) {
      setError(err?.message || "일정 생성 실패");
    } finally {
      setLoading(false);
      // 생성이 끝나면 모달 자동 닫기
      setCtxOpen(false);
    }
  };

  return (
    <LavenderSection>
    <Card>
      <SectionTitle>책 기반 일정 계획 만들기</SectionTitle>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <FormGrid>
    <FormField>
      <div style={{ fontSize: 12, color: '#6b7280' }}>책 제목</div>
      <Input
        value={bookTitle}
        onChange={e => setBookTitle(e.target.value)}
        placeholder="예) 난쟁이가 쏘아올린 작은 공"
        required
      />
    </FormField>
    <FormField>
      <div style={{ fontSize: 12, color: '#6b7280' }}>인원</div>
      <Input
        type="number"
        min={1}
        value={travelers}
        onChange={e => setTravelers(Number(e.target.value) || 1)}
      />
    </FormField>
    <FormField>
      <div style={{ fontSize: 12, color: '#6b7280' }}>기간(일)</div>
      <Input
        type="number"
        min={1}
        value={days}
        onChange={e => setDays(Number(e.target.value) || 1)}
        />
      </FormField>
      <FormField>
        <div style={{ fontSize: 12, color: '#6b7280' }}>테마</div>
        <Input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="예) 역사 체험 / 문학 산책"
        />
      </FormField>
      <div style={{ alignSelf: 'end' }}>
        <Button type="submit" disabled={loading}>
          {loading ? '생성 중...' : '계획 생성'}
        </Button>
      </div>
    </FormGrid>


    {error && <div style={{ color: '#ef4444' }}>{error}</div>}
  </form>

      {plan && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>요약</div>
            <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{plan.summary}</div>
          </Card>

          {plan.days.map(d => (
            <Card key={d.day}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                Day {d.day} {d.theme ? `· ${d.theme}` : ""}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {d.stops.map((s, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                      <div style={{ width: 60, color:'#6b7280' }}>{s.time || ""}</div>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      {s.place && <div style={{ color:'#6b7280' }}>· {s.place}</div>}
                      {s.notes && <div style={{ color:'#9ca3af' }}>— {s.notes}</div>}
                    </div>
                    {s.mission && (
                      <div style={{ color:'#10b981', marginLeft: '68px' }}>
                        🎯 미션: {s.mission}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {plan && (
        <Row gap={8}>
          <Button
            variant="ghost"
            onClick={() => { try { localStorage.removeItem(`tripPlan:${tripId}`); } catch {}; setPlan(null); }}
          >계획 비우기</Button>
        </Row>
      )}
    </Card>

    {/* 책 컨텍스트 모달 (한 줄 요약) */}
    {ctxOpen && (
      <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}} onClick={()=>setCtxOpen(false)}>
        <div onClick={(e)=>e.stopPropagation()} style={{width:'min(92vw,720px)', background:'#fff', borderRadius:16, padding:20, boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontWeight:900, fontSize:22}}>📚 {ctxData?.title}</div>
            <button onClick={()=>setCtxOpen(false)} style={{border:'1px solid #eee', background:'#fff', borderRadius:8, padding:'6px 10px'}}>닫기</button>
          </div>
          <div style={{display:'grid', gap:12}}>
            {ctxData?.cover_url && (
              <div style={{display:'flex', justifyContent:'center'}}>
                <img src={ctxData.cover_url} alt="cover" style={{width:120, height:160, objectFit:'cover', borderRadius:8, boxShadow:'0 6px 18px rgba(0,0,0,.15)'}} />
              </div>
            )}
            <div><b>저자</b><div style={{color:'#374151', marginTop:4}}>{ctxData?.author || '알 수 없음'}</div></div>
            <div><b>배경</b><div style={{color:'#374151', marginTop:4}}>{ctxData?.background || '—'}</div></div>
            <div><b>내용</b><div style={{color:'#374151', marginTop:4}}>{ctxData?.content || '검색 결과가 충분하지 않습니다.'}</div></div>
            {loading && <div style={{color:'#64748b'}}>계획 생성 중… 잠시만 기다려 주세요.</div>}
          </div>
        </div>
      </div>
    )}
    </LavenderSection>
  );

}

/* ---------------- Panels ---------------- */

export function PlanPanel() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* ✅ GPT 여행 계획 폼 */}
      <PlanForm tripId={id!} />

      {/* 기존 수동 일정 관리 UI */}
      <LavenderSection>
        <Card>
          <StopPlanner tripId={id!} onAdded={() => { /* 필요시 토스트 */ }} />
        </Card>
      </LavenderSection>

    </div>
  );
}

// JournalPanel 제거(요청에 따라 일기 기능 숨김)

/*  ItineraryPanel (일정 전체 보기 + 각 일정에 일기 추가) */

function groupByDate(stops: Stop[]) {
  const map: Record<string, Stop[]> = {};
  for (const s of stops) {
    const key = s.date || '날짜 미정';
    (map[key] ??= []).push(s);
  }
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
      {/* file input은 동적으로 생성하여 사용함 */}
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
                    {/* 간단 인증 버튼: 파일 업로드 → proof_url 등록 */}
                    <Button
                      onClick={async ()=>{
                        try{
                          const input = document.createElement('input');
                          input.type='file'; input.accept='image/*';
                          input.onchange = async ()=>{
                            const f = input.files?.[0]; if(!f) return;
                            const form = new FormData(); form.append('file', f);
                            const res = await fetch(apiUrl('/api/uploads'), { method:'POST', body: form, credentials:'include' });
                            if(!res.ok) throw new Error('upload failed');
                            const j = await res.json();
                            await completeMission(id!, Number(s.id), j.url);
                            await fetchStops();
                          };
                          input.click();
                        } catch(err) { console.error(err); }
                      }}
                    >인증하기</Button>
                  </Row>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {grouped.length === 0 && (
        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ color:'#64748b', textAlign: 'center' }}>
            아직 추가된 일정이 없습니다.
          </div>
        </Card>
      )}
    </div>
  );
}
