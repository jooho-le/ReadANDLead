// src/api/neighbor.ts
import { apiFetch } from './config';

export type NeighborPost = {
  id: number;
  author: string;
  title: string;
  date: string;
  cover?: string;
  images?: string[];
  content_html: string;
};

export type PostCreateInput = {
  title: string;
  cover?: string;
  contentHtml?: string;   // 프론트 입력용 (camelCase)
  content_html?: string;  // 혹시 서버형식 그대로 올 때 대비
  images?: string[];
};
export type PostUpdateInput = Partial<PostCreateInput>;

// ✅ 이 파일 안에서만 사용할 경로 상수
const EP = {
  neighborPosts: '/api/neighbor-posts',
};

// 목록 조회 (공개)
export function listNeighborPosts() {
  return apiFetch<NeighborPost[]>(EP.neighborPosts);
}

// 단건 조회 (공개)
export function getNeighborPost(id: string | number) {
  return apiFetch<NeighborPost>(`${EP.neighborPosts}/${id}`);
}

// 생성 (인증 필요)
export function createNeighborPost(body: PostCreateInput) {
  const payload = {
    title: body.title,
    cover: body.cover ?? null,
    content_html: body.content_html ?? body.contentHtml ?? '',
    images: body.images ?? [],
  };
  return apiFetch<NeighborPost>(EP.neighborPosts, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 수정 (인증 & 본인 글만)
export function updateNeighborPost(id: string | number, body: PostUpdateInput) {
  const payload: Record<string, unknown> = {};
  if (body.title !== undefined) payload.title = body.title;
  if (body.cover !== undefined) payload.cover = body.cover;
  if (body.images !== undefined) payload.images = body.images;
  if (body.content_html !== undefined || body.contentHtml !== undefined) {
    payload.content_html = body.content_html ?? body.contentHtml ?? '';
  }
  return apiFetch<NeighborPost>(`${EP.neighborPosts}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// 삭제 (인증 & 본인 글만)
export function deleteNeighborPost(id: string | number) {
  return apiFetch<void>(`${EP.neighborPosts}/${id}`, { method: 'DELETE' });
}
