// 이력서 전용 프로젝트 상세 모달.
// 큐레이션(프로젝트 설명 / 내가 한 일 / 핵심 설계 키포인트) + 원본 DB 섹션(개요·아키텍처·성능·결과·이미지/영상)을
// 한 화면에 세로 스크롤로 모두 보여주고, 상단 탭으로 각 섹션으로 점프한다. 라이트/다크 테마 대응.
import { useEffect, useRef, useState } from "react";
import {
  X, ChevronLeft, ChevronRight, Github, ExternalLink, BookOpen, FileText, Globe, Brain,
} from "lucide-react";
import type { ResumeProject, ResumeLink } from "@/data/resumeProjects";
import type { Project, ProjectSection, ProjectSectionImage } from "@/types/project";

const LINK_META: Record<ResumeLink["kind"], { label: string; labelEn: string; Icon: typeof Github }> = {
  github: { label: "GitHub", labelEn: "GitHub", Icon: Github },
  demo: { label: "데모", labelEn: "Demo", Icon: ExternalLink },
  blog: { label: "개발기록", labelEn: "Dev log", Icon: BookOpen },
  notion: { label: "Notion", labelEn: "Notion", Icon: FileText },
  live: { label: "운영 서비스", labelEn: "Live", Icon: Globe },
  huggingface: { label: "Hugging Face", labelEn: "Hugging Face", Icon: Brain },
};

