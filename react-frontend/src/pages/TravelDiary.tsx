import React from 'react';
import styled from 'styled-components';
import { FaTrophy, FaMapMarkedAlt } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

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
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

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
  
  &.collected {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }
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
  const collections = [
    {
      id: 1,
      title: '포항 구룡포',
      description: '한강 작가의 소설 배경지',
      collected: true,
      icon: FaMapMarkedAlt
    },
    {
      id: 2,
      title: '제주도',
      description: '영화 촬영지',
      collected: true,
      icon: FaMapMarkedAlt
    },
    {
      id: 3,
      title: '부산 감천문화마을',
      description: '부산의 대표 문화마을',
      collected: false,
      icon: FaMapMarkedAlt
    },
    {
      id: 4,
      title: '경주',
      description: '신라 문화의 정수',
      collected: false,
      icon: FaMapMarkedAlt
    },
    {
      id: 5,
      title: '전주 한옥마을',
      description: '전통 한옥의 아름다움',
      collected: false,
      icon: FaMapMarkedAlt
    },
    {
      id: 6,
      title: '여수 돌산공원',
      description: '아름다운 밤바다',
      collected: false,
      icon: FaMapMarkedAlt
    }
  ];

  const collectedCount = collections.filter(c => c.collected).length;
  const totalCount = collections.length;

  return (
    <DiaryContainer>
      <Container>
        <DiarySection>
          <DiaryTitle>나만의 문학 지도</DiaryTitle>
          
          <StatsGrid>
            <StatCard>
              <StatNumber>{collectedCount}</StatNumber>
              <StatLabel>수집 완료</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{totalCount}</StatNumber>
              <StatLabel>전체 장소</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{Math.round((collectedCount / totalCount) * 100)}%</StatNumber>
              <StatLabel>달성률</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>3</StatNumber>
              <StatLabel>연속 방문</StatLabel>
            </StatCard>
          </StatsGrid>

          <CollectionGrid>
            {collections.map((collection) => {
              return (
                <CollectionCard key={collection.id} className={collection.collected ? 'collected' : ''}>
                  <BadgeIcon className={collection.collected ? 'collected' : ''}>
                    {React.createElement(collection.icon as React.ComponentType<IconBaseProps>)}
                  </BadgeIcon>
                  <CollectionTitle>{collection.title}</CollectionTitle>
                  <CollectionBook>{collection.description}</CollectionBook>
                  <CollectionDescription>{collection.description}</CollectionDescription>
                  {collection.collected && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      {React.createElement(FaTrophy as React.ComponentType<IconBaseProps>, { style: { color: '#28a745', fontSize: '1.2rem' } })}
                    </div>
                  )}
                </CollectionCard>
              );
            })}
          </CollectionGrid>
        </DiarySection>
      </Container>
    </DiaryContainer>
  );
};

export default TravelDiary; 