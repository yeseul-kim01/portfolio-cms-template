import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { site } from '@/config/site';

type HeaderProps = {
  nav?: Record<string, string>;
  lang?: 'ko' | 'en';
  onToggle?: () => void;
};

export const Header = ({ nav = {}, lang = 'ko', onToggle }: HeaderProps) => (
  <header className="fixed top-0 w-full bg-black/90 border-b border-gray-800 z-40">
    <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
      <div className="font-bold">{site.brand}</div>
      <div className="flex gap-6 items-center">
        {Object.entries(nav).map(([k, v]) => (
          <a key={k} href={`#${k}`} className="text-sm hover:text-[var(--muted)]">
            {v as string}
          </a>
        ))}
        <Link to="/blog" className="text-sm hover:text-[var(--muted)]">
          {lang === 'ko' ? '블로그' : 'Blog'}
        </Link>
        <Link to="/resume" className="text-sm hover:text-[var(--muted)]">
          {lang === 'ko' ? '이력서' : 'Resume'}
        </Link>
        <button
          onClick={() => onToggle?.()}
          className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded"
        >
          <Globe size={14} />
          {lang === 'ko' ? 'ENG' : 'KO'}
        </button>
      </div>
    </nav>
  </header>
);
