// src/api/neighbor.ts
import { apiFetch, apiUrl } from './config';

export type NeighborPost = {
  id: number;
  author: string;
  title: string;
  date: string;
  cover?: string;
  images?: string[];
  content_html: string;
};

export type NeighborComment = {
  id: number;
  post_id: number;
  author: string;
  content: string;
  date: string;
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
  upload: '/api/uploads',
};

function resolvePostMedia(post: NeighborPost): NeighborPost {
  const cover = post.cover ? apiUrl(post.cover) : undefined;
  const images = post.images
    ?.filter((img) => !!img)
    .map((img) => apiUrl(img));
  return {
    ...post,
    cover,
    images,
  };
}

// 목록 조회 (공개)
export function listNeighborPosts() {
  return apiFetch<NeighborPost[]>(EP.neighborPosts).then((posts) =>
    posts.map(resolvePostMedia),
  );
}

// 단건 조회 (공개)
export function getNeighborPost(id: string | number) {
  return apiFetch<NeighborPost>(`${EP.neighborPosts}/${id}`).then(resolvePostMedia);
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
  }).then(resolvePostMedia);
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
  }).then(resolvePostMedia);
}

// 삭제 (인증 & 본인 글만)
export function deleteNeighborPost(id: string | number) {
  return apiFetch<void>(`${EP.neighborPosts}/${id}`, { method: 'DELETE' });
}

export function claimNeighborPost(id: string | number) {
  return apiFetch<void>(`${EP.neighborPosts}/${id}/claim`, { method: 'POST' });
}

// 파일 업로드 → 업로드된 공개 URL 반환
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(apiUrl(EP.upload), {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers: (() => {
      const h = new Headers();
      const token = typeof localStorage !== 'undefined' && localStorage.getItem('token');
      if (token) h.set('Authorization', `Bearer ${token}`);
      return h;
    })(),
  });
  if (!res.ok) throw new Error('upload failed');
  const j = await res.json();
  return j.url as string;
}

// 댓글 API
export function listComments(postId: number | string) {
  return apiFetch<NeighborComment[]>(`${EP.neighborPosts}/${postId}/comments`);
}
export function createComment(postId: number | string, content: string) {
  return apiFetch<NeighborComment>(`${EP.neighborPosts}/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
export function deleteComment(postId: number | string, commentId: number | string) {
  return apiFetch<void>(`${EP.neighborPosts}/${postId}/comments/${commentId}`, { method: 'DELETE' });
}
