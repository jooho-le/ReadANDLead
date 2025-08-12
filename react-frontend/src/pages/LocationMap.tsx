import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { FaMapMarkedAlt, FaBook, FaLocationArrow, FaSearch } from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import bookLocationData from '../data/book_location_event.json';
import DiscoveryPanel from '../components/discovery/DiscoveryPanel';

const MapContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;
const Container = styled.div`max-width: 1200px; margin: 0 auto;`;
const SearchSection = styled.section`
  background: white; border-radius: 20px; padding: 40px; margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;
const SearchTitle = styled.h2`font-size:1.8rem;font-weight:600;text-align:center;margin-bottom:30px;color:#333;`;
const SearchForm = styled.form`
  display:flex;gap:16px;max-width:600px;margin:0 auto 30px;
  @media (max-width:768px){flex-direction:column;}
`;
const SearchInput = styled.input`
  flex:1;padding:16px 20px;border:2px solid #e1e5e9;border-radius:50px;font-size:16px;
  transition:all .3s ease;
  &:focus{outline:none;border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,.1);}
`;
const SearchButton = styled.button`
  padding:16px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  color:white;border:none;border-radius:50px;font-size:16px;font-weight:600;cursor:pointer;
  transition:all .3s ease;display:flex;align-items:center;gap:8px;
  &:hover{transform:translateY(-2px);box-shadow:0 6px 15px rgba(102,126,234,.4);}
  &:disabled{opacity:.6;cursor:not-allowed;transform:none;}
`;

const SearchResultCard = styled.div`background:#f8f9fa;border-radius:16px;padding:24px;margin:20px 0;border:2px solid #667eea;`;
const SearchBookTitle = styled.h3`font-size:1.3rem;font-weight:600;margin-bottom:12px;color:#667eea;display:flex;align-items:center;gap:8px;`;
const LocationInfo = styled.div`margin-top:16px;`;
const SearchLocationTitle = styled.h4`font-size:1.1rem;font-weight:600;margin-bottom:8px;color:#333;display:flex;align-items:center;gap:8px;`;
const EventDescription = styled.p`color:#666;line-height:1.6;margin-top:8px;`;
const NoResults = styled.div`text-align:center;padding:20px;color:#666; p{margin:8px 0;}`;

const MapSection = styled.section`background:white;border-radius:20px;padding:40px;box-shadow:0 10px 30px rgba(0,0,0,.1);`;
const MapTitle = styled.h2`font-size:1.8rem;font-weight:600;text-align:center;margin-bottom:30px;color:#333;`;
const MapWrapper = styled.div`height:500px;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);`;

const LocationCard = styled.div`background:#f8f9fa;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #667eea;`;
const MapLocationTitle = styled.h3`font-size:1.1rem;font-weight:600;margin-bottom:12px;color:#333;display:flex;align-items:center;gap:8px;`;
const BookInfo = styled.div`margin:12px 0;`;
const MapBookTitle = styled.h4`font-size:1rem;font-weight:600;color:#667eea;display:flex;align-items:center;gap:8px;margin-bottom:8px;`;
const LocationDescription = styled.p`color:#666;line-height:1.6;`;

const InfoWindowContent = styled.div`padding:8px;max-width:200px;`;
const InfoWindowTitle = styled.h4`font-size:14px;font-weight:600;margin-bottom:4px;color:#333;`;
const InfoWindowText = styled.p`font-size:12px;color:#666;margin:4px 0;`;

type LatLng = { lat: number; lng: number };
type MarkerItem = { id:number; position:LatLng; title:string; location:string; event?:string; };

const locationCoordinates: Record<string, LatLng> = {
  '서울': { lat: 37.5665, lng: 126.9780 },
  '제주도': { lat: 33.4996, lng: 126.5312 },
  '포항 구룡포': { lat: 36.1194, lng: 129.5519 },
  '대한민국 광주광역시': { lat: 35.1595, lng: 126.8526 },
  '전라남도 여수, 순천, 벌교': { lat: 34.7604, lng: 127.6622 },
  '경상남도 하동 평사리': { lat: 35.0671, lng: 127.7507 },
  '하얼빈': { lat: 45.8038, lng: 126.5350 },
  '남한산성': { lat: 37.4794, lng: 127.1836 },
  '멕시코 유카탄 반도': { lat: 20.6843, lng: -88.5678 },
};
const defaultCenter: LatLng = { lat: 37.5665, lng: 126.9780 };

// ✅ CRA에서는 process.env만 사용
const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

// Places 라이브러리
const libraries = ['places'] as ('places')[];

const LocationMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerItem | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [markers, setMarkers] = useState<MarkerItem[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapObj, setMapObj] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_KEY,
    libraries,
    language: 'ko',
    region: 'KR',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (err) => console.log('위치 정보를 가져올 수 없습니다:', err)
      );
    }
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapObj(map);
  }, []);

  const searchBook = useCallback((bookTitle: string) => {
    const bookData = (bookLocationData as any)[bookTitle];
    if (bookData?.length > 0) {
      const locationData = bookData[0];
      const coord = locationCoordinates[locationData.location as keyof typeof locationCoordinates];
      if (coord) {
        setMapCenter(coord);
        mapRef.current?.setCenter(coord as any);
        setMarkers([{
          id: 1, position: coord, title: bookTitle, location: locationData.location, event: locationData.event
        }]);
      }
      return { book: bookTitle, location: locationData.location, event: locationData.event };
    }
    return null;
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const result = searchBook(searchTerm);
    setSearchResult(result);
  };

  const onMarkerClick = (m: MarkerItem) => setSelectedMarker(m);
  const onMapClick = () => setSelectedMarker(null);

  return (
    <MapContainer>
      <Container>
        <SearchSection>
          <SearchTitle>책으로 찾는 문학 여행지</SearchTitle>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              placeholder="도서 제목을 입력하세요 (예: 동백꽃 필 무렵)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchButton type="submit" disabled={!searchTerm.trim()}>
              {React.createElement(FaSearch as React.ComponentType<IconBaseProps>)}
              검색
            </SearchButton>
          </SearchForm>

          {searchResult && (
            <SearchResultCard>
              <SearchBookTitle>
                {React.createElement(FaBook as React.ComponentType<IconBaseProps>)}
                {searchResult.book}
              </SearchBookTitle>
              {searchResult.location ? (
                <LocationInfo>
                  <SearchLocationTitle>
                    {React.createElement(FaMapMarkedAlt as React.ComponentType<IconBaseProps>)}
                    관련 장소: {searchResult.location}
                  </SearchLocationTitle>
                  {searchResult.event && <EventDescription>{searchResult.event}</EventDescription>}
                </LocationInfo>
              ) : (
                <NoResults>
                  <p>이 도서와 관련된 여행지 정보를 찾을 수 없습니다.</p>
                  <p>다른 도서를 검색해보세요!</p>
                </NoResults>
              )}
            </SearchResultCard>
          )}
        </SearchSection>

        <MapSection>
          <MapTitle>위치 기반 문학 체험</MapTitle>
          <MapWrapper>
            {loadError && <div style={{ padding: 16 }}>Maps 로드 실패: {String(loadError)}</div>}
            {!isLoaded && !loadError && <div style={{ padding: 16 }}>Loading...</div>}
            {isLoaded && !loadError && (
              <GoogleMap
                onLoad={onMapLoad}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={10}
                onClick={onMapClick}
              >
                {userLocation && <Marker position={userLocation} title="현재 위치" />}
                {markers.map(m => (
                  <Marker key={m.id} position={m.position} onClick={() => setSelectedMarker(m)} />
                ))}
                {selectedMarker && (
                  <InfoWindow position={selectedMarker.position} onCloseClick={() => setSelectedMarker(null)}>
                    <InfoWindowContent>
                      <InfoWindowTitle>{selectedMarker.title}</InfoWindowTitle>
                      <InfoWindowText>📍 {selectedMarker.location}</InfoWindowText>
                      {selectedMarker.event && <InfoWindowText>{selectedMarker.event}</InfoWindowText>}
                    </InfoWindowContent>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </MapWrapper>

          {/* 지도 하단 디스커버리 패널 */}
          <DiscoveryPanel map={mapObj} center={mapCenter} />

          {userLocation && (
            <LocationCard>
              <MapLocationTitle>
                {React.createElement(FaLocationArrow as React.ComponentType<IconBaseProps>)}
                현재 위치
              </MapLocationTitle>
              <p>위도: {userLocation.lat.toFixed(6)}</p>
              <p>경도: {userLocation.lng.toFixed(6)}</p>
            </LocationCard>
          )}

          {searchResult?.location && (
            <LocationCard>
              <MapLocationTitle>
                {React.createElement(FaMapMarkedAlt as React.ComponentType<IconBaseProps>)}
                검색된 장소: {searchResult.location}
              </MapLocationTitle>
              <BookInfo>
                <MapBookTitle>
                  {React.createElement(FaBook as React.ComponentType<IconBaseProps>)}
                  {searchResult.book}
                </MapBookTitle>
              </BookInfo>
              <LocationDescription>{searchResult.event}</LocationDescription>
            </LocationCard>
          )}
        </MapSection>
      </Container>
    </MapContainer>
  );
};

export default LocationMap;
