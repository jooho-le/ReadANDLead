import React, { useState } from 'react';
import styled from 'styled-components';
import AutocompleteInput, { Suggestion } from '../components/common/AutocompleteInput';
import bookLocationData from '../data/book_location_event.json';
import RcIcon from '../components/RcIcon';
import { FaRoute, FaTrophy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  InputGroup,
  StyledAutoInput,
  StyledSubmitButton,
} from '../components/ui';

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(120deg, #eef2ff 0%, #f8fafc 100%);
  padding: 48px 20px 80px;
`;
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;
const Title = styled.h1`
  font-size: 40px;
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.02em;
  color: #5b21b6;
  margin-bottom: 28px;
`;
// const Grid3 = styled.div`
//   display: grid;
//   grid-template-columns: repeat(3,minmax(0,1fr));
//   gap: 16px;
//   margin-bottom: 24px;
//   @media (max-width: 960px){ grid-template-columns: 1fr; }
// `;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
`;
const PlanCard = styled(Card)`
  padding: 36px;
`;
const Row = styled.div`display:flex; align-items:center; gap:10px;`;
const Muted = styled.div`color:#6b7280; font-size:12px;`;

// const StatCard = styled(Card)`
//   text-align:center;
//   h3{ font-size:32px; font-weight:800; color:#4f46e5; margin:6px 0; }
//   span{ color:#64748b; font-weight:600; }
// `;

// 상단은 단일 카드, 배지는 하단 전체 폭으로 표시

const Badges = styled.div`display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:8px; @media(max-width:960px){grid-template-columns:1fr;}`;
const BadgeCard = styled(Card)`display:flex; align-items:center; gap:14px; border:1px dashed #d1d5db; background:#fafafa; padding:20px;`;
const BadgeIcon = styled.div`width:56px;height:56px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:#e0f2fe;color:#0369a1;font-weight:900;font-size:22px;`;

// 좌측 버튼 + 우측 콘텐츠 레이아웃
const Layout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
  @media (max-width: 960px){ grid-template-columns: 1fr; }
`;
const Sidebar = styled.div`display:flex; flex-direction:column; gap:12px;`;
const SideBtn = styled.button<{active?:boolean}>`
  width: 100%;
  padding: 18px 16px;
  border-radius: 14px;
  border: 2px solid ${({active})=>active?'#6366f1':'#e5e7eb'};
  background: ${({active})=>active?'#eef2ff':'#fff'};
  color: ${({active})=>active?'#3730a3':'#111'};
  font-weight: 800;
  font-size: 18px;
  display:flex; align-items:center; gap:10px; justify-content:flex-start;
  cursor:pointer;
`;
const Content = styled.div`display:grid; gap:16px;`;

export default function TravelDiary() {
  const nav = useNavigate();
  const [bookTitle, setBookTitle] = useState('');
  const [tab, setTab] = useState<'plan'|'badges'>('plan');

  // 도서 자동완성: 데이터 키 기반
  const bookTitles = Object.keys(bookLocationData as any);
  async function fetchBookSuggestions(q: string): Promise<Suggestion[]>{
    const s = q.trim().toLowerCase();
    if(!s) return [];
    return bookTitles
      .filter(t => t.toLowerCase().includes(s))
      .slice(0, 8)
      .map(t => ({ label: t }));
  }

  const handleStart = () => {
    const title = bookTitle.trim();
    if (!title) return;
    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `trip_${Date.now().toString(36)}`;
    // ✅ 쿼리 파라미터를 book=... 으로 맞춤
    const qs = new URLSearchParams({ book: title }).toString();
    nav(`/diary/trip/${encodeURIComponent(id)}/plan?${qs}`);
  };

  // 수집 배지(예시 1개: '소년이 온다' 미션 클리어)
  const badges = [
    { id: 'badge-1', title: "'소년이 온다' 미션 클리어", date: new Date().toISOString() },
    { id: 'badge-2', title: "'바깥은 여름' 미션 클리어", date: new Date().toISOString() },
    { id: 'badge-3', title: "'왕을 찾아서' 미션 클리어", date: new Date().toISOString() },
  ];
  const collected = badges.length;

  return (
    <Page>
      <Container>
        <Title>여행 퀘스트북</Title>

        <Layout>
          <Sidebar>
            <SideBtn active={tab==='plan'} onClick={()=>setTab('plan')}>
              <RcIcon icon={FaRoute} /> 여행 계획 세우기
            </SideBtn>
            <SideBtn active={tab==='badges'} onClick={()=>setTab('badges')}>
              <RcIcon icon={FaTrophy} /> 나의 수집 배지
            </SideBtn>
          </Sidebar>
          <Content>
            {tab==='plan' && (
              <PlanCard>
                <Row style={{justifyContent:'space-between'}}>
                  <Row>
                    <RcIcon icon={FaRoute} />
                    <b style={{ fontSize: 22 }}>여행 계획 세우기</b>
                  </Row>
                </Row>
                <Row style={{ marginTop: 12, width: '100%' }}>
                  <InputGroup style={{ width: '97%' }}>
                    <StyledAutoInput
                      value={bookTitle}
                      onChange={setBookTitle}
                      placeholder="책 제목을 입력하세요 (예: 소년이 온다)"
                      fetchSuggestions={fetchBookSuggestions}
                      onSelect={(s)=>setBookTitle(s.label)}
                    />
                    <StyledSubmitButton
                      onClick={handleStart}
                      type="button"
                      disabled={!bookTitle.trim()}
                    >
                      시작하기
                    </StyledSubmitButton>
                  </InputGroup>
                </Row>

                <Muted style={{ marginTop: 8 }}>
                  책 제목을 입력하고 시작하기를 누르면 여행 루트 추천 페이지로 이동합니다.
                </Muted>
              </PlanCard>
            )}

            {tab==='badges' && (
              <Card>
                <div style={{fontWeight:800, marginBottom:8}}>나의 수집 배지</div>
                <Badges>
                  {badges.map(b => (
                    <BadgeCard key={b.id}>
                      <BadgeIcon>🏅</BadgeIcon>
                      <div>
                        <div style={{fontWeight:700}}>{b.title}</div>
                        <Muted style={{marginTop:2}}>{new Date(b.date).toLocaleDateString()}</Muted>
                      </div>
                    </BadgeCard>
                  ))}
                </Badges>
                <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '13px' }}>
                    ※ 위 배지는 예시이며, 실제 AI 여행 미션을 모두 인증한 후 본인만의 배지가 발급됩니다.
                </p>
              </Card>
            )}
          </Content>
        </Layout>
      </Container>
    </Page>
  );
}
