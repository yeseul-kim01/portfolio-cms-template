// 핵심 역량 — 아래는 샘플(정적 기본값). 실제 값은 /admin '이력서 편집 → 핵심 역량(카드)'에서
// 추가·수정(라벨·레벨·색·스킬칩·태그). tags 가 프로젝트 태그와 겹치면 "연결된 프로젝트"로 강조.
export type Competency = {
  key: string;
  label: string;
  level: number; // 0~100 (강도)
  blurb: string;
  skills: string[]; // 화면에 보여줄 대표 스킬 칩
  tags: string[]; // 매칭 판정용 태그
  accent: string; // tailwind 색 (bar/하이라이트)
};

export const COMPETENCIES: Competency[] = [
  {
    key: "backend",
    label: "Backend",
    level: 90,
    blurb: "이 역량을 한 줄로 소개하세요. (예: API·인증·동시성 설계)",
    skills: ["스킬 A", "스킬 B", "스킬 C"],
    tags: ["Spring Boot", "FastAPI", "REST API"],
    accent: "blue",
  },
  {
    key: "frontend",
    label: "Frontend",
    level: 80,
    blurb: "이 역량을 한 줄로 소개하세요.",
    skills: ["React", "TypeScript"],
    tags: ["React", "TypeScript"],
    accent: "violet",
  },
  {
    key: "infra",
    label: "Infra / DevOps",
    level: 80,
    blurb: "이 역량을 한 줄로 소개하세요.",
    skills: ["Docker", "CI/CD", "AWS"],
    tags: ["Docker", "AWS", "CI/CD"],
    accent: "amber",
  },
  {
    key: "data",
    label: "Data / Storage",
    level: 75,
    blurb: "이 역량을 한 줄로 소개하세요.",
    skills: ["PostgreSQL", "Redis"],
    tags: ["PostgreSQL", "Redis", "MongoDB"],
    accent: "emerald",
  },
];

export function projectMatchesCompetency(tags: string[] = [], comp: Competency): boolean {
  const set = new Set(comp.tags.map((t) => t.toLowerCase()));
  return tags.some((t) => set.has(t.toLowerCase()));
}

// accent → tailwind 클래스 (동적 클래스는 빌드에서 누락되므로 명시 매핑)
export const ACCENT: Record<string, { bar: string; text: string; ring: string; chipActive: string }> = {
  blue: { bar: "bg-blue-500", text: "text-blue-300", ring: "ring-blue-500/50", chipActive: "bg-blue-500/15 border-blue-400/40 text-blue-200" },
  violet: { bar: "bg-violet-500", text: "text-violet-300", ring: "ring-violet-500/50", chipActive: "bg-violet-500/15 border-violet-400/40 text-violet-200" },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-300", ring: "ring-emerald-500/50", chipActive: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200" },
  amber: { bar: "bg-amber-500", text: "text-amber-300", ring: "ring-amber-500/50", chipActive: "bg-amber-500/15 border-amber-400/40 text-amber-200" },
  rose: { bar: "bg-rose-500", text: "text-rose-300", ring: "ring-rose-500/50", chipActive: "bg-rose-500/15 border-rose-400/40 text-rose-200" },
  indigo: { bar: "bg-indigo-500", text: "text-indigo-300", ring: "ring-indigo-500/50", chipActive: "bg-indigo-500/15 border-indigo-400/40 text-indigo-200" },
};
