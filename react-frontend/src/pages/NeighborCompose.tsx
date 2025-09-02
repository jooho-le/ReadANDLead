import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createNeighborPost } from '../api/neighbor';

const Wrap = styled.div`
  max-width: 900px; margin: 0 auto; padding: 24px 20px 60px;
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
  const [cover, setCover] = useState('');
  const [content, setContent] = useState('<p>여기에 내용을 입력하세요…</p>');
  const [images, setImages] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    if (!title.trim()) return alert('제목을 입력해 주세요.');
    const token = localStorage.getItem('token');
    if (!token) return alert('로그인 후 작성할 수 있어요.');

    setBusy(true);
    try {
      const imgs = images.split('\n').map(s => s.trim()).filter(Boolean);
      const r = await createNeighborPost({
        title,
        cover: cover || undefined,
        content_html: content,
        images: imgs.length ? imgs : undefined,
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

      <Label>커버 이미지(URL, 선택)</Label>
      <Input value={cover} onChange={e=>setCover(e.target.value)} placeholder="https://…"/>

      <Label>본문(HTML 가능)</Label>
      <TextArea value={content} onChange={e=>setContent(e.target.value)} />

      <Label>본문 하단 갤러리 이미지들(URL, 줄바꿈으로 구분, 선택)</Label>
      <TextArea style={{minHeight:120}} value={images} onChange={e=>setImages(e.target.value)} placeholder={'https://img1...\nhttps://img2...'} />

      <Row>
        <Btn onClick={()=>nav(-1)}>취소</Btn>
        <Primary onClick={save} disabled={busy}>등록</Primary>
      </Row>
    </Wrap>
  );
}
