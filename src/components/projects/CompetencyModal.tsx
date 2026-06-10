// 역량 카드 클릭 시 뜨는 모달.
// "이 능력은 어떤 프로젝트에서 무엇으로 검증됐나"를 보여주고, 프로젝트명을 누르면 해당 프로젝트 상세로 연결.
import { useEffect, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
import type { Competency } from "@/data/competencies";
import { ACCENT } from "@/data/competencies";
import { type CompEvidence } from "@/data/resumeProjects";
import { type ResumeBundle } from "@/data/resumeBundle";

type Props = {
  competency: Competency;
  bundle: ResumeBundle;
  lang: "ko" | "en";
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
};

export function CompetencyModal({ competency, bundle, lang, onClose, onOpenProject }: Props) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const accent = ACCENT[competency.accent] ?? ACCENT.blue;
  const evidence = bundle.competencyEvidence[lang][competency.key] ?? [];
  const projects = bundle.projects[lang];
  const titleOf = (id: string) => projects.find((p) => p.id === id)?.title ?? id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100vh-40px)] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-white/10 bg-[#faf8f5] dark:bg-[#16161a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-7 pt-6 pb-5 border-b border-stone-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400/90 dark:text-rose-300/80 mb-1">
                {t("핵심 역량", "Core Strength")}
              </p>
              <h3 className="font-display text-3xl text-stone-900 dark:text-white leading-tight">
                {competency.label}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="close"
              className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center border border-stone-300 dark:border-white/15 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {bundle.competencyDesc[lang][competency.key]}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {competency.skills.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200/70 dark:border-white/10"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* 검증 근거 */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-4">
            {t("이렇게 활용했어요", "How I used it")}
          </p>
          <div className="space-y-3">
            {evidence.map((ev, i) => (
              <EvidenceCard
                key={i}
                ev={ev}
                title={titleOf(ev.projectId)}
                accentBar={accent.bar}
                lang={lang}
                onOpen={() => onOpenProject(ev.projectId)}
              />
            ))}
          </div>
          <p className="mt-5 text-xs text-stone-400 dark:text-stone-500">
            {t("프로젝트명을 누르면 해당 프로젝트 상세 설명이 열려요.", "Click a project name to open its full description.")}
          </p>
        </div>
      </div>
    </div>
  );
}

function EvidenceCard({
  ev,
  title,
  accentBar,
  lang,
  onOpen,
}: {
  ev: CompEvidence;
  title: string;
  accentBar: string;
  lang: "ko" | "en";
  onOpen: () => void;
}) {
  const t = (ko: string, en: string) => (lang === "ko" ? ko : en);
  const [open, setOpen] = useState(false);
  const long = ev.what.length > 150; // 긴 근거만 접기/펼치기

  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={onOpen}
        className="group inline-flex items-center gap-1 text-sm font-semibold text-stone-800 dark:text-stone-100 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
      >
        <span className={`h-2 w-2 rounded-full ${accentBar}`} />
        {title}
        <ArrowUpRight size={14} className="opacity-50 group-hover:opacity-100" />
      </button>
      <p
        className={`mt-2 text-sm leading-7 text-stone-600 dark:text-stone-400 ${
          long && !open ? "line-clamp-2" : ""
        }`}
      >
        {ev.what}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 text-xs font-medium text-rose-500/90 dark:text-rose-300/80 hover:underline"
        >
          {open ? t("접기 ▴", "Show less ▴") : t("상세 보기 ▾", "Show more ▾")}
        </button>
      )}
      {ev.impact && (
        <div className="mt-2.5 inline-flex items-start gap-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300 pt-0.5 shrink-0">
            {t("성능", "Impact")}
          </span>
          <span className="text-sm text-emerald-800 dark:text-emerald-100 leading-6">{ev.impact}</span>
        </div>
      )}
      {ev.image && (
        <figure className="mt-3 rounded-xl overflow-hidden border border-stone-200 dark:border-white/10 bg-white dark:bg-white/5">
          <img src={ev.image} alt={ev.caption || ""} loading="lazy" className="w-full object-contain" />
          {ev.caption && (
            <figcaption className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-white/10">
              {ev.caption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}
