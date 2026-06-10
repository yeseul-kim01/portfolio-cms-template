// 사이트 색 테마 편집 — 영역별(포트폴리오·블로그·이력서) 색 지정. DB content "theme" 저장.
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clearThemeCache } from "@/lib/useSiteTheme";
import { DEFAULT_THEME, mergeTheme, THEME_TOKENS, type Area, type SiteTheme } from "@/lib/theme";

const AREAS: { key: Area; label: string }[] = [
  { key: "portfolio", label: "포트폴리오" },
  { key: "blog", label: "블로그" },
  { key: "resume", label: "이력서" },
];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export default function ThemeAdmin() {
  const { accessToken } = useAuth();
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .getContent("theme")
      .then((d) => setTheme(mergeTheme(d)))
      .catch(() => setTheme(clone(DEFAULT_THEME)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const setColor = (area: Area, token: string, value: string) =>
    setTheme((prev) => ({ ...prev, [area]: { ...prev[area], [token]: value } }));

  const save = async () => {
    if (!accessToken) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await api.putContent(accessToken, "theme", theme as unknown as Record<string, unknown>);
      clearThemeCache();
      setMsg("저장 완료 — 새로고침하면 사이트에 반영돼요.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">불러오는 중…</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">색 테마</h1>
          <p className="text-xs text-gray-500 mt-1">
            영역별 배경·텍스트·강조색을 지정해요. (세부 회색 음영 등 일부는 디자인 기본값 유지)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTheme(clone(DEFAULT_THEME))} className="px-3 py-2 text-sm border border-gray-700 rounded text-gray-300 hover:bg-gray-900">기본값</button>
          <button onClick={load} className="px-3 py-2 text-sm border border-gray-700 rounded text-gray-300 hover:bg-gray-900">되돌리기</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      {msg && <p className="text-green-400 text-sm mb-3">{msg}</p>}
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid gap-5 md:grid-cols-3">
        {AREAS.map(({ key, label }) => (
          <div key={key} className="rounded border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{label}</h3>
              {/* 미리보기 */}
              <span
                className="text-xs px-2 py-1 rounded"
                style={{ background: theme[key].surface, color: theme[key].text, border: `1px solid ${theme[key].border}` }}
              >
                <span style={{ color: theme[key].accent }}>●</span> 미리보기
              </span>
            </div>
            <div className="space-y-2">
              {THEME_TOKENS.map(({ key: tk, label: tl }) => (
                <div key={tk} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 shrink-0">{tl}</span>
                  <input
                    type="color"
                    value={theme[key][tk]}
                    onChange={(e) => setColor(key, tk, e.target.value)}
                    className="h-8 w-10 rounded bg-transparent border border-gray-700 cursor-pointer"
                  />
                  <input
                    value={theme[key][tk]}
                    onChange={(e) => setColor(key, tk, e.target.value)}
                    className="input flex-1 font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
