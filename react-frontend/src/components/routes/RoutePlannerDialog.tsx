import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { loadKakaoSdk } from '../../api/kakao';
import { loadGooglePlaces } from '../../api/googlePlaces';

type LatLng = { lat: number; lng: number };
type PlacePick = LatLng & { name?: string; address?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  map: any; // kakao.maps.Map
  defaultOrigin?: PlacePick | null;
  defaultDestination?: PlacePick | null;
  onRouteDrawn?: (info: { distance?: number | null; duration?: number | null }) => void;
};

/* ===== styled ===== */
const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.38);
  display: flex; align-items: center; justify-content: center; z-index: 1100;
`;
const Modal = styled.div`
  width: 720px; max-width: calc(100vw - 24px);
  background: #fff; border-radius: 16px; padding: 18px;
  box-shadow: 0 20px 44px rgba(0,0,0,.18);
`;
const TitleRow = styled.div`display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;`;
const H3 = styled.h3`margin:0;`;
const CloseBtn = styled.button`border:none;background:transparent;font-size:18px;cursor:pointer;`;
const Tabs = styled.div`display:flex;gap:6px;margin-bottom:10px;`;
const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 12px; border-radius: 999px; border:1px solid #e6e6ff;
  background: ${p=>p.$active ? '#f1f2ff' : '#fff'}; color: ${p=>p.$active ? '#5a5de0' : '#444'};
  font-weight: 700; cursor:pointer;
`;
const Grid = styled.div`
  display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px;
  @media (max-width:720px){ grid-template-columns:1fr; }
`;
const Field = styled.div``;
const Label = styled.div`font-size:.9rem;color:#555;margin-bottom:4px;`;
const Row = styled.div`display:flex;gap:6px;`;
const Input = styled.input`flex:1;padding:10px 12px;border:1px solid #e7e7ea;border-radius:10px;`;
const Btn = styled.button`
  padding: 10px 12px; border-radius: 10px; border:1px solid #e7e7ea; background:#fff; cursor:pointer;
  &:hover{ background:#f8f8ff; }
`;
const PrimBtn = styled.button`
  padding: 12px 16px; border-radius: 12px; border:none; background:#6b6ef9; color:#fff; font-weight:800; cursor:pointer;
  &:hover{ opacity:.9 }
`;
const FootRow = styled.div`display:flex;justify-content:space-between;align-items:center;margin-top:12px;`;
const Help = styled.div`font-size:.9rem;color:#777;`;
const Small = styled.div`font-size:.85rem;color:#888;margin-top:8px;`;
const ErrorText = styled.div`color:#c00;background:#fff1f1;border:1px solid #ffdcdc;padding:8px;border-radius:10px;margin-top:8px;`;
const List = styled.ul`
  list-style:none;margin:6px 0 0;padding:0;border:1px solid #eee;border-radius:10px;max-height:160px;overflow:auto;
`;
const Item = styled.li`
  padding:8px 10px; cursor:pointer; border-bottom:1px solid #f3f3f3;
  &:hover{ background:#f7f7ff; } &:last-child{ border-bottom:none; }
`;

/* ===== helpers ===== */
async function kakaoKeywordSearch(keyword: string, center?: LatLng){
  await loadKakaoSdk();
  const kakaoAny = (window as any).kakao;
  const ps = new kakaoAny.maps.services.Places();
  const opts:any = {};
  if (center) {
    opts.location = new kakaoAny.maps.LatLng(center.lat, center.lng);
    opts.radius = 5000;
  }
  return new Promise<PlacePick[]>((resolve) => {
    ps.keywordSearch(keyword, (data:any[], status:string)=>{
      if (status !== kakaoAny.maps.services.Status.OK || !Array.isArray(data)) return resolve([]);
      resolve(data.map((d:any)=>({
        name: d.place_name,
        address: d.road_address_name || d.address_name,
        lat: Number(d.y), lng: Number(d.x),
      })));
    }, opts);
  });
}

function externalLinks(o: PlacePick | null, d: PlacePick | null){
  const oC = o ? `${o.lat},${o.lng}` : '';
  const dC = d ? `${d.lat},${d.lng}` : '';
  const oN = encodeURIComponent(o?.name || '출발지');
  const dN = encodeURIComponent(d?.name || '도착지');
  return {
    google: `https://www.google.com/maps/dir/?api=1&origin=${oC}&destination=${dC}&travelmode=driving`,
    kakao:  `https://map.kakao.com/?sName=${oN}&sx=${o?.lng ?? ''}&sy=${o?.lat ?? ''}&eName=${dN}&ex=${d?.lng ?? ''}&ey=${d?.lat ?? ''}`,
  };
}

