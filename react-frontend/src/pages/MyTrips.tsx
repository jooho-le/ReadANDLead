import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchTripSummary, deleteTrip } from '../api/trips';
import { listNeighborPosts, NeighborPost } from '../api/neighbor';
import { me } from '../api/auth';
import { Link } from 'react-router-dom';
import RcIcon from '../components/RcIcon';
import { FaMapMarkedAlt, FaUsers } from 'react-icons/fa';

const Wrap = styled.div`max-width:1040px;margin:0 auto;   padding: 30px 20px 20px;

  @media (max-width: 900px) {
    padding: 70px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 70px 12px 12px;
  }`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;@media(max-width:900px){grid-template-columns:1fr;}`;
const Card = styled.div`border:1px solid #eee;background:#fff;border-radius:12px;padding:14px;color:inherit;`;
const Bar = styled.div<{p:number}>`height:8px;border-radius:6px;background:#eef2f7;overflow:hidden;>span{display:block;height:100%;width:${p=>p.p}%;background:#6366f1;}`;

const ChoiceGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:16px;@media(max-width:900px){grid-template-columns:1fr;}`;
const Choice = styled.button`
  border:1px solid #e5e7eb;background:#fff;border-radius:16px;padding:28px;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,.06);
  transition:.15s ease; &:hover{transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,.1);}
`;
const ChoiceIcon = styled.div`width:72px;height:72px;border-radius:9999px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-size:28px;`;
const BackBtn = styled.button`border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:6px 10px;margin-bottom:10px;cursor:pointer;`;

export default function MyTrips(){
  const [view, setView] = useState<'choose'|'trips'|'posts'>('choose');
  const [items, setItems] = useState<any[]>([]);
  const [posts, setPosts] = useState<NeighborPost[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(()=>{(async()=>{try{setItems(await fetchTripSummary());}catch{}})();},[]);
  useEffect(()=>{(async()=>{
    try{
      const profile=await me();
      setDisplayName(profile.display_name||profile.email);
      setIsLoggedIn(true);
    }catch{
      setIsLoggedIn(false);
      setDisplayName('');
      setPosts([]);
    }
  })();},[]);
  useEffect(()=>{(async()=>{
    if(isLoggedIn===false){
      setPosts([]);
      return;
    }
    if(isLoggedIn!==true||!displayName) return;
    try{
      const all=await listNeighborPosts();
      setPosts(all.filter(p=>p.author===displayName));
    }catch{
      setPosts([]);
    }
  })();},[displayName,isLoggedIn]);
  return (
    <Wrap>
      <h1 style={{fontWeight:800, fontSize:24, margin:'8px 0 8px'}}>마이페이지</h1>
      {view==='choose' && (
        <ChoiceGrid>
          <Choice onClick={()=>setView('trips')}>
            <ChoiceIcon><RcIcon icon={FaMapMarkedAlt} /></ChoiceIcon>
            <div style={{fontWeight:900, fontSize:20}}>나의 여행 · 여행 퀘스트북</div>
            <div style={{color:'#64748b', fontSize:14}}>진행 중인 코스와 인증 현황을 확인하고 이어서 진행하세요.</div>
          </Choice>
          <Choice onClick={()=>setView('posts')}>
            <ChoiceIcon><RcIcon icon={FaUsers} /></ChoiceIcon>
            <div style={{fontWeight:900, fontSize:20}}>내가 쓴 글 · 이웃의 책여행</div>
            <div style={{color:'#64748b', fontSize:14}}>내가 작성한 글을 모아 보고, 상세로 이동합니다.</div>
          </Choice>
        </ChoiceGrid>
      )}
      {view==='trips' && (
        <>
          <BackBtn onClick={()=>setView('choose')}>← 돌아가기</BackBtn>
        <Grid>
          {items.map(it => (
            <Card key={it.trip_id}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <Link to={`/diary/trip/${encodeURIComponent(it.trip_id)}/itinerary`} style={{fontWeight:800, textDecoration:'none', color:'inherit'}}>{it.book_title}</Link>
                <button
                  onClick={async ()=>{ if(!window.confirm('이 계획을 삭제할까요?')) return; await deleteTrip(it.trip_id); setItems(items.filter(x=>x.trip_id!==it.trip_id)); }}
                  style={{border:'1px solid #eee', background:'#fff', borderRadius:8, padding:'6px 10px', cursor:'pointer'}}
                >삭제</button>
              </div>
              <div style={{fontSize:12, color:'#64748b', marginBottom:6}}>{it.succeeded}/{it.total} 완료 ({it.percent}%)</div>
              <Bar p={it.percent}><span/></Bar>
              {it.proofs?.length>0 && (
                <div style={{display:'flex', gap:6, marginTop:8}}>
                  {it.proofs.slice(0,3).map((u:string, i:number)=> (
                    <img key={i} src={u} alt="proof" style={{width:72, height:48, objectFit:'cover', borderRadius:8, background:'#f3f4f6'}} />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </Grid>
        </>
      )}
      {view==='posts' && (
        <>
          <BackBtn onClick={()=>setView('choose')}>← 돌아가기</BackBtn>
          {isLoggedIn===false ? (
            <div style={{border:'1px solid #e5e7eb', background:'#fff', borderRadius:12, padding:24, color:'#64748b'}}>
              로그인 후 내가 쓴 글을 확인할 수 있어요.
            </div>
          ) : (
            <Grid>
            {posts.map(p => (
              <Card key={p.id}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <Link to={`/neighbors/${p.id}`} style={{fontWeight:800, textDecoration:'none', color:'inherit'}}>{p.title}</Link>
                  <span style={{fontSize:12, color:'#64748b'}}>{new Date(p.date).toLocaleDateString()}</span>
                </div>
                {p.cover && <img src={p.cover} alt="cover" style={{width:'100%', height:160, objectFit:'cover', borderRadius:8, marginTop:8}} />}
              </Card>
            ))}
            </Grid>
          )}
        </>
      )}
    </Wrap>
  );
}
