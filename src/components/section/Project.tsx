import type { Project } from '@/types/project';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { projectMatchesCompetency, type Competency } from '@/data/competencies';

type ProjectCategory = 'featured' | 'project' | 'career' | 'toy';

type ProjectsBlock = {
  title: string;
  note: string;
  items: Project[];
};

type ProjectsProps = {
  projects: ProjectsBlock;
  label: string;
  onSelect: (project: Project) => void;
  activeSkill?: Competency | null;
};

const sectionMeta: Record<ProjectCategory, { title: string; description: string; featured?: boolean }> = {
  featured: {
    title: 'Featured',
    description: '현재 운영 중이거나 대표성을 가장 잘 보여주는 프로젝트입니다.',
    featured: true,
  },
  project: {
    title: 'Projects',
    description: '서비스 수준으로 설계·구현한 주요 프로젝트입니다.',
  },
  career: {
    title: 'Company Work',
    description: '회사 및 인턴 환경에서 수행한 실무 프로젝트입니다.',
  },
  toy: {
    title: 'Toy Projects',
    description: '짧은 주기로 실험하거나 문제를 빠르게 검증한 프로젝트입니다.',
  },
};

export const Projects = ({ projects, label, onSelect, activeSkill }: ProjectsProps) => {
  if (!projects) return null;

  const categorized = projects.items?.reduce<Record<ProjectCategory, Project[]>>(
    (acc, project) => {
      const category = (project.category as ProjectCategory) || 'project';
      if (!acc[category]) acc[category] = [];
      acc[category].push(project);
      return acc;
    },
    { featured: [], project: [], career: [], toy: [] },
  );

  const order: ProjectCategory[] = ['featured', 'project', 'career', 'toy'];

  return (
    <section id="projects" className="px-6 py-24 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">{projects.title}</h2>
        <p className="text-gray-500 mb-4 text-sm whitespace-pre-line">{projects.note}</p>
        {activeSkill && (
          <p className="mb-10 text-sm text-gray-300">
            <span className="text-white font-semibold">{activeSkill.label}</span> 역량과 연결된 프로젝트를 강조 중
          </p>
        )}
        {!activeSkill && <div className="mb-8" />}

        <div className="space-y-16">
          {order.map((category) => {
            const items = categorized?.[category] ?? [];
            if (items.length === 0) return null;

            const meta = sectionMeta[category];
            const gridClass = meta.featured ? 'grid grid-cols-1 gap-6' : 'grid md:grid-cols-2 gap-6';

            return (
              <div key={category}>
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">{meta.title}</h3>
                  <p className="text-sm text-gray-500">{meta.description}</p>
                </div>

                <div className={gridClass}>
                  {items.map((p) => {
                    const matched = !activeSkill || projectMatchesCompetency(p.tags, activeSkill);
                    return (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        label={label}
                        onClick={() => onSelect(p)}
                        dimmed={!matched}
                        highlighted={Boolean(activeSkill) && matched}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