const youtubeEmbed = (url?: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

function MediaBlock({ media }: { media: ProjectSectionImage }) {
  const yt = youtubeEmbed(media.src);
  const isVideo = media.src?.toLowerCase().endsWith(".mp4");
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-white/5 p-3">
      {yt ? (
        <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            src={yt}
            title={media.alt || "video"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isVideo ? (
        <video src={media.src} controls loop muted className="w-full max-h-[70vh] object-contain rounded-xl" />
      ) : (
        <img src={media.src} alt={media.alt || ""} loading="lazy" className="w-full max-h-[70vh] object-contain rounded-xl block" />
      )}
      {media.caption && <p className="mt-2 text-xs leading-6 text-stone-500 dark:text-stone-400">{media.caption}</p>}
    </div>
  );
}

// 원본 DB 섹션 한 개를 테마 대응으로 렌더
function DbSectionBlock({ section }: { section: ProjectSection }) {
  const items = section.items;
  const stringItems = Array.isArray(items) && typeof items[0] === "string" ? (items as string[]) : [];
  const objItems =
    Array.isArray(items) && items.length > 0 && typeof items[0] === "object"
      ? (items as { title: string; description: string }[])
      : [];
  const isPerf = section.type === "performance";

  return (
    <div className="space-y-4">
      {section.content && (
        <p className="text-[15px] leading-[1.85] text-stone-700 dark:text-stone-300 whitespace-pre-line">
          {section.content}
        </p>
      )}

      {section.image?.src && <MediaBlock media={section.image} />}
      {section.images?.map((m, i) => <MediaBlock key={i} media={m} />)}

      {stringItems.length > 0 && (
        <ul className="space-y-2">
          {stringItems.map((it, i) => (
            <li key={i} className="relative pl-5 text-[15px] leading-7 text-stone-700 dark:text-stone-300">
              <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-400 dark:bg-rose-300" />
              {it}
            </li>
          ))}
        </ul>
      )}

      {section.stacks && (
        <div className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-3">
          {Object.entries(section.stacks).map(([group, techs]) => (
            <div key={group} className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="min-w-[96px] text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 pt-1">
                {group}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {techs.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 text-xs text-stone-600 dark:text-stone-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {objItems.length > 0 && (
        <div className={isPerf ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
          {objItems.map((it, i) => (
            <div
              key={i}
              className={
                isPerf
                  ? "rounded-2xl border border-emerald-500/20 dark:border-emerald-400/20 bg-emerald-500/5 dark:bg-emerald-400/10 p-4"
                  : "rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 border-l-4 border-l-rose-300 dark:border-l-rose-400/50"
              }
            >
              <p className={`text-sm font-semibold mb-1.5 ${isPerf ? "text-emerald-700 dark:text-emerald-300" : "text-stone-800 dark:text-stone-100"}`}>
                {it.title}
              </p>
              <p className="text-[14px] leading-7 text-stone-600 dark:text-stone-300">{it.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  project: ResumeProject;
  original?: Project | null;
  lang: "ko" | "en";
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function ResumeProjectModal({ project, original, lang, onClose, hasPrev, hasNext, onPrev, onNext }: Props) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("desc");

  // 원본 섹션은 한국어 데이터라 ko 일 때만 노출.
  // 큐레이션과 겹치는 것만 "제목 기준"으로 제외 (type 으로 거르면 같은 type 의 알맹이 섹션까지 빠짐).
  //  - "프로젝트 개요" → 프로젝트 설명과 중복
  //  - role 타입(내가 맡은 역할/공부한 것) → 내가 한 일과 중복
  //  - 일반 "핵심 설계/구현/학습 포인트" → 핵심 설계 키포인트와 중복
  const DUP_TITLES = new Set([
    "프로젝트 개요",
    "핵심 설계 포인트",
    "핵심 설계 / 구현 전략",
    "핵심 학습 포인트",
    "핵심 구현 포인트",
  ]);
  const origSections =
    lang === "ko"
      ? (original?.sections ?? []).filter(
          (s) => s.type !== "role" && !DUP_TITLES.has((s.title ?? "").trim()),
        )
      : [];

  const tabs = [
    { id: "desc", label: t("프로젝트 설명", "About") },
    { id: "did", label: t("내가 한 일", "What I did") },
    { id: "key", label: t("핵심 설계 키포인트", "Key points") },
    ...origSections.map((s, i) => ({ id: `orig-${i}`, label: s.title })),
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // 프로젝트 바뀌면 맨 위로
  useEffect(() => {
    setActive("desc");
    bodyRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  const goTo = (id: string) => {
    setActive(id);
    bodyRef.current?.querySelector(`[data-sec="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-40px)] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-white/10 bg-[#faf8f5] dark:bg-[#16161a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-7 pt-6 pb-3 border-b border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-3xl text-stone-900 dark:text-white leading-tight">{project.title}</h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{project.oneLiner}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="close"
              className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center border border-stone-300 dark:border-white/15 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-mono">{project.period}</span>
            <span className="text-stone-300 dark:text-stone-600">·</span>
            <span>{t("참여인원", "Team")} {project.team}</span>
            <span className="text-stone-300 dark:text-stone-600">·</span>
            <span className="text-rose-500/90 dark:text-rose-300/80">{project.role}</span>
          </div>

          {project.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.links.map((l) => {
                const meta = LINK_META[l.kind];
                const Icon = meta.Icon;
                return (
                  <a
                    key={l.kind + l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-300/80 dark:border-white/15 text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-white/10 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
                  >
                    <Icon size={13} />
                    {lang === "ko" ? meta.label : meta.labelEn}
                  </a>
                );
              })}
            </div>
          )}

          {/* 섹션 선택 탭 (상단 고정, 가로 스크롤) */}
          <div className="mt-3 -mb-px flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active === tab.id
                    ? "bg-stone-800 text-white border-stone-800 dark:bg-white dark:text-stone-900 dark:border-white"
                    : "bg-transparent text-stone-500 dark:text-stone-400 border-stone-300 dark:border-white/15 hover:border-stone-400 dark:hover:border-white/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 본문 (세로 스크롤) */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-7 py-6 space-y-9">
          {/* 1) 프로젝트 설명 */}
          <section data-sec="desc" className="scroll-mt-2">
            <SectionLabel>{t("프로젝트 설명", "About the project")}</SectionLabel>
            <p className="text-[15px] leading-[1.85] text-stone-700 dark:text-stone-300">{project.description}</p>
            {project.image && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 bg-white dark:bg-white/5">
                <img src={project.image} alt={project.title} className="w-full object-contain" />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200/70 dark:border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* 2) 내가 한 일 */}
          <section data-sec="did" className="scroll-mt-2">
            <SectionLabel>{t("내가 한 일", "What I did")}</SectionLabel>
            <ul className="space-y-2">
              {project.contributions.map((item, i) => (
                <li key={i} className="relative pl-5 text-[15px] leading-7 text-stone-700 dark:text-stone-300">
                  <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-400 dark:bg-rose-300" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3) 핵심 설계 키포인트 */}
          <section data-sec="key" className="scroll-mt-2">
            <SectionLabel>{t("핵심 설계 키포인트", "Key design points")}</SectionLabel>
            <div className="space-y-3">
              {project.keyPoints.map((kp, i) => (
                <div key={i} className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h4 className="font-semibold text-stone-800 dark:text-stone-100">{kp.title}</h4>
                    {kp.tech && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800/90 dark:bg-white/10 text-white dark:text-stone-200 shrink-0">
                        {kp.tech}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-stone-400">{kp.detail}</p>
                  {kp.impact && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 px-3 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 pt-0.5 shrink-0">
                        {t("성능·효과", "Impact")}
                      </span>
                      <span className="text-sm text-emerald-800 dark:text-emerald-100 leading-6">{kp.impact}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 4) 원본 상세 (DB 섹션) */}
          {origSections.length > 0 && (
            <div className="pt-2 border-t border-dashed border-stone-300/70 dark:border-white/10 space-y-9">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                {t("프로젝트 상세", "Project detail")}
              </p>
              {origSections.map((s, i) => (
                <section key={i} data-sec={`orig-${i}`} className="scroll-mt-2">
                  <h4 className="font-display text-2xl text-stone-800 dark:text-stone-100 mb-3">{s.title}</h4>
                  <DbSectionBlock section={s} />
                </section>
              ))}
            </div>
          )}

          {/* 이전/다음 */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 dark:border-white/15 px-4 py-3 text-sm font-medium text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} /> {t("이전", "Prev")}
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/60 dark:border-rose-400/20 bg-rose-50 dark:bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-100 dark:hover:bg-rose-400/15 transition-colors"
            >
              {t("다음", "Next")} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400/90 dark:text-rose-300/80 mb-3">
      {children}
    </p>
  );
}
