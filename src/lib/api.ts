// 백엔드 호출 래퍼. 쓰기 요청에는 토큰을 붙입니다.
import { config } from "./config";
import type { Post, PostInput } from "./types";
import type { Project } from "@/types/project";

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // ---- 로그인 ----
  login: (password: string) =>
    request<{ token: string; expires_at: string }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  // ---- posts (공개 읽기) ----
  listPosts: (lang = "ko") => request<Post[]>(`/posts?lang=${lang}`),
  getPost: (slug: string, lang = "ko") =>
    request<Post>(`/posts/${slug}?lang=${lang}`),

  // ---- posts (관리자) ----
  listPostsAdmin: (token: string, lang = "ko") =>
    request<Post[]>(`/posts/admin?lang=${lang}`, { token }),
  createPost: (token: string, body: PostInput) =>
    request<Post>(`/posts`, { method: "POST", body: JSON.stringify(body), token }),
  updatePost: (token: string, id: string, body: PostInput) =>
    request<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(body), token }),
  deletePost: (token: string, id: string) =>
    request<{ ok: true }>(`/posts/${id}`, { method: "DELETE", token }),

  // ---- site content (텍스트 전체) ----
  getContent: (lang: string) => request<Record<string, unknown>>(`/content/${lang}`),
  putContent: (token: string, lang: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/content/${lang}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  // ---- analytics ----
  // 조회 트래킹: 실패해도 사용자 경험에 영향 없게 fire-and-forget.
  track: (event: string, target = "_") => {
    if (!config.apiBaseUrl) return;
    fetch(`${config.apiBaseUrl}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, target }),
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  },
  getAnalytics: (token: string) =>
    request<{ event: string; target: string; count: number }[]>(`/analytics`, { token }),

  // ---- projects ----
  listProjects: () => request<Project[]>(`/projects`),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  upsertProject: (token: string, id: string, body: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body), token }),
  deleteProject: (token: string, id: string) =>
    request<{ ok: true }>(`/projects/${id}`, { method: "DELETE", token }),

  // ---- 티스토리 가져오기 ----
  importPreview: (token: string, url: string) =>
    request<{
      title: string;
      content: string;
      excerpt: string;
      tags: string[];
      cover_image: string | null;
      published_at: string | null;
      source_url: string;
      slug: string;
    }>(`/import/preview`, { method: "POST", token, body: JSON.stringify({ url }) }),
  // 티스토리 sitemap 전체를 훑어 '프로젝트기록-<id>' 태그로 자동 분류해 일괄 저장
  importSitemap: (token: string) =>
    request<{
      scanned: number;
      failed: { url: string; error: string }[];
      by_project: Record<string, { created: number; skipped: number }>;
    }>(`/import/sitemap`, { method: "POST", token, body: JSON.stringify({ status: "published" }) }),
  importTag: (token: string, tag: string, projectId: string, status = "published") =>
    request<{
      total: number;
      created: { slug: string; title: string }[];
      skipped: string[];
      failed: { url: string; error: string }[];
    }>(`/import/tag`, {
      method: "POST",
      token,
      body: JSON.stringify({ tag, project_id: projectId, status }),
    }),

  // ---- 이미지 업로드 ----
  async uploadImage(token: string, file: File, prefix = "posts"): Promise<string> {
    const { upload_url, public_url } = await request<{
      upload_url: string;
      public_url: string;
    }>(`/uploads/presign`, {
      method: "POST",
      token,
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || "image/png",
        prefix,
      }),
    });
    // presigned URL 로 S3 직접 업로드
    const put = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/png" },
      body: file,
    });
    if (!put.ok) throw new Error("이미지 업로드 실패");
    return public_url;
  },
};
