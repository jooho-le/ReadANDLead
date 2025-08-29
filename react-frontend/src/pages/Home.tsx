import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaMapMarkedAlt, FaBookOpen, FaCalendarAlt } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

// 등록된 도서 수 = 로컬 JSON 개수
import bookLocationData from '../data/book_location_event.json';

// 통계 집계에 쓰는 API들
import { loadKakaoSdk, reverseSido } from '../api/kakao';
import { fetchCultureNearby } from '../api/culture';
import { fetchKopisPerformances } from '../api/kopis';
import { fetchUsersCount } from '../api/stats';

/* ===== styled ===== */
const HomeContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
`;

const HeroSection = styled.section`
  text-align: center;
  padding: 80px 0;
  color: #764ba2;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  margin-bottom: 40px;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 16px 32px;
  background: white;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 0;
  background: white;
  border-radius: 30px 30px 0 0;
  margin-top: -30px;
  position: relative;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
  margin-bottom: 80px;
`;

const FeatureCard = styled(Link)`
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 2rem;
  color: white;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const StatsSection = styled.section`
  padding: 60px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
`;

/* ===== helpers ===== */
type LatLng = { lat: number; lng: number };
const SEOUL: LatLng = { lat: 37.5665, lng: 126.9780 };

function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(SEOUL);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(SEOUL),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  });
}

// Kakao Places: 박물관/미술관/명소 5km 반경(1페이지) 합
async function countNearbyAttractions(center: LatLng): Promise<number> {
  await loadKakaoSdk();
  const kakaoAny = (window as any).kakao;
  const ps = new kakaoAny.maps.services.Places();
  const loc = new kakaoAny.maps.LatLng(center.lat, center.lng);

  const keywords = ['박물관', '미술관', '명소'];
  let total = 0;

  await Promise.all(
    keywords.map(
      (kw) =>
        new Promise<void>((res) => {
          ps.keywordSearch(
            kw,
            (data: any[], status: string) => {
              if (status === kakaoAny.maps.services.Status.OK) {
                total += Array.isArray(data) ? data.length : 0;
              }
              res();
            },
            { location: loc, radius: 5000, size: 15, page: 1 }
          );
        })
    )
  );

  return total;
}

/* ===== component ===== */
const Home: React.FC = () => {
  const features = [
    {
      icon: FaSearch,
      title: '도서 기반 AI 여행 큐레이션',
      description: '관심 도서를 입력하면 관련된 여행지, 일정, 전시, 지역 콘텐츠를 추천해드립니다.',
      link: '/search',
    },
    {
      icon: FaMapMarkedAlt,
      title: '위치 기반 문학 체험',
      description: '여행 중 해당 장소에 도달하면 책 속 문장과 작가 설명이 자동으로 제공됩니다.',
      link: '/map',
    },
    {
      icon: FaBookOpen,
      title: '책-도시 수집형 지도',
      description: '방문 장소마다 책 표지나 문학 배지를 수집하여 나만의 문학 지도를 만들어보세요.',
      link: '/diary',
    },
    {
      icon: FaCalendarAlt,
      title: '문화행사 연계',
      description: '문학 작품의 배경 지역에서 열리는 공연, 전시, 북토크 등의 행사를 추천합니다.',
      link: '/events',
    },
  ];

  // 등록된 도서 수 (JSON 최상위 key 개수)
  const booksCount = useMemo(() => {
    try {
      return Object.keys(bookLocationData as Record<string, unknown>).length;
    } catch {
      return 0;
    }
  }, []);

  // 근처 관광지 / 문화행사(공연+전시) / 사용자
  const [nearPlaces, setNearPlaces] = useState<number | null>(null);
  const [nearEvents, setNearEvents] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const center = await getCurrentPosition();

      // 관광지 카운트
      try {
        const cnt = await countNearbyAttractions(center);
        if (!cancelled) setNearPlaces(cnt);
      } catch {
        if (!cancelled) setNearPlaces(null);
      }

      // 문화행사(전시 + 공연) 카운트
      try {
          await loadKakaoSdk();
  const kakaoAny = (window as any).kakao;
  const ll = new kakaoAny.maps.LatLng(center.lat, center.lng);
        const sido = await reverseSido(ll).catch(() => null);
        let total = 0;

        try {
          const ex = await fetchCultureNearby({ lat: center.lat, lng: center.lng, radiusKm: 5 });
          if (Array.isArray(ex)) total += ex.length;
        } catch {}

        try {
          if (sido) {
            const perf = await fetchKopisPerformances({
              city: sido,
              lat: center.lat, lng: center.lng,
              radiusKm: 10, daysFromNow: 30,
            } as any);
            if (Array.isArray(perf)) total += perf.length;
          }
        } catch {}

        if (!cancelled) setNearEvents(total);
      } catch {
        if (!cancelled) setNearEvents(null);
      }

      // 사용자 수
      try {
        const n = await fetchUsersCount();
        if (!cancelled) setUsers(n);
      } catch {
        if (!cancelled) setUsers(null);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <HomeContainer>
      <HeroSection>
        <HeroTitle>Read & Lead</HeroTitle>
        <HeroSubtitle>책을 기반으로 한 테마 여행 & 문화 체험 플랫폼</HeroSubtitle>
        {/* 필요시 /map 으로 바꿔도 OK */}
        <CTAButton to="/search">지금 시작하기</CTAButton>
      </HeroSection>

      <FeaturesSection>
        <Container>
          <SectionTitle>주요 기능</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index} to={feature.link}>
                <FeatureIcon>
                  {React.createElement(feature.icon as React.ComponentType<IconBaseProps>)}
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      <StatsSection>
        <Container>
          <SectionTitle style={{ color: 'white', marginBottom: '40px' }}>
            서비스 현황
          </SectionTitle>
          <StatsGrid>
            <StatItem>
              <StatNumber>{booksCount.toLocaleString()}</StatNumber>
              <StatLabel>등록된 도서</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{nearPlaces != null ? nearPlaces.toLocaleString() : '—'}</StatNumber>
              <StatLabel>근처 관광지</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{nearEvents != null ? nearEvents.toLocaleString() : '—'}</StatNumber>
              <StatLabel>문화행사(공연/전시)</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{users != null ? users.toLocaleString() : '—'}</StatNumber>
              <StatLabel>사용자</StatLabel>
            </StatItem>
          </StatsGrid>
        </Container>
      </StatsSection>
    </HomeContainer>
  );
};

export default Home;
