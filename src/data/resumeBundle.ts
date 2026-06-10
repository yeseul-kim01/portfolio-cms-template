// 이력서 페이지가 쓰는 "편집 가능한" 데이터 묶음.
// DB(content 문서 키 "resume")에 저장되며, 없으면 아래 정적값으로 fallback.
// /admin/resume 에서 JSON 으로 편집.
import {
  RESUME_PROJECTS,
  COMPETENCY_DESC,
  COMPETENCY_EVIDENCE,
  type ResumeProject,
  type CompEvidence,
} from "./resumeProjects";
import { COMPETENCIES, type Competency } from "./competencies";

// 이력서에 직접 고른 티스토리 글(문제해결 과정)
export interface FeaturedPost {
  url: string;
  title: string;
  date?: string;
  image?: string;
  excerpt?: string;
}

export interface ResumeBundle {
  projects: Record<"ko" | "en", ResumeProject[]>;
  competencyDesc: Record<"ko" | "en", Record<string, string>>;
  competencyEvidence: Record<"ko" | "en", Record<string, CompEvidence[]>>;
  competencies?: Competency[]; // 역량 카드 목록(라벨·레벨·색·스킬칩) — 관리자에서 편집
  featuredPosts?: FeaturedPost[]; // 직접 고른 블로그 글 (관리자에서 추가)
}

export const RESUME_BUNDLE_STATIC: ResumeBundle = {
  projects: RESUME_PROJECTS,
  competencyDesc: COMPETENCY_DESC,
  competencyEvidence: COMPETENCY_EVIDENCE,
  competencies: COMPETENCIES,
  featuredPosts: [],
};
