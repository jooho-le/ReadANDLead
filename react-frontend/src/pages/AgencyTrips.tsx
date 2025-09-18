import React from 'react';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAgencyTrips, type AgencyTrip } from '../api/agency';

// 이웃 페이지 카드 스타일과 유사하게 구성
const Wrap = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 50px 20px 20px;
  
  @media (max-width: 768px) {
    padding: 40px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 32px 12px 12px;
  }
`;
const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;
const H1 = styled.h1`
  margin: 0;
  font-weight: 800;
  font-size: 24px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const Card = styled(Link)`
  display: block;
  border: 1px solid #eee;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow .15s ease;
  &:hover { box-shadow: 0 10px 24px rgba(0,0,0,.08); }
`;
const Thumb = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: #f2f3f5;
`;
const Body = styled.div`
  padding: 14px;
`;
const Title = styled.h3`
  margin: 0 0 6px;
  font-weight: 800;
`;
const Meta = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
`;
const Para = styled.p`
  margin: 6px 0;
  color: #333;
  line-height: 1.45;
`;
const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;
const A = styled.a`
  border: 1px solid #ddd;
  padding: 8px 10px;
  border-radius: 10px;
  color: #111;
  text-decoration: none;
  background: #fff;
`;

const PhoneBtn = styled.button`
  border: 1px solid #ddd;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const Dialog = styled.div`
  width: min(90vw, 360px);
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,.2);
`;
const DialogTitle = styled.h3`
  margin: 0 0 6px;
`;
const DialogRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
`;
const CloseBtn = styled.button`
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
`;

export default function AgencyTrips() {
  const [items, setItems] = useState<AgencyTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneOpen, setPhoneOpen] = useState<{open: boolean; phone?: string}>({open:false});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await listAgencyTrips();
        if (alive) setItems(r || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Wrap>
      <Head>
        <H1>관광사와 책여행 떠나기</H1>
      </Head>
      {loading ? (
        <div>불러오는 중…</div>
      ) : (
        <Grid>
          {items.map((s) => (
            <Card key={s.id} to={`/agency-trips/${encodeURIComponent(s.id)}`}>
              {s.cover && (
                <Thumb src={s.cover} alt={s.title} />
              )}
              <Body>
                <Title>{s.title}</Title>
                <Meta>주최: {s.operator}</Meta>
              </Body>
            </Card>
          ))}
        </Grid>
      )}

      {phoneOpen.open && (
        <Backdrop onClick={()=>setPhoneOpen({open:false})}>
          <Dialog onClick={(e)=>e.stopPropagation()}>
            <DialogTitle>전화번호</DialogTitle>
            <Para style={{marginTop:4, fontWeight:700}}>{phoneOpen.phone}</Para>
            <Actions>
              {phoneOpen.phone && (
                <A href={`tel:${(phoneOpen.phone||'').replace(/[^0-9]/g,'')}`}>전화 걸기</A>
              )}
              <CloseBtn onClick={()=>setPhoneOpen({open:false})}>닫기</CloseBtn>
            </Actions>
          </Dialog>
        </Backdrop>
      )}
    </Wrap>
  );
}
