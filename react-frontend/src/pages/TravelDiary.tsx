import React, { useState } from 'react';
import styled from 'styled-components';
import RcIcon from '../components/RcIcon';
import { FaRoute, FaCheckCircle, FaShareAlt, FaMapMarkedAlt, FaTrophy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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
const Grid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 960px){ grid-template-columns: 1fr; }
`;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
`;
const Row = styled.div`display:flex; align-items:center; gap:10px;`;
const Muted = styled.div`color:#6b7280; font-size:12px;`;

const StatCard = styled(Card)`
  text-align:center;
  h3{ font-size:32px; font-weight:800; color:#4f46e5; margin:6px 0; }
  span{ color:#64748b; font-weight:600; }
`;

const CollectionGrid = styled.div`
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 960px){ grid-template-columns: 1fr; }
`;
const PlaceCard = styled(Card)<{active?:boolean}>`
  border-color: ${({active})=>active ? '#22c55e' : '#e5e7eb'};
  background: ${({active})=>active ? 'linear-gradient(180deg, #f0fff4 0%, #ffffff 100%)' : '#fff'};
  transition: .2s ease;
  &:hover{ transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.08); }
`;
const Pill = styled.div`
  width:48px; height:48px; border-radius:9999px; display:flex; align-items:center; justify-content:center;
  background:#eef2ff; color:#4338ca; font-size:20px;
`;

export default function TravelDiary() {
  const nav = useNavigate();
  const [bookTitle, setBookTitle] = useState('');

  const handleStart = () => {
    const title = bookTitle.trim();
    if (!title) return;
    const id =
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `trip_${Date.now().toString(36)}`;

  nav(`/book-trip/${id}?title=${encodeURIComponent(title)}`);
  };

  // 데모 데이터(원래 있던 카드 레이아웃)
  const collections = [
    { id:1, title:'포항 구룡포', desc:'한강 작가의 소설 배경지', collected:true },
    { id:2, title:'제주도', desc:'영화 촬영지', collected:true },
    { id:3, title:'부산 감천문화마을', desc:'부산의 대표 문화마을', collected:false },
    { id:4, title:'경주', desc:'신라 문화의 정수', collected:false },
    { id:5, title:'전주 한옥마을', desc:'전통 한옥의 아름다움', collected:false },
    { id:6, title:'여수 돌산공원', desc:'아름다운 밤바다', collected:false },
  ];
  const collected = collections.filter(c=>c.collected).length;

  return (
    <Page>
      <Container>
        <Title>여행일기</Title>

        {/* 액션 카드 (여기서만 책 제목 입력/시작하기 표시) */}
        <Grid3>
          <Card>
            <Row style={{justifyContent:'space-between'}}>
              <Row><RcIcon icon={FaRoute} /><b>여행 계획 세우기</b></Row>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <input
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder="책 제목을 입력하세요"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleStart}
                disabled={!bookTitle.trim()}
                style={{
                  marginLeft: 8,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: bookTitle.trim() ? '#6366f1' : '#c7d2fe',
                  color: '#fff',
                  border: 'none',
                  cursor: bookTitle.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                시작하기
              </button>
            </Row>
            <Muted style={{ marginTop: 8 }}>
              책 제목을 입력하고 시작하기를 누르면 /book-trip 페이지로 이동합니다.
            </Muted>
          </Card>

          <Card>
            <Row><RcIcon icon={FaCheckCircle} /><b>체크인</b></Row>
            <Muted style={{marginTop:8}}>위치 기반 체크인은 다음 단계에서 제공됩니다.</Muted>
            <button disabled style={{marginTop:12, padding:'8px 10px', borderRadius:12, border:'1px solid #e5e7eb', background:'#f8fafc'}}>체크인 (준비중)</button>
          </Card>

          <Card>
            <Row><RcIcon icon={FaShareAlt} /><b>공유</b></Row>
            <Muted style={{marginTop:8}}>링크 공유/공개 설정은 곧 제공됩니다.</Muted>
            <button disabled style={{marginTop:12, padding:'8px 10px', borderRadius:12, border:'1px solid #e5e7eb', background:'#f8fafc'}}>공유 링크 만들기 (준비중)</button>
          </Card>
        </Grid3>

        {/* 통계 */}
        <Grid3>
          <StatCard><h3>{collected}</h3><span>수집 완료</span></StatCard>
          <StatCard><h3>{collections.length}</h3><span>전체 장소</span></StatCard>
          <StatCard><h3>{Math.round((collected/collections.length)*100)}%</h3><span>달성률</span></StatCard>
        </Grid3>

        {/* 수집 카드 그리드 ) */}
        <CollectionGrid>
          {collections.map(c=>(
            <PlaceCard key={c.id} active={c.collected}>
              <Row style={{justifyContent:'space-between', marginBottom:8}}>
                <Row>
                  <Pill><RcIcon icon={FaMapMarkedAlt} /></Pill>
                  <div style={{marginLeft:12, fontWeight:800}}>{c.title}</div>
                </Row>
                {c.collected && <RcIcon icon={FaTrophy} color="#22c55e" />}
              </Row>
              <div style={{color:'#4f46e5', fontWeight:600}}>{c.desc}</div>
              <Muted style={{marginTop:6}}>{c.desc}</Muted>
            </PlaceCard>
          ))}
        </CollectionGrid>
      </Container>
    </Page>
  );
}
