import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Github, ChevronLeft, ChevronRight, X, FileText, BookOpen, Brain } from 'lucide-react';
import type { Project, ProjectSection, ProjectSectionImage } from '@/types/project';

type ProjectModalProps = {
  project: Project;
  onClose: () => void;
  onPrevProject?: () => void;
  onNextProject?: () => void;
  hasPrevProject?: boolean;
  hasNextProject?: boolean;
};

const LinkButton = ({
  href,
  label,
  icon,
  primary = false,
}: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) => {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors',
        primary
          ? 'bg-white text-black border border-white hover:bg-gray-200 font-semibold shadow-lg'
          : 'border border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800',
      ].join(' ')}
    >
      {icon}
      {label}
    </a>
  );
};

const FloatingSectionArrow = ({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'absolute top-1/2 -translate-y-1/2 z-20 h-14 w-14 rounded-full flex items-center justify-center',
        'border shadow-lg transition-all',
        direction === 'left' ? '-left-7' : '-right-7',
        disabled
          ? 'bg-gray-900/70 border-gray-800 text-gray-700 cursor-not-allowed'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:scale-105',
      ].join(' ')}
      aria-label={direction === 'left' ? 'previous section' : 'next section'}
    >
      {direction === 'left' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
    </button>
  );
};

// 유튜브 URL(watch?v= / youtu.be/ / embed/)에서 임베드 주소를 만든다.
const youtubeEmbed = (url?: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

// 이미지 / 유튜브 / mp4 한 장을 렌더 (캡션 포함). 섹션의 image, images[] 모두에서 재사용.
const MediaBlock = ({
  media,
  fallbackTitle,
}: {
  media: ProjectSectionImage;
  fallbackTitle?: string;
}) => {
  const ytEmbed = youtubeEmbed(media.src);
  const isVideo = media.src?.endsWith('.MP4');
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4">
      {ytEmbed ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-gray-900" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            src={ytEmbed}
            title={media.alt || fallbackTitle}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isVideo ? (
        <video
          src={media.src}
          controls
          autoPlay
          loop
          muted
          className="w-full max-h-[70vh] object-contain rounded-xl bg-gray-900"
        />
      ) : (
        <img
          src={media.src}
          alt={media.alt || fallbackTitle}
          className="w-full max-h-[70vh] object-contain rounded-xl block bg-gray-900"
        />
      )}
      {media.caption && (
        <p className="mt-3 text-xs leading-6 text-gray-500">{media.caption}</p>
      )}
    </div>
  );
};

