import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { saveScrapItem } from '../services/api';

type Scrap = {
  id: string;
  photoUrl: string;
  locationName?: string;
  quoteText?: string;
  comment?: string;
  bookTitle?: string;
  author?: string;
  hashtags?: string[];
  createdAt: string;
};

const STORAGE_KEY = 'literary_trip_scraps_v1';

const Page = styled.div`
  min-height: 100vh; padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;
const Container = styled.div` max-width: 1200px; margin: 0 auto; `;
const Title = styled.h1` font-size: 2rem; font-weight: 800; color:#fff; margin-bottom: 8px; `;
const Subtitle = styled.p` color: rgba(255,255,255,0.9); margin-bottom: 24px; `;
const Grid = styled.div` display: grid; grid-template-columns: 1fr 2fr; gap: 16px; @media(max-width:900px){ grid-template-columns:1fr; }`;
const Card = styled.div` background:#fff; border:1px solid #eef2f7; border-radius:16px; padding:16px; box-shadow:0 6px 20px rgba(0,0,0,0.06); `;
const SectionTitle = styled.h2` font-size: 1.1rem; font-weight:700; margin-bottom: 10px; `;
const Input = styled.input` width:100%; padding:12px 14px; border:2px solid #e1e5e9; border-radius:10px; &:focus{ outline:none; border-color:#667eea; }`;
const Textarea = styled.textarea` width:100%; padding:12px 14px; border:2px solid #e1e5e9; border-radius:10px; min-height:80px; &:focus{ outline:none; border-color:#667eea; }`;
const Button = styled.button<{primary?: boolean}>`
  padding: 12px 16px; border-radius: 10px; font-weight: 700; border:2px solid #e5e7eb;
  background: ${p=>p.primary?'#111827':'transparent'}; color: ${p=>p.primary?'#fff':'#111827'};
  &:disabled{ opacity: .5; cursor: not-allowed; }
`;
const Thumb = styled.img` width:100%; height:112px; object-fit:cover; border-radius: 12px; `;
const List = styled.div` display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; @media(max-width:1100px){ grid-template-columns: repeat(2,1fr); } @media(max-width:700px){ grid-template-columns: 1fr; }`;
const Item = styled.article` border:1px solid #eef2f7; border-radius:16px; overflow:hidden; background:#fff; box-shadow:0 6px 20px rgba(0,0,0,0.05); `;
const ItemBody = styled.div` padding:12px; `;
const Meta = styled.div` font-size:12px; color:#6b7280; `;

