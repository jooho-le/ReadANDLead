import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { loadKakaoSdk, categorySearch, searchKeyword, reverseSido } from '../../api/kakao';
import { fetchCultureNearby } from '../../api/culture';
import { fetchKopisPerformances } from '../../api/kopis';
import { useKakaoMarkers } from './useKakaoMarkers';
import RouteSidebar from '../routes/RouteSidebar';

/* ======================== 스타일 ======================== */
const Panel = styled.div`
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 10px;
  position: relative; /* 사이드바 고정용 기준 */
`;

const ChipRow = styled.div`display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;`;
const Chip = styled.button<{ $active?: boolean }>`
  border:1px solid ${p=>p.$active ? '#000' : '#ddd'};
  background:#fff;padding:8px 12px;border-radius:999px;cursor:pointer;
  font-weight:${p=>p.$active?700:500};
`;

const TopBar = styled.div`display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:8px 0 12px;`;
const Select = styled.select`border:1px solid #ddd;border-radius:8px;padding:6px 10px;background:#fff;`;
const Checkbox = styled.label`display:flex;gap:6px;align-items:center;font-size:.95rem;`;

const ResultList = styled.div`
  max-height: 360px;
  overflow: auto;
  border: 1px solid #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fff;
`;
const Row = styled.div<{ $clickable?: boolean }>`
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
  ${p => p.$clickable ? 'cursor:pointer;' : ''}
`;
const Name = styled.div`font-weight:700;`;
const Sub = styled.div`color:#555;font-size:.9rem;`;
const Actions = styled.div`display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;`;
const A = styled.a`border:1px solid #ddd;padding:6px 10px;border-radius:8px;text-decoration:none;color:#111;background:#fff;`;
const SmallBtn = styled.button`border:1px solid #ddd;padding:6px 10px;border-radius:8px;background:#fff;cursor:pointer;font-size:.9rem;`;
const Loading = styled.div`color:#777;padding:12px 0;`;

/* 중앙 팝업 (데이터 없음/오류 알림) */
const Backdrop = styled.div`
  position:fixed; inset:0; background:rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center; z-index:60;
`;
const Dialog = styled.div`
  background:#fff; border-radius:12px; padding:18px 16px;
  width:min(90vw, 360px); text-align:center; box-shadow:0 12px 32px rgba(0,0,0,.2);
`;
const DialogTitle = styled.div`font-weight:800; font-size:1.05rem; margin-bottom:8px;`;
const DialogMsg = styled.div`color:#555; margin-bottom:12px;`;
const DialogBtn = styled.button`border:1px solid #ddd; padding:8px 12px; border-radius:8px; background:#fff; cursor:pointer;`;

/* 상세 모달 (간단 버전) */
const DetailBackdrop = styled(Backdrop)``;
const DetailSheet = styled.div`
  background:#fff;border-radius:16px; padding:16px;
  width:min(92vw, 720px); max-height:86vh; overflow:auto;
  box-shadow:0 16px 40px rgba(0,0,0,.25);
`;
const DetailH = styled.h3`margin:0 0 8px;`;
const Line = styled.div`font-size:.95rem;color:#333; margin:6px 0; word-break:break-all;`;
const DetailActions = styled.div`display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;`;

/* ======================== 타입 ======================== */
type LatLng = { lat: number; lng: number };

type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  phone?: string;
  place_url?: string;
};

type EventItem = {
  kind: 'exhibition' | 'performance';
  title: string;
  venue?: string;
  addr?: string;
  period?: string;
  loc?: LatLng;
};

type PlaceItem = {
  kind: 'place';
  id: string;
  name: string;
  addr?: string;
  phone?: string;
  url?: string;
  loc?: LatLng;
  type: 'museum' | 'cafe' | 'hot';
};

type RowItem = EventItem | PlaceItem;

type Props = { map: any; center: LatLng; origin?: LatLng };

