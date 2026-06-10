// src/pages/Portfolio.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApplyTheme } from "@/lib/useSiteTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjects } from "@/hooks/useProjects";
import { Hero } from "@/components/section/Hero";
import { Projects } from "@/components/section/Project";
import { About } from "@/components/section/About";
import { Skills } from "@/components/section/Skills";
import { Contact } from "@/components/section/Contact";
import type { Competency } from "@/data/competencies";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { ProjectModal } from "@/components/projects/ProjectModal";
import type { Project } from "@/types/project";

const Portfolio = () => {
  useApplyTheme("portfolio");
  const { lang, setLang, content } = useLanguage();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeSkill, setActiveSkill] = useState<Competency | null>(null);

  // 포트폴리오 조회수 트래킹 (1회)
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    api.track("portfolio_view", "home");
  }, []);

  const handleSelectSkill = (comp: Competency) => {
    setActiveSkill((prev) => {
      const next = prev?.key === comp.key ? null : comp;
      if (next) {
        // 선택 시 프로젝트 섹션으로 부드럽게 이동
        setTimeout(() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }), 80);
      }
      return next;
    });
  };

  const staticItems = useMemo(() => content.projects?.items ?? [], [content.projects]);
  // DB 에 프로젝트가 있으면 그것으로, 없으면 정적 데이터로 표시
  const projectItems = useProjects(staticItems);
  const projectsBlock = useMemo(
    () => ({ ...content.projects, items: projectItems }),
    [content.projects, projectItems],
  );
  const activeProjectIndex = useMemo(() => {
    if (!activeProject) return -1;
    return projectItems.findIndex((item: Project) => item.id === activeProject.id);
  }, [activeProject, projectItems]);

  const handleToggleLang = () => setLang((prev) => (prev === "ko" ? "en" : "ko"));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Header nav={content.nav} lang={lang} onToggle={handleToggleLang} />

      <main className="flex-1 pt-20">
        <Hero home={content.home} />

        <About about={content.about} />
        <Skills
          activeKey={activeSkill?.key ?? null}
          onSelect={handleSelectSkill}
          stacks={content.about?.stacks as never}
          note={(content.about as { skillsNote?: string })?.skillsNote}
        />
        <Projects
          projects={projectsBlock}
          onSelect={setActiveProject}
          label={lang === "ko" ? "자세히 보기" : "View Details"}
          activeSkill={activeSkill}
        />
        <Contact contact={content.contact} />
      </main>

      <Footer />

      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onPrevProject={() => {
            if (activeProjectIndex > 0) setActiveProject(projectItems[activeProjectIndex - 1]);
          }}
          onNextProject={() => {
            if (activeProjectIndex >= 0 && activeProjectIndex < projectItems.length - 1) setActiveProject(projectItems[activeProjectIndex + 1]);
          }}
          hasPrevProject={activeProjectIndex > 0}
          hasNextProject={activeProjectIndex >= 0 && activeProjectIndex < projectItems.length - 1}
        />
      )}
    </div>
  );
};

export default Portfolio;
