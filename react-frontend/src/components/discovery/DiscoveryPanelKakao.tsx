// src/components/discovery/DiscoveryPanelKakao.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  categorySearch,
  loadKakaoSdk,
  reverseSido,
  searchKeyword,
} from '../../api/kakao';
import { fetchKopisPerformances } from '../../api/kopis';
import { fetchCultureNearby } from '../../api/culture';
import { useKakaoMarkers } from './useKakaoMarkers';
import AutocompleteInput, { Suggestion } from '../common/AutocompleteInput';
import {
  createTrip as apiCreateTrip,
  upsertPlace,
  addStop as apiAddStop,
  listMyTrips,
} from '../../api/trips';

// (선택) 상세 패널 보강용 — 있으면 쓰고, 없으면 무시
import {
  extractPhotoUrls,
  getPlaceDetails,
  loadGooglePlaces,
  searchPlaceByText,
} from '../../api/googlePlaces';

/* ======================== 스타일 (기존 톤 유지) ======================== */
const Panel = styled.div`
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 10px;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;
const Chip = styled.button<{ $active?: boolean }>`
  border: 1px solid ${(p) => (p.$active ? '#000' : '#ddd')};
  background: #fff;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: ${(p) => (p.$active ? 800 : 600)};
`;

const TopBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin: 8px 0 12px;
`;
const Select = styled.select`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fff;
`;
const Checkbox = styled.label`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.95rem;
`;
const RangeWrap = styled.label`
  display: flex;
  gap: 6px;
  align-items: center;
`;
const Range = styled.input.attrs({ type: 'range' })`
  width: 160px;
`;
const ResultList = styled.div`
  max-height: 360px;
  overflow: auto;
  border: 1px solid #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
`;
const Row = styled.div<{ $clickable?: boolean }>`
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
  ${(p) => (p.$clickable ? 'cursor:pointer;' : '')}
`;
const Name = styled.div`
  font-weight: 800;
`;
const Sub = styled.div`
  color: #555;
  font-size: 0.9rem;
`;
const SmallBtn = styled.button`
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
`;
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
`;
const A = styled.a`
  border: 1px solid #ddd;
  padding: 6px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: #111;
  background: #fff;
`;
const Loading = styled.div`
  color: #777;
  padding: 12px 0;
`;

/* 중앙 팝업형 길찾기 */
const PlannerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 70;
`;
const PlannerModal = styled.div`
  position: relative;
  width: 400px;
  max-width: min(92vw, 420px);
  max-height: 80vh;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  padding: 12px;
  overflow: visible; /* 드롭다운이 잘리지 않도록 */
`;
const PlannerTitle = styled.div`
  font-weight: 800;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const PlannerClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;
`;
const PlannerRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 8px 0;
  > * { min-width: 0; }
`;
const Input = styled.input`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 10px;
`;
const Btn = styled.button`
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
`;
const BtnPrimary = styled(Btn)`
  background: #111;
  color: #fff;
  border-color: #111;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
`;
const Dialog = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 18px 16px;
  width: min(90vw, 360px);
  text-align: center;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
`;
const DialogTitle = styled.div`
  font-weight: 800;
  font-size: 1.05rem;
  margin-bottom: 8px;
`;
const DialogMsg = styled.div`
  color: #555;
  margin-bottom: 12px;
`;
const DialogBtn = styled.button`
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
`;

const DetailBackdrop = styled(Backdrop)`
  /* 상세 모달은 화면 중앙보다 약간 아래에 위치 */
  align-items: flex-start;
  padding-top: min(10vh, 72px);
`;
const DetailSheet = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  width: min(92vw, 820px);
  max-height: 86vh;
  overflow: auto;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
