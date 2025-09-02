import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, Link } from 'react-router-dom';
import { getNeighborPost } from '../api/neighbor';
import type { NeighborPost } from '../api/neighbor';

const Wrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
`;

const Back = styled(Link)`
  display: inline-block;
  margin-bottom: 16px;
  color: #667eea;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 2rem;
  font-weight: 800;
  color: #222;
`;

const Meta = styled.div`
  color: #777;
  margin-bottom: 16px;
`;

const Cover = styled.img`
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 12px;
  background: #eee;
  margin: 12px 0 20px;
`;

const Content = styled.div`
  line-height: 1.8;
  color: #333;
  word-break: break-word;

  /* 네이버블로그 느낌의 본문 스타일 살짝 */
  h2, h3 { margin: 1.2em 0 .6em; }
  img { max-width: 100%; border-radius: 10px; }
  p { margin: .8em 0; }
  a { color: #4f46e5; }
`;

const Gallery = styled.div`
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;
const Photo = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  background: #eee;
`;

export default function NeighborPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<NeighborPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) return;
        const p = await getNeighborPost(id);
        if (alive) setPost(p);
      } catch (e) {
        console.error('getNeighborPost failed', e);
        if (alive) setPost(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Wrap>불러오는 중…</Wrap>;
  if (!post) return <Wrap>게시글을 찾을 수 없습니다.</Wrap>;

  return (
    <Wrap>
      <Back to="/neighbors">← 목록으로</Back>
      <Title>{post.title}</Title>
      <Meta>
        {post.author} · {new Date(post.date).toLocaleString()}
      </Meta>

      {post.cover && <Cover src={post.cover} alt="cover" />}

      {/* 🔧 여기! contentHtml → content_html 로 수정 */}
      <Content dangerouslySetInnerHTML={{ __html: post.content_html }} />

      {post.images && post.images.length > 0 && (
        <Gallery>
          {post.images.map((src, i) => (
            <Photo key={i} src={src} alt={`img-${i}`} />
          ))}
        </Gallery>
      )}
    </Wrap>
  );
}
