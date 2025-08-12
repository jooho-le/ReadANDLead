import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { fetchCultureNearby } from '../../api/culture';
import { fetchKopisPerformances } from '../../api/kopis';
import { useMarkers } from './useMarkers';

type LatLng = { lat: number; lng: number };

const Panel = styled.div`
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 10px;
`;
const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
`;
const Chip = styled.button<{ active?: boolean }>`
  border: 1px solid ${p => (p.active ? '#000' : '#ddd')};
  background: #fff;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: ${p => (p.active ? 700 : 500)};
`;
const ResultList = styled.div`
  max-height: 280px;
  overflow: auto;
  border: 1px solid #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
`;
const Row = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #f3f3f3;
  &:last-child { border-bottom: none; }
`;
const Name = styled.div` font-weight: 700; `;
const Sub = styled.div` color: #555; font-size: 0.9rem; `;
const Loading = styled.div` color: #777; padding: 12px 0; `;

function yyyymmdd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 시/도명 정규화: 영어/축약/다양한 형태 → KOPIS 시도명으로 통일 */
function normalizeSido(input: string): string {
  if (!input) return '';
  const t = input.toLowerCase().replace(/\s+/g, '');
  const map: Record<string, string> = {
    // 광역시
    seoul: '서울특별시', seoulsi: '서울특별시', '서울': '서울특별시', '서울특별시': '서울특별시',
    busan: '부산광역시', busansi: '부산광역시', '부산': '부산광역시', '부산광역시': '부산광역시',
    daegu: '대구광역시', daegusi: '대구광역시', '대구': '대구광역시', '대구광역시': '대구광역시',
    incheon: '인천광역시', incheonsi: '인천광역시', '인천': '인천광역시', '인천광역시': '인천광역시',
    gwangju: '광주광역시', gwangjusi: '광주광역시', '광주': '광주광역시', '광주광역시': '광주광역시',
    daejeon: '대전광역시', daejeonsi: '대전광역시', '대전': '대전광역시', '대전광역시': '대전광역시',
    ulsan: '울산광역시', ulsansi: '울산광역시', '울산': '울산광역시', '울산광역시': '울산광역시',
    sejong: '세종특별자치시', sejongsi: '세종특별자치시', '세종': '세종특별자치시', '세종특별자치시': '세종특별자치시',
    // 도
    gyeonggi: '경기도', gyeonggido: '경기도', '경기': '경기도', '경기도': '경기도',
    gangwon: '강원도', gangwondo: '강원도', '강원': '강원도', '강원도': '강원도',
    chungcheongbukdo: '충청북도', chungbuk: '충청북도', '충북': '충청북도', '충청북도': '충청북도',
    chungcheongnamdo: '충청남도', chungnam: '충청남도', '충남': '충청남도', '충청남도': '충청남도',
    jeollabukdo: '전라북도', jeonbuk: '전라북도', '전북': '전라북도', '전라북도': '전라북도',
    jeollanamdo: '전라남도', jeonnam: '전라남도', '전남': '전라남도', '전라남도': '전라남도',
    gyeongsangbukdo: '경상북도', gyeongbuk: '경상북도', '경북': '경상북도', '경상북도': '경상북도',
    gyeongsangnamdo: '경상남도', gyeongnam: '경상남도', '경남': '경상남도', '경상남도': '경상남도',
    jeju: '제주특별자치도', jejudo: '제주특별자치도', '제주': '제주특별자치도', '제주특별자치도': '제주특별자치도',
  };
  if (t.endsWith('시') && map[t.slice(0, -1)]) return map[t.slice(0, -1)];
  return map[t] || input;
}

type Props = { map: google.maps.Map | null; center: LatLng };

