import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNeighborPost, deleteNeighborPost, listComments, createComment, deleteComment, claimNeighborPost, type NeighborComment } from '../api/neighbor';
import { me as fetchMe } from '../api/auth';
import type { NeighborPost } from '../api/neighbor';

const Wrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 50px 20px 60px;
  
  @media (max-width: 768px) {
    padding: 40px 16px 16px;
  }

  @media (max-width: 480px) {
    padding: 32px 12px 12px;
  }
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
  const nav = useNavigate();
  const [post, setPost] = useState<NeighborPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [myName, setMyName] = useState<string>('');
  const [comments, setComments] = useState<NeighborComment[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) return;
        const p = await getNeighborPost(id);
        if (alive) setPost(p);
        // 내 정보
        try {
          const profile = await fetchMe();
          if (alive) setMyName(profile.display_name || profile.email);
        } catch {}
        // 댓글
        try {
          const list = await listComments(id);
          if (alive) setComments(list || []);
        } catch {}
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
      {myName && post.author === myName && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={async () => {
              if (!id) return;
              if (!window.confirm('정말 이 글을 삭제할까요?')) return;
              try {
                await deleteNeighborPost(id);
                nav('/neighbors');
              } catch (e) {
                // 레거시 글(익명/소유자 미지정) 대비: 소유권 등록 후 재시도
                try {
                  await claimNeighborPost(id);
                  await deleteNeighborPost(id);
                  nav('/neighbors');
                } catch {
                  alert('삭제 실패: 권한이 없거나 오류가 발생했습니다.');
                }
              }
            }}
            style={{ border: '1px solid #e33', background: '#e33', color: '#fff', borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}
          >
            글 삭제
          </button>
        </div>
      )}

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

      {/* 댓글 섹션 */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ marginTop: 24 }}>댓글</h3>
        {comments.length === 0 ? (
          <div style={{ color: '#666' }}>아직 댓글이 없습니다.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{c.author}</div>
                <div style={{ color: '#555', whiteSpace: 'pre-wrap' }}>{c.content}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{new Date(c.date).toLocaleString()}</div>
                {myName && c.author === myName && (
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={async () => {
                        try {
                          await deleteComment(id!, c.id);
                          setComments((prev) => prev.filter((x) => x.id !== c.id));
                        } catch {
                          alert('댓글 삭제 실패');
                        }
                      }}
                      style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 10px' }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 댓글 입력 */}
        {myName ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px' }}
            />
            <button
              onClick={async () => {
                if (!commentText.trim()) return;
                try {
                  const c = await createComment(id!, commentText.trim());
                  setComments((prev) => [...prev, c]);
                  setCommentText('');
                } catch {
                  alert('댓글 등록 실패');
                }
              }}
              style={{ border: '1px solid #111', background: '#111', color: '#fff', borderRadius: 8, padding: '10px 14px', fontWeight: 700 }}
            >
              등록
            </button>
          </div>
        ) : (
          <div style={{ color: '#666', marginTop: 8 }}>로그인 후 댓글을 작성할 수 있어요.</div>
        )}
      </div>
    </Wrap>
  );
}
