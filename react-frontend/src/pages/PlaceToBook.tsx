import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import KakaoMap from '../components/map/KakaoMap';
import DiscoveryPanelKakao from '../components/discovery/DiscoveryPanelKakao';
import { geocodeAddress, loadKakaoSdk, searchKeyword } from '../api/kakao';
import bookLocationData from '../data/book_location_event.json';
import AutocompleteInput, { Suggestion } from '../components/common/AutocompleteInput';
import {
  InputGroup,
  StyledAutoInput,
  StyledSubmitButton,
  Button,
} from '../components/ui';
import TripPlanModal from '../components/routes/TripPlanModal';

const Page = styled.div`background:#fff; padding:20px;`;
const Card = styled.div`background:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08);padding:16px;`;
const Title = styled.h2`text-align:center;margin:0 0 16px;`;
const MapBox = styled.div`height:500px;border-radius:12px;overflow:hidden;`;

const SearchSection = styled.section`
  background:#fff;border:1px solid #eee;border-radius:16px;padding:20px;margin-bottom:40px;
`;
const SearchTitle = styled.h3`margin:0 0 12px;text-align:center; font-size: 24px`;
const SearchForm = styled.form`
  display:flex;align-items:center;gap:10px;max-width:720px;margin:0 auto;position:relative;
  @media (max-width:768px){flex-direction:column;}
`;
const Btn = styled.button`
  padding:12px 20px;border:none;border-radius:14px;background:#5b7cfa;color:#fff;font-weight:700;cursor:pointer;position:relative;z-index:1;
`;
const ResultList = styled.div`
  position: relative; /* 클릭 우선순위 확보 */
  z-index: 50;
  max-width:720px;margin:12px auto 0;border:1px solid #e9e9e9;border-radius:12px;background:#fafafa;overflow:hidden;
`;
const ResultItem = styled.button.attrs({ type: 'button' })`
  display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eee;background:#fff;padding:12px 14px;cursor:pointer;
  &:last-child{border-bottom:0;}
`;
const Row = styled.div`color:#555; & + &{margin-top:6px;}`;
const Name = styled.div`font-weight:800;`;
const Sub = styled.div`color:#666;font-size:.92rem;`;

type LatLng = { lat:number; lng:number };

const defaultCenter: LatLng = { lat: 37.5665, lng: 126.9780 }; // 서울

type BookHit = { title: string; location: string; event?: string };

