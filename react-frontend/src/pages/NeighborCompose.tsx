import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createNeighborPost, uploadImage } from '../api/neighbor';

const Wrap = styled.div`
  max-width: 900px; margin: 0 auto; padding: 50px 20px 60px;
  
  @media (max-width: 768px) {
    padding: 40px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 32px 12px 12px;
  }
`;
const H1 = styled.h1`margin:0 0 14px;font-size:1.8rem;font-weight:800;color:#222;`;
const Label = styled.div`margin:12px 0 6px;font-weight:700;`;
const Input = styled.input`
  width:100%;padding:12px;border-radius:10px;border:1px solid #e5e5e5;
`;
const TextArea = styled.textarea`
  width:100%;min-height:280px;padding:12px;border-radius:10px;border:1px solid #e5e5e5;
  line-height:1.6;
`;
const Row = styled.div`display:flex;gap:8px;align-items:center;margin-top:12px;`;
const Btn = styled.button`
  padding:10px 14px;border-radius:10px;border:1px solid #ddd;background:#fff;cursor:pointer;
`;
const Primary = styled(Btn)`background:#667eea;color:#fff;border-color:#667eea;font-weight:800;`;

export default function NeighborCompose() {
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSelectCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setBusy(true);
      const url = await uploadImage(f);
      setCoverUrl(url);
    } catch (e) {
      alert('커버 업로드 실패');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function onSelectGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setBusy(true);
      const urls: string[] = [];
      for (const f of files) {
        const u = await uploadImage(f);
        urls.push(u);
      }
      setImages(prev => [...prev, ...urls]);
    } catch (e) {
      alert('이미지 업로드 실패');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function save() {
    if (busy) return;
    if (!title.trim()) return alert('제목을 입력해 주세요.');
    if (!content.trim()) return alert('본문을 입력해 주세요.');
    const token = localStorage.getItem('token');
    if (!token) return alert('로그인 후 작성할 수 있어요.');

    setBusy(true);
    try {
      const r = await createNeighborPost({
        title,
        cover: coverUrl || undefined,
        content_html: content,
        images: images.length ? images : undefined,
      });
      nav(`/neighbors/${r.id}`);
    } catch (e) {
      console.error(e);
      alert('저장에 실패했어요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Wrap>
      <H1>새 글 쓰기</H1>

      <Label>제목</Label>
      <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 광주 — 『소년이 온다』와 함께 걷다" />

      <Label>커버 이미지(파일 선택)</Label>
      <Input type="file" accept="image/*" onChange={onSelectCover} />
      {coverUrl && (
        <div style={{ marginTop: 8 }}>
          <img src={coverUrl} alt="cover" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
        </div>
      )}

      <Label>본문(HTML 가능)</Label>
      <TextArea
        value={content}
        onChange={e=>setContent(e.target.value)}
        placeholder="예: <p>여행 후기를 HTML로 작성해 보세요</p>"
      />

      <Label>갤러리 이미지(여러 파일 선택 가능)</Label>
      <Input type="file" accept="image/*" multiple onChange={onSelectGallery} />
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 8 }}>
          {images.map((src, idx) => (
            <img key={idx} src={src} alt={`img-${idx}`} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
          ))}
        </div>
      )}

      <Row>
        <Btn onClick={()=>nav(-1)}>취소</Btn>
        <Primary onClick={save} disabled={busy}>등록</Primary>
      </Row>
    </Wrap>
  );
}
