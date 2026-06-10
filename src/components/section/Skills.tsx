// 통합 Skills 섹션 — 역량 바(애니메이션 + 클릭 강조) + 상세 스킬 칩(레벨/설명).
// 상세 칩은 about.stacks(5축, 같은 순서)에서 가져온다.
import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT, type Competency } from "@/data/competencies";
import { useCompetencies } from "@/lib/useCompetencies";

type SkillItem = { name: string; level?: string; detail?: string };
type StackGroup = { group: string; items: SkillItem[] };

type SkillsProps = {
  activeKey: string | null;
  onSelect: (comp: Competency) => void;
  stacks?: StackGroup[];
  note?: string;
};

// 레벨 → 칩 스타일 (강도 시각화)
function levelChip(level?: string): string {
  switch ((level || "").trim()) {
    case "상":
      return "border-gray-400 text-white bg-white/10";
    case "중상":
      return "border-gray-600 text-gray-200 bg-white/[0.04]";
    case "중":
      return "border-gray-700 text-[var(--muted)]";
    default:
      return "border-gray-800 text-gray-500";
  }
}

export const Skills = ({ activeKey, onSelect, stacks = [], note }: SkillsProps) => {
  const competencies = useCompetencies();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // 칩 hover 시 상세 설명 팝오버
  const [tip, setTip] = useState<{ x: number; y: number; item: SkillItem } | null>(null);
  const showTip = (e: React.MouseEvent<HTMLSpanElement>, item: SkillItem) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, item });
  };
  const hideTip = () => setTip(null);

  // 역량 라벨 → 상세 스킬 항목 매핑 (about.stacks 와 동일한 5축 라벨)
  const itemsByLabel = useMemo(() => {
    const m = new Map<string, SkillItem[]>();
    for (const g of stacks) m.set(g.group, g.items || []);
    return m;
  }, [stacks]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="skills" ref={ref} className="px-6 py-24 scroll-mt-24">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-3">Skills</h2>
        <p className="text-gray-500 text-sm mb-2">
          {note ?? "핵심 역량을 한 줄로 소개하세요."}
        </p>
        <p className="text-gray-600 text-xs mb-12">
          역량 카드를 누르면 관련 프로젝트가 강조됩니다 · 다시 누르면 해제 · 칩에 마우스를 올리면 상세 설명
        </p>

        <div className="space-y-6">
          {competencies.map((c, i) => {
            const accent = ACCENT[c.accent];
            const active = activeKey === c.key;
            const dim = activeKey !== null && !active;
            const detailItems = itemsByLabel.get(c.label) ?? [];
            return (
              <div
                key={c.key}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(c);
                  }
                }}
                className={`block w-full text-left rounded-2xl border p-5 transition-all cursor-pointer ${
                  active
                    ? `border-transparent ring-2 ${accent.ring} bg-white/[0.03]`
                    : "border-gray-800 hover:border-gray-600 bg-white/[0.02]"
                } ${dim ? "opacity-50" : "opacity-100"}`}
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-semibold text-white">{c.label}</span>
                  <span className={`text-sm font-mono ${accent.text}`}>{c.level}</span>
                </div>

                {/* 애니메이션 바 */}
                <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${accent.bar} transition-[width] duration-1000 ease-out`}
                    style={{
                      width: visible ? `${c.level}%` : "0%",
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-3 leading-6">{c.blurb}</p>

                {/* 상세 스킬 칩 (레벨 색 + 설명 툴팁) */}
                {detailItems.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {detailItems.map((s) => (
                      <span
                        key={s.name}
                        onMouseEnter={(e) => s.detail && showTip(e, s)}
                        onMouseLeave={hideTip}
                        className={`px-2.5 py-1 rounded-full text-[11px] border ${
                          s.detail ? "cursor-help" : ""
                        } ${levelChip(s.level)}`}
                      >
                        {s.name}
                        {s.level && <span className="ml-1 opacity-60">· {s.level}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 설명 팝오버 (칩 hover) */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tip.x, top: tip.y - 12, transform: "translate(-50%, -100%)" }}
        >
          <div className="max-w-[440px] rounded-xl border border-gray-700 bg-black/90 backdrop-blur px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{tip.item.name}</span>
              {tip.item.level && (
                <span className="text-[11px] text-gray-300 border border-gray-700 rounded-full px-2 py-0.5">
                  {tip.item.level}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {tip.item.detail}
            </div>
            <div className="w-2 h-2 bg-black/90 border-r border-b border-gray-700 rotate-45 mx-auto mt-3" />
          </div>
        </div>
      )}
    </section>
  );
};
