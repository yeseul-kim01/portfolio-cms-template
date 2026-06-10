// 이력서(/resume) 전용 큐레이션 데이터 — 샘플(정적 fallback).
// 실제 데이터는 DB 에 있음: 프로젝트는 /admin '프로젝트 관리'의 resume:{ko,en} 필드,
// 역량(제목·설명·근거)은 /admin '이력서 편집'(content "resume" 문서)에서 편집.

export type LinkKind = "github" | "demo" | "blog" | "notion" | "live" | "huggingface";
export interface ResumeLink {
  kind: LinkKind;
  url: string;
}
// 핵심 설계 키포인트: 무엇을 / 어떤 기술로 / 어떤 로직으로 / 성능·효과를 어떻게
export interface ResumeKeyPoint {
  title: string;
  tech?: string;
  detail: string;
  impact?: string;
}
export interface ResumeProject {
  id: string;
  category: "featured" | "project" | "career" | "toy";
  title: string;
  oneLiner: string;
  description: string;
  period: string;
  team: string;
  role: string;
  stack: string[];
  links: ResumeLink[];
  image?: string;
  contributions: string[];
  keyPoints: ResumeKeyPoint[];
}

// ----------------------------- 샘플 프로젝트 -----------------------------
const SAMPLE_KO: ResumeProject[] = [
  {
    id: "sample",
    category: "featured",
    title: "샘플 프로젝트",
    oneLiner: "한 줄 설명을 적으세요.",
    description: "프로젝트 설명을 적으세요. /admin '프로젝트 관리'의 resume.ko 에서 편집합니다.",
    period: "2025.01 ~ 2025.06",
    team: "개인",
    role: "역할을 적으세요",
    stack: ["Spring Boot", "FastAPI", "React"],
    links: [{ kind: "github", url: "https://github.com/your-id/sample" }],
    contributions: ["내가 한 일 1", "내가 한 일 2"],
    keyPoints: [
      { title: "핵심 설계 포인트", tech: "사용 기술", detail: "어떤 로직으로 풀었는지.", impact: "성능·효과(수치)" },
    ],
  },
  {
    id: "sample2",
    category: "project",
    title: "샘플 프로젝트 2",
    oneLiner: "한 줄 설명.",
    description: "두 번째 샘플 프로젝트 설명.",
    period: "2024.07 ~ 2024.12",
    team: "팀 프로젝트",
    role: "역할",
    stack: ["Python", "PyTorch"],
    links: [],
    contributions: ["내가 한 일"],
    keyPoints: [{ title: "키포인트", detail: "설명." }],
  },
];
const SAMPLE_EN: ResumeProject[] = [
  {
    id: "sample",
    category: "featured",
    title: "Sample Project",
    oneLiner: "A one-line summary.",
    description: "Project description. Edit in /admin → Projects (resume.en).",
    period: "Jan 2025 – Jun 2025",
    team: "Solo",
    role: "Your role",
    stack: ["Spring Boot", "FastAPI", "React"],
    links: [{ kind: "github", url: "https://github.com/your-id/sample" }],
    contributions: ["What I did 1", "What I did 2"],
    keyPoints: [
      { title: "Key design point", tech: "Tech", detail: "How it was solved.", impact: "Impact (numbers)" },
    ],
  },
  {
    id: "sample2",
    category: "project",
    title: "Sample Project 2",
    oneLiner: "A one-line summary.",
    description: "Second sample project.",
    period: "Jul 2024 – Dec 2024",
    team: "Team project",
    role: "Your role",
    stack: ["Python", "PyTorch"],
    links: [],
    contributions: ["What I did"],
    keyPoints: [{ title: "Key point", detail: "Detail." }],
  },
];

export const RESUME_PROJECTS_KO = SAMPLE_KO;
export const RESUME_PROJECTS_EN = SAMPLE_EN;
export const RESUME_PROJECTS: Record<"ko" | "en", ResumeProject[]> = {
  ko: RESUME_PROJECTS_KO,
  en: RESUME_PROJECTS_EN,
};

// ----------------------------- 역량 근거/설명 -----------------------------
// 역량 제목·라벨은 competencies.ts 의 COMPETENCIES(label) 를 그대로 씀. 여기선 설명/근거만.
// key 는 competencies.ts 의 COMPETENCIES key 와 일치시켜야 연결됨.
const KEYS = ["backend", "frontend", "infra", "data"] as const;

export const COMPETENCY_DESC: Record<"ko" | "en", Record<string, string>> = {
  ko: Object.fromEntries(KEYS.map((k) => [k, "이 역량 설명을 /admin '이력서 편집'에서 적으세요."])),
  en: Object.fromEntries(KEYS.map((k) => [k, "Describe this strength in /admin → Resume."])),
};

export interface CompEvidence {
  projectId: string;
  what: string;
  impact?: string;
  image?: string;
  caption?: string;
}

const sampleEvidence = (lang: "ko" | "en"): Record<string, CompEvidence[]> =>
  Object.fromEntries(
    KEYS.map((k) => [
      k,
      [
        {
          projectId: "sample",
          what: lang === "ko" ? "이 역량을 보여준 작업을 적으세요." : "What you did that shows this strength.",
          impact: lang === "ko" ? "성능·효과(수치)" : "Impact (numbers)",
        },
      ],
    ]),
  );

export const COMPETENCY_EVIDENCE_KO = sampleEvidence("ko");
export const COMPETENCY_EVIDENCE_EN = sampleEvidence("en");
export const COMPETENCY_EVIDENCE: Record<"ko" | "en", Record<string, CompEvidence[]>> = {
  ko: COMPETENCY_EVIDENCE_KO,
  en: COMPETENCY_EVIDENCE_EN,
};
