// 테마(색)를 DB(content "theme")에서 한 번 불러와 CSS 변수로 적용.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import { DEFAULT_THEME, mergeTheme, themeVars, type Area, type SiteTheme } from "@/lib/theme";

let cache: SiteTheme | null = null;
let inflight: Promise<SiteTheme> | null = null;

function fetchTheme(): Promise<SiteTheme> {
  if (cache) return Promise.resolve(cache);
  if (!isApiEnabled) return Promise.resolve(DEFAULT_THEME);
  if (!inflight) {
    inflight = api
      .getContent("theme")
      .then((d) => mergeTheme(d))
      .catch(() => DEFAULT_THEME)
      .then((t) => (cache = t));
  }
  return inflight;
}

export function clearThemeCache() {
  cache = null;
  inflight = null;
}

// 해당 영역 테마를 documentElement 의 CSS 변수로 설정
export function useApplyTheme(area: Area): SiteTheme[Area] {
  const [theme, setTheme] = useState<SiteTheme>(cache ?? DEFAULT_THEME);
  useEffect(() => {
    let alive = true;
    fetchTheme().then((t) => alive && setTheme(t));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVars(theme[area])).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [theme, area]);
  return theme[area];
}
