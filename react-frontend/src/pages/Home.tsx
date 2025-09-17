import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaMapMarkedAlt, FaBookOpen, FaImages, FaUsers } from 'react-icons/fa';
import { IconBaseProps } from 'react-icons';

import bookLocationData from '../data/book_location_event.json';
import { loadKakaoSdk, reverseSido, categorySearch } from '../api/kakao';
import { fetchUsersCount, fetchCultureNearbyCount, fetchKopisCount } from '../api/stats';

/* ===== styled-components ===== */
const HomeContainer = styled.div`
  min-height: 100vh;
`;

const HeroSection = styled.section`
  text-align: center;
  justify-content: flex-start;
  align-items: center;
  color: #764ba2;
  margin-bottom: 20px;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin: 16px auto 20px;
  opacity: 0.85;
  max-width: 600px;
`;

const QuoteBox = styled.div`
  max-width: 720px;
  margin: 0 auto 10px;
  padding: 10px 32px;
  background: white;
  border-radius: 28px;        // ⬅️ 엣지를 둥글게
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: #4c1d95;             // ⬅️ 진한 보라 (tailwind 기준 'purple-900')
`;

const FeaturesSection = styled.section`
  padding: 60px 0;
  background: #fff;
  border-radius: 30px 30px 0 0;
  margin-top: -20px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const SectionTitle = styled.h2`
  font-size: 2.25rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
`;

const FeatureCard = styled(Link)`
  background: #fff;
  padding: 32px 24px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  text-align: center;
  border: 1px solid #eee;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
`;

const FeatureIcon = styled.div`
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 1.8rem;
  color: #fff;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const FeatureDescription = styled.p`
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const StatsSection = styled.section`
  padding: 60px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const StatItem = styled.div``;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  opacity: 0.85;
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

export default function Home() {
  const features = [
    { icon: FaSearch, title: '도서 기반 문학 여행 가이드', description: '관심 도서를 검색하면 관련된 여행지, 일정, 전시, 지역 콘텐츠를 추천해드립니다.', link: '/map' },
    { icon: FaUsers, title: '관광사와 여행 떠나기', description: '관책 속 이야기를 따라 여행사가 안내하는 특별한 문학 여행으로 떠나보세요.', link: '/agency-trips' },
    { icon: FaMapMarkedAlt, title: '지역 기반 문학 여행 가이드', description: '관심 지역을 스토리로한 책을 기반으로 여행지, 일정, 전시, 콘텐츠를 추천해드립니다.', link: '/place-to-book' },
    { icon: FaBookOpen, title: '여행 퀘스트북', description: '책을 기반으로 한 여행계획을 추천받고 책 도장을 모아 할인된 가격으로 책을 구매해 보세요.', link: '/diary' },
    { icon: FaUsers, title: '이웃의 여행스토리 살펴보기', description: '책 이웃들이 남긴 여행스토리를 살펴보고 책여행에 관해 소통해보세요.', link: '/neighbors' },
    { icon: FaImages, title: '여행기록 인생네컷으로 기록하기', description: '책여행을 하며 찍은 사진들로 인생네컷을 만들어 저장하고 SNS에 공유해보세요.', link: '/four-cut' },
  ];

  const booksCount = useMemo(() => Object.keys(bookLocationData || {}).length, []);
  const [nearPlaces, setNearPlaces] = useState<number | null>(null);
  const [nearEvents, setNearEvents] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const center = await getCurrentPosition();

      try {
        const cnt = await countNearbyAttractions(center);
        if (!cancelled) setNearPlaces(cnt);
      } catch {}

      try {
        const today = new Date();
        const yyyymmdd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const from = yyyymmdd(today);
        const to = yyyymmdd(new Date(today.getTime() + 30 * 86400000));

        let total = 0;
        total += await fetchCultureNearbyCount({ lat: center.lat, lng: center.lng, radiusKm: 5, from, to });
        const sido = await reverseSido(center);
        if (sido) total += await fetchKopisCount({ city: sido, from, to, rows: 50 });

        if (!cancelled) setNearEvents(total);
      } catch {}

      try {
        const count = await fetchUsersCount();
        if (!cancelled) setUsers(count);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <HomeContainer>
      <HeroSection>
        <LavenderSection>
        <HeroTitle>Read & Lead</HeroTitle>
        <HeroSubtitle>책을 기반으로 한 테마 여행 & 문화 체험 플랫폼</HeroSubtitle>
        <QuoteBox>
          📚 당신만의 문학여행을 떠나보세요
        </QuoteBox>
        </LavenderSection>
      </HeroSection>

      <FeaturesSection>
        <Container>
          <SectionTitle>주요 기능</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, idx) => (
              <FeatureCard key={idx} to={feature.link}>
                <FeatureIcon>{React.createElement(feature.icon as React.ComponentType<IconBaseProps>)}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      <StatsSection>
        <Container>
          <SectionTitle style={{marginBottom: '40px', background: 'none', WebkitTextFillColor: '#f1f3f5' }}>서비스 현황</SectionTitle>
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
}

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

async function countNearbyAttractions(center: LatLng): Promise<number> {
  await loadKakaoSdk();
  const radius = 20000;
  const codes = ['AT4', 'CE7', 'CT1'];

  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  const distKm = 20;
  const toDeg = Math.PI / 180;
  const dLat = (km: number) => km / 111.0;
  const dLng = (km: number, lat: number) => km / (111.0 * Math.max(Math.cos(lat * toDeg), 1e-6));

  const centers = [center, ...dirs.map((ang) => ({
    lat: center.lat + dLat(Math.cos(ang * toDeg) * distKm),
    lng: center.lng + dLng(Math.sin(ang * toDeg) * distKm, center.lat)
  }))];

  const seen = new Set<string>();
  let total = 0;

  for (const c of centers) {
    for (const code of codes) {
      for (let page = 1; page <= 2; page++) {
        const list = await categorySearch({ code, x: c.lng, y: c.lat, radius, page });
        if (!list?.length) break;
        for (const p of list) {
          const id = String((p as any).id || '');
          if (id && !seen.has(id)) {
            seen.add(id);
            total++;
          }
        }
        if (list.length < 15) break;
      }
    }
  }

  return total;
}
