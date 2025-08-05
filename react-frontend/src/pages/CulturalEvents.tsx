import React from 'react';
import styled from 'styled-components';
import { FaCalendarAlt, FaTheaterMasks, FaBook, FaMapMarkedAlt, FaHeart, FaShareAlt } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

const EventsContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const EventsSection = styled.section`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;

const EventsTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;



const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const EventCard = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const EventHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e1e5e9;
`;

const EventIcon = styled.div`
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 12px;
`;

const EventTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const EventInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #666;
  font-size: 0.9rem;
`;

const EventDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const EventActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 0 24px 24px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid #e1e5e9;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }
  
  &.primary {
    background: #667eea;
    color: white;
    border-color: #667eea;
    
    &:hover {
      background: #5a6fd8;
    }
  }
`;

const CulturalEvents: React.FC = () => {
  const events = [
    {
      id: 1,
      title: '한강 작가 북토크',
      date: '2024.01.15',
      location: '부산 해운대',
      description: '동백꽃 필 무렵의 배경지에서 한강 작가와 함께하는 특별한 북토크',
      book: '동백꽃 필 무렵',
      icon: FaBook
    },
    {
      id: 2,
      title: '문학 기행 전시',
      date: '2024.01.20',
      location: '서울 종로',
      description: '한국 현대문학의 배경지를 찾아 떠나는 문학 기행 전시',
      book: '다양한 작품',
      icon: FaTheaterMasks
    },
    {
      id: 3,
      title: '건축학개론 촬영지 투어',
      date: '2024.01.25',
      location: '전주 한옥마을',
      description: '건축학개론 촬영지를 돌아보는 특별 투어',
      book: '건축학개론',
      icon: FaMapMarkedAlt
    },
    {
      id: 4,
      title: '부산 밤바다 시 낭송회',
      date: '2024.02.01',
      location: '부산 광안리',
      description: '부산의 밤바다를 배경으로 한 시 낭송회',
      book: '부산행',
      icon: FaTheaterMasks
    },
    {
      id: 5,
      title: '전주 한옥마을 작가 사인회',
      date: '2024.02.05',
      location: '전주 한옥마을',
      description: '전통 한옥에서 만나는 작가 사인회',
      book: '전주 한옥마을 이야기',
      icon: FaBook
    },
    {
      id: 6,
      title: '여수 밤바다 문학 콘서트',
      date: '2024.02.10',
      location: '여수 돌산공원',
      description: '여수 밤바다를 배경으로 한 문학 콘서트',
      book: '여수 밤바다',
      icon: FaTheaterMasks
    }
  ];

  return (
    <EventsContainer>
      <Container>
        <EventsSection>
          <EventsTitle>문화행사 & 이벤트</EventsTitle>
          
          <EventsGrid>
            {events.map((event) => {
              return (
                <EventCard key={event.id}>
                  <EventHeader>
                    <EventIcon>
                      {React.createElement(event.icon as React.ComponentType<IconBaseProps>)}
                    </EventIcon>
                    <EventTitle>{event.title}</EventTitle>
                    <EventInfo>
                      {React.createElement(FaCalendarAlt as React.ComponentType<IconBaseProps>)}
                      {event.date}
                    </EventInfo>
                    <EventInfo>
                      {React.createElement(FaMapMarkedAlt as React.ComponentType<IconBaseProps>)}
                      {event.location}
                    </EventInfo>
                    <EventInfo>
                      {React.createElement(FaBook as React.ComponentType<IconBaseProps>)}
                      {event.book}
                    </EventInfo>
                    <EventDescription>{event.description}</EventDescription>
                  </EventHeader>
                  <EventActions>
                    <ActionButton className="primary">
                      {React.createElement(FaHeart as React.ComponentType<IconBaseProps>)}
                      관심
                    </ActionButton>
                    <ActionButton>
                      {React.createElement(FaShareAlt as React.ComponentType<IconBaseProps>)}
                      공유
                    </ActionButton>
                  </EventActions>
                </EventCard>
              );
            })}
          </EventsGrid>
        </EventsSection>
      </Container>
    </EventsContainer>
  );
};

export default CulturalEvents; 