import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { listAgencyTrips, type AgencyTrip } from '../api/agency';

const Wrap = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 50px 20px 20px;
  
  @media (max-width: 768px) {
    padding: 40px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 32px 12px 12px;
  }
`;
const Back = styled(Link)`
  display: inline-block;
  margin-bottom: 12px;
  text-decoration: none;
  color: #667eea;
`;
const Card = styled.article`
  border: 1px solid #eee;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
`;
const Thumb = styled.img`
  width: 100%;
  height: 220px;
  object-fit: cover;
  background: #f2f3f5;
`;
const Body = styled.div`
  padding: 16px;
`;
const Title = styled.h2`
  margin: 0 0 8px;
`;
const Meta = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
`;
const Para = styled.p`
  margin: 6px 0;
  color: #333;
`;
const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
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
const CloseBtn = styled.button`
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
`;

export default function AgencyTripDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState<AgencyTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneOpen, setPhoneOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listAgencyTrips();
        const t = list.find((x) => x.id === id) || null;
        if (alive) setTrip(t);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Wrap>불러오는 중…</Wrap>;
  if (!trip) return <Wrap>항목을 찾을 수 없습니다. <Back to="/agency-trips">목록으로</Back></Wrap>;

  return (
    <Wrap>
      <Back to="/agency-trips">← 목록으로</Back>
      <Card>
        {trip.cover && <Thumb src={trip.cover} alt={trip.title} />}
        <Body>
          <Title>{trip.title}</Title>
          <Meta>주최: {trip.operator}{trip.phone ? ` · 문의 ${trip.phone}` : ''}</Meta>
          {trip.intro && <Para>{trip.intro}</Para>}
          {trip.author_note && <Para>{trip.author_note}</Para>}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <Para>코스 예시: {trip.itinerary.join(' – ')}</Para>
          )}
          <Actions>
            {trip.link && <A href={trip.link} target="_blank" rel="noreferrer">페이지 바로가기</A>}
            {trip.phone && <PhoneBtn onClick={() => setPhoneOpen(true)}>전화번호</PhoneBtn>}
          </Actions>
        </Body>
      </Card>

      {phoneOpen && (
        <Backdrop onClick={() => setPhoneOpen(false)}>
          <Dialog onClick={(e)=>e.stopPropagation()}>
            <DialogTitle>전화번호</DialogTitle>
            <Para style={{marginTop:4, fontWeight:700}}>{trip.phone}</Para>
            <Actions>
              {trip.phone && (
                <A href={`tel:${trip.phone.replace(/[^0-9]/g,'')}`}>전화 걸기</A>
              )}
              <CloseBtn onClick={() => setPhoneOpen(false)}>닫기</CloseBtn>
            </Actions>
          </Dialog>
        </Backdrop>
      )}
    </Wrap>
  );
}

