// src/pages/Neighbors.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { listNeighborSummaries, type NeighborPostSummary } from '../api/neighbor';
import fallbackPosts from '../data/neighbor_posts.json';

const FALLBACK_SUMMARIES: NeighborPostSummary[] = (fallbackPosts as any[]).map((p, idx) => ({
  id: p.id ?? `seed-${idx}`,
  author: p.author ?? '익명',
  title: p.title ?? '',
  date: p.date ?? new Date().toISOString(),
  cover: p.cover,
}));

const Wrap = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 30px 20px 20px;

  @media (max-width: 900px) {
    padding: 70px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 70px 12px 12px;
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
const WriteBtn = styled.button`
  border: 1px solid #111;
  background: #111;
  color: #fff;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
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
  padding: 12px;
`;
const CardTitle = styled.div`
  font-weight: 800;
  margin-bottom: 6px;
`;
const CardMeta = styled.div`
  font-size: 12px;
  color: #666;
`;

export default function Neighbors() {
  const [posts, setPosts] = useState<NeighborPostSummary[]>(FALLBACK_SUMMARIES);
  const [loading, setLoading] = useState(FALLBACK_SUMMARIES.length === 0);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await listNeighborSummaries();
        if (alive && Array.isArray(r) && r.length > 0) {
          setPosts(r);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Wrap>
      <Head>
        <H1>이웃의 책여행 따라가기</H1>
        {/* ✅ 글쓰기: 항상 SPA 경로로 이동 */}
        <WriteBtn onClick={() => nav('/neighbors/new')}>글 쓰기</WriteBtn>
      </Head>

      {loading ? (
        <div>불러오는 중…</div>
      ) : posts.length === 0 ? (
        <div>아직 작성된 글이 없어요. 첫 번째 글을 써보세요!</div>
      ) : (
        <Grid>
          {posts.map((p) => (
            <Card key={p.id} to={`/neighbors/${p.id}`}>
              {p.cover && <Thumb src={p.cover} alt={p.title} />}
              <Body>
                <CardTitle>{p.title}</CardTitle>
                <CardMeta>
                  {p.author} · {new Date(p.date).toLocaleDateString()}
                </CardMeta>
              </Body>
            </Card>
          ))}
        </Grid>
      )}
    </Wrap>
  );
}