export default function PlaceToBook(){
  const [map, setMap] = useState<any>(null);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [origin, setOrigin] = useState<LatLng | undefined>(undefined);

  const [placeTerm, setPlaceTerm] = useState('');
  const [hits, setHits] = useState<BookHit[]>([]);
  const [selected, setSelected] = useState<BookHit | null>(null);

  const bookMarkerRef = useRef<any>(null);
  const bookInfoRef = useRef<any>(null);
  const [planOpen, setPlanOpen] = useState(false);

  // 현재 위치 → 초기 중심
  useEffect(()=> {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(ll); setOrigin(ll);
        },
        () => {}
      );
    }
  }, []);

  // Kakao SDK 로드 + 책 인포윈도우 준비
  useEffect(() => {
    (async () => {
      await loadKakaoSdk();
      if (!bookInfoRef.current) {
        bookInfoRef.current = new window.kakao.maps.InfoWindow({ removable: true });
      }
    })();
  }, []);

  // 좌표 캐시
  function getCacheKey(loc:string){ return `geo:${loc}`; }
  function readCache(loc:string): LatLng | null {
    try {
      const raw = localStorage.getItem(getCacheKey(loc));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
    } catch {}
    return null;
  }
  function writeCache(loc:string, ll:LatLng){
    try { localStorage.setItem(getCacheKey(loc), JSON.stringify(ll)); } catch {}
  }

  // 장소명 → 좌표
  const resolveCoords = useCallback(async (location: string): Promise<LatLng | null> => {
    if (!location?.trim()) return null;
    const cached = readCache(location);
    if (cached) return cached;
    const g = await geocodeAddress(location).catch(()=>null);
    if (g) { writeCache(location, g); return g; }
    const found = await searchKeyword({ query: location }).catch(()=>[]);
    if (found && found[0]) {
      const ll = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
      writeCache(location, ll);
      return ll;
    }
    return null;
  }, []);

  // 장소 검색 → 책 리스트 생성
  const findBooksByPlace = useCallback((q: string): BookHit[] => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const res: BookHit[] = [];
    const db = bookLocationData as Record<string, Array<{ location: string; event?: string }>>;
    for (const [title, arr] of Object.entries(db)){
      for (const it of arr){
        const loc = (it.location || '').toLowerCase();
        if (loc.includes(s)){
          res.push({ title, location: it.location, event: it.event });
          break; // 한 권 당 첫 매칭만 추가
        }
      }
    }
    // 제목 가나다순
    res.sort((a,b)=>a.title.localeCompare(b.title));
    return res;
  }, []);

  // 제출
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelected(null);
    setHits(findBooksByPlace(placeTerm));
  };

  // 자동완성: 데이터 안의 location 필드 기반
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    const db = bookLocationData as Record<string, Array<{ location: string }>>;
    for (const arr of Object.values(db)){
      for (const it of arr){
        if (it.location) set.add(it.location);
      }
    }
    return Array.from(set);
  }, []);

  async function fetchPlaceSuggestions(q: string): Promise<Suggestion[]>{
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return uniqueLocations
      .filter(l => l.toLowerCase().includes(s))
      .slice(0, 8)
      .map(l => ({ label: l }));
  }

  // 책 선택 시 지도 이동 + 마커
  const selectBook = useCallback(async (hit: BookHit) => {
    setSelected(hit);
    const coords = await resolveCoords(hit.location);
    if (coords && map){
      const kakao = window.kakao;
      const pos = new kakao.maps.LatLng(coords.lat, coords.lng);
      map.setCenter(pos);
      setCenter(coords);

      if (bookMarkerRef.current) bookMarkerRef.current.setMap(null);
      const marker = new kakao.maps.Marker({ map, position: pos, title: hit.title });
      bookMarkerRef.current = marker;
      const html = `
        <div style="max-width:220px">
          <div style="font-weight:700;margin-bottom:4px">${hit.title}</div>
          <div style="font-size:12px;color:#555">📍 ${hit.location}</div>
          ${hit.event ? `<div style=\"font-size:12px;color:#666;margin-top:4px\">${hit.event}</div>` : ''}
        </div>`;
      kakao.maps.event.addListener(marker, 'click', () => {
        bookInfoRef.current.setContent(html);
        bookInfoRef.current.open(map, marker);
      });
    }
  }, [map, resolveCoords]);

  return (
    <Page>
      <Card>
        {/* 상단: 장소로 책 찾기 */}
        <SearchSection>
          <SearchTitle>장소로 책 찾기</SearchTitle>
          <SearchForm onSubmit={onSubmit}>
            <InputGroup style={{ width: '97%' }}>
              <StyledAutoInput
                value={placeTerm}
                onChange={setPlaceTerm}
                placeholder="장소를 입력하세요 (예: 대전, 제주도)"
                fetchSuggestions={fetchPlaceSuggestions}
                onSelect={(s) => {
                  setPlaceTerm(s.label);
                  setHits(findBooksByPlace(s.label));
                  setSelected(null);
                }}
              />
              <StyledSubmitButton
                type="submit"
                size="lg"
                disabled={!placeTerm.trim()}
              >
                검색
              </StyledSubmitButton>
            </InputGroup>
          </SearchForm>


          {hits.length > 0 && (
            <ResultList>
              {hits.map((h, idx) => (
                <ResultItem key={idx} onClick={() => selectBook(h)}>
                  <Name>{h.title}</Name>
                  <Sub>{h.location}</Sub>
                </ResultItem>
              ))}
            </ResultList>
          )}
          {hits.length === 0 && placeTerm.trim() && (
            <ResultList>
              <ResultItem disabled>
                <Row>검색한 장소와 연결된 도서를 찾지 못했습니다.</Row>
              </ResultItem>
            </ResultList>
          )}
        </SearchSection>

        {/* 지도 */}
        <Title>위치 기반 문학 체험</Title>
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
          <Button onClick={()=>setPlanOpen(true)}>여행계획 생성</Button>
        </div>
        <MapBox>
          <KakaoMap center={center} onReady={setMap} />
        </MapBox>

        {/* 하단: 주변 추천 패널 */}
        <DiscoveryPanelKakao map={map} center={center} origin={origin} />

        <TripPlanModal isOpen={planOpen} onClose={()=>setPlanOpen(false)} />
      </Card>
    </Page>
  );
}
