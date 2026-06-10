// 사이트 색 테마 (영역별). DB content 문서 "theme" 에 저장, 없으면 아래 기본값.
// CSS 변수로 적용: --bg / --surface / --text / --muted / --accent / --border
export type AreaTheme = {
  bg: string; // 페이지 배경
  surface: string; // 카드/패널 배경
  text: string; // 기본 텍스트
  muted: string; // 보조 텍스트
  accent: string; // 강조색 (버튼·링크·하이라이트)
  border: string; // 테두리
};
export type Area = "portfolio" | "blog" | "resume";
export type SiteTheme = Record<Area, AreaTheme>;

export const THEME_TOKENS: { key: keyof AreaTheme; label: string }[] = [
  { key: "bg", label: "배경" },
  { key: "surface", label: "카드/표면" },
  { key: "text", label: "텍스트" },
  { key: "muted", label: "보조 텍스트" },
  { key: "accent", label: "강조색" },
  { key: "border", label: "테두리" },
];

export const DEFAULT_THEME: SiteTheme = {
  portfolio: { bg: "#0a0a0a", surface: "#121216", text: "#ffffff", muted: "#9ca3af", accent: "#a78bfa", border: "#26262e" },
  blog: { bg: "#000000", surface: "#0b0b0d", text: "#ffffff", muted: "#9ca3af", accent: "#a78bfa", border: "#1f2630" },
  resume: { bg: "#f7f4ef", surface: "#ffffff", text: "#292524", muted: "#78716c", accent: "#e11d48", border: "#e7e5e4" },
};

// area 테마를 CSS 변수 객체로
export function themeVars(t: AreaTheme): Record<string, string> {
  return {
    "--bg": t.bg,
    "--surface": t.surface,
    "--text": t.text,
    "--muted": t.muted,
    "--accent": t.accent,
    "--border": t.border,
  };
}

export function mergeTheme(partial: unknown): SiteTheme {
  const p = (partial ?? {}) as Partial<SiteTheme>;
  const out = {} as SiteTheme;
  (["portfolio", "blog", "resume"] as Area[]).forEach((a) => {
    out[a] = { ...DEFAULT_THEME[a], ...(p[a] ?? {}) };
  });
  return out;
}
