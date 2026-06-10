// 사이트 텍스트(한국어) — 샘플. 실제 내용은 /admin 의 '사이트 내용'에서 편집(DB 저장).
import { Project } from '@/types/project';

export const contentKo = {
  nav: { home: '홈', about: '소개', projects: '프로젝트', contact: '연락처' },

  home: {
    title: `Your Name`,
    subtitle: `Backend · AI · Infrastructure Engineer`,
    intro: `여기에 한 줄 소개를 적으세요.\n/admin 의 '사이트 내용'에서 수정할 수 있어요.`,
    summary: `보유 기술과 강점을 짧게 요약하세요.`,
    cta: '프로젝트 보기',
    quote: 'Successful development includes not only coding, but also debugging, testing, deployment, and maintenance.',
  },

  about: {
    title: 'About Me',
    skillsNote: '핵심 역량을 한 줄로 소개하세요.',
    p1: '한 줄 소개 (윗줄)',
    p2: '한 줄 소개 (아랫줄)',
    intro: '자기소개 문단을 적으세요. 관리자에서 편집할 수 있습니다.',
    // 포트폴리오 About 의 자유 섹션 (원하는 종류·순서로 추가). type: timeline | list | cards | text
    sections: [
      { type: 'cards', title: '', items: [
        { title: '카드 제목 (자유)', text: '내용을 자유롭게 적으세요. 예) 개발 관점, 관심사, 성장 방향…' },
        { title: '카드 제목 (자유)', text: '내용을 자유롭게 적으세요.' },
      ] },
      { type: 'timeline', title: 'Career', items: [
        { from: '2024.01', to: '현재', title: '직함 / 소속', detail: '한 일을 적으세요.' },
      ] },
      { type: 'timeline', title: 'Education', items: [
        { from: '2019', to: '2025', title: '대학교 — 전공', detail: '' },
      ] },
      { type: 'list', title: '자격 · 수상', items: [
        { date: '2025.01', title: '항목 제목', detail: '비고', org: '기관/주최' },
      ] },
      { type: 'text', title: '소개', text: '자유 텍스트 섹션입니다. 원하는 내용을 적으세요.' },
    ],
    stacks: [
      {
        group: 'Backend',
        items: [
          { name: 'Spring Boot', level: '상', detail: '설명을 적으세요.' },
          { name: 'FastAPI', level: '중', detail: '설명을 적으세요.' },
        ],
      },
      {
        group: 'Frontend',
        items: [{ name: 'React', level: '중', detail: '설명을 적으세요.' }],
      },
    ],
    certificates: [
      { date: '2025.01', title: '자격증 이름', detail: '비고', org: '발급 기관' },
    ],
    awards: [{ date: '2025.01', title: '수상 내역', org: '주최' }],
    career: [
      { from: '2024.01', to: '현재', title: '직함 / 소속', detail: '한 일을 적으세요.' },
    ],
    education: [
      { from: '2019', to: '2025', name: '대학교 — 전공', detail: '' },
    ],
  },

  projects: {
    title: 'Projects',
    note: '대표 프로젝트를 /admin 의 프로젝트 관리에서 추가하세요.',
    items: [] as Project[],
  },

  contact: { title: 'Contact', note: '연락 방법을 적으세요.' },

  modal: {
    accessTitle: '서비스 접근 안내',
    continueBtn: '이동',
    closeBtn: '닫기',
    noUrl: '공개되지 않은 프로젝트입니다.',
  },
};
