// 환경변수 모음. API 가 설정돼 있으면 DB 모드, 아니면 정적 데이터 fallback.
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
};

export const isApiEnabled = Boolean(config.apiBaseUrl);