export default function LiteraryTripScrap() {
  const [items, setItems] = useState<Scrap[]>([]);
  const [adding, setAdding] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [comment, setComment] = useState('');
  const [locationName, setLocationName] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [hashtagsRaw, setHashtagsRaw] = useState('');

  useEffect(() => { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const hashtags = useMemo(() => hashtagsRaw.split(/[\s,]+/).filter(Boolean).map(h=>h.replace(/^#/,'')), [hashtagsRaw]);

  const addItem = async () => {
    if (!photoUrl) { alert('사진을 선택하세요'); return; }
    setAdding(true);
    const item: Scrap = { id: `${Date.now()}`, photoUrl, locationName, quoteText, comment, bookTitle, author, hashtags, createdAt: new Date().toISOString() };
    setItems(prev => [item, ...prev]); await saveScrapItem(item); resetForm(); setAdding(false);
  };

  const resetForm = () => { setPhotoUrl(''); setQuoteText(''); setComment(''); setLocationName(''); setBookTitle(''); setAuthor(''); setHashtagsRaw(''); };

  const onPickPhoto = (fl: FileList | null) => { if (!fl || !fl[0]) return; const url = URL.createObjectURL(fl[0]); setPhotoUrl(url); };

  const onShare = async (it: Scrap) => {
    try {
      const resp = await fetch(it.photoUrl); const blob = await resp.blob();
      const file = new File([blob], 'scrap.png', { type: 'image/png' });
      const text = [ it.quoteText ? `“${it.quoteText}”` : '', it.comment || '', [it.bookTitle, it.author].filter(Boolean).join(' · '), it.locationName ? `@${it.locationName}` : '', ...(it.hashtags?.map(h=>`#${h}`) || []) ].filter(Boolean).join('\n');
      const share = (navigator as any).share, canShare = (navigator as any).canShare;
      if (share && canShare?.({ files:[file] })) { await share({ title:'문학 여행 스크랩', text, files:[file] }); }
      else { alert('공유 미지원 브라우저입니다. 이미지를 저장한 뒤 SNS로 업로드하세요.'); }
    } catch (e) { console.error(e); }
  };

  return (
    <Page>
      <Container>
        <Title>문학 여행 스크랩</Title>
        <Subtitle>사진/위치/문장/코멘트를 저장해서 나만의 앨범을 만들고 공유하세요.</Subtitle>

        <Grid>
          {/* 입력 */}
          <Card>
            <SectionTitle>새 스크랩 추가</SectionTitle>
            <div style={{display:'grid', gap:8}}>
              <div>
                <Input as="input" type="file" accept="image/*" onChange={e=>onPickPhoto((e.target as HTMLInputElement).files)} />
                {photoUrl && <Thumb src={photoUrl} alt="" style={{marginTop:8}} />}
              </div>
              <Input placeholder="촬영 장소(선택)" value={locationName} onChange={e=>setLocationName(e.target.value)} />
              <Input placeholder="책 제목(선택)" value={bookTitle} onChange={e=>setBookTitle(e.target.value)} />
              <Input placeholder="저자(선택)" value={author} onChange={e=>setAuthor(e.target.value)} />
              <Textarea placeholder="명대사/문장(선택)" value={quoteText} onChange={e=>setQuoteText(e.target.value)} />
              <Textarea placeholder="코멘트(선택)" value={comment} onChange={e=>setComment(e.target.value)} />
              <Input placeholder="#태그1 #태그2 (공백/쉼표 구분)" value={hashtagsRaw} onChange={e=>setHashtagsRaw(e.target.value)} />
              <Button onClick={addItem} disabled={adding} primary>{adding?'추가 중…':'스크랩 저장'}</Button>
              <p style={{fontSize:12, color:'#6b7280'}}>※ 백엔드 연동 시 자동 저장/동기화가 가능합니다. (현재는 로컬 저장)</p>
            </div>
          </Card>

          {/* 리스트 */}
          <Card>
            <SectionTitle>나의 스크랩</SectionTitle>
            {items.length ? (
              <List>
                {items.map(it=>(
                  <Item key={it.id}>
                    <img src={it.photoUrl} alt="" style={{width:'100%', height:160, objectFit:'cover'}} />
                    <ItemBody>
                      {it.quoteText && <p style={{fontSize:14, marginBottom:4}}>“{it.quoteText}”</p>}
                      {it.comment && <p style={{fontSize:14, color:'#374151', marginBottom:4}}>{it.comment}</p>}
                      <Meta>{[it.bookTitle, it.author].filter(Boolean).join(' · ')}{it.locationName ? ` · @${it.locationName}`:''}</Meta>
                      {it.hashtags?.length ? <div style={{fontSize:12, color:'#9ca3af', marginTop:4}}>{it.hashtags.map(h=>`#${h}`).join(' ')}</div> : null}
                      <div style={{display:'flex', gap:8, marginTop:10}}>
                        <Button onClick={()=>onShare(it)}>공유</Button>
                        <Button onClick={()=>setItems(prev=>prev.filter(x=>x.id!==it.id))}>삭제</Button>
                      </div>
                    </ItemBody>
                  </Item>
                ))}
              </List>
            ) : (
              <div style={{height:300, border:'2px dashed #e5e7eb', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>
                아직 스크랩이 없습니다. 좌측에서 새로 추가해 보세요.
              </div>
            )}
          </Card>
        </Grid>
      </Container>
    </Page>
  );
}
