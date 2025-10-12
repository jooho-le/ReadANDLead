// FourCutCreator.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { composeFourCut, blobToDataUrl, FourCutTemplate } from '../utils/canvas';
import { fetchRecommendedQuotes, Quote } from '../services/api';

type LocalPhoto = { id: string; file?: File; url: string; imgEl?: HTMLImageElement; };

const REQUIRED_PHOTO_COUNT = 4;

// 해시태그 제한
const MAX_HASHTAG_LEN = 30;     // 각 태그 최대 글자 수
const MAX_USER_HASHTAGS = 60;   // 사용자 입력 상한(2줄 맞춤 전에 1차 컷)
const FOOTER_MAX_LINES = 3;     // 최종 2줄 제한

// 캔버스/측정 기준
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const CANVAS_PADDING = 48;
const FOOTER_BASE_FONT = 26;
const FOOTER_MIN_FONT  = 20;
const FOOTER_LH_FACTOR = 1.23;
const FOOTER_INNER_W   = CANVAS_W - CANVAS_PADDING * 2;

const Page = styled.div`
  min-height: 100vh; padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Container = styled.div` max-width: 85%; margin: 0 auto; `;

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
  width: 100%; max-width: 420px; padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px;
  box-sizing: border-box;
  &:focus{ outline: none; border-color: #667eea;}
`;
const Textarea = styled.textarea`
  width: 100%; max-width: 420px; padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px; min-height: 80px;
  box-sizing: border-box;
  &:focus{ outline: none; border-color: #667eea;}
`;
const Select = styled.select`
  width: 100%; max-width: 420px; padding: 12px 14px; border: 2px solid #e1e5e9; border-radius: 10px;
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
  { key: '2x2', label: '네컷 사진' },
  { key: 'strip', label: '세로 스트립' },
];

export default function FourCutCreator() {
  const [quoteList, setQuoteList] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [manualQuote, setManualQuote] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [locationName, setLocationName] = useState('');
  const [userTags, setUserTags] = useState<string[]>([]);

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [template, setTemplate] = useState<FourCutTemplate>('2x2');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const photoSectionRef = useRef<HTMLDivElement>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // 해시태그 입력창/에러/최종 적용 태그
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [finalTags, setFinalTags] = useState<string[]>([]); // ★ 캔버스 전달용(베이스+사용자, 2줄에 맞춰 트리밍된 결과)

  useEffect(() => { fetchRecommendedQuotes({}).then(setQuoteList); }, []);

  /* ===============================
     사진 업로드/제거
  ================================== */
  const onPickPhotos = (files: FileList | null) => {
    if (!files) return;
    const list: LocalPhoto[] = [];
    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      list.push({ id: `${Date.now()}_${idx}`, file, url });
    });
    setPhotos(prev => {
      const merged = [...prev, ...list].slice(0, REQUIRED_PHOTO_COUNT);
      if (merged.length === REQUIRED_PHOTO_COUNT && photoError) setPhotoError('');
      return merged;
    });
  };
  const removePhoto = (id: string) => setPhotos(prev => prev.filter(x => x.id !== id));

  /* ===============================
     해시태그 측정용 캔버스 컨텍스트
  ================================== */
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  function getMeasureCtx() {
    if (!measureCtxRef.current) {
      const cvs = document.createElement('canvas');
      measureCtxRef.current = cvs.getContext('2d');
    }
    return measureCtxRef.current!;
  }
  function wrapForWidth(ctx: CanvasRenderingContext2D, text: string, fontPx: number, maxWidth: number, maxLines: number) {
    ctx.font = `500 ${fontPx}px Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (line) lines.push(line);
        if (lines.length >= maxLines - 1) {
          let rest = w;
          while (ctx.measureText(rest + ' …').width > maxWidth && rest.length > 0) rest = rest.slice(0, -1);
          lines.push(rest + ' …');
          return { lines, overflow: true };
        }
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return { lines, overflow: lines.length > maxLines };
  }

  /* ===============================
     핵심: 베이스+사용자 태그를 2줄에 맞춰 트리밍
     - 베이스: 문학여행/인생네컷/감성여행/책제목/촬영장소 (촬영장소 포함!)
     - 사용자: 입력 태그
  ================================== */
  function recomputeFinalTags(rawInput: string, bookTitleStr: string, locationStr: string) {
    setTagInput(rawInput);

    // 1) 사용자 입력 → 토큰화(+글자수 컷)
    let userTokens = rawInput
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .map(t => t.slice(0, MAX_HASHTAG_LEN));

    const tooLongRaw = rawInput
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .filter(t => t.length > MAX_HASHTAG_LEN);

    if (userTokens.length > MAX_USER_HASHTAGS) {
      userTokens = userTokens.slice(0, MAX_USER_HASHTAGS);
    }

    // 2) 베이스 태그(촬영장소/책제목 포함) 구성 + 글자수 컷
    const baseTokensRaw = [
      '문학여행', '인생네컷', '감성여행',
      ...(bookTitleStr ? [bookTitleStr.replace(/\s+/g,'')] : []),
      ...(locationStr ? [locationStr.replace(/\s+/g,'')] : []), // ★ 촬영장소 반영
    ].filter(Boolean);
    const baseTokens = baseTokensRaw.map(t => t.slice(0, MAX_HASHTAG_LEN));

    // 3) 중복 제거(앞쪽 우선), 결합: [베이스] + [사용자]
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const t of [...baseTokens, ...userTokens]) {
      if (!t) continue;
      if (!seen.has(t)) { seen.add(t); merged.push(t); }
    }

    // 4) 2줄 측정 → 넘치면 "사용자 태그"부터 제거, 그래도 넘치면 베이스 뒤쪽부터 제거
    const ctx = getMeasureCtx();
    const fitsTwoLines = (arr: string[]) => {
      for (let size = FOOTER_BASE_FONT; size >= FOOTER_MIN_FONT; size--) {
        const joined = arr.map(t => `#${t}`).join(' ');
        const { overflow } = wrapForWidth(ctx, joined, size, FOOTER_INNER_W, FOOTER_MAX_LINES);
        if (!overflow) return true;
      }
      return false;
    };

    const result = [...merged];
    const removedUser: string[] = [];
    const removedBase: string[] = [];

    // 우선 사용자 태그 뒤에서부터 제거
    const baseCount = baseTokens.filter(t => seen.has(t)).length;
    while (result.length && !fitsTwoLines(result)) {
      // 사용자 파트 범위
      const lastIdx = result.length - 1;
      if (lastIdx >= baseCount) {
        removedUser.unshift(result.pop()!);
      } else {
        // 이미 사용자 다 지웠는데도 넘치면 베이스 뒤에서 제거(보통 책제목/촬영장소가 뒤쪽이라 우선 제외됨)
        removedBase.unshift(result.pop()!);
      }
    }

    setUserTags(userTokens);     // 원본 사용자 태그(상태 유지)
    setFinalTags(result);        // ★ 실제 사용될 최종 태그

    // 5) 에러 메시지
    const msgs: string[] = [];
    if (tooLongRaw.length) msgs.push(`각 태그는 최대 ${MAX_HASHTAG_LEN}자까지입니다. (초과: ${tooLongRaw.map(t => `#${t}`).join(', ')})`);
    if (rawInput.split(/[\s,]+/).filter(Boolean).length > MAX_USER_HASHTAGS) msgs.push(`사용자 태그는 최대 ${MAX_USER_HASHTAGS}개까지만 반영됩니다.`);
    if (removedUser.length) msgs.push(`2줄 제한으로 다음 사용자 태그가 제외되었습니다: ${removedUser.map(t => `#${t}`).join(' ')}`);
    if (removedBase.length) msgs.push(`2줄 제한으로 일부 베이스 태그가 제외되었습니다: ${removedBase.map(t => `#${t}`).join(' ')}`);
    setTagError(msgs.join(' '));
  }

  // 입력 핸들러
  function onTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    recomputeFinalTags(e.currentTarget.value, bookTitle, locationName);
  }

  // 책 제목/촬영장소가 바뀌면 재측정(촬영장소 반영 핵심)
  useEffect(() => {
    recomputeFinalTags(tagInput, bookTitle, locationName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookTitle, locationName]);

  /* ===============================
     제목 보조 래핑(미리보기 UX용, 실제 그리기는 canvas가 책임)
  ================================== */
  const wrapHard = (s: string, maxLineChars = 28, maxLines = 3) => {
    const words = s.trim().split(/\s+/);
    const lines: string[] = []; let cur = '';
    for (const w of words) {
      const nxt = cur ? `${cur} ${w}` : w;
      if (nxt.length > maxLineChars) { if (cur) lines.push(cur); cur = w; if (lines.length >= maxLines - 1) break; }
      else cur = nxt;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) lines.length = maxLines;
    const joined = lines.join('\n');
    return (s.length > joined.replace(/\n/g, ' ').length) ? joined + '…' : joined;
  };

  /* ===============================
     합성
  ================================== */
  const doCompose = async () => {
    if (photos.length !== REQUIRED_PHOTO_COUNT) {
      setPhotoError(`사진을 정확히 ${REQUIRED_PHOTO_COUNT}장 선택해주세요. (현재 ${photos.length}장)`);
      photoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      const imgEls = await Promise.all(photos.map(p => loadImage(p.url)));

      const raw = (manualQuote.trim() || quote?.text || '여행엔 이야기가 필요해').trim();
      const alreadyHasBook = !!(bookTitle && raw.includes(bookTitle));
      const alreadyHasAuthor = !!(author && raw.includes(author));
      const quoteText = wrapHard(raw, 28, 3);

      // 최종 태그(2줄에 맞춰 트리밍된 결과)
      const footerSafe = finalTags.map(h => `#${h}`).join(' ');

      const blob = await composeFourCut({
        width: CANVAS_W, height: CANVAS_H, background: '#fff',
        quoteText,
        bookTitle: alreadyHasBook ? undefined : (bookTitle || quote?.bookTitle),
        author: alreadyHasAuthor ? undefined : (author || quote?.author),
        photos: imgEls, template,
        accentColor: '#111827',
        watermark: 'Literary Trip',
        footerText: footerSafe,
        padding: CANVAS_PADDING,
      });

      const dataUrl = await blobToDataUrl(blob);
      setPreviewUrl(dataUrl);
    } finally { setLoading(false); }
  };

  const onDownload = () => { if (previewUrl) downloadRef.current?.click(); };

  /* ===============================
     UI
  ================================== */
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
              <Input placeholder="책 제목" value={bookTitle} onChange={e=>setBookTitle(e.target.value)} style={{ width: '90%' }} />
              <Input placeholder="저자" value={author} onChange={e=>setAuthor(e.target.value)} style={{ width: '90%' }}/>
            </Row>

            <div style={{height:16}} />

            {/* 사진 선택 */}
            <div ref={photoSectionRef}>
              <SectionTitle>사진 선택 (4장 필요)</SectionTitle>
              <Input as="input" type="file" accept="image/*" multiple onChange={e=>onPickPhotos((e.target as HTMLInputElement).files)}/>
              {photoError && (
                <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }} aria-live="polite">
                  {photoError}
                </p>
              )}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:8}}>
              {photos.map(p=>(
                <div key={p.id} style={{position:'relative'}}>
                  <Thumb src={p.url} alt="" />
                  <button
                    onClick={()=>removePhoto(p.id)}
                    style={{position:'absolute',right:-6,top:-6, background:'#000', color:'#fff', borderRadius:999, padding:'2px 6px', fontSize:12}}
                    aria-label="remove"
                  >
                    ✕
                  </button>
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
            <SectionTitle>해시태그 (최대 2줄)</SectionTitle>
            <Input placeholder="촬영 장소" value={locationName} onChange={e=>setLocationName(e.target.value)}/>
            <div style={{height:8}} />
            <Input
              placeholder={`#태그1 #태그2 (각 ${MAX_HASHTAG_LEN}자 이내, 전체 2줄 이내)`}
              value={tagInput}
              onChange={onTagsChange}
            />
            {tagError && (
              <p style={{ color:'#dc2626', fontSize:12, marginTop:6 }} aria-live="polite">{tagError}</p>
            )}
            <p style={{fontSize:12, color:'#6b7280', marginTop:8}}>
              적용 예정: {finalTags.map(h => `#${h}`).join(' ')}
            </p>
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
              <Button onClick={doCompose} disabled={loading} variant="primary">
                {loading ? '생성 중…' : '이미지 생성'}
              </Button>
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
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