/* ===== component ===== */
const RoutePlannerDialog: React.FC<Props> = ({ isOpen, onClose, map, defaultOrigin=null, defaultDestination=null, onRouteDrawn }) => {
  const [tab, setTab] = useState<'inapp'|'external'>('inapp');
  const [mode, setMode] = useState<'DRIVING'|'WALKING'|'TRANSIT'>('DRIVING');

  const [origin, setOrigin] = useState<PlacePick | null>(defaultOrigin);
  const [destination, setDestination] = useState<PlacePick | null>(defaultDestination);

  const [oQuery, setOQuery] = useState(''); const [dQuery, setDQuery] = useState('');
  const [oResults, setOResults] = useState<PlacePick[]>([]); const [dResults, setDResults] = useState<PlacePick[]>([]);
  const [err, setErr] = useState('');
  const polylineRef = useRef<any>(null);

  useEffect(()=>{
    if(!isOpen) return;
    setTab('inapp'); setErr('');
    setMode('DRIVING');
    setOQuery(''); setDQuery('');
    setOResults([]); setDResults([]);
    setOrigin(defaultOrigin ?? null);
    setDestination(defaultDestination ?? null);
  }, [isOpen, defaultOrigin, defaultDestination]);

  useEffect(()=>{
    if (isOpen) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, [isOpen]);

  // 검색
  async function doSearch(which:'o'|'d'){
    const q = (which==='o'?oQuery:dQuery).trim();
    if (!q) return;
    const center = map?.getCenter?.() ? { lat: map.getCenter().getLat(), lng: map.getCenter().getLng() } : undefined;
    const r = await kakaoKeywordSearch(q, center);
    which==='o' ? setOResults(r) : setDResults(r);
  }

  async function setFromCurrent(which:'o'|'d'){
    return new Promise<void>((resolve) => {
      if (!navigator.geolocation) return resolve();
      navigator.geolocation.getCurrentPosition((pos)=>{
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: '현재 위치' };
        which==='o' ? setOrigin(p) : setDestination(p);
        resolve();
      }, ()=>resolve(), { enableHighAccuracy:true, timeout:7000 });
    });
  }
  async function setFromMapCenter(which:'o'|'d'){
    await loadKakaoSdk();
    const center = map?.getCenter?.();
    if (!center) return;
    const p = { lat: center.getLat(), lng: center.getLng(), name: '지도 중심' };
    which==='o' ? setOrigin(p) : setDestination(p);
  }

  // Google Directions → Kakao Polyline
  async function drawInApp(){
    try{
      setErr('');
      if (!origin || !destination) {
        setErr('출발지와 도착지를 모두 선택해주세요.');
        return;
      }
      await loadGooglePlaces(); // Maps JS 로드 (DirectionsService 포함)
      await loadKakaoSdk();

      const google: any = (window as any).google;
      const kakaoAny: any = (window as any).kakao;

      // DirectionsService는 콜백 스타일 → Promise로 래핑
      const route = await new Promise<any>((resolve, reject)=>{
        const svc = new google.maps.DirectionsService();
        svc.route({
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: mode,
        }, (res: any, status: any) => {
          if (status !== 'OK' || !res?.routes?.length) return reject(new Error('경로를 찾지 못했습니다.'));
          resolve(res.routes[0]);
        });
      });

      // 개략 경로(overview_path) → Kakao LatLng 배열
      const path = (route.overview_path || []).map((p:any)=> new kakaoAny.maps.LatLng(p.lat(), p.lng()));

      // 기존 라인 제거 후 그리기
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
      polylineRef.current = new kakaoAny.maps.Polyline({
        map,
        path,
        strokeWeight: 5,
        strokeColor: '#5B5FEA',
        strokeOpacity: 0.95,
        strokeStyle: 'solid',
      });

      // 지도 범위 맞추기
      if (path.length) {
        const bounds = new kakaoAny.maps.LatLngBounds();
        path.forEach((ll:any)=>bounds.extend(ll));
        map.setBounds(bounds);
      }

      // 거리/시간(대략): legs 합산
      let dist:number|null = null, dur:number|null = null;
      if (route.legs?.length) {
        dist = route.legs.reduce((s:number,l:any)=>s+(l.distance?.value||0),0);
        dur  = route.legs.reduce((s:number,l:any)=>s+(l.duration?.value||0),0);
      }
      onRouteDrawn?.({ distance: dist, duration: dur });

      // (선택) 완료 후 외부탭으로 전환하고 싶으면 아래 라인 주석 해제
      // setTab('external');
    }catch(e:any){
      setErr(e?.message || '경로 계산에 실패했습니다.');
    }
  }

  const links = useMemo(()=>externalLinks(origin, destination), [origin, destination]);

  if (!isOpen) return null;
  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e)=>e.stopPropagation()}>
        <TitleRow>
          <H3>길찾기</H3>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </TitleRow>

        <Tabs>
          <Tab $active={tab==='inapp'} onClick={()=>setTab('inapp')}>앱 내 경로</Tab>
          <Tab $active={tab==='external'} onClick={()=>setTab('external')}>외부 열기</Tab>
        </Tabs>

        {tab==='inapp' && (
          <>
            <Grid>
              {/* 출발지 */}
              <Field>
                <Label>출발지</Label>
                <Row>
                  <Input placeholder="키워드로 검색 (예: 광주역)" value={oQuery} onChange={(e)=>setOQuery(e.target.value)} />
                  <Btn onClick={()=>doSearch('o')}>검색</Btn>
                </Row>
                <Row style={{marginTop:6,gap:6}}>
                  <Btn onClick={()=>setFromCurrent('o')}>현재 위치</Btn>
                  <Btn onClick={()=>setFromMapCenter('o')}>지도 중심</Btn>
                </Row>
                {origin && <Small>선택됨: {origin.name || origin.address || `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`}</Small>}
                {oResults.length>0 && (
                  <List>
                    {oResults.map((r,i)=>(
                      <Item key={i} onClick={()=>{ setOrigin(r); setOResults([]); }}>
                        <div style={{fontWeight:800}}>{r.name}</div>
                        <div style={{fontSize:'.9rem',color:'#666'}}>{r.address}</div>
                      </Item>
                    ))}
                  </List>
                )}
              </Field>

              {/* 도착지 */}
              <Field>
                <Label>도착지</Label>
                <Row>
                  <Input placeholder="키워드로 검색 (예: 스타벅스 상무치평점)" value={dQuery} onChange={(e)=>setDQuery(e.target.value)} />
                  <Btn onClick={()=>doSearch('d')}>검색</Btn>
                </Row>
                <Row style={{marginTop:6,gap:6}}>
                  <Btn onClick={()=>setFromCurrent('d')}>현재 위치</Btn>
                  <Btn onClick={()=>setFromMapCenter('d')}>지도 중심</Btn>
                </Row>
                {destination && <Small>선택됨: {destination.name || destination.address || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}</Small>}
                {dResults.length>0 && (
                  <List>
                    {dResults.map((r,i)=>(
                      <Item key={i} onClick={()=>{ setDestination(r); setDResults([]); }}>
                        <div style={{fontWeight:800}}>{r.name}</div>
                        <div style={{fontSize:'.9rem',color:'#666'}}>{r.address}</div>
                      </Item>
                    ))}
                  </List>
                )}
              </Field>
            </Grid>

            <Row style={{marginTop:10, alignItems:'center'}}>
              <Label style={{margin:0, minWidth:70}}>모드</Label>
              <select value={mode} onChange={(e)=>setMode(e.target.value as any)} style={{padding:'8px 10px', border:'1px solid #e7e7ea', borderRadius:10}}>
                <option value="DRIVING">자동차</option>
                <option value="WALKING">도보</option>
                <option value="TRANSIT">대중교통</option>
              </select>
              <div style={{flex:1}} />
              <PrimBtn onClick={drawInApp}>경로 그리기</PrimBtn>
            </Row>

            {err && <ErrorText>{err}</ErrorText>}
          </>
        )}

        {tab==='external' && (
          <>
            <Grid>
              <Field>
                <Label>출발지</Label>
                <Small>{origin ? (origin.name || origin.address || `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`) : '미선택'}</Small>
              </Field>
              <Field>
                <Label>도착지</Label>
                <Small>{destination ? (destination.name || destination.address || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`) : '미선택'}</Small>
              </Field>
            </Grid>

            <FootRow style={{marginTop:12}}>
              <Help>외부 지도 서비스로 열기</Help>
              <Row>
                <a href={links.kakao} target="_blank" rel="noreferrer"><Btn>카카오맵</Btn></a>
                <a href={links.google} target="_blank" rel="noreferrer"><Btn>구글지도</Btn></a>
              </Row>
            </FootRow>
          </>
        )}
      </Modal>
    </Backdrop>
  );
};

export default RoutePlannerDialog;
