// 블로그/관리자 페이지 공용 상단바. 홈 헤더(Header.tsx)와 톤을 맞춤.
import { Link } from "react-router-dom";
import { site } from "@/config/site";

export function SiteNav({ right }: { right?: React.ReactNode }) {
  return (
    <header className="fixed top-0 w-full bg-black/90 border-b border-gray-800 z-40">
      <nav className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="font-bold">
          {site.brand}
        </Link>
        <div className="flex gap-6 items-center text-sm">
          <Link to="/" className="hover:text-[var(--muted)]">
            포트폴리오
          </Link>
          <Link to="/blog" className="hover:text-[var(--muted)]">
            블로그
          </Link>
          <Link to="/resume" className="hover:text-[var(--muted)]">
            이력서
          </Link>
          {right}
        </div>
      </nav>
    </header>
  );
}
