import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaMapMarkedAlt, FaBookOpen, FaImages, FaUsers, FaRoute } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

// 등록된 도서 수 = 로컬 JSON 개수
import bookLocationData from '../data/book_location_event.json';

// 통계 집계에 쓰는 API들
import { loadKakaoSdk, reverseSido, categorySearch } from '../api/kakao';
import { fetchUsersCount, fetchCultureNearbyCount, fetchKopisCount } from '../api/stats';



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
  text-decoration: none;  /* 링크 밑줄 제거 */
  color: inherit;         /* 기본 링크 색상 무시 */
  
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

// Kakao Places: 등록된 관광장소(카페 CE7 + 핫플 AT4 + 박물관 CT1)
// 최대 반경(20km) 한계를 보완하기 위해 중심 + 8방위(거리 20km) 타일 검색 후 ID로 dedupe
async function countNearbyAttractions(center: LatLng): Promise<number> {
  await loadKakaoSdk();
  const radius = 20000; // Kakao 카테고리 검색 최대 반경
  const codes = ['AT4', 'CE7', 'CT1']; // 핫플(관광명소), 카페, 박물관

  // 8방위 + 중심 좌표 생성 (거리 20km)
  const centers: LatLng[] = [center];
  const distKm = 20;
  const toDeg = Math.PI / 180;
  const dLat = (km: number) => km / 111.0;
  const dLng = (km: number, atLat: number) => km / (111.0 * Math.max(Math.cos(atLat * toDeg), 1e-6));
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const ang of dirs) {
    const rad = ang * toDeg;
    const north = Math.cos(rad) * distKm;
    const east = Math.sin(rad) * distKm;
    centers.push({
      lat: center.lat + dLat(north),
      lng: center.lng + dLng(east, center.lat),
    });
  }

  const seen = new Set<string>();
  let total = 0;

  for (const c of centers) {
    for (const code of codes) {
      for (let page = 1; page <= 2; page++) { // 과도한 호출 방지: 2페이지까지만 합산
        const list = await categorySearch({ code, x: c.lng, y: c.lat, radius, page });
        if (!list?.length) break;
        for (const p of list) {
          const id = String((p as any).id || '')
          if (id && !seen.has(id)) { seen.add(id); total++; }
        }
        if (list.length < 15) break; // 마지막 페이지
      }
    }
  }

  return total;
}

/* ===== component ===== */
const Home: React.FC = () => {
  const features = [
    {
      icon: FaSearch, // 책 검색 기반 가이드
      title: '도서 기반 문학 여행 가이드',
      description: '읽어본 책을 검색하여 그 책을 배경으로 한 지역으로 여행을 떠나보세요. 해당 지역의 여행지, 일정, 전시, 지역 콘텐츠를 추천해드립니다.',
      link: '/map',
    },
    {
      icon: FaMapMarkedAlt, // 지역(지도) 기반 가이드
      title: '지역 기반 문학 여행 가이드',
      description: '가고싶은 여행지를 검색하여 그 지역을 배경으로한 책을 검색하고 읽으며 여행을 떠나보세요. 해당 지역의 여행지, 일정, 전시, 지역 콘텐츠를 추천해드립니다.',
      link: '/place-to-book',
    },
    {
      icon: FaBookOpen, // 여행일기/퀘스트북
      title: '여행 퀘스트북',
      description: '책을 기반으로 한 여행계획을 추천받고 책 도장을 모아 할인된 가격으로 책을 구매해 보세요.',
      link: '/travel-diary',
    },
    {
      icon: FaUsers, // 커뮤니티/이웃
      title: '이웃의 여행스토리 살펴보기',
      description: '책 이웃들이 남긴 여행스토리를 살펴보고 책여행에 관해 소통해보세요.',
      link: '/neighbors',
    },
    {
      icon: FaImages, // 인생네컷(사진)
      title: '여행기록 인생네컷으로 기록하기',
      description: '책여행을 하며 찍은 사진들로 인생네컷을 만들어 저장하고 SNS에 공유해보세요.',
      link: '/four-cut',
    },
    {
      icon: FaRoute, // 관광사/여행사 가이드
      title: '관광사와 떠나는 문학여행',
      description: '책속 이야기를 따라 여행사가 안내하는 특별한 문학여행을 떠나보세요',
      link: '/agency-trips',
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
        const today = new Date();
        const yyyymmdd = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}${m}${day}`;
        };
        const from = yyyymmdd(today);
        const to = yyyymmdd(new Date(today.getTime() + 30 * 86400000));

        let total = 0;
        // 전시(문화포털)
        try {
          const exCount = await fetchCultureNearbyCount({ lat: center.lat, lng: center.lng, radiusKm: 5, from, to });
          total += exCount;
        } catch {}

        // 공연(KOPIS)
        try {
          const sido = await reverseSido(center).catch(() => '');
          if (sido) {
            const perfCount = await fetchKopisCount({ city: sido, from, to, rows: 50 });
            total += perfCount;
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
              <StatLabel>등록 도서</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{nearPlaces != null ? nearPlaces.toLocaleString() : '—'}</StatNumber>
              <StatLabel>등록 관광장소</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{nearEvents != null ? nearEvents.toLocaleString() : '—'}</StatNumber>
              <StatLabel>문화행사</StatLabel>
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
