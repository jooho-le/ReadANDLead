import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { readDraft, clearDraft, removeDraftIndex, DraftStop } from '../../store/tripDraft';
import { me } from '../../api/auth';
import { persistPlan } from '../../api/trips';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (tripId: string) => void;
};

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.38);
  display:flex; align-items:center; justify-content:center; z-index: 1200;
`;
const Modal = styled.div`
  position: relative; width: 520px; max-width: min(96vw, 560px);
  max-height: 86vh; overflow:auto; background:#fff; border-radius:14px; padding:16px;
  box-shadow: 0 16px 40px rgba(0,0,0,.2);
`;
const Title = styled.h3`margin:0 0 8px;`;
const Close = styled.button`
  position:absolute; top:10px; right:10px; border:1px solid #e6e6e6; background:#fff; border-radius:8px; padding:6px 8px; cursor:pointer;
`;
const Row = styled.div`display:flex; gap:8px; align-items:center; margin:8px 0;`;
const Input = styled.input`flex:1; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px;`;
const Btn = styled.button`border:1px solid #e5e7eb; padding:10px 12px; border-radius:10px; background:#fff; cursor:pointer;`;
const Primary = styled.button`border:none; padding:12px 16px; border-radius:12px; background:#111; color:#fff; font-weight:800; cursor:pointer;`;
const List = styled.div`border:1px solid #eee; border-radius:10px; overflow:hidden;`;
const Item = styled.div`display:flex; gap:10px; align-items:flex-start; padding:10px 12px; border-bottom:1px solid #f3f3f3; &:last-child{border-bottom:0}`;
const Name = styled.div`font-weight:800;`;
const Sub = styled.div`color:#555; font-size:.92rem;`;
const Help = styled.div`color:#777; font-size:.92rem;`;
const Error = styled.div`color:#c00; background:#fff1f1; border:1px solid #ffdcdc; padding:8px; border-radius:8px; margin-top:8px;`;

function uuid(): string { return (crypto?.randomUUID?.() || (Date.now().toString(36)+Math.random().toString(36).slice(2,8))); }

const TripPlanModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [stops, setStops] = useState<DraftStop[]>([]);
  const [title, setTitle] = useState('나의 문학여행');
  const [theme, setTheme] = useState('문학여행');
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(()=>{
    if (!isOpen) return;
    setStops(readDraft());
    setErr(''); setLoading(false);
    (async()=>{
      try { await me(); setLoggedIn(true); } catch { setLoggedIn(false); }
    })();
  }, [isOpen]);

  async function save(){
    if (!loggedIn) { setErr('로그인(회원가입)이 필요합니다'); return; }
    if (!stops.length){ setErr('추가한 장소가 없습니다'); return; }
    setErr(''); setLoading(true);
    try{
      const tripId = uuid();
      const payload = {
        bookTitle: title,
        theme,
        days,
        stops: [
          { day: 1, stops: stops.map(s=>({ title: s.name, place: s.name, lat: s.lat, lng: s.lng, notes: s.addr })) }
        ],
      };
      await persistPlan(tripId, payload as any);
      clearDraft();
      onSaved?.(tripId);
      onClose();
    }catch(e:any){
      setErr(e?.message || '저장에 실패했습니다.');
    }finally{
      setLoading(false);
    }
  }

  if (!isOpen) return null;
  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e)=>e.stopPropagation()}>
        <Title>여행계획 생성</Title>
        <Close onClick={onClose}>✕</Close>

        {!loggedIn && (
          <Error>로그인(회원가입)이 필요합니다</Error>
        )}

        <Row>
          <Input placeholder="여행 제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </Row>
        <Row>
          <Input placeholder="테마(선택)" value={theme} onChange={(e)=>setTheme(e.target.value)} />
          <Input style={{maxWidth:120}} type="number" min={1} value={days} onChange={(e)=>setDays(parseInt(e.target.value||'1',10)||1)} />
        </Row>

        <Help style={{marginTop:6}}>지도에서 ‘일정에 추가’한 장소가 아래에 표시됩니다.</Help>
        <List style={{marginTop:8}}>
          {stops.length===0 && <div style={{padding:12, color:'#666'}}>추가한 장소가 없습니다.</div>}
          {stops.map((s, i)=>(
            <Item key={i}>
              <div style={{flex:1}}>
                <Name>{s.name}</Name>
                {s.addr && <Sub>{s.addr}</Sub>}
                {(s.lat!=null && s.lng!=null) && <Sub>{s.lat?.toFixed(5)}, {s.lng?.toFixed(5)}</Sub>}
              </div>
              <Btn onClick={()=>{ removeDraftIndex(i); setStops(readDraft()); }}>삭제</Btn>
            </Item>
          ))}
        </List>

        {err && <Error>{err}</Error>}

        <Row style={{justifyContent:'flex-end', marginTop:12}}>
          <Btn onClick={()=>{ clearDraft(); setStops([]); }}>계획 비우기</Btn>
          <Primary onClick={save} disabled={loading || !stops.length}>저장</Primary>
        </Row>
      </Modal>
    </Backdrop>
  );
}

export default TripPlanModal;