const SectionContent = ({ section }: { section: ProjectSection }) => {

  const roleItems =
    section.type === 'role' && Array.isArray(section.items)
      ? (section.items as string[])
      : [];
  const decisions =
    section.type === 'decisions' && Array.isArray(section.items)
      ? (section.items as { title: string; description: string }[])
      : [];
  const performanceItems =
    section.type === 'performance' && Array.isArray(section.items)
      ? (section.items as { title: string; description: string }[])
      : [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-white mb-3">{section.title}</h3>
        {section.content && (
          <p className="text-base leading-[1.85] text-gray-200 whitespace-pre-line">{section.content}</p>
        )}
      </div>


      {section.image?.src && <MediaBlock media={section.image} fallbackTitle={section.title} />}

      {section.images?.map((media, i) => (
        <MediaBlock key={i} media={media} fallbackTitle={section.title} />
      ))}

      {roleItems.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
          <ul className="space-y-3">
            {roleItems.map((item, i) => (
              <li key={i} className="relative pl-5 text-[15px] leading-7 text-gray-200">
                <span className="absolute left-0 top-3 h-2 w-2 rounded-full bg-[var(--accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.type === 'architecture' && section.stacks && (
        <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
          {Object.entries(section.stacks).map(([group, techs]) => (
            <div key={group} className="flex flex-col md:flex-row md:items-start gap-3">
              <div className="min-w-[100px] text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 pt-1">
                {group}
              </div>
              <div className="flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full border border-gray-700 bg-white/5 text-xs text-gray-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {decisions.length > 0 && (
        <div className="space-y-4">
          {decisions.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-800 bg-slate-950/70 p-5 border-l-4 border-l-[var(--accent)]"
            >
              <p className="text-base font-semibold text-[var(--accent)] mb-2">{item.title}</p>
              <p className="text-[15px] leading-7 text-gray-200">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {performanceItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {performanceItems.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
            >
              <p className="text-sm font-semibold text-emerald-300 mb-2">{item.title}</p>
              <p className="text-[15px] leading-7 text-gray-200">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LegacyProjectContent = ({ project }: { project: Project }) => {
  return (
    <>
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">서비스 접근 안내</h4>
        <p className="text-[var(--muted)] text-sm whitespace-pre-line leading-7">{project.accessNote}</p>
      </div>

      <div className="mb-6">
        <p className="text-gray-300 text-sm whitespace-pre-line mb-3 leading-7">{project.description}</p>
        <p className="text-[var(--muted)] text-sm whitespace-pre-line leading-7">{project.design}</p>
      </div>

      <div className="flex gap-3">
        {project.url ? (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            서비스로 이동
            <ExternalLink size={16} />
          </a>
        ) : (
          <div className="flex-1 bg-gray-800 text-gray-500 px-6 py-3 rounded-xl font-medium text-center cursor-not-allowed">
            외부 접근이 제한된 프로젝트입니다.
          </div>
        )}
      </div>
    </>
  );
};

export const ProjectModal = ({
  project,
  onClose,
  onPrevProject,
  onNextProject,
  hasPrevProject = false,
  hasNextProject = false,
}: ProjectModalProps) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const sections = project.sections ?? [];
  const hasEnhancedLayout = sections.length > 0;

  useEffect(() => {
    setActiveSectionIndex(0);
  }, [project.id]);

  const activeSection = useMemo(() => sections[activeSectionIndex], [sections, activeSectionIndex]);
  const totalSections = sections.length;

  const handlePrevSection = useCallback(() => {
    setActiveSectionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextSection = useCallback(() => {
    setActiveSectionIndex((prev) => Math.min(totalSections - 1, prev + 1));
  }, [totalSections]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!hasEnhancedLayout) return;
      if (e.key === 'ArrowLeft') handlePrevSection();
      if (e.key === 'ArrowRight') handleNextSection();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, hasEnhancedLayout, handlePrevSection, handleNextSection]);

  if (!project) return null;

  const title = project.title ?? project.name ?? '';
  const subtitle = project.subtitle ?? project.tagline ?? '';
  const tags = project.tags ?? [];
  const hasLinks = Boolean(project.links && Object.values(project.links).some(Boolean));

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-[28px] max-w-5xl w-full max-h-[calc(100vh-40px)] relative shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-800 bg-black/80 px-6 pt-4 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-white leading-tight truncate">{title}</h3>
              {subtitle && <p className="text-sm text-[var(--muted)] mt-1 line-clamp-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-9 w-9 rounded-full border border-gray-700 bg-gray-900 text-[var(--muted)] hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center"
              aria-label="close"
            >
              <X size={18} />
            </button>
          </div>

          {/* 메타 + 링크 (한 줄, 작게) */}
          {(project.period || project.role || hasLinks) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500">
              {project.period && <span>{project.period}</span>}
              {project.role && <span className="text-[var(--muted)] truncate max-w-full">· {project.role}</span>}
              {hasLinks && (
                <span className="flex flex-wrap gap-2 md:ml-auto">
                  <LinkButton href={project.links?.demo} label="View Service" icon={<ExternalLink size={14} />} primary />
                  <LinkButton href={project.links?.github} label="GitHub" icon={<Github size={14} />} />
                  <LinkButton href={project.links?.huggingface} label="Hugging Face" icon={<Brain size={14} />} />
                  <LinkButton href={project.links?.blog} label="기술 블로그" icon={<BookOpen size={14} />} />
                  <LinkButton href={project.links?.notion} label="Notion" icon={<FileText size={14} />} />
                </span>
              )}
            </div>
          )}

          {/* 섹션 탭 (헤더 고정, 줄바꿈 — 한눈에 전부 보이게) */}
          {hasEnhancedLayout && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sections.map((section, index) => (
                <button
                  key={section.title}
                  onClick={() => setActiveSectionIndex(index)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    index === activeSectionIndex
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-[var(--muted)] border-gray-700 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {project.summary && activeSectionIndex === 0 && (
            <div className="bg-accent-soft border border-accent-soft border-l-4 border-l-[var(--accent)] rounded-2xl px-5 py-4 mb-6">
              <p className="text-sm leading-7 text-white">{project.summary}</p>
            </div>
          )}

          {hasEnhancedLayout ? (
            <>
              <div className="relative">
                <FloatingSectionArrow
                  direction="left"
                  onClick={handlePrevSection}
                  disabled={activeSectionIndex === 0}
                />

                <FloatingSectionArrow
                  direction="right"
                  onClick={handleNextSection}
                  disabled={activeSectionIndex === totalSections - 1}
                />

                <div className="px-2 md:px-6">
                  {activeSection && <SectionContent section={activeSection} />}
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[11px] border border-gray-800 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {(hasPrevProject || hasNextProject) && (
                <div className="mt-9 pt-6 border-t border-gray-800 flex flex-col md:flex-row gap-3">
                  <button
                    onClick={onPrevProject}
                    disabled={!hasPrevProject}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-700 px-4 py-4 text-sm font-semibold text-gray-200 disabled:text-gray-600 disabled:bg-gray-900/60 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    이전 프로젝트 보기
                  </button>
                  <button
                    onClick={onNextProject}
                    disabled={!hasNextProject}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-accent-soft bg-accent-soft px-4 py-4 text-sm font-semibold text-[var(--accent)] disabled:text-gray-600 disabled:bg-gray-900/60 disabled:border-gray-800 disabled:cursor-not-allowed hover:bg-accent-soft transition-colors"
                  >
                    다음 프로젝트 보기
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <LegacyProjectContent project={project} />
          )}
        </div>
      </div>
    </div>
  );
};