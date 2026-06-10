export interface ProjectSectionImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ProjectSectionDecision {
  title: string;
  description: string;
}

export interface ProjectSection {
  type: 'overview' | 'role' | 'architecture' | 'decisions' | 'performance'|'result' | string;
  title: string;
  content?: string;
  items?: string[] | ProjectSectionDecision[];
  stacks?: Record<string, string[]>;
  image?: ProjectSectionImage;
  images?: ProjectSectionImage[];
}

export interface ProjectLinks {
  github?: undefined | string;
  demo?: undefined | string;
  blog?: undefined | string;
  notion?: undefined | string;
  huggingface?: undefined | string;
}

export interface Project {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  category?: 'featured' | 'project' | 'career' | 'toy' | string;
  tagline?: string;
  subtitle?: string;
  url?: string | null;
  accessNote?: string;
  description?: string;
  design?: string;
  period?: string;
  role?: string;
  summary?: string;
  tags?: string[];
  links?: ProjectLinks;
  sections?: ProjectSection[];
}
