import { useState } from "react";
import { Reveal } from "@/components/common/Reveal";

type Tip = { x: number; y: number; title: string; sub?: string; detail: string };

export const About = ({ about }: any) => {
  const [tip, setTip] = useState<Tip | null>(null);
  const showTip = (e: React.MouseEvent, title: string, detail?: string, sub?: string) => {
    if (!detail) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, title, detail, sub });
  };
  const hideTip = () => setTip(null);

  return (
    <section id="about" className="px-6 py-28 max-w-5xl mx-auto scroll-mt-24">
      {/* Header */}
      <Reveal>
        <p className="text-sm font-mono text-[var(--accent)] mb-3 tracking-widest">ABOUT ME</p>
        <h2 className="text-4xl font-bold mb-10">{about.title}</h2>
      </Reveal>

      {/* Statement */}
      <Reveal delay={0.05}>
        <p className="text-3xl md:text-4xl font-semibold leading-tight mb-8">
          {about.p1}
          <br />
          <span className="text-gradient-flow">{about.p2}</span>
        </p>
      </Reveal>

      {/* Intro */}
      <Reveal delay={0.1}>
        <div className="text-gray-300 whitespace-pre-line max-w-3xl leading-[1.9] mb-14">
          {about.intro}
        </div>
      </Reveal>

      {/* 자유 섹션 (사용자가 원하는 종류·순서로 — /admin 사이트 내용 about.sections) */}
      {(about.sections ?? []).map((sec: AboutSection, si: number) => (
        <SectionBlock key={si} sec={sec} showTip={showTip} hideTip={hideTip} />
      ))}

      {/* hover 상세 팝오버 (career / 수상) */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tip.x, top: tip.y - 12, transform: "translate(-50%, -100%)" }}
        >
          <div className="max-w-[480px] rounded-xl border border-gray-700 bg-black/90 backdrop-blur px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{tip.title}</span>
              {tip.sub && (
                <span className="text-[11px] text-[var(--muted)] border border-gray-700 rounded-full px-2 py-0.5">
                  {tip.sub}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {tip.detail}
            </div>
            <div className="w-2 h-2 bg-black/90 border-r border-b border-gray-700 rotate-45 mx-auto mt-3" />
          </div>
        </div>
      )}
    </section>
  );
};

type SectionItem = {
  from?: string;
  to?: string;
  date?: string;
  title?: string;
  text?: string;
  detail?: string;
  org?: string;
};
type AboutSection = {
  type: "timeline" | "list" | "cards" | "text";
  title?: string;
  text?: string;
  items?: SectionItem[];
};

function SectionBlock({
  sec,
  showTip,
  hideTip,
}: {
  sec: AboutSection;
  showTip: (e: React.MouseEvent, title: string, detail?: string, sub?: string) => void;
  hideTip: () => void;
}) {
  const items = sec.items ?? [];

  if (sec.type === "text") {
    return (
      <Reveal>
        <div className="mb-16">
          {sec.title && <h3 className="text-xl font-semibold mb-5">{sec.title}</h3>}
          <p className="text-[var(--muted)] whitespace-pre-line leading-[1.9] max-w-3xl">{sec.text}</p>
        </div>
      </Reveal>
    );
  }

  if (sec.type === "cards") {
    return (
      <Reveal>
        <div className="mb-16">
          {sec.title && <h3 className="text-xl font-semibold mb-5">{sec.title}</h3>}
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((c, i) => (
              <div key={i} className="h-full border border-neutral-800 rounded-2xl p-6 bg-white/[0.02] hover:border-neutral-600 hover:-translate-y-1 transition-all">
                <h4 className="font-semibold mb-3 text-[var(--accent)]">{c.title}</h4>
                <p className="text-sm text-[var(--muted)] whitespace-pre-line leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    );
  }

  // timeline | list (표/타임라인 — 호버 시 상세)
  return (
    <Reveal>
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-5">
          {sec.title && <h3 className="text-xl font-semibold">{sec.title}</h3>}
          <span className="text-xs text-gray-500 font-medium">마우스를 올리면 상세 설명</span>
        </div>
        <div className="border border-neutral-800 rounded-2xl overflow-hidden">
          {items.map((it, i) => {
            const period = sec.type === "timeline" ? `${it.from ?? ""} ~ ${it.to ?? ""}` : it.date ?? "";
            const tipDetail =
              sec.type === "list"
                ? `${it.org ?? ""}${it.detail ? (it.org ? "\n\n" : "") + it.detail : ""}`
                : it.detail;
            const hoverable = !!(it.detail || it.org);
            return (
              <div
                key={i}
                onMouseEnter={(e) => hoverable && showTip(e, it.title ?? "", tipDetail, period)}
                onMouseLeave={hideTip}
                className={`flex flex-col sm:flex-row sm:gap-4 px-6 py-4 border-b border-neutral-900 last:border-b-0 transition-colors ${
                  hoverable ? "cursor-help hover:bg-neutral-900/40" : "cursor-default"
                }`}
              >
                <div className="w-40 shrink-0 text-sm text-gray-500">{period}</div>
                <div>
                  <div className="text-sm text-gray-200">{it.title}</div>
                  {sec.type === "list" && it.org && (
                    <div className="text-xs text-gray-500 mt-0.5">{it.org}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
