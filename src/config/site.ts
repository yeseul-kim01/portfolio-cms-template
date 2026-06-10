// 사이트 신원/소셜 — 본인 정보로 바꾸세요.
// 빌드 시 환경변수(VITE_*)로 덮어쓸 수 있고, 없으면 아래 기본값을 씁니다.
export const site = {
  name: import.meta.env.VITE_SITE_NAME || "Your Name",
  brand: import.meta.env.VITE_SITE_BRAND || "PF", // 상단바 로고 텍스트 (예: 이니셜)
  role: import.meta.env.VITE_SITE_ROLE || "Backend · AI · Infrastructure Engineer",
  email: import.meta.env.VITE_SITE_EMAIL || "you@example.com",
  domain: import.meta.env.VITE_SITE_DOMAIN || "example.com",
  blogUrl: import.meta.env.VITE_BLOG_URL || "https://yourblog.tistory.com",
  github: import.meta.env.VITE_GITHUB_URL || "https://github.com/your-id",
  huggingface: import.meta.env.VITE_HF_URL || "",
  heroImage: import.meta.env.VITE_HERO_IMAGE || "", // 홈 중앙 로고/이미지 (public 경로). 비우면 숨김
};
