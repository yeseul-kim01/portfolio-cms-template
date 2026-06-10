// /resume — 홈페이지에 추가한 단독 이력서 페이지.
// 밝은 에디토리얼 톤 기본 + 다크 토글, 한/영 토글, PDF 인쇄.
// 경력·스킬·자격·수상은 DB(content) 연동, 프로젝트는 이력서 전용 큐레이션 데이터(resumeProjects).
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sun, Moon, Globe, Printer, ArrowLeft,
  Github, ExternalLink, BookOpen, FileText, Brain, Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjects } from "@/hooks/useProjects";
import { ResumeProjectModal } from "@/components/projects/ResumeProjectModal";
import { CompetencyModal } from "@/components/projects/CompetencyModal";
import { type ResumeProject, type ResumeLink } from "@/data/resumeProjects";
import { RESUME_BUNDLE_STATIC, type ResumeBundle } from "@/data/resumeBundle";
import { isApiEnabled } from "@/lib/config";
import { useApplyTheme } from "@/lib/useSiteTheme";
import { site } from "@/config/site";
import type { Project } from "@/types/project";
import type { Post } from "@/lib/types";

// 이력서 프로젝트 id 와 DB 프로젝트 id 가 다를 때만 매핑 (보통 비움)
const DB_ID: Record<string, string> = {};
import { ACCENT } from "@/data/competencies";
import { useCompetencies } from "@/lib/useCompetencies";
import { links as contactLinks } from "@/data/links";

type Theme = "light" | "dark";

const CATEGORIES = [
  { key: "featured", ko: "대표 프로젝트", en: "Featured" },
  { key: "project", ko: "주요 프로젝트", en: "Selected Projects" },
  { key: "career", ko: "회사 · 실무", en: "Work" },
  { key: "toy", ko: "토이 · 학습", en: "Toy & Learning" },
];

const CARD_LINK_ICON: Record<ResumeLink["kind"], typeof Github> = {
  github: Github,
  demo: ExternalLink,
  blog: BookOpen,
  notion: FileText,
  live: Globe,
  huggingface: Brain,
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)] mb-3">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-4xl md:text-5xl font-medium text-stone-800 dark:text-stone-100 leading-tight">
      {children}
    </h2>
  );
}

