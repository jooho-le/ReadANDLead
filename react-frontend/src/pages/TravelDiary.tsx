// src/pages/TravelDiary.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTrophy, FaMapMarkedAlt, FaRoute, FaCheckCircle, FaShareAlt } from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons';
import { useNavigate } from 'react-router-dom';

const RouteIcon = FaRoute as unknown as React.ComponentType<IconBaseProps>;
const CheckIcon = FaCheckCircle as unknown as React.ComponentType<IconBaseProps>;
const ShareIcon = FaShareAlt as unknown as React.ComponentType<IconBaseProps>;

const DiaryContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const DiarySection = styled.section`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const DiaryTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

/* ---------- Quick Actions ---------- */
const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
`;

const ActionCard = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  box-shadow: 0 8px 18px rgba(0,0,0,0.05);
`;

const ActionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 12px;
  color: #4338ca;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
`;

const Button = styled.button<{variant?: 'primary'|'ghost'}>`
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  ${({variant}) => variant === 'ghost'
    ? `background:#fff;border-color:#e5e7eb;color:#374151; &:hover{background:#f9fafb;}`
    : `background:#6366f1;color:#fff; &:hover{background:#4f46e5;}`
  };
  &:disabled { opacity:.6; cursor: not-allowed; }
`;

/* ---------- Stats & Collections (원래 UI 유지) ---------- */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid #dee2e6;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #666;
  font-weight: 600;
`;

const CollectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 40px;
`;

const CollectionCard = styled.div`
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }
  &.collected {
    border-color: #28a745;
    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
  }
`;

const BadgeIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 1.5rem;
  color: white;
  &.collected { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
`;

const CollectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  text-align: center;
`;

const CollectionBook = styled.p`
  color: #667eea;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
`;

const CollectionDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
`;

const TravelDiary: React.FC = () => {
  const navigate = useNavigate();
  const [tripIdInput, setTripIdInput] = useState('TEST'); // 임시 기본값(나중엔 새 여행 생성/선택으로 교체)

  const collections = [
    { id: 1, title: '포항 구룡포', description: '한강 작가의 소설 배경지', collected: true, icon: FaMapMarkedAlt },
    { id: 2, title: '제주도', description: '영화 촬영지', collected: true, icon: FaMapMarkedAlt },
    { id: 3, title: '부산 감천문화마을', description: '부산의 대표 문화마을', collected: false, icon: FaMapMarkedAlt },
    { id: 4, title: '경주', description: '신라 문화의 정수', collected: false, icon: FaMapMarkedAlt },
    { id: 5, title: '전주 한옥마을', description: '전통 한옥의 아름다움', collected: false, icon: FaMapMarkedAlt },
    { id: 6, title: '여수 돌산공원', description: '아름다운 밤바다', collected: false, icon: FaMapMarkedAlt },
  ];
  const collectedCount = collections.filter(c => c.collected).length;
  const totalCount = collections.length;

  const goPlan = () => {
    if (!tripIdInput.trim()) return;
    navigate(`/diary/trip/${encodeURIComponent(tripIdInput.trim())}`);
  };

  return (
    <DiaryContainer>
      <Container>
        <DiarySection>
          <DiaryTitle>여행일기</DiaryTitle>

          {/* 상단 빠른 액션 */}
          <ActionGrid>
            <ActionCard>
              <ActionTitle>
                <RouteIcon size={16} /> 여행 계획 세우기
              </ActionTitle>
              <Row>
                <Input
                  placeholder="여행 ID (예: TEST)"
                  value={tripIdInput}
                  onChange={(e) => setTripIdInput(e.target.value)}
                />
                <Button onClick={goPlan} disabled={!tripIdInput.trim()}>시작하기</Button>
              </Row>
              <p style={{margin:'8px 0 0', color:'#6b7280', fontSize:12}}>
                버튼을 누르면 <b>/diary/trip/ID</b> 화면으로 이동해 일정 계획 · 일기 작성 · 타임라인을 함께 봅니다.
              </p>
            </ActionCard>

            <ActionCard>
              <ActionTitle>
                <CheckIcon size={16} /> 체크인
              </ActionTitle>
              <p style={{color:'#6b7280', fontSize:14, margin:'6px 0 12px'}}>
                위치 기반 체크인은 다음 단계에서 제공됩니다.
              </p>
              <Row>
                <Button variant="ghost" disabled>체크인 (준비중)</Button>
              </Row>
            </ActionCard>

            <ActionCard>
              <ActionTitle>
                <ShareIcon size={16} /> 공유
              </ActionTitle>

              <p style={{color:'#6b7280', fontSize:14, margin:'6px 0 12px'}}>
                링크 공유/공개 설정은 곧 제공됩니다.
              </p>
              <Row>
                <Button variant="ghost" disabled>공유 링크 만들기 (준비중)</Button>
              </Row>
            </ActionCard>
          </ActionGrid>

          {/* 기존 통계/컬렉션 UI 유지 */}
          <StatsGrid>
            <StatCard><StatNumber>{collectedCount}</StatNumber><StatLabel>수집 완료</StatLabel></StatCard>
            <StatCard><StatNumber>{totalCount}</StatNumber><StatLabel>전체 장소</StatLabel></StatCard>
            <StatCard><StatNumber>{Math.round((collectedCount / totalCount) * 100)}%</StatNumber><StatLabel>달성률</StatLabel></StatCard>
            <StatCard><StatNumber>3</StatNumber><StatLabel>연속 방문</StatLabel></StatCard>
          </StatsGrid>

          <CollectionGrid>
            {collections.map((c) => (
              <CollectionCard key={c.id} className={c.collected ? 'collected' : ''}>
                <BadgeIcon className={c.collected ? 'collected' : ''}>
                  {React.createElement(c.icon as React.ComponentType<IconBaseProps>)}
                </BadgeIcon>
                <CollectionTitle>{c.title}</CollectionTitle>
                <CollectionBook>{c.description}</CollectionBook>
                <CollectionDescription>{c.description}</CollectionDescription>
                {c.collected && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    {React.createElement(FaTrophy as React.ComponentType<IconBaseProps>, { style: { color: '#28a745', fontSize: '1.2rem' } })}
                  </div>
                )}
              </CollectionCard>
            ))}
          </CollectionGrid>
        </DiarySection>
      </Container>
    </DiaryContainer>
  );
};

export default TravelDiary;
