import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 브라우저 탭 아이콘 — 배포 스크립트의 export(process.env) 와 .env 파일 둘 다 지원, 없으면 기본 logo.svg
  const favicon = process.env.VITE_FAVICON || env.VITE_FAVICON || '/logo.svg';
  return {
    plugins: [
      react(),
      {
        name: 'html-favicon',
        transformIndexHtml(html: string) {
          return html.replace('href="/logo.svg"', `href="${favicon}"`);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
