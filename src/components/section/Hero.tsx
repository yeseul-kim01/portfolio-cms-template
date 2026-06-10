import { ChevronDown } from "lucide-react";
import { site } from "@/config/site";

type HeroProps = {
  home: {
    title: string;
    subtitle: string;
    intro: string;
    summary: string;
    cta: string;
  };
};

export const Hero = ({ home }: HeroProps) => {
  // 개발 중 데이터 로딩/구조 변경으로 home이 비는 경우를 방지
  if (!home) return null;

  return (
    <div className="relative">
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden"
      >
        {/* 오로라 배경 (은은하게 움직임) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="animate-aurora absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-[var(--accent)] opacity-20 blur-[120px]" />
          <div
            className="animate-aurora absolute top-10 right-1/4 h-[380px] w-[380px] rounded-full bg-[var(--accent)] opacity-10 blur-[120px]"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="animate-aurora absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[120px]"
            style={{ animationDelay: "-12s" }}
          />
        </div>

        {/* 홈 중앙 이미지 (site.heroImage 가 있을 때만) */}
        {site.heroImage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[280px] z-0 pointer-events-none">
            <div className="animate-floaty w-full h-full">
              <img
                src={site.heroImage}
                alt=""
                className="w-full h-full object-contain opacity-20 [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 text-center max-w-3xl">
          <h1
            className="animate-fade-up text-5xl md:text-6xl font-bold whitespace-pre-line mb-4 leading-tight tracking-tight"
            style={{ animationDelay: "0.05s" }}
          >
            {home.title}
          </h1>
          <h3
            className="animate-fade-up text-2xl md:text-3xl font-bold whitespace-pre-line mb-10 leading-snug text-gradient-flow"
            style={{ animationDelay: "0.2s" }}
          >
            {home.subtitle}
          </h3>
          <p
            className="animate-fade-up text-gray-300 whitespace-pre-line mb-6 leading-relaxed"
            style={{ animationDelay: "0.35s" }}
          >
            {home.intro}
          </p>
          <p
            className="animate-fade-up text-gray-500 whitespace-pre-line mb-10 leading-relaxed text-sm"
            style={{ animationDelay: "0.5s" }}
          >
            {home.summary}
          </p>
          <a
            href="#projects"
            className="animate-fade-up group inline-flex items-center justify-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-semibold hover:bg-gray-200 hover:scale-105 transition-all shadow-lg shadow-white/5"
            style={{ animationDelay: "0.65s" }}
          >
            {home.cta}
            <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* 스크롤 인디케이터 */}
        <a
          href="#about"
          aria-label="scroll down"
          className="animate-bounce-down absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[var(--muted)] hover:text-white"
        >
          <ChevronDown size={26} />
        </a>
      </section>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </div>
  );
};