export default function Resume() {
  useApplyTheme("resume");
  const RESUME_COMPETENCIES = useCompetencies();
  const { lang, setLang, content } = useLanguage();
  const c = content as any;

  // 이력서 데이터: DB(content "resume") 우선, 없으면 정적 번들
  const [bundle, setBundle] = useState<ResumeBundle>(RESUME_BUNDLE_STATIC);
  useEffect(() => {
    if (!isApiEnabled) return;
    api
      .getContent("resume")
      .then((d) => {
        const b = d as unknown as ResumeBundle;
        // 완전한 번들일 때만 채택 (불완전/빈 doc 이면 정적 fallback 유지)
        const ok =
          !!b &&
          (["ko", "en"] as const).every(
            (l) =>
              Array.isArray(b.projects?.[l]) &&
              !!b.competencyDesc?.[l] &&
              !!b.competencyEvidence?.[l],
          ) &&
          b.projects.ko.length > 0;
        if (ok) setBundle(b);
      })
      .catch(() => {
        /* 404/실패 → 정적 번들 유지 */
      });
  }, []);

  const dbProjects = useProjects([]); // /projects (원본 섹션 + resume:{ko,en})

  // 이력서 프로젝트는 프로젝트 레코드의 resume[lang] 를 사용. 없으면 정적 번들 fallback.
  type WithResume = Project & { resume?: { ko: ResumeProject; en: ResumeProject } };
  const dbResume = useMemo(() => {
    const list: { rp: ResumeProject; original: Project }[] = [];
    for (const p of dbProjects as WithResume[]) {
      const rp = p.resume?.[lang];
      if (rp) list.push({ rp, original: p });
    }
    return list;
  }, [dbProjects, lang]);
  const useDb = dbResume.length > 0;
  const projects = useDb ? dbResume.map((x) => x.rp) : bundle.projects[lang] ?? [];

  // CompetencyModal 의 titleOf 용: 현재 프로젝트 목록을 번들에 끼워 전달
  const compBundle: ResumeBundle = {
    ...bundle,
    projects: {
      ko: lang === "ko" ? projects : bundle.projects.ko,
      en: lang === "en" ? projects : bundle.projects.en,
    },
  };

  // 이력서 프로젝트 id → 원본(DB) 프로젝트 (모달의 '프로젝트 상세' 섹션용)
  const originalById = useMemo(() => {
    const m = new Map<string, Project>();
    if (useDb) dbResume.forEach((x) => m.set(x.rp.id, x.original));
    else
      (bundle.projects[lang] ?? []).forEach((rp) => {
        const o = dbProjects.find((p) => p.id === (DB_ID[rp.id] ?? rp.id));
        if (o) m.set(rp.id, o);
      });
    return m;
  }, [useDb, dbResume, dbProjects, bundle, lang]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem("resume-theme") as Theme) || "light";
    setTheme(saved);
  }, []);

  // 이력서 조회수 트래킹 (1회)
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    api.track("resume_view", "resume");
  }, []);

  const openProject = (id: string) => {
    setSelectedId(id);
    api.track("project_open", id);
  };
  const openComp = (key: string) => {
    setSelectedComp(key);
    api.track("competency_open", key);
  };
  useEffect(() => {
    localStorage.setItem("resume-theme", theme);
  }, [theme]);

  const home = c?.home ?? {};
  const about = c?.about ?? {};
  const career: { from: string; to: string; title: string; detail?: string }[] =
    about.career ?? [];
  const stacks: { group: string; items: { name: string; level: string }[] }[] =
    about.stacks ?? [];
  const certificates: { date: string; title: string; detail?: string; org?: string }[] =
    about.certificates ?? [];
  const awards: { date: string; title: string; org?: string }[] = about.awards ?? [];
  const education: { from: string; to: string; name: string; detail?: string }[] =
    about.education ?? [];

  const grouped = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        items: projects.filter((p) => p.category === cat.key),
      })).filter((g) => g.items.length > 0),
    [projects],
  );

  const flatProjects = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);
  const selectedIndex = flatProjects.findIndex((p) => p.id === selectedId);
  const selectedProject = selectedIndex >= 0 ? flatProjects[selectedIndex] : null;

  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);

  // 직접 고른 블로그 글 (관리자에서 추가)
  const featuredPosts = bundle.featuredPosts ?? [];

  // 개발기록: 블로그 글을 프로젝트별로 자동 분류 (3개씩)
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    if (isApiEnabled) api.listPosts("ko").then(setPosts).catch(() => {});
  }, []);
  const projTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? id;
  const devGroups = useMemo(() => {
    const byProj = new Map<string, Post[]>();
    for (const p of posts) {
      const k = p.project_id || "etc";
      if (!byProj.has(k)) byProj.set(k, []);
      byProj.get(k)!.push(p);
    }
    return Array.from(byProj.entries()).map(([pid, list]) => ({ pid, list: list.slice(0, 3) }));
  }, [posts]);
  const [devProj, setDevProj] = useState("structverify");
  const activeDev = devGroups.find((g) => g.pid === devProj) ?? devGroups[0];
  // 목차 nav (현재 섹션 하이라이트 + 부드러운 스크롤)
  const toc = useMemo(
    () => [
      { id: "skills", ko: "기술", en: "Skills" },
      { id: "strengths", ko: "역량", en: "Strengths" },
      { id: "projects", ko: "프로젝트", en: "Projects" },
      ...(featuredPosts.length ? [{ id: "blog", ko: "블로그", en: "Blog" }] : []),
      ...(devGroups.length ? [{ id: "devlogs", ko: "개발기록", en: "Dev Logs" }] : []),
      { id: "experience", ko: "경력", en: "Career" },
      { id: "education", ko: "학력", en: "Education" },
    ],
    [featuredPosts.length, devGroups.length],
  );
  const [activeSec, setActiveSec] = useState("skills");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSec(e.target.id)),
      { rootMargin: "-25% 0px -70% 0px" },
    );
    toc.forEach((x) => {
      const el = document.getElementById(x.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="resume-root min-h-screen bg-[var(--bg)] text-[var(--text)] dark:bg-[#0e0e11] dark:text-stone-200 transition-colors duration-300 selection:bg-rose-200/60 dark:selection:bg-rose-500/30">
        {/* ===== 상단바 ===== */}
        <header className="resume-no-print fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-[#f7f4ef]/80 dark:bg-[#0e0e11]/80 border-b border-stone-200/70 dark:border-white/10">
          <nav className="max-w-5xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <Link
                to="/"
                aria-label={t("홈으로", "Home")}
                className="flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
              </Link>
              <Link
                to="/"
                className="text-sm text-stone-500 dark:text-stone-400 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
              >
                {t("포트폴리오", "Portfolio")}
              </Link>
              <Link
                to="/blog"
                className="text-sm text-stone-500 dark:text-stone-400 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
              >
                {t("블로그", "Blog")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "ko" ? "en" : "ko")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300/80 dark:border-white/15 hover:bg-white dark:hover:bg-white/10 transition-colors"
              >
                <Globe size={13} />
                {lang === "ko" ? "ENG" : "KO"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="toggle theme"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-300/80 dark:border-white/15 hover:bg-white dark:hover:bg-white/10 transition-colors"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-stone-800 text-white dark:bg-white dark:text-stone-900 hover:opacity-90 transition-opacity"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </nav>
          {/* 목차 (섹션 이동) */}
          <div className="resume-no-print hidden md:flex justify-center items-center gap-7 h-11 border-t border-stone-200/60 dark:border-white/10">
            {toc.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`text-sm transition-colors ${
                  activeSec === item.id
                    ? "text-[var(--accent)] font-semibold"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white"
                }`}
              >
                {t(item.ko, item.en)}
              </button>
            ))}
          </div>
        </header>

        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 px-6">
          <div className="absolute inset-0 pointer-events-none -z-0">
            <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-[var(--accent)] opacity-[0.12] blur-[90px]" />
            <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-[var(--accent)] opacity-[0.10] blur-[100px]" />
            <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[var(--accent)] opacity-[0.08] blur-[100px]" />
          </div>

          <div className="relative max-w-3xl mx-auto text-center resume-reveal">
            <p className="font-serif-ko text-sm tracking-[0.3em] uppercase text-stone-400 dark:text-stone-500 mb-6">
              Resume
            </p>
            <h1 className="font-display text-6xl md:text-7xl font-medium tracking-tight text-stone-900 dark:text-white mb-5">
              {home.title ?? site.name}
            </h1>
            <p className="font-display italic text-xl md:text-2xl text-rose-500/90 dark:text-rose-300/90 mb-8">
              {home.subtitle ?? "Backend · AI System · Infrastructure Engineer"}
            </p>
            {home.intro && (
              <p className="whitespace-pre-line leading-[1.95] text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
                {home.intro}
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              {contactLinks.map(({ label, url }) => {
                const Icon =
                  label === "GitHub" ? Github
                  : label === "huggingface" ? Brain
                  : label === "Tech Blog" ? BookOpen
                  : Mail;
                return (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
                  >
                    <Icon size={15} />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== 기술 스택 ===== */}
        {stacks.length > 0 && (
          <Section id="skills">
            <Eyebrow>{t("기술 스택", "Tech Stack")}</Eyebrow>
            <SectionTitle>{t("쓰는 도구들", "Tools I use")}</SectionTitle>
            <div className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {stacks.map((grp) => (
                <div key={grp.group}>
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-3">{grp.group}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {grp.items.map((it) => (
                      <span
                        key={it.name}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10 text-stone-600 dark:text-stone-300"
                      >
                        {it.name}
                        {it.level && (
                          <span className="ml-1.5 text-[10px] text-stone-400 dark:text-stone-500">{it.level}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== 핵심 역량 (주인공: 클릭 → 검증 근거) ===== */}
        <Section alt id="strengths">
          <Eyebrow>{t("핵심 역량", "Core Strengths")}</Eyebrow>
          <SectionTitle>{t("무엇을 잘하나요", "What I do best")}</SectionTitle>
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            {t(
              "역량을 누르면 어떤 프로젝트에서 무엇을 했는지 볼 수 있어요.",
              "Click a strength to see what I actually did with it.",
            )}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {RESUME_COMPETENCIES.map((comp) => {
              const accent = ACCENT[comp.accent] ?? ACCENT.blue;
              return (
                <button
                  key={comp.key}
                  type="button"
                  onClick={() => openComp(comp.key)}
                  className="group text-left rounded-2xl border border-stone-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] p-7 backdrop-blur-sm hover:shadow-lg hover:shadow-stone-200/60 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 leading-snug">
                        {comp.label}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-stone-400 dark:text-stone-500 shrink-0">{comp.level}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-200/80 dark:bg-white/10 overflow-hidden mb-4">
                    <div className={`h-full rounded-full ${accent.bar}`} style={{ width: `${comp.level}%` }} />
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-[1.8] mb-5">
                    {bundle.competencyDesc[lang][comp.key]}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {comp.skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200/70 dark:border-white/10"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity">
                    {t("활용 사례 보기 →", "See examples →")}
                  </p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ===== 프로젝트 ===== */}
        {grouped.length > 0 && (
          <Section id="projects">
            <Eyebrow>{t("전체 프로젝트", "All Projects")}</Eyebrow>
            <SectionTitle>{t("프로젝트 전체 보기", "Browse all projects")}</SectionTitle>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              {t(
                "각 프로젝트의 설명 · 내가 한 일 · 핵심 설계 키포인트가 궁금하면 카드를 누르세요.",
                "Click a card for each project's description, what I did, and key design points.",
              )}
            </p>
            <div className="mt-10 space-y-12">
              {grouped.map((g) => (
                <div key={g.key}>
                  <h3 className="font-serif-ko text-sm tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-5">
                    {t(g.ko, g.en)}
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {g.items.map((p) => (
                      <ProjectCard key={p.id} p={p} lang={lang} onOpen={() => openProject(p.id)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== 블로그 (직접 고른 문제해결 글) ===== */}
        {featuredPosts.length > 0 && (
          <Section id="blog">
            <Eyebrow>{t("블로그", "Blog")}</Eyebrow>
            <SectionTitle>{t("문제 해결 기록", "Problem-solving notes")}</SectionTitle>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              {t("자세한 문제 해결 과정은 블로그에서 확인할 수 있습니다.", "Detailed problem-solving is documented on my blog.")}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post, i) => (
                <PostCard key={i} title={post.title} date={post.date} image={post.image} href={post.url} lang={lang} />
              ))}
            </div>
            <div className="mt-8">
              <a
                href={site.blogUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {t("블로그로 이동", "Visit blog")} →
              </a>
            </div>
          </Section>
        )}

        {/* ===== 개발기록 (블로그에서 프로젝트별 자동) ===== */}
        {devGroups.length > 0 && (
          <Section alt id="devlogs">
            <Eyebrow>{t("개발 기록", "Dev Logs")}</Eyebrow>
            <SectionTitle>{t("프로젝트별 개발기록", "Dev logs by project")}</SectionTitle>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              {t("프로젝트를 진행하며 블로그에 남긴 기록을 확인할 수 있어요.", "Notes I kept on my blog while building each project.")}
            </p>
            {/* 프로젝트 분류 선택 */}
            <div className="mt-8 flex flex-wrap gap-2">
              {devGroups.map((g) => (
                <button
                  key={g.pid}
                  onClick={() => setDevProj(g.pid)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    activeDev?.pid === g.pid
                      ? "bg-stone-800 text-white border-stone-800 dark:bg-white dark:text-stone-900 dark:border-white"
                      : "border-stone-300 dark:border-white/15 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-white/30"
                  }`}
                >
                  {projTitle(g.pid)}
                </button>
              ))}
            </div>
            {activeDev && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeDev.list.map((post) => (
                  <PostCard
                    key={post.id}
                    title={post.title}
                    date={post.published_at ?? undefined}
                    image={post.cover_image ?? undefined}
                    href={`/blog/${post.slug}`}
                    internal
                    lang={lang}
                  />
                ))}
              </div>
            )}
            <div className="mt-8">
              <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
                {t("개발기록 더 보기", "More dev logs")} →
              </Link>
            </div>
          </Section>
        )}

        {/* ===== 경력 · 활동 ===== */}
        {career.length > 0 && (
          <Section alt id="experience">
            <Eyebrow>{t("경력 · 활동", "Experience & Activities")}</Eyebrow>
            <SectionTitle>{t("걸어온 길", "The path so far")}</SectionTitle>
            <ol className="mt-10 relative border-l border-stone-200 dark:border-white/10 ml-1">
              {career.map((item, i) => (
                <CareerItem key={i} item={item} lang={lang} />
              ))}
            </ol>
          </Section>
        )}


        {/* ===== 학력 · 자격 · 수상 ===== */}
        <Section id="education">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <Eyebrow>{t("학력 · 자격", "Education & Certificates")}</Eyebrow>
              {education.map((e, i) => (
                <div key={i} className="mt-6 rounded-2xl border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-6">
                  <h3 className="font-display text-2xl text-stone-800 dark:text-stone-100">{e.name}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {e.from} – {e.to}{e.detail ? ` · ${e.detail}` : ""}
                  </p>
                </div>
              ))}
              {certificates.length > 0 && (
                <ul className="mt-5 space-y-2.5">
                  {certificates.map((cert, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-stone-700 dark:text-stone-200">
                        {cert.title}
                        {cert.detail && (
                          <span className="text-stone-400 dark:text-stone-500"> · {cert.detail}</span>
                        )}
                      </span>
                      <span className="font-mono text-xs text-stone-400 dark:text-stone-500 shrink-0">
                        {cert.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {awards.length > 0 && (
              <div>
                <Eyebrow>{t("수상", "Awards")}</Eyebrow>
                <ul className="mt-6 space-y-3">
                  {awards.map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-xs text-stone-400 dark:text-stone-500 pt-0.5 shrink-0 w-16">
                        {a.date}
                      </span>
                      <div>
                        <p className="text-sm text-stone-700 dark:text-stone-200 leading-snug">{a.title}</p>
                        {a.org && <p className="text-xs text-stone-400 dark:text-stone-500">{a.org}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        {/* ===== Footer ===== */}
        <footer className="resume-no-print border-t border-stone-200/70 dark:border-white/10 mt-10">
          <div className="max-w-5xl mx-auto px-6 py-12 text-center">
            <p className="font-display italic text-xl md:text-2xl text-stone-700 dark:text-stone-200 mb-4 max-w-2xl mx-auto leading-snug">
              “{home.quote ?? "Successful development includes not only coding, but also debugging, testing, deployment, and maintenance."}”
            </p>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 text-[var(--accent)] hover:underline"
            >
              <Mail size={15} /> {site.email}
            </a>
            <p className="mt-8 text-xs text-stone-400 dark:text-stone-600">
              © {site.name} ·{" "}
              <Link to="/" className="hover:underline">
                {site.domain}
              </Link>
            </p>
          </div>
        </footer>
      </div>

      {/* ===== 역량 검증 근거 모달 (주인공) ===== */}
      {selectedComp && (
        <CompetencyModal
          competency={RESUME_COMPETENCIES.find((cmp) => cmp.key === selectedComp)!}
          bundle={compBundle}
          lang={lang}
          onClose={() => setSelectedComp(null)}
          onOpenProject={(id) => {
            setSelectedComp(null);
            openProject(id);
          }}
        />
      )}

      {/* ===== 프로젝트 상세 모달 ===== */}
      {selectedProject && (
        <ResumeProjectModal
          project={selectedProject}
          original={originalById.get(selectedProject.id) ?? null}
          lang={lang}
          onClose={() => setSelectedId(null)}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < flatProjects.length - 1}
          onPrev={() => selectedIndex > 0 && setSelectedId(flatProjects[selectedIndex - 1].id)}
          onNext={() =>
            selectedIndex < flatProjects.length - 1 && setSelectedId(flatProjects[selectedIndex + 1].id)
          }
        />
      )}
    </div>
  );
}

function CareerItem({
  item,
  lang,
}: {
  item: { from: string; to: string; title: string; detail?: string };
  lang: "ko" | "en";
}) {
  const [open, setOpen] = useState(false);
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  return (
    <li className="relative pl-7 pb-9 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-400 dark:bg-rose-300 ring-4 ring-[#f7f4ef] dark:ring-[#0e0e11]" />
      <p className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-1">
        {item.from} – {item.to}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">{item.title}</h3>
        {item.detail && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            {open ? t("접기 ▴", "less ▴") : t("자세히 ▾", "more ▾")}
          </button>
        )}
      </div>
      {open && item.detail && (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-[1.8] max-w-2xl">
          {item.detail}
        </p>
      )}
    </li>
  );
}

function fmtDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
}

function PostCard({
  title,
  date,
  image,
  href,
  internal,
  lang,
}: {
  title: string;
  date?: string;
  image?: string;
  href: string;
  internal?: boolean;
  lang: "ko" | "en";
}) {
  const inner = (
    <>
      {image ? (
        <div className="aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-white/5">
          <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-stone-100 to-stone-200 dark:from-white/10 dark:to-white/5" />
      )}
      <div className="p-5">
        <h4 className="font-display text-lg leading-snug text-stone-800 dark:text-stone-100 line-clamp-2">{title}</h4>
        {date && <p className="mt-2 font-mono text-[11px] text-stone-400 dark:text-stone-500">{fmtDate(date)}</p>}
        <p className="mt-3 text-xs font-medium text-[var(--accent)]">{lang === "ko" ? "자세히 보기 →" : "Read more →"}</p>
      </div>
    </>
  );
  const cls =
    "group block rounded-2xl border border-stone-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg hover:shadow-stone-200/60 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all";
  return internal ? (
    <Link to={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  );
}

function Section({ children, alt = false, id }: { children: React.ReactNode; alt?: boolean; id?: string }) {
  // alt 섹션은 살짝 다른 배경으로 영역을 구분 (풀폭 밴드 + 가운데 정렬 본문)
  return (
    <section id={id} className={`scroll-mt-28 ${alt ? "bg-stone-500/[0.045] dark:bg-white/[0.025]" : ""}`}>
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 border-t border-stone-200/70 dark:border-white/[0.07]">
        {children}
      </div>
    </section>
  );
}

function ProjectCard({
  p,
  lang,
  onOpen,
}: {
  p: ResumeProject;
  lang: "ko" | "en";
  onOpen: () => void;
}) {
  const tags = p.stack.slice(0, 6);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full text-left rounded-2xl border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg hover:shadow-stone-200/60 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all"
    >
      {p.image && (
        <div className="aspect-[16/9] overflow-hidden bg-stone-100 dark:bg-white/5">
          <img
            src={p.image}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-display text-xl text-stone-800 dark:text-stone-100">{p.title}</h4>
          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 shrink-0">{p.period}</span>
        </div>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
          {p.oneLiner}
        </p>
        <p className="mt-2 text-xs text-[var(--accent)]">
          {lang === "ko" ? "참여인원" : "Team"} {p.team} · {p.role.split("/")[0].trim()}
        </p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tg) => (
              <span
                key={tg}
                className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400"
              >
                {tg}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          {p.links.length > 0 ? (
            <div className="flex gap-2.5 text-stone-400 dark:text-stone-500">
              {p.links.map((l) => {
                const Icon = CARD_LINK_ICON[l.kind];
                return <Icon key={l.kind + l.url} size={13} />;
              })}
            </div>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-[var(--accent)]">
            {lang === "ko" ? "자세히 보기 →" : "View details →"}
          </span>
        </div>
      </div>
    </button>
  );
}
