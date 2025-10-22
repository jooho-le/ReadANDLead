// src/pages/Neighbors.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { listNeighborSummaries, type NeighborPostSummary } from '../api/neighbor';

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
  const [posts, setPosts] = useState<NeighborPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await listNeighborSummaries();
        if (!alive) return;
        setPosts(Array.isArray(r) ? r : []);
        setError('');
      } catch (err) {
        if (!alive) return;
        setError('이웃 글을 불러오지 못했어요. 다시 시도해 주세요.');
        setPosts([]);
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
      ) : error ? (
        <div>{error}</div>
      ) : posts.length === 0 ? (
        <div>아직 작성된 글이 없어요. 첫 번째 글을 써보세요!</div>
      ) : (
        <Grid>
          {posts.map((p) => (
            <Card key={p.id} to={`/neighbors/${p.id}`}>
              {p.cover && <Thumb src={p.cover} alt={p.title} loading="lazy" decoding="async" />}
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
