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

// 페이지 스타일
const Page = styled.div`background:#fff; padding:20px;`;
const Card = styled.div`background:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08);padding:16px;`;
const Title = styled.h2`text-align:center;margin:0 0 16px;`;
const MapBox = styled.div`height:500px;border-radius:12px;overflow:hidden;`;

const SearchSection = styled.section`
  background:#fff;border:1px solid #eee;border-radius:16px;padding:20px;margin-bottom:40px;
`;
const SearchTitle = styled.h3`margin:0 0 12px;text-align:center; font-size: 24px`;
const SearchForm = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 720px;
  margin: 0 auto;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ResultCard = styled.div`
  margin-top:12px;border:1px solid #e9e9e9;border-radius:12px;padding:12px;background:#fafafa;max-width:720px;margin-left:auto;margin-right:auto;
`;
const Row = styled.div`color:#555; & + &{margin-top:6px;}`;

type LatLng = { lat:number; lng:number };
const defaultCenter: LatLng = { lat: 37.5665, lng: 126.9780 }; // 서울

export default function LocationMap() {
  const [map, setMap] = useState<any>(null);
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const [origin, setOrigin] = useState<LatLng | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<{ book: string; location?: string; event?: string } | null>(null);

  const bookMarkerRef = useRef<any>(null);
  const bookInfoRef = useRef<any>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(ll);
          setOrigin(ll);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadKakaoSdk();
      if (!bookInfoRef.current) {
        bookInfoRef.current = new window.kakao.maps.InfoWindow({ removable: true });
      }
    })();
  }, []);

  const getCacheKey = (loc: string) => `geo:${loc}`;
  const readCache = (loc: string): LatLng | null => {
    try {
      const raw = localStorage.getItem(getCacheKey(loc));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
    } catch {}
    return null;
  };

  const writeCache = (loc: string, ll: LatLng) => {
    try {
      localStorage.setItem(getCacheKey(loc), JSON.stringify(ll));
    } catch {}
  };

  const resolveCoords = useCallback(async (location: string): Promise<LatLng | null> => {
    if (!location?.trim()) return null;

    const cached = readCache(location);
    if (cached) return cached;

    const g = await geocodeAddress(location).catch(() => null);
    if (g) {
      writeCache(location, g);
      return g;
    }

    const found = await searchKeyword({ query: location }).catch(() => []);
    if (found && found[0]) {
      const ll = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
      writeCache(location, ll);
      return ll;
    }

    return null;
  }, []);

  const searchBook = useCallback(
    async (bookTitle: string) => {
      const bookData = (bookLocationData as any)[bookTitle];
      if (!bookData || bookData.length === 0) return null;

      const { location, event } = bookData[0] || {};
      if (!location) return { book: bookTitle };

      const coords = await resolveCoords(location);
      if (coords && map) {
        const kakao = window.kakao;
        const pos = new kakao.maps.LatLng(coords.lat, coords.lng);
        map.setCenter(pos);
        setCenter(coords);

        if (bookMarkerRef.current) bookMarkerRef.current.setMap(null);

        const marker = new kakao.maps.Marker({ map, position: pos, title: bookTitle });
        bookMarkerRef.current = marker;

        const html = `
          <div style="max-width:220px">
            <div style="font-weight:700;margin-bottom:4px">${bookTitle}</div>
            <div style="font-size:12px;color:#555">📍 ${location || ''}</div>
            ${event ? `<div style="font-size:12px;color:#666;margin-top:4px">${event}</div>` : ''}
          </div>`;
        kakao.maps.event.addListener(marker, 'click', () => {
          bookInfoRef.current.setContent(html);
          bookInfoRef.current.open(map, marker);
        });
      }

      return { book: bookTitle, location, event };
    },
    [map, resolveCoords]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const r = await searchBook(searchTerm.trim());
    setResult(r);
  };

  const bookTitles = useMemo(() => Object.keys(bookLocationData as any), []);
  const fetchBookSuggestions = async (q: string): Promise<Suggestion[]> => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return bookTitles
      .filter(t => t.toLowerCase().includes(s))
      .slice(0, 8)
      .map(t => ({ label: t }));
  };

  return (
    <Page>
      <Card>
        <SearchSection>
          <SearchTitle>책으로 찾는 문학 여행지</SearchTitle>
          <SearchForm onSubmit={onSubmit}>
            <InputGroup style={{ gap: '0' }}>
              <StyledAutoInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="도서 제목을 입력하세요 (예: 소년이 온다)"
                fetchSuggestions={fetchBookSuggestions}
                onSelect={async (s) => {
                  setSearchTerm(s.label);
                  const r = await searchBook(s.label);
                  setResult(r);
                }}
              />
              <StyledSubmitButton
                type="submit"
                size="lg"
                disabled={!searchTerm.trim()}
              >
                검색
              </StyledSubmitButton>
            </InputGroup>
          </SearchForm>

          {result && (
            <ResultCard>
              <Row><b>도서</b> : {result.book}</Row>
              {result.location
                ? <>
                    <Row><b>관련 장소</b> : {result.location}</Row>
                    {result.event && <Row>{result.event}</Row>}
                  </>
                : <Row>이 도서와 관련된 여행지 정보를 찾을 수 없습니다.</Row>}
            </ResultCard>
          )}
        </SearchSection>

        <Title>위치 기반 문학 체험</Title>
        <MapBox>
          <KakaoMap center={center} onReady={setMap} />
        </MapBox>

        <DiscoveryPanelKakao map={map} center={center} origin={origin} />
      </Card>
    </Page>
  );
}
