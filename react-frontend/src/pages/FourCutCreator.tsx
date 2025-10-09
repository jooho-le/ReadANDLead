import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { composeFourCut, blobToDataUrl, FourCutTemplate } from '../utils/canvas';
import { fetchRecommendedQuotes, Quote } from '../services/api';

type LocalPhoto = { id: string; file?: File; url: string; imgEl?: HTMLImageElement; };

const Page = styled.div`
  min-height: 100vh; padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Container = styled.div`
  max-width: 85%; margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 8px;
  text-shadow: 0 8px 24px rgba(0,0,0,0.15);
`;
const Subtitle = styled.p` color: rgba(255,255,255,0.9); margin-bottom: 24px; `;

const Grid = styled.div`
  display: grid; grid-template-columns: 1fr 2fr; gap: 16px;
  @media (max-width: 900px){ grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #fff; border: 1px solid #eef2f7; border-radius: 16px; padding: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
`;

const SectionTitle = styled.h2` font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; `;
const Input = styled.input`
  width: 100%;   max-width: 420px;  padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px;
  box-sizing: border-box; 
  &:focus{ outline: none; border-color: #667eea;}
`;
const Textarea = styled.textarea`
  width: 100%;   max-width: 420px; padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px; min-height: 80px;
  box-sizing: border-box; 
  &:focus{ outline: none; border-color: #667eea;}
`;
const Select = styled.select`
  width: 100%;   max-width: 420px; padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px;
  &:focus{ outline: none; border-color: #667eea; }
`;
const Button = styled.button<{variant?: 'primary'|'ghost'}>`
  padding: 12px 16px; border-radius: 10px; font-weight: 700;
  background: ${p=>p.variant==='primary'?'#111827':'transparent'};
  color: ${p=>p.variant==='primary'?'#fff':'#111827'};
  border: 2px solid #e5e7eb;
  &:disabled{ opacity: .5; cursor: not-allowed; }
`;

const Thumb = styled.img` width: 100%; height: 80px; object-fit: cover; border-radius: 10px; `;
const Preview = styled.img`
  width: 100%;
  max-width: 480px;
  aspect-ratio: 9/16;
  object-fit: contain;
  background: #fafafa;
  border-radius: 16px;
  display: block;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

const TemplateGroup = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; `;
const TemplateBtn = styled.button<{active?: boolean}>`
  padding: 10px; border-radius: 10px; border: 2px solid ${p=>p.active?'#111827':'#e5e7eb'};
  background: #fff; font-weight: 600;
`;

const Row = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; `;

const templates: { key: FourCutTemplate; label: string }[] = [
  { key: '2x2', label: '2x2 네컷' },
  { key: 'strip', label: '세로 스트립' },
  { key: 'polaroid', label: '폴라로이드' },
];

export default function FourCutCreator() {
  const [quoteList, setQuoteList] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [manualQuote, setManualQuote] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [locationName, setLocationName] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [template, setTemplate] = useState<FourCutTemplate>('2x2');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => { fetchRecommendedQuotes({}).then(setQuoteList); }, []);

  const generatedHashtags = useMemo(() => {
    const base = ['문학여행','인생네컷','감성여행',
      ...(bookTitle ? [bookTitle.replace(/\s+/g,'')] : []),
      ...(locationName ? [locationName.replace(/\s+/g,'')] : [])
    ];
    return Array.from(new Set([...base, ...hashtags.map(h=>h.replace(/^#/,''))])).map(h => `#${h}`);
  }, [bookTitle, locationName, hashtags]);

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const list: LocalPhoto[] = [];
    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      list.push({ id: `${Date.now()}_${idx}`, file, url });
    });
    setPhotos(prev => [...prev, ...list].slice(0,4));
  };

  const doCompose = async () => {
    setLoading(true);
    try {
      const imgEls = await Promise.all(photos.map(p => loadImage(p.url)));
      const quoteText = manualQuote.trim() || quote?.text || '여행엔 이야기가 필요해';
      const blob = await composeFourCut({
        width: 1080, height: 1920, background: '#fff',
        quoteText, bookTitle: bookTitle || quote?.bookTitle, author: author || quote?.author,
        photos: imgEls, template, accentColor: '#111827', watermark: 'Literary Trip',
      });
      const dataUrl = await blobToDataUrl(blob);
      setPreviewUrl(dataUrl);
    } finally { setLoading(false); }
  };

  const onDownload = () => { if (previewUrl) downloadRef.current?.click(); };

  const onShare = async () => {
    if (!previewUrl) return;
    try {
      const resp = await fetch(previewUrl); const blob = await resp.blob();
      const file = new File([blob], 'literary-trip.png', { type: 'image/png' });
      const share = (navigator as any).share, canShare = (navigator as any).canShare;
      if (share && canShare?.({ files:[file] })) {
        await share({ title: '문학 여행', text: `${(manualQuote || quote?.text || '').slice(0,80)} ${generatedHashtags.join(' ')}`, files: [file] });
      } else {
        onDownload(); alert('공유 미지원 브라우저입니다. 이미지를 저장한 뒤 Instagram/블로그에서 업로드하세요.');
      }
    } catch { onDownload(); }
  };

  return (
    <Page>
      <Container>
        <Title>인생네컷 문학 여행 생성기</Title>
        <Subtitle>상단은 문장, 하단은 여행 사진을 조합해 SNS용 이미지를 만듭니다.</Subtitle>

        <Grid>
          {/* 좌측 패널 */}
          <Card>
            <SectionTitle>문장 선택</SectionTitle>
            <Select value={quote?.id || ''} onChange={e => {
              const q = quoteList.find(x=>x.id===e.target.value) || null;
              setQuote(q); setManualQuote(''); setBookTitle(q?.bookTitle || ''); setAuthor(q?.author || '');
            }}>
              <option value="">추천 문장 선택…</option>
              {quoteList.map(q => <option key={q.id} value={q.id}>{q.text.slice(0, 24)}{q.text.length>24?'…':''} / {q.bookTitle || '무제'}</option>)}
            </Select>

            <div style={{height:8}} />
            <Textarea placeholder="직접 문장을 입력하세요" value={manualQuote} onChange={e=>setManualQuote(e.target.value)}/>
            <div style={{height:8}} />
            <Row>
              <Input placeholder="책 제목" value={bookTitle} onChange={e=>setBookTitle(e.target.value)}
                 style={{ width: '90%' }} />
              <Input placeholder="저자" value={author} onChange={e=>setAuthor(e.target.value)}
                 style={{ width: '90%' }}/>
            </Row>

            <div style={{height:16}} />
            <SectionTitle>사진 선택 (최대 4장)</SectionTitle>
            <Input as="input" type="file" accept="image/*" multiple onChange={e=>onPickPhotos((e.target as HTMLInputElement).files)}/>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:8}}>
              {photos.map(p=>(
                <div key={p.id} style={{position:'relative'}}>
                  <Thumb src={p.url} alt="" />
                  <button onClick={()=>setPhotos(prev=>prev.filter(x=>x.id!==p.id))}
                          style={{position:'absolute',right:-6,top:-6, background:'#000', color:'#fff', borderRadius:999, padding:'2px 6px', fontSize:12}}>✕</button>
                </div>
              ))}
            </div>

            <div style={{height:16}} />
            <SectionTitle>템플릿</SectionTitle>
            <TemplateGroup>
              {templates.map(t => (
                <TemplateBtn key={t.key} active={template===t.key} onClick={()=>setTemplate(t.key)}>
                  {t.label}
                </TemplateBtn>
              ))}
            </TemplateGroup>

            <div style={{height:16}} />
            <SectionTitle>메타 & 해시태그</SectionTitle>
            <Input placeholder="촬영 장소" value={locationName} onChange={e=>setLocationName(e.target.value)}/>
            <div style={{height:8}} />
            <Input placeholder="#태그1 #태그2 (공백/쉼표 구분)" onBlur={(e)=>setHashtags((e.target as HTMLInputElement).value.split(/[\s,]+/).filter(Boolean))}/>
            <p style={{fontSize:12, color:'#6b7280', marginTop:8}}>자동 해시태그: {generatedHashtags.join(' ')}</p>
          </Card>

          {/* 우측 패널 */}
          <Card>
            <SectionTitle>미리보기</SectionTitle>
            {previewUrl ? (
              <Preview src={previewUrl} alt="preview" />
            ) : (
              <div style={{height:400, border:'2px dashed #e5e7eb', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>
                합성 결과가 여기 표시됩니다.
              </div>
            )}
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <Button onClick={doCompose} disabled={loading || photos.length===0} variant="primary">{loading?'생성 중…':'이미지 생성'}</Button>
              <Button onClick={onShare} disabled={!previewUrl}>공유하기</Button>
              <Button onClick={onDownload} disabled={!previewUrl}>다운로드</Button>
              <a ref={downloadRef} href={previewUrl || '#'} download="literary-trip.png" style={{display:'none'}}>download</a>
            </div>
            <p style={{fontSize:12, color:'#6b7280', marginTop:8}}>
              Instagram은 브라우저에서 자동 업로드가 불가합니다. 이미지를 저장한 뒤 앱에서 업로드하세요.
            </p>
          </Card>
        </Grid>
      </Container>
    </Page>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
}