export default function DiscoveryPanel({ map, center }: Props) {
  const [active, setActive] = useState<'performance'|'exhibition'|'museum'|'cafe'|'hot'|null>(null);
  const [list, setList] = useState<{name:string; addr?:string; detail?:string}[]>([]);
  const [loading, setLoading] = useState(false);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const { clearMarkers, pushMarker } = useMarkers();

  const safeCenter = useMemo(() => center || { lat: 36.5, lng: 127.5 }, [center]);

  useEffect(() => {
    if (map && (window as any).google) {
      geocoderRef.current = new window.google.maps.Geocoder();
      placesRef.current = new window.google.maps.places.PlacesService(map);
    }
  }, [map]);

  async function onClick(type: typeof active) {
    if (!map) return;
    setActive(type);
    setList([]);
    setLoading(true);
    try {
      if (type === 'exhibition') await loadCulture();
      else if (type === 'performance') await loadKopis();
      else if (type === 'museum' || type === 'cafe' || type === 'hot') await loadPlaces(type);
    } catch (e) {
      console.error('[DiscoveryPanel] fetch error:', e);
      alert('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function addMarker(
    kind: 'performance'|'exhibition'|'museum'|'cafe'|'hot',
    pos: google.maps.LatLng | google.maps.LatLngLiteral,
    title: string
  ) {
    const marker = new window.google.maps.Marker({ map: map!, position: pos as any, title });
    pushMarker(kind, marker);
  }

  /** 전시/공연(문화포털): 0건이면 반경/기간을 늘려 재조회 */
  async function loadCulture() {
    const { lat, lng } = safeCenter;
    clearMarkers('exhibition');

    const tries = [
      { radiusKm: 5, days: 14, label: '기본' },
      { radiusKm: 15, days: 30, label: '확장1' },
      { radiusKm: 30, days: 90, label: '확장2' },
    ];

    let results: any[] = [];
    for (const t of tries) {
      const from = yyyymmdd(new Date());
      const to = yyyymmdd(addDays(new Date(), t.days));
      const res = await fetchCultureNearby({ lat, lng, radiusKm: t.radiusKm, from, to });

      const items = (((res || {}).response || {}).body || {}).items || {};
      const arr = Array.isArray(items.item) ? items.item : (items.item ? [items.item] : []);
      if (arr.length > 0) {
        results = arr;
        break;
      }
    }

    const out: {name:string; addr?:string; detail?:string}[] = [];
    for (const it of results) {
      const name = it.title || it.prfnm || '전시/공연';
      const place = it.place || it.place_nm || '';
      const addr = it.place_addr || it.placeaddr || '';
      const period = `${(it.startDate || it.prfpdfrom || '')} ~ ${(it.endDate || it.prfpdto || '')}`;
      out.push({ name, addr: place || addr, detail: period });

      const la = parseFloat(it.gpslatitude || it.latitude || '');
      const ln = parseFloat(it.gpslongitude || it.longitude || '');
      if (!Number.isNaN(la) && !Number.isNaN(ln)) {
        addMarker('exhibition', { lat: la, lng: ln }, name);
      } else if (place && geocoderRef.current) {
        try {
          const r = await geocodeAsync(place);
          addMarker('exhibition', r.geometry.location, name);
        } catch {}
      }
    }

    if (out.length === 0) {
      setList([{ name: '표시할 전시/공연이 없습니다', addr: '반경/기간을 늘렸지만 결과가 없어요.', detail: '다른 지역으로 이동해보세요.' }]);
    } else {
      setList(out);
    }
  }

  /** 공연(KOPIS): 0건이면 기간을 넓혀 재조회 + 시/도 정규화 */
  async function loadKopis() {
    const cityRaw = await reverseGeocodeCity(safeCenter);
    const city = normalizeSido(cityRaw);
    if (!city) {
      alert('시/도 정보를 찾지 못했습니다. (reverse geocoding 실패)');
      return;
    }

    clearMarkers('performance');

    const spans = [14, 60, 90]; // 2주 → 2달 → 3달
    let list: any[] = [];
    for (const days of spans) {
      const from = yyyymmdd(new Date());
      const to = yyyymmdd(addDays(new Date(), days));
      const data = await fetchKopisPerformances({ city, from, to, rows: 50 });
      const arr = (((data || {}).dbs || {}).db) || [];
      const asArray = Array.isArray(arr) ? arr : (arr ? [arr] : []);
      if (asArray.length > 0) {
        list = asArray;
        break;
      }
    }

    if (list.length === 0) {
      setList([{ name: '표시할 공연이 없습니다', addr: `${city} 기준으로 기간을 넓혀도 결과가 없어요.`, detail: '다른 지역으로 이동해보세요.' }]);
      return;
    }

    const out: {name:string; addr?:string; detail?:string}[] = [];
    for (const it of list) {
      if (!it) continue;
      const name = it.prfnm || '공연';
      const venue = it.fcltynm || '';
      const gugun = it.gugunnm || '';
      const period = `${it.prfpdfrom || ''} ~ ${it.prfpdto || ''}`;
      out.push({ name, addr: `${venue} ${gugun}`.trim(), detail: period });

      const q = venue || `${gugun} 공연장`;
      if (q) {
        try {
          const r = await geocodeAsync(q);
          addMarker('performance', r.geometry.location, name);
        } catch {}
      }
    }
    setList(out);
  }

  /** Google Places (박물관/카페/핫플) */
  async function loadPlaces(kind: 'museum'|'cafe'|'hot') {
    if (!placesRef.current) return;
    const gKind = kind === 'hot' ? 'tourist_attraction' : kind;
    clearMarkers(kind);

    const request: google.maps.places.PlaceSearchRequest = {
      location: new window.google.maps.LatLng(safeCenter.lat, safeCenter.lng),
      radius: 3000,
      type: gKind as any,
    };

    const results = await nearbySearchAsync(request);
    const out: {name:string; addr?:string; detail?:string}[] = [];

    results.forEach(p => {
      out.push({ name: p.name || '', addr: p.vicinity || '' });
      if (p.geometry?.location) addMarker(kind, p.geometry.location, p.name || '');
    });
    setList(out);
  }

  function geocodeAsync(query: string): Promise<google.maps.GeocoderResult> {
    return new Promise((resolve, reject) => {
      geocoderRef.current!.geocode({ address: query }, (res, status) => {
        // 디버그용 로그
        console.log('[geocode] status=', status, 'query=', query, 'res=', res);
        if (status === 'OK' && res && res[0]) resolve(res[0]);
        else reject(new Error('geocode failed'));
      });
    });
  }

  /** 행정구역 추출: admin_level_1 → locality → admin_level_2 → formatted_address */
  function reverseGeocodeCity({ lat, lng }: LatLng): Promise<string> {
    return new Promise((resolve) => {
      geocoderRef.current!.geocode({ location: { lat, lng } as any }, (results, status) => {
        console.log('[reverseGeocode] status=', status, 'results=', results);
        if (status !== 'OK' || !results?.[0]) return resolve('');
        const comps = results[0].address_components || [];
        const get = (typ: string) => comps.find(c => c.types.includes(typ))?.long_name || '';
        const a1 = get('administrative_area_level_1');
        const loc = get('locality');
        const a2 = get('administrative_area_level_2');
        resolve(a1 || loc || a2 || results[0].formatted_address || '');
      });
    });
  }

  function nearbySearchAsync(req: google.maps.places.PlaceSearchRequest): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      placesRef.current!.nearbySearch(req, (results, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results)
          return reject(new Error('nearbySearch failed'));
        resolve(results);
      });
    });
  }

  return (
    <Panel>
      <ChipRow>
        <Chip active={active==='performance'} onClick={() => onClick('performance')}>공연(KOPIS)</Chip>
        <Chip active={active==='exhibition'} onClick={() => onClick('exhibition')}>전시(문화포털)</Chip>
        <Chip active={active==='museum'} onClick={() => onClick('museum')}>박물관</Chip>
        <Chip active={active==='cafe'} onClick={() => onClick('cafe')}>카페</Chip>
        <Chip active={active==='hot'} onClick={() => onClick('hot')}>핫플</Chip>
      </ChipRow>

      <ResultList>
        {loading ? (
          <Loading>불러오는 중…</Loading>
        ) : (
          (list.length === 0 ? <Loading>항목을 선택해 주변 정보를 조회하세요</Loading> :
            list.map((it, i) => (
              <Row key={i}>
                <Name>{it.name}</Name>
                {it.addr && <Sub>{it.addr}</Sub>}
                {it.detail && <Sub>{it.detail}</Sub>}
              </Row>
            ))
          )
        )}
      </ResultList>
    </Panel>
  );
}
