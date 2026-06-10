import { ChevronRight } from 'lucide-react';
import type { Project } from '@/types/project';

type ProjectCardProps = {
  project: Project;
  label: string;
  onClick: () => void;
  dimmed?: boolean;
  highlighted?: boolean;
};

const categoryLabelMap: Record<string, string> = {
  featured: 'LIVE SERVICE',
  project: 'PROJECT',
  career: 'COMPANY',
  toy: 'TOY',
};

export const ProjectCard = ({ project, label, onClick, dimmed = false, highlighted = false }: ProjectCardProps) => {
  const title = project.title ?? project.name ?? '';
  const subtitle = project.subtitle ?? project.tagline ?? '';
  const tags = project.tags ?? [];
  const badge = categoryLabelMap[project.category ?? 'project'] ?? 'PROJECT';
  const isFeatured = project.category === 'featured';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className={`border rounded-2xl p-6 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl ${
        isFeatured
          ? 'border-accent-soft bg-gradient-to-br from-slate-900 via-slate-950 to-black hover:border-accent-soft md:p-8'
          : 'border-gray-800 bg-gradient-to-br from-gray-900 to-black hover:border-gray-600 hover:-translate-y-1'
      } ${dimmed ? 'opacity-30 grayscale' : 'opacity-100'} ${
        highlighted ? 'ring-2 ring-white/70 border-transparent -translate-y-1' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className={`inline-flex mb-3 px-3 py-1 rounded-full text-[11px] tracking-[0.18em] ${
            isFeatured
              ? 'border border-accent-soft text-[var(--accent)] bg-accent-soft'
              : 'border border-gray-700 text-gray-300 bg-white/5'
          }`}>
            {badge}
          </span>
          <h3 className="text-2xl font-bold group-hover:text-gray-100 transition-colors leading-tight">
            {title}
          </h3>
        </div>
        {project.period && (
          <span className="text-xs text-gray-500 whitespace-nowrap pt-1">{project.period}</span>
        )}
      </div>

      <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed whitespace-pre-line">{subtitle}</p>

      {project.description && (
        <p className="text-gray-500 text-sm whitespace-pre-line leading-relaxed mb-4 line-clamp-3">
          {project.description}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs border border-gray-700 text-gray-300 bg-white/5"
            >
              {tag}
            </span>
          ))}
          {tags.length > 6 && <span className="text-xs text-gray-500 px-1">+{tags.length - 6}</span>}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 text-[var(--muted)] group-hover:text-white transition-colors">
        <span className="text-sm">{label}</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
};
