// Site text (English) — sample. Edit real content in /admin → "사이트 내용" (stored in DB).
import { Project } from '@/types/project';

export const contentEn = {
  nav: { home: 'Home', about: 'About', projects: 'Projects', contact: 'Contact' },

  home: {
    title: `Your Name`,
    subtitle: `Backend · AI · Infrastructure Engineer`,
    intro: `Write a one-line intro here.\nEdit it in /admin → "사이트 내용".`,
    summary: `Briefly summarize your skills and strengths.`,
    cta: 'View Projects',
    quote: 'Successful development includes not only coding, but also debugging, testing, deployment, and maintenance.',
  },

  about: {
    title: 'About Me',
    skillsNote: 'Introduce your core strengths in one line.',
    p1: 'Short intro (top line)',
    p2: 'Short intro (bottom line)',
    intro: 'Write your about paragraph here. Editable from the admin.',
    // Free-form sections for the portfolio About (add any type/order). type: timeline | list | cards | text
    sections: [
      { type: 'cards', title: '', items: [
        { title: 'Card title (free)', text: 'Write anything — e.g. approach, interests, growth…' },
        { title: 'Card title (free)', text: 'Write anything here.' },
      ] },
      { type: 'timeline', title: 'Career', items: [
        { from: 'Jan 2024', to: 'Present', title: 'Title / Org', detail: 'What you did.' },
      ] },
      { type: 'timeline', title: 'Education', items: [
        { from: '2019', to: '2025', title: 'University — Major', detail: '' },
      ] },
      { type: 'list', title: 'Certificates · Awards', items: [
        { date: 'Jan 2025', title: 'Item title', detail: 'note', org: 'Issuer/Organizer' },
      ] },
      { type: 'text', title: 'About', text: 'A free text section. Write anything you want.' },
    ],
    stacks: [
      {
        group: 'Backend',
        items: [
          { name: 'Spring Boot', level: 'Advanced', detail: 'Describe here.' },
          { name: 'FastAPI', level: 'Intermediate', detail: 'Describe here.' },
        ],
      },
      {
        group: 'Frontend',
        items: [{ name: 'React', level: 'Intermediate', detail: 'Describe here.' }],
      },
    ],
    certificates: [
      { date: 'Jan 2025', title: 'Certificate name', detail: 'note', org: 'Issuer' },
    ],
    awards: [{ date: 'Jan 2025', title: 'Award name', org: 'Organizer' }],
    career: [
      { from: 'Jan 2024', to: 'Present', title: 'Title / Org', detail: 'What you did.' },
    ],
    education: [
      { from: '2019', to: '2025', name: 'University — Major', detail: '' },
    ],
  },

  projects: {
    title: 'Projects',
    note: 'Add your projects in /admin → Projects.',
    items: [] as Project[],
  },

  contact: { title: 'Contact', note: 'How to reach you.' },

  modal: {
    accessTitle: 'Service Access Notice',
    continueBtn: 'Continue',
    closeBtn: 'Close',
    noUrl: 'This project is not publicly accessible.',
  },
};