`;
const DetailH = styled.h3`
  margin: 0 0 8px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const Photo = styled.img`
  width: 100%;
  /* 더 낮은 가변 높이로 잘림 느낌 최소화 */
  height: clamp(90px, 18vh, 140px);
  object-fit: contain; /* 비율 유지, 잘림 없음 */
  background: #f3f4f6;
  border-radius: 12px;
  display: block;
`;
const Line = styled.div`
  font-size: 0.95rem;
  color: #333;
  margin: 6px 0;
  word-break: break-all;
`;
const DetailActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

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
  rating?: number;
  ratingCount?: number;
  openNow?: boolean;
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

/* ======================== 메인 컴포넌트 ======================== */
export default function DiscoveryPanelKakao({ map, center, origin }: Props) {
  const [active, setActive] = useState<
    'performance' | 'exhibition' | 'museum' | 'cafe' | 'hot' | null
  >(null);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 정렬/필터 (UI 모양 보존)
  const [sortKey, setSortKey] = useState<
    'distance' | 'rating' | 'name' | 'openFirst'
  >('distance');
  const [minRating, setMinRating] = useState(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false); // 공연/전시에만 의미

  // 길찾기 플래너 + 자동완성 (외부 길찾기)
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromLL, setFromLL] = useState<LatLng | null>(null);
  const [toLL, setToLL] = useState<LatLng | null>(null);

  // 중앙 팝업
  const [dialog, setDialog] = useState<{
    open: boolean;
    title?: string;
    msg?: string;
  }>({ open: false });

  // 상세 모달
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    ratingCount?: number;
    openingHours?: string[];
    photos?: string[];
    kakaoUrl?: string;
    loc?: LatLng;
  } | null>(null);

  const safeCenter = origin || center;
  const infoRef = useRef<any>(null);
  const { pushMarker, clearMarkers, clearCategoryMarkers } = useKakaoMarkers();

  useEffect(() => {
    (async () => {
      await loadKakaoSdk();
      infoRef.current = new window.kakao.maps.InfoWindow({ removable: true });
    })();
  }, []);

  // (삭제됨) 일정 초안 변경 브로드캐스트

  // 계획에 담은 장소 마커(보라색) 표시 유지
  useEffect(() => {
    if (!map || !(window as any).kakao) return;
    const kakao = (window as any).kakao;
    function addDraftMarker(ll: LatLng, title: string, addr?: string) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='8' fill='#8b5cf6' stroke='white' stroke-width='2'/></svg>`;
      const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      const image = new kakao.maps.MarkerImage(url, new kakao.maps.Size(24, 24), { offset: new kakao.maps.Point(12, 12) });
      const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(ll.lat, ll.lng), title, image });
      const html = `<div style="max-width:220px"><div style="font-weight:700;margin-bottom:4px">${title}</div><div style="font-size:12px;color:#555">${addr || ''}</div><div style='margin-top:4px;font-size:12px;color:#8b5cf6'>계획에 담긴 장소</div></div>`;
      kakao.maps.event.addListener(marker, 'click', () => { infoRef.current.setContent(html); infoRef.current.open(map, marker); });
      pushMarker('draft' as any, marker);
    }
    // refresh
    clearMarkers('draft' as any);
    const list: any[] = [];
    list.forEach((s: any) => { if (s?.lat != null && s?.lng != null) addDraftMarker({ lat: s.lat, lng: s.lng }, s.name, s.addr); });
  }, [map]);

  // 여행 일정 담기 모달 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<{
    extId: string;
    name: string;
    addr?: string;
    loc?: LatLng;
  } | null>(null);
  const [tripId, setTripId] = useState<string>('');
  const [tripList, setTripList] = useState<Array<{ id: string; title: string }>>(
    []
  );
  const [addDate, setAddDate] = useState<string>('');
  const [addTime, setAddTime] = useState<string>('');

  useEffect(() => {
    if (!addOpen) return;
    (async () => {
      try {
        const r = await listMyTrips();
        setTripList(r || []);
        if ((r || []).length) setTripId(r[0].id);
      } catch (e) {
        console.error('trips fetch error', e);
      }
    })();
  }, [addOpen]);

  async function ensureInternalPlaceId(t: {
    extId: string;
    name: string;
    addr?: string;
    loc?: LatLng;
  }) {
    const p = await upsertPlace({
      source: 'kakao',
      externalId: t.extId,
      name: t.name,
      lat: t.loc?.lat,
      lng: t.loc?.lng,
      address: t.addr,
    });
    return p.id as string;
  }
  async function saveAddToTrip() {
    if (!addTarget || !tripId) return;
    try {
      const placeId = await ensureInternalPlaceId(addTarget);
      await apiAddStop(tripId, {
        placeId,
        date: addDate || undefined,
        startTime: addTime || undefined,
      });
      setAddOpen(false);
    } catch (e) {
      console.error('add to trip failed', e);
      setDialog({ open: true, title: '오류', msg: '일정에 추가하지 못했어요.' });
    }
  }

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
    if (!r || !(r as any).loc) return;
    const kakao = (window as any).kakao;
    const ll = (r as any).loc as LatLng;
    map.panTo(new kakao.maps.LatLng(ll.lat, ll.lng));
    map.setLevel(Math.max(map.getLevel() - 2, 2));
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
    (window as any).kakao.maps.event.addListener(marker, 'click', () => {
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

    // Google Places 보강은 백그라운드로 수행하여 UI 블로킹 방지
    (async () => {
      try {
        await loadGooglePlaces();
      } catch {
        return; // 키 오류/차단 시 즉시 중단
      }
      const tasks = list.slice(0, 30).map(async (it) => {
        try {
          const query = `${it.name} ${it.addr || ''}`.trim();
          // 안전 타임아웃(1.5s) — 구글 콜백 미호출 대비
          const cand: any = await Promise.race([
            searchPlaceByText(query),
            new Promise((res) => setTimeout(() => res(null), 1500)),
          ]);
          if (cand) {
            if (typeof (cand as any).rating === 'number') it.rating = (cand as any).rating;
            if (typeof (cand as any).user_ratings_total === 'number') it.ratingCount = (cand as any).user_ratings_total;
            if (typeof (cand as any).opening_hours?.open_now === 'boolean') it.openNow = (cand as any).opening_hours.open_now;
          }
        } catch {}
      });
      await Promise.allSettled(tasks);
      // 데이터 보강된 내용만 살짝 갱신
      setRows((prev) => {
        // 동일 길이면 최신 list로 교체
        if (Array.isArray(prev) && prev.length === list.length) return [...list];
        return prev;
      });
    })();
    return list.length > 0;
  }

  /* ---------- 전시(문화포털) ---------- */
  async function loadCulture() {
    clearMarkers('exhibition');
    const tries = [
      { r: 5, d: 14 },
      { r: 15, d: 30 },
      { r: 30, d: 90 },
    ];
    let data: any[] = [];
    for (const t of tries) {
      const from = yyyymmdd(new Date());
      const to = yyyymmdd(addDays(new Date(), t.d));
      const r = await fetchCultureNearby({
        lat: center.lat,
        lng: center.lng,
        radiusKm: t.r,
        from,
        to,
      });
      const items = (((r || {}).response || {}).body || {}).items || {};
      const arr = Array.isArray(items.item)
        ? items.item
        : items.item
        ? [items.item]
        : [];
      if (arr.length) {
        data = arr;
        break;
      }
    }

    const out: EventItem[] = [];
    for (const it of data) {
      const title = it.title || it.prfnm || '전시/공연';
      const venue = it.place || it.place_nm || '';
      const addr = it.place_addr || it.placeaddr || '';
      const period = `${it.startDate || it.prfpdfrom || ''} ~ ${
        it.endDate || it.prfpdto || ''
      }`;

      let loc: LatLng | undefined;
      if (it.gpslatitude && it.gpslongitude) {
        loc = {
          lat: parseFloat(it.gpslatitude),
          lng: parseFloat(it.gpslongitude),
        };
      } else if (venue) {
        const found = await searchKeyword({
          query: venue,
          x: center.lng,
          y: center.lat,
          radius: 10000,
        });
        if (found[0])
          loc = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
      }
      if (loc) addMarker('exhibition', loc, title, addr || venue);
      out.push({ kind: 'exhibition', title, venue, addr, period, loc });
    }
    setRows(out);
    return out.length > 0;
  }

  /* ---------- 공연(KOPIS) ---------- */
  async function loadKopis() {
    clearMarkers('performance');
    const sido = await reverseSido(center);
    if (!sido) return false;

    const from = yyyymmdd(new Date());
    const to = yyyymmdd(addDays(new Date(), 30));
    const r = await fetchKopisPerformances({ city: sido, from, to, rows: 50 });
    const list = (((r || {}).dbs || {}).db) || [];
    const arr = Array.isArray(list) ? list : list ? [list] : [];

    const out: EventItem[] = [];
    for (const it of arr) {
      const title = it.prfnm || '공연';
      const venue = it.fcltynm || '';
      const gugun = it.gugunnm || '';
      const addr = `${venue} ${gugun}`.trim();
      const period = `${it.prfpdfrom || ''} ~ ${it.prfpdto || ''}`;

      let loc: LatLng | undefined;
      if (venue) {
        const found = await searchKeyword({
          query: `${venue} ${sido}`,
          x: center.lng,
          y: center.lat,
          radius: 20000,
        });
        if (found[0])
          loc = { lat: parseFloat(found[0].y), lng: parseFloat(found[0].x) };
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
    setPlannerOpen(false);
    setLoading(true);
    try {
      // 이전 카테고리 마커만 정리(계획 마커는 유지)
      clearCategoryMarkers();
      try { infoRef.current?.close?.(); } catch {}
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
      // 단순 표시 유지 — 기간 문자열이 있는지만 체크
      arr = arr.filter((r) => (r.kind === 'place' ? true : !!(r as EventItem).period));
    }

    // 최소 별점 필터 (장소만, 평점 없는 항목은 제외)
    if (minRating > 0) {
      arr = arr.filter((r) =>
        r.kind !== 'place' ? true : ((r as PlaceItem).rating ?? -1) >= minRating
      );
    }
    // 영업중만 (장소만, 상태 없는 항목은 제외)
    if (openNowOnly) {
      arr = arr.filter((r) =>
        r.kind !== 'place' ? true : Boolean((r as PlaceItem).openNow)
      );
    }
    arr.sort((a, b) => {
      if (sortKey === 'name') {
        const an = a.kind === 'place' ? (a as PlaceItem).name : (a as EventItem).title;
        const bn = b.kind === 'place' ? (b as PlaceItem).name : (b as EventItem).title;
        return an.localeCompare(bn);
      } else if (sortKey === 'rating') {
        const ra = a.kind === 'place' ? (a as PlaceItem).rating ?? -1 : -1;
        const rb = b.kind === 'place' ? (b as PlaceItem).rating ?? -1 : -1;
        if (rb !== ra) return rb - ra; // 내림차순
        // 동률이면 거리로 보조 정렬
      } else if (sortKey === 'openFirst') {
        const oa = a.kind === 'place' ? Number(Boolean((a as PlaceItem).openNow)) : 0;
        const ob = b.kind === 'place' ? Number(Boolean((b as PlaceItem).openNow)) : 0;
        if (ob !== oa) return ob - oa; // true 우선
      }
      // 거리 기준
      const la = a.kind === 'place' ? (a as PlaceItem).loc : (a as EventItem).loc;
      const lb = b.kind === 'place' ? (b as PlaceItem).loc : (b as EventItem).loc;
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
  }, [rows, sortKey, todayOnly, safeCenter, minRating, openNowOnly]);

  /* ---------- 상세 패널 ---------- */
  async function openDetail(r: RowItem) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      let base = {
        name: r.kind === 'place' ? (r as PlaceItem).name : (r as EventItem).title,
        address: r.kind === 'place' ? (r as PlaceItem).addr : (r as EventItem).addr,
        phone: r.kind === 'place' ? (r as PlaceItem).phone : undefined,
        website: undefined as string | undefined,
        rating: undefined as number | undefined,
        ratingCount: undefined as number | undefined,
        openingHours: undefined as string[] | undefined,
        photos: undefined as string[] | undefined,
        kakaoUrl: r.kind === 'place' ? (r as PlaceItem).url : undefined,
        loc: (r as any).loc as LatLng | undefined,
      };

      // (선택) Google Places 상세 보강 — 키 없으면 catch로 넘어감
      try {
        await loadGooglePlaces();
        const query =
          r.kind === 'place'
            ? `${(r as PlaceItem).name} ${(r as PlaceItem).addr || ''}`
            : `${(r as EventItem).title} ${((r as EventItem).venue || '')} ${((r as EventItem).addr || '')}`;
        const cand = await searchPlaceByText(query);
        if (cand?.place_id) {
          const d = await getPlaceDetails(cand.place_id);
          base = {
            ...base,
            address: d.formatted_address || base.address,
            phone:
              d.formatted_phone_number ||
              d.international_phone_number ||
              base.phone,
            website: d.website || base.website,
            rating: d.rating ?? base.rating,
            ratingCount: d.user_ratings_total ?? base.ratingCount,
            openingHours: d.opening_hours?.weekday_text || base.openingHours,
            photos: extractPhotoUrls(d, 6) || base.photos,
            loc: d.geometry?.location
              ? { lat: d.geometry.location.lat(), lng: d.geometry.location.lng() }
              : base.loc,
          };
        }
      } catch {
        // 구글 키 없음/실패 — Kakao 기본 정보만 노출
      }

      setDetail(base);
    } finally {
      setDetailLoading(false);
    }
  }

  /* ---------- 길찾기(외부 링크) + 자동완성 ---------- */
  function openPlannerFor(r?: RowItem) {
    setPlannerOpen(true);
    setFromText('내 위치');
    setFromLL(origin || null);
    if (r) {
      const n = r.kind === 'place' ? (r as any).name : (r as any).title + ' ' + ((r as any).venue || '');
      setToText(n);
      const loc = (r as any).loc as LatLng | undefined;
      setToLL(loc || null);
    } else {
      setToText('');
      setToLL(null);
    }
  }
  function kakaoExternal(from: string, to: string) {
    return `https://map.kakao.com/?sName=${encodeURIComponent(from || '내 위치')}&eName=${encodeURIComponent(
      to || '목적지'
    )}`;
  }
  // 외부 길찾기는 카카오만 유지

  async function fetchPlaceSuggestions(q: string): Promise<Suggestion[]> {
    if (!q.trim()) return [];
    const arr: any[] = await searchKeyword({
      query: q,
      x: center.lng,
      y: center.lat,
      radius: 20000,
    });
    return (arr || []).slice(0, 8).map((p) => ({
      label: p.place_name,
      subtitle: p.road_address_name || p.address_name,
      value: { lat: parseFloat(p.y), lng: parseFloat(p.x) },
    }));
  }

  /* ======================== 렌더 ======================== */
  return (
    <Panel>
      {/* 카테고리 버튼 */}
      <ChipRow>
        <Chip $active={active === 'performance'} onClick={() => onClick('performance')}>
          공연(KOPIS)
        </Chip>
        <Chip $active={active === 'exhibition'} onClick={() => onClick('exhibition')}>
          전시(문화포털)
        </Chip>
        <Chip $active={active === 'museum'} onClick={() => onClick('museum')}>
          박물관
        </Chip>
        <Chip $active={active === 'cafe'} onClick={() => onClick('cafe')}>
          카페
        </Chip>
        <Chip $active={active === 'hot'} onClick={() => onClick('hot')}>
          핫플
        </Chip>
      </ChipRow>

      {/* 정렬/필터 */}
      <TopBar>
        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
          <option value="distance">정렬: 거리순</option>
          <option value="rating">정렬: 평점순</option>
          <option value="name">정렬: 이름순</option>
          <option value="openFirst">정렬: 영업중 우선</option>
        </Select>

        <RangeWrap>
          최소 별점
          <Range
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
          />
          <span>{minRating.toFixed(1)}</span>
        </RangeWrap>

        <Checkbox>
          <input type="checkbox" checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)} />
          지금 영업중만
        </Checkbox>

        <Checkbox title="공연/전시에만 적용">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <Name>{p.name}</Name>
                      <Sub>{p.addr || ''}</Sub>
                      <Actions onClick={(e) => e.stopPropagation()}>
                        <A onClick={() => openDetail(p)}>상세</A>
                        <A href={kakaoLink(p.name)} target="_blank" rel="noreferrer">
                          카카오
                        </A>
                        <A href={naverLink(p.name)} target="_blank" rel="noreferrer">
                          네이버
                        </A>
                      <A href={googleLink(p.name)} target="_blank" rel="noreferrer">
                          Google
                        </A>
                        {p.phone && <A href={`tel:${p.phone.replace(/\s+/g, '')}`}>전화</A>}
                        {p.url && (
                          <A href={p.url} target="_blank" rel="noreferrer">
                            지도페이지
                          </A>
                        )}
                      </Actions>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <SmallBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          openPlannerFor(p);
                        }}
                      >
                        길찾기
                      </SmallBtn>
                    </div>
                  </div>
                </Row>
              );
            } else {
              const e = r as EventItem;
              const key = `${e.title}-${e.venue || ''}-${i}`;
              return (
                <Row key={key} $clickable onClick={() => onRowClick(e)}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div>
                      <Name>{e.title}</Name>
                      {e.venue && <Sub>{e.venue}</Sub>}
                      {e.period && <Sub>{e.period}</Sub>}
                      {e.addr && <Sub>{e.addr}</Sub>}
                      <Actions onClick={(ev) => ev.stopPropagation()}>
                        <A onClick={() => openDetail(e)}>상세</A>
                        <A href={kakaoLink(e.title + ' ' + (e.venue || ''))} target="_blank" rel="noreferrer">
                          카카오
                        </A>
                        <A href={naverLink(e.title + ' ' + (e.venue || ''))} target="_blank" rel="noreferrer">
                          네이버
                        </A>
                        <A href={googleLink(e.title + ' ' + (e.venue || ''))} target="_blank" rel="noreferrer">
                          Google
                        </A>
                      </Actions>
                    </div>

                    {/* 일정 추가하기 제거 */}
                    <SmallBtn
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openPlannerFor(e);
                      }}
                    >
                      길찾기
                    </SmallBtn>
                  </div>
                </Row>
              );
            }
          })
        )}
      </ResultList>

      {/* 길찾기 플래너 (자동완성으로 외부 길찾기 열기) */}
      {plannerOpen && (
        <PlannerBackdrop onClick={() => setPlannerOpen(false)}>
          <PlannerModal onClick={(e)=>e.stopPropagation()}>
            <PlannerTitle>길찾기</PlannerTitle>
            <PlannerClose onClick={() => setPlannerOpen(false)}>✕</PlannerClose>

          <PlannerRow>
            <AutocompleteInput
              value={fromText}
              onChange={(v) => {
                setFromText(v);
                setFromLL(null);
              }}
              placeholder="출발지 (예: 내 위치 / 서울역 / 주소)"
              fetchSuggestions={fetchPlaceSuggestions}
              onSelect={(s) => {
                setFromText(s.label);
                setFromLL((s.value as LatLng) || null);
              }}
            />
            <Btn
              onClick={() => {
                setFromText('내 위치');
                setFromLL(origin || null);
              }}
            >
              내 위치
            </Btn>
          </PlannerRow>

          <PlannerRow>
            <AutocompleteInput
              value={toText}
              onChange={(v) => {
                setToText(v);
                setToLL(null);
              }}
              placeholder="도착지 (예: 장소명 / 주소)"
              fetchSuggestions={fetchPlaceSuggestions}
              onSelect={(s) => {
                setToText(s.label);
                setToLL((s.value as LatLng) || null);
              }}
            />
          </PlannerRow>

          <PlannerRow>
            <BtnPrimary
              onClick={() => {
                const f = fromText || '내 위치';
                const t = toText || '목적지';
                window.open(kakaoExternal(f, t), '_blank');
              }}
            >
              카카오 길찾기 열기
            </BtnPrimary>
          </PlannerRow>
          </PlannerModal>
        </PlannerBackdrop>
      )}

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
      {detailOpen && (
        <DetailBackdrop onClick={() => setDetailOpen(false)}>
          <DetailSheet onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div>불러오는 중…</div>
            ) : detail ? (
              <>
                <DetailH>{detail.name}</DetailH>
                {detail.photos && detail.photos.length > 0 && (
                  <Grid>
                    {detail.photos.map((url, idx) => (
                      <Photo key={idx} src={url} alt={`photo-${idx}`} />
                    ))}
                  </Grid>
                )}
                <div style={{ marginTop: 8 }}>
                  {detail.address && <Line>📍 {detail.address}</Line>}
                  {typeof detail.rating === 'number' && (
                    <Line>
                      ★ {detail.rating} {detail.ratingCount ? `(${detail.ratingCount})` : ''}
                    </Line>
                  )}
                  {detail.phone && <Line>☎ {detail.phone}</Line>}
                  {detail.website && (
                    <Line>
                      🔗{' '}
                      <a href={detail.website} target="_blank" rel="noreferrer">
                        {detail.website}
                      </a>
                    </Line>
                  )}
                </div>
                <DetailActions>
                  {detail.kakaoUrl && (
                    <A href={detail.kakaoUrl} target="_blank" rel="noreferrer">
                      카카오 상세페이지
                    </A>
                  )}
                  <A href={kakaoLink(detail.name)} target="_blank" rel="noreferrer">
                    카카오 검색
                  </A>
                  <A href={naverLink(detail.name)} target="_blank" rel="noreferrer">
                    네이버 검색
                  </A>
                  <A href={googleLink(detail.name)} target="_blank" rel="noreferrer">
                    Google 검색
                  </A>
                  <A
                    onClick={() =>
                      openPlannerFor({
                        kind: 'place',
                        id: '',
                        name: detail.name,
                        addr: detail.address,
                        phone: detail.phone || '',
                        url: undefined,
                        loc: detail.loc,
                        type: 'hot',
                      } as PlaceItem)
                    }
                  >
                    길찾기
                  </A>
                </DetailActions>
              </>
            ) : (
              <div>상세 정보를 찾지 못했습니다.</div>
            )}
          </DetailSheet>
        </DetailBackdrop>
      )}

      {/* 여행 일정에 추가하기 모달 */}
      {addOpen && addTarget && (
        <DetailBackdrop onClick={() => setAddOpen(false)}>
          <DetailSheet onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>여행 일정에 추가하기</h3>

            <div style={{ margin: '8px 0 12px' }}>
              <div style={{ fontWeight: 700 }}>{addTarget.name}</div>
              {addTarget.addr && <div style={{ color: '#555' }}>{addTarget.addr}</div>}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span className="text-sm">여행 선택</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Select value={tripId} onChange={(e) => setTripId(e.target.value)}>
                    <option value="" disabled>
                      여행을 선택하세요
                    </option>
                                        {tripList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <label style={{ display: 'grid', gap: 6 }}>
                  <span className="text-sm">날짜(선택)</span>
                  <Input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span className="text-sm">시간(선택)</span>
                  <Input
                    type="time"
                    value={addTime}
                    onChange={(e) => setAddTime(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 12,
              }}
            >
              <Btn onClick={() => setAddOpen(false)}>취소</Btn>
              <BtnPrimary onClick={saveAddToTrip} disabled={!tripId}>
                추가하기
              </BtnPrimary>
            </div>
          </DetailSheet>
        </DetailBackdrop>
      )}

    </Panel>
  );
}
