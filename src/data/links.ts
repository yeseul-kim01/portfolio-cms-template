import { Github, BookOpen, Brain, Mail } from 'lucide-react';
import { site } from '@/config/site';

// 소셜 링크 — 값은 src/config/site.ts 에서. (huggingface 는 비우면 자동 숨김)
export const links = [
  { icon: Github, label: 'GitHub', url: site.github },
  ...(site.huggingface ? [{ icon: Brain, label: 'huggingface', url: site.huggingface }] : []),
  { icon: BookOpen, label: 'Tech Blog', url: site.blogUrl },
  { icon: Mail, label: 'Email', url: `mailto:${site.email}` },
];