/* ======================== 유틸 ======================== */
function distanceKm(a?: LatLng | null, b?: LatLng | null) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function googleLink(n: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(n)}`;
}
function naverLink(n: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(n)}`;
}
function kakaoLink(n: string) {
  return `https://map.kakao.com/?q=${encodeURIComponent(n)}`;
}

/* ======================== 메인 컴포넌트 ======================== */
export default function DiscoveryPanelKakao({ map, center, origin }: Props) {
  const [active, setActive] = useState<
    'performance' | 'exhibition' | 'museum' | 'cafe' | 'hot' | null
  >(null);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 정렬/필터 (간단)
  const [sortKey, setSortKey] = useState<'distance' | 'name'>('distance');
  const [todayOnly, setTodayOnly] = useState(false); // 공연/전시에만 의미

  // 상세/팝업
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<{
    name: string;
    address?: string;
    phone?: string;
    kakaoUrl?: string;
    loc?: LatLng;
    extra?: string;
  } | null>(null);

  const [dialog, setDialog] = useState<{ open: boolean; title?: string; msg?: string }>({ open: false });

  // 길찾기 사이드바
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerDest, setPlannerDest] = useState<{ lat: number; lng: number; name?: string } | null>(null);

  const safeCenter = origin || center;
  const infoRef = useRef<any>(null);
  const { pushMarker, clearMarkers } = useKakaoMarkers();

  useEffect(() => {
    (async () => {
      await loadKakaoSdk();
      infoRef.current = new (window as any).kakao.maps.InfoWindow({ removable: true });
    })();
  }, []);

  /* ---------- 공통 ---------- */
  function showEmptyDialog(kind: NonNullable<typeof active>) {
    const name =
      kind === 'museum'
        ? '박물관'
        : kind === 'cafe'
        ? '카페'
        : kind === 'hot'
        ? '핫플'
        : kind === 'exhibition'
        ? '전시'
        : '공연';
    setDialog({
      open: true,
      title: '안내',
      msg: `해당 위치에 ${name}이(가) 없습니다`,
    });
  }

  function onRowClick(r: RowItem) {
    const kakao = (window as any).kakao;
    const ll = (r as any).loc as LatLng | undefined;
    if (!ll) return;
    map.panTo(new kakao.maps.LatLng(ll.lat, ll.lng));
    map.setLevel(Math.max(map.getLevel() - 2, 2));
  }

  /* ---------- 마커 ---------- */
  function addMarker(
    type: NonNullable<typeof active>,
    ll: LatLng,
    title: string,
    addr?: string
  ) {
    const kakao = (window as any).kakao;
    const marker = new kakao.maps.Marker({
      map,
      position: new kakao.maps.LatLng(ll.lat, ll.lng),
      title,
    });
    const html = `<div style="max-width:220px"><div style="font-weight:700;margin-bottom:4px">${title}</div><div style="font-size:12px;color:#555">${addr || ''}</div></div>`;
    kakao.maps.event.addListener(marker, 'click', () => {
      infoRef.current.setContent(html);
      infoRef.current.open(map, marker);
    });
    pushMarker(type as any, marker);
  }

  /* ---------- Kakao Places(카페/핫플/박물관) ---------- */
  async function loadPlaces(type: 'cafe' | 'hot' | 'museum') {
    clearMarkers(type);
    const code = type === 'cafe' ? 'CE7' : type === 'hot' ? 'AT4' : 'CT1';
    const res: KakaoPlace[] = await categorySearch({
      code,
      x: center.lng,
      y: center.lat,
      radius: 3000,
    });

    const list: PlaceItem[] = res.map((p) => ({
      kind: 'place',
      id: p.id,
      name: p.place_name,
      addr: p.road_address_name || p.address_name,
      phone: p.phone,
      url: p.place_url,
      loc: { lat: parseFloat(p.y), lng: parseFloat(p.x) },
      type,
    }));

    list.forEach((item) => {
      if (item.loc) addMarker(type, item.loc, item.name, item.addr);
    });
    setRows(list);
    return list.length > 0;
  }

  /* ---------- 전시(문화포털) - 정규화 배열 사용 ---------- */
  async function loadCulture() {
    clearMarkers('exhibition');

    // 프로젝트의 culture API가 정규화된 배열을 돌려준다는 전제
    const arr: any[] = await fetchCultureNearby({
      lat: center.lat,
      lng: center.lng,
      radiusKm: 10,
    });

    const out: EventItem[] = [];
    for (const it of arr) {
      const title = it.title || '전시';
      const venue = it.place || '';
      const addr = it.place || '';
      const period = `${it.startDate || ''}${it.endDate ? ' ~ ' + it.endDate : ''}`;

      let loc: LatLng | undefined;
      if (it.lat && it.lng) {
        loc = { lat: it.lat, lng: it.lng };
      } else if (venue) {
        // 좌표가 없으면 키워드로 근사 검색
        const found = await searchKeyword({ query: venue, x: center.lng, y: center.lat, radius: 15000 });
        if (found[0]) loc = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
      }

      if (loc) addMarker('exhibition', loc, title, addr || venue);
      out.push({ kind: 'exhibition', title, venue, addr, period, loc });
    }

    setRows(out);
    return out.length > 0;
  }

  /* ---------- 공연(KOPIS) - 정규화 배열 사용 ---------- */
  async function loadKopis() {
    clearMarkers('performance');
    const sido = await reverseSido(center);
    if (!sido) return false;

    const arr: any[] = await fetchKopisPerformances({
      city: sido,
      lat: center.lat,
      lng: center.lng,
      radiusKm: 20,
      daysFromNow: 30,
    });

    const out: EventItem[] = [];
    for (const it of arr) {
      const title = it.title || '공연';
      const venue = it.place || '';
      const addr = it.place || '';
      const period = `${it.startDate || ''}${it.endDate ? ' ~ ' + it.endDate : ''}`;

      let loc: LatLng | undefined;
      if (it.lat && it.lng) {
        loc = { lat: it.lat, lng: it.lng };
      } else if (venue) {
        const found = await searchKeyword({ query: `${venue} ${sido}`, x: center.lng, y: center.lat, radius: 20000 });
        if (found[0]) loc = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
      }

      if (loc) addMarker('performance', loc, title, addr || venue);
      out.push({ kind: 'performance', title, venue, addr, period, loc });
    }

    setRows(out);
    return out.length > 0;
  }

  /* ---------- 카테고리 클릭 ---------- */
  async function onClick(kind: NonNullable<typeof active>) {
    if (!map) return;
    setActive(kind);
    setRows([]);
    setLoading(true);
    try {
      let ok = false;
      if (kind === 'cafe' || kind === 'hot' || kind === 'museum') {
        ok = await loadPlaces(kind);
      } else if (kind === 'exhibition') {
        ok = await loadCulture();
      } else if (kind === 'performance') {
        ok = await loadKopis();
      }
      if (!ok) showEmptyDialog(kind);
    } catch (e) {
      console.error('[DiscoveryPanelKakao] fetch error:', e);
      setDialog({ open: true, title: '오류', msg: '데이터를 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- 정렬/필터 ---------- */
  const filteredSorted = useMemo(() => {
    let arr = [...rows];
    if (todayOnly) {
      // 간단: 기간 문자열이 있는 항목만 (실제 날짜 비교는 서버/정규화 로직에 위임)
      arr = arr.filter((r) => (r.kind === 'place' ? true : !!(r as EventItem).period));
    }
    arr.sort((a, b) => {
      if (sortKey === 'name') {
        const an = a.kind === 'place' ? (a as PlaceItem).name : (a as EventItem).title;
        const bn = b.kind === 'place' ? (b as PlaceItem).name : (b as EventItem).title;
        return an.localeCompare(bn);
      }
      // 거리순
      const la = (a as any).loc as LatLng | undefined;
      const lb = (b as any).loc as LatLng | undefined;
      const da = distanceKm(safeCenter, la);
      const db = distanceKm(safeCenter, lb);
      if (isFinite(da) && isFinite(db)) return da - db;
      if (isFinite(da)) return -1;
      if (isFinite(db)) return 1;
      const an = a.kind === 'place' ? (a as PlaceItem).name : (a as EventItem).title;
      const bn = b.kind === 'place' ? (b as PlaceItem).name : (b as EventItem).title;
      return an.localeCompare(bn);
    });
    return arr;
  }, [rows, sortKey, todayOnly, safeCenter]);

  /* ---------- 상세 열기 ---------- */
  function openDetail(r: RowItem) {
    setDetailOpen(true);
    setDetail({
      name: r.kind === 'place' ? (r as PlaceItem).name : (r as EventItem).title,
      address: r.kind === 'place' ? (r as PlaceItem).addr : (r as EventItem).addr,
      phone: r.kind === 'place' ? (r as PlaceItem).phone : undefined,
      kakaoUrl: r.kind === 'place' ? (r as PlaceItem).url : undefined,
      loc: (r as any).loc as LatLng | undefined,
      extra:
        r.kind === 'place'
          ? (r as PlaceItem).type.toUpperCase()
          : (r as EventItem).period,
    });
  }

  /* ---------- 길찾기 열기(사이드바) ---------- */
  function openPlanner(r?: RowItem) {
    const loc = (r as any)?.loc as LatLng | undefined;
    setPlannerDest(loc ? { ...loc, name: r?.kind === 'place' ? (r as PlaceItem).name : (r as EventItem).title } : null);
    setPlannerOpen(true);
  }

  /* ======================== 렌더 ======================== */
  return (
    <Panel>
      {/* 카테고리 */}
      <ChipRow>
        <Chip $active={active === 'performance'} onClick={() => onClick('performance')}>공연(KOPIS)</Chip>
        <Chip $active={active === 'exhibition'} onClick={() => onClick('exhibition')}>전시(문화포털)</Chip>
        <Chip $active={active === 'museum'} onClick={() => onClick('museum')}>박물관</Chip>
        <Chip $active={active === 'cafe'} onClick={() => onClick('cafe')}>카페</Chip>
        <Chip $active={active === 'hot'} onClick={() => onClick('hot')}>핫플</Chip>
      </ChipRow>

      {/* 정렬/필터 (간단) */}
      <TopBar>
        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
          <option value="distance">정렬: 거리순</option>
          <option value="name">정렬: 이름순</option>
        </Select>

        <Checkbox>
          <input type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
          오늘 진행중만
        </Checkbox>
      </TopBar>

      {/* 결과 리스트 */}
      <ResultList>
        {loading ? (
          <Loading>불러오는 중…</Loading>
        ) : filteredSorted.length === 0 ? (
          <Loading>항목을 선택해 주변 정보를 조회하세요</Loading>
        ) : (
          filteredSorted.map((r, i) => {
            if (r.kind === 'place') {
              const p = r as PlaceItem;
              return (
                <Row key={p.id} $clickable onClick={() => onRowClick(p)}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                    <div>
                      <Name>{p.name}</Name>
                      <Sub>{p.addr || ''}</Sub>
                      <Actions onClick={(e)=>e.stopPropagation()}>
                        <A onClick={() => openDetail(p)}>상세</A>
                        <A href={kakaoLink(p.name)} target="_blank" rel="noreferrer">카카오</A>
                        <A href={naverLink(p.name)} target="_blank" rel="noreferrer">네이버</A>
                        <A href={googleLink(p.name)} target="_blank" rel="noreferrer">Google</A>
                        {p.phone && <A href={`tel:${p.phone.replace(/\s+/g, '')}`}>전화</A>}
                        {p.url && <A href={p.url} target="_blank" rel="noreferrer">지도페이지</A>}
                      </Actions>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <SmallBtn onClick={(e)=>{ e.stopPropagation(); openPlanner(p); }}>길찾기</SmallBtn>
                    </div>
                  </div>
                </Row>
              );
            } else {
              const ev = r as EventItem;
              const key = `${ev.title}-${ev.venue || ''}-${i}`;
              return (
                <Row key={key} $clickable onClick={() => onRowClick(ev)}>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start',justifyContent:'space-between'}}>
                    <div>
                      <Name>{ev.title}</Name>
                      {ev.venue && <Sub>{ev.venue}</Sub>}
                      {ev.period && <Sub>{ev.period}</Sub>}
                      {ev.addr && <Sub>{ev.addr}</Sub>}
                      <Actions onClick={(e)=>e.stopPropagation()}>
                        <A onClick={() => openDetail(ev)}>상세</A>
                        <A href={kakaoLink(ev.title + ' ' + (ev.venue || ''))} target="_blank" rel="noreferrer">카카오</A>
                        <A href={naverLink(ev.title + ' ' + (ev.venue || ''))} target="_blank" rel="noreferrer">네이버</A>
                        <A href={googleLink(ev.title + ' ' + (ev.venue || ''))} target="_blank" rel="noreferrer">Google</A>
                      </Actions>
                    </div>
                    <SmallBtn onClick={(e)=>{ e.stopPropagation(); openPlanner(ev); }}>길찾기</SmallBtn>
                  </div>
                </Row>
              );
            }
          })
        )}
      </ResultList>

      {/* 중앙 팝업 */}
      {dialog.open && (
        <Backdrop onClick={() => setDialog({ open: false })}>
          <Dialog onClick={(e) => e.stopPropagation()}>
            <DialogTitle>{dialog.title || '안내'}</DialogTitle>
            <DialogMsg>{dialog.msg || ''}</DialogMsg>
            <DialogBtn onClick={() => setDialog({ open: false })}>확인</DialogBtn>
          </Dialog>
        </Backdrop>
      )}

      {/* 상세 모달 */}
      {detailOpen && detail && (
        <DetailBackdrop onClick={() => setDetailOpen(false)}>
          <DetailSheet onClick={(e) => e.stopPropagation()}>
            <DetailH>{detail.name}</DetailH>
            {detail.address && <Line>📍 {detail.address}</Line>}
            {detail.phone && <Line>☎ {detail.phone}</Line>}
            {detail.extra && <Line>🕒 {detail.extra}</Line>}
            <DetailActions>
              {detail.kakaoUrl && (
                <A href={detail.kakaoUrl} target="_blank" rel="noreferrer">카카오 상세페이지</A>
              )}
              <A href={kakaoLink(detail.name)} target="_blank" rel="noreferrer">카카오 검색</A>
              <A href={naverLink(detail.name)} target="_blank" rel="noreferrer">네이버 검색</A>
              <A href={googleLink(detail.name)} target="_blank" rel="noreferrer">Google 검색</A>
              <A onClick={() => { setDetailOpen(false); openPlanner({ kind:'place', id:'', name: detail.name, addr: detail.address, loc: detail.loc, type: 'hot' } as PlaceItem); }}>
                길찾기
              </A>
            </DetailActions>
          </DetailSheet>
        </DetailBackdrop>
      )}

      {/* 길찾기 사이드바 (앱 내 경로 + 단계별 안내 + 외부 열기) */}
      <RouteSidebar
        open={plannerOpen}
        onClose={()=>setPlannerOpen(false)}
        map={map}
        defaultOrigin={origin ? { ...origin, name: '현재 위치' } : null}
        defaultDestination={plannerDest}
      />
    </Panel>
  );
}
