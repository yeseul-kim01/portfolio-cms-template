// 블로그 글 타입. 백엔드 PostOut 과 동일 형태.
export interface Post {
  id: string;
  slug: string;
  lang: "ko" | "en";
  title: string;
  excerpt: string;
  content: string; // 마크다운
  cover_image?: string | null;
  tags: string[];
  status: "draft" | "published";
  project_id?: string | null; // 어느 프로젝트의 개발기록인지
  source_url?: string | null; // 원본(티스토리) 링크
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export type PostInput = Pick<
  Post,
  | "slug"
  | "lang"
  | "title"
  | "excerpt"
  | "content"
  | "cover_image"
  | "tags"
  | "status"
  | "project_id"
  | "source_url"
>;
