import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { loadKakaoSdk } from '../../api/kakao';
import { loadGooglePlaces } from '../../api/googlePlaces';

type LatLng = { lat: number; lng: number };
type PlacePick = LatLng & { name?: string; address?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  map: any; // kakao.maps.Map
  defaultOrigin?: PlacePick | null;
  defaultDestination?: PlacePick | null;
};

const Wrap = styled.div<{ $open:boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 380px;
  max-width: calc(100vw - 20px);
  height: calc(100% - 20px);
  background: #fff;
  border: 1px solid #e9e9ef;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,.18);
  z-index: 50;
  transform: translateX(${p=>p.$open ? '0' : '420px'});
  transition: transform .25s ease;
  display: flex;
  flex-direction: column;
`;

const Head = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f6;
  display: flex; align-items: center; gap: 8px; justify-content: space-between;
`;
const Title = styled.div` font-weight: 800; `;
const CloseBtn = styled.button`
  border: none; background: transparent; font-size: 18px; cursor: pointer;
`;

const Body = styled.div` padding: 12px 14px; overflow: auto; flex: 1; `;
const Field = styled.div` display: grid; gap: 6px; margin-bottom: 10px; `;
const Label = styled.label` font-size: .9rem; color: #555; `;
const Row = styled.div` display: flex; gap: 6px; `;
const Input = styled.input` flex: 1; border: 1px solid #e5e7ec; border-radius: 10px; padding: 10px 12px; `;
const Btn = styled.button`
  border: 1px solid #e5e7ec; background: #fff; border-radius: 10px; padding: 10px 12px; cursor: pointer;
  &:hover{ background: #f7f7ff; }
`;
const Primary = styled(Btn)` background:#5B5FEA; color:#fff; border-color:#5B5FEA; font-weight: 800; `;
const Select = styled.select` border: 1px solid #e5e7ec; border-radius: 10px; padding: 10px 12px; `;

const Divider = styled.div` height: 1px; background: #f0f0f6; margin: 12px 0; `;
const ErrorText = styled.div` color:#c00; background:#fff1f1; border:1px solid #ffdcdc; padding:8px; border-radius:10px; `;
const Muted = styled.div` color:#777; font-size:.9rem; `;

const List = styled.ul` list-style:none; margin:8px 0 0; padding:0; border:1px solid #eee; border-radius:10px; max-height: 160px; overflow:auto; `;
const Item = styled.li`
  padding:8px 10px; cursor:pointer; border-bottom:1px solid #f3f3f3;
  &:hover{ background:#f7f7ff; } &:last-child{ border-bottom:none; }
`;

const Step = styled.div` padding: 8px 0; border-bottom: 1px dashed #eee; `;
const StepTitle = styled.div` font-weight: 700; `;
const StepMeta = styled.div` color: #666; font-size: .88rem; `;
const StepsWrap = styled.div` display: grid; gap: 8px; `;

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

function extLinks(o: PlacePick | null, d: PlacePick | null, mode: 'DRIVING'|'WALKING'|'TRANSIT'){
  const oC = o ? `${o.lat},${o.lng}` : '';
  const dC = d ? `${d.lat},${d.lng}` : '';
  const oN = encodeURIComponent(o?.name || '출발지');
  const dN = encodeURIComponent(d?.name || '도착지');
  const m = mode === 'DRIVING' ? 'car' : mode === 'WALKING' ? 'walk' : 'pubtrans';
  return {
    kakao:  `https://map.kakao.com/?sName=${oN}&sx=${o?.lng ?? ''}&sy=${o?.lat ?? ''}&eName=${dN}&ex=${d?.lng ?? ''}&ey=${d?.lat ?? ''}`,
    naver:  `https://map.naver.com/v5/directions/${o?.lng ?? ''},${o?.lat ?? ''},${oN}/-/${d?.lng ?? ''},${d?.lat ?? ''},${dN}/-/${m}`,
    google: `https://www.google.com/maps/dir/?api=1&origin=${oC}&destination=${dC}&travelmode=${mode.toLowerCase()}`,
  };
}

const RouteSidebar: React.FC<Props> = ({ open, onClose, map, defaultOrigin=null, defaultDestination=null }) => {
  const [mode, setMode] = useState<'DRIVING'|'WALKING'|'TRANSIT'>('DRIVING');

  const [origin, setOrigin] = useState<PlacePick | null>(defaultOrigin);
  const [destination, setDestination] = useState<PlacePick | null>(defaultDestination);

  const [oQuery, setOQuery] = useState(''); const [dQuery, setDQuery] = useState('');
  const [oResults, setOResults] = useState<PlacePick[]>([]); const [dResults, setDResults] = useState<PlacePick[]>([]);
  const [err, setErr] = useState('');

  const polylineRef = useRef<any>(null);
  const [steps, setSteps] = useState<Array<{ html: string; dist?: string; dur?: string }>>([]);
  const [summary, setSummary] = useState<{ distance?: string; duration?: string } | null>(null);

  useEffect(()=>{
    if(!open) return;
    setErr('');
    setOQuery(''); setDQuery('');
    setOResults([]); setDResults([]);
    setSteps([]); setSummary(null);
    setOrigin(defaultOrigin ?? null);
    setDestination(defaultDestination ?? null);
  }, [open, defaultOrigin, defaultDestination]);

  useEffect(()=>{
    if (open) return;
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
  }, [open]);

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

  // Google Directions → steps + polyline on Kakao
  async function draw(){
    try{
      setErr('');
      setSteps([]); setSummary(null);
      if (!origin || !destination) { setErr('출발지와 도착지를 모두 선택해주세요.'); return; }

      await loadGooglePlaces(); // Google Maps JS
      await loadKakaoSdk();

      const google: any = (window as any).google;
      const kakaoAny: any = (window as any).kakao;

      const route = await new Promise<any>((resolve, reject)=>{
        const svc = new google.maps.DirectionsService();
        svc.route({
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: mode,
          provideRouteAlternatives: false,
        }, (res: any, status: any) => {
          if (status !== 'OK' || !res?.routes?.length) {
            const m = status === 'ZERO_RESULTS'
              ? '해당 모드로 경로를 찾지 못했습니다. 다른 모드로 시도하거나 외부 길찾기를 이용하세요.'
              : `경로 오류: ${status}`;
            return reject(new Error(m));
          }
          resolve(res.routes[0]);
        });
      });

      // 폴리라인
      const path = (route.overview_path || []).map((p:any)=> new kakaoAny.maps.LatLng(p.lat(), p.lng()));
      if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
      polylineRef.current = new kakaoAny.maps.Polyline({
        map, path, strokeWeight: 5, strokeColor: '#5B5FEA', strokeOpacity: 0.95, strokeStyle: 'solid',
      });
      if (path.length) {
        const bounds = new kakaoAny.maps.LatLngBounds();
        path.forEach((ll:any)=>bounds.extend(ll));
        map.setBounds(bounds);
      }

      // 단계별 안내 + 합계
      const legs = route.legs || [];
      const s: Array<{ html: string; dist?: string; dur?: string }> = [];
      let totalDist = 0, totalDur = 0;
      legs.forEach((leg:any)=>{
        totalDist += leg.distance?.value || 0;
        totalDur += leg.duration?.value || 0;
        (leg.steps || []).forEach((st:any)=>{
          const html = st.instructions || st.html_instructions || '';
          s.push({
            html,
            dist: st.distance?.text,
            dur: st.duration?.text,
          });
        });
      });
      setSteps(s);
      const distTxt = totalDist ? (totalDist/1000).toFixed(1) + ' km' : undefined;
      const durTxt = totalDur ? Math.round(totalDur/60) + '분' : undefined;
      setSummary({ distance: distTxt, duration: durTxt });

    }catch(e:any){
      setErr(e?.message || '경로 계산에 실패했습니다.');
    }
  }

  const links = useMemo(()=>extLinks(origin, destination, mode), [origin, destination, mode]);

  return (
    <Wrap $open={open}>
      <Head>
        <Title>길찾기</Title>
        <CloseBtn onClick={onClose}>✕</CloseBtn>
      </Head>
      <Body>
        <Field>
          <Label>모드</Label>
          <Row>
            <Select value={mode} onChange={(e)=>setMode(e.target.value as any)}>
              <option value="DRIVING">자동차</option>
              <option value="WALKING">도보</option>
              <option value="TRANSIT">대중교통</option>
            </Select>
            <Primary onClick={draw}>경로 그리기</Primary>
          </Row>
        </Field>

        <Field>
          <Label>출발지</Label>
          <Row>
            <Input placeholder="키워드 (예: 광주역 / 주소)"
                   value={oQuery} onChange={(e)=>setOQuery(e.target.value)} />
            <Btn onClick={()=>doSearch('o')}>검색</Btn>
          </Row>
          <Row style={{marginTop:6, gap:6}}>
            <Btn onClick={()=>setFromCurrent('o')}>현재 위치</Btn>
            <Btn onClick={()=>setFromMapCenter('o')}>지도 중심</Btn>
          </Row>
          {origin && <Muted style={{marginTop:6}}>선택됨: {origin.name || origin.address || `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`}</Muted>}
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

        <Field>
          <Label>도착지</Label>
          <Row>
            <Input placeholder="키워드 (예: 스타벅스 상무치평점 / 주소)"
                   value={dQuery} onChange={(e)=>setDQuery(e.target.value)} />
            <Btn onClick={()=>doSearch('d')}>검색</Btn>
          </Row>
          <Row style={{marginTop:6, gap:6}}>
            <Btn onClick={()=>setFromCurrent('d')}>현재 위치</Btn>
            <Btn onClick={()=>setFromMapCenter('d')}>지도 중심</Btn>
          </Row>
          {destination && <Muted style={{marginTop:6}}>선택됨: {destination.name || destination.address || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}</Muted>}
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

        {err && <ErrorText>{err}</ErrorText>}

        <Divider />

        {/* 요약 */}
        {summary && (summary.distance || summary.duration) && (
          <div style={{marginBottom:8}}>
            <b>요약</b>
            <div style={{marginTop:4, color:'#444'}}>
              {summary.distance ? `거리 ${summary.distance}` : ''} {summary.duration ? `• 시간 ${summary.duration}` : ''}
            </div>
          </div>
        )}

        {/* 단계별 안내 */}
        <div>
          <b>단계별 안내</b>
          {steps.length === 0 ? (
            <Muted style={{marginTop:6}}>
              경로를 그리면 여기 단계별 안내가 표시됩니다. (대중교통은 지역에 따라 Google 데이터가 제한될 수 있어요)
            </Muted>
          ) : (
            <StepsWrap style={{marginTop:6}}>
              {steps.map((s, idx)=>(
                <Step key={idx}>
                  <StepTitle dangerouslySetInnerHTML={{__html: s.html}} />
                  <StepMeta>{[s.dist, s.dur].filter(Boolean).join(' · ')}</StepMeta>
                </Step>
              ))}
            </StepsWrap>
          )}
        </div>

        <Divider />

        {/* 외부 열기 */}
        <div>
          <b>외부 길찾기</b>
          <Row style={{marginTop:6}}>
            <a href={links.kakao} target="_blank" rel="noreferrer"><Btn>카카오맵</Btn></a>
            <a href={links.naver} target="_blank" rel="noreferrer"><Btn>네이버지도</Btn></a>
            <a href={links.google} target="_blank" rel="noreferrer"><Btn>구글지도</Btn></a>
            <div style={{flex:1}} />
            <Btn onClick={onClose}>닫기</Btn>
          </Row>
        </div>
      </Body>
    </Wrap>
  );
};

export default RouteSidebar;
