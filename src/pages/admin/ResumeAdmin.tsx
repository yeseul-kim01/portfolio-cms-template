// 이력서 "역량" 편집 (제목·설명·근거). 프로젝트는 '프로젝트 관리'에서 편집 → 이력서/포폴 동시 반영.
// DB content 문서 "resume" 의 competencies(카드) + competencyDesc/Evidence 를 다룬다.
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RESUME_BUNDLE_STATIC, type ResumeBundle } from "@/data/resumeBundle";

type Lang = "ko" | "en";
const LANGS: Lang[] = ["ko", "en"];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
// 근거에서 고를 프로젝트 id 목록 (이력서 프로젝트 id 기준)
const PROJECT_IDS = RESUME_BUNDLE_STATIC.projects.ko.map((p) => p.id);

export default function ResumeAdmin() {
  const { accessToken } = useAuth();
  const [bundle, setBundle] = useState<ResumeBundle | null>(null);
  const [lang, setLang] = useState<Lang>("ko");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"db" | "static">("static");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blogUrl, setBlogUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setMsg(null);
    setError(null);
    api
      .getContent("resume")
      .then((d) => {
        const b = d as unknown as ResumeBundle;
        if (b?.competencyEvidence) {
          setBundle(b);
          setSource("db");
        } else throw new Error("empty");
      })
      .catch(() => {
        setBundle(clone(RESUME_BUNDLE_STATIC));
        setSource("static");
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const update = (fn: (b: ResumeBundle) => void) =>
    setBundle((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      fn(next);
      return next;
    });

  const loadStatic = () => {
    setBundle(clone(RESUME_BUNDLE_STATIC));
    setSource("static");
    setMsg("정적 데이터를 불러왔어요. 저장하면 DB에 반영됩니다.");
  };

  const save = async () => {
    if (!accessToken || !bundle) return;
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      // 프로젝트는 별도 관리이지만, 호환을 위해 기존 projects 도 그대로 보존해 저장
      await api.putContent(accessToken, "resume", bundle as unknown as Record<string, unknown>);
      setSource("db");
      setMsg("저장 완료 — 이력서 페이지에 반영됐어요.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addPost = async () => {
    if (!accessToken || !blogUrl.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const p = await api.importPreview(accessToken, blogUrl.trim());
      update((b) => {
        (b.featuredPosts ??= []).push({
          url: p.source_url || blogUrl.trim(),
          title: p.title,
          date: p.published_at ?? undefined,
          image: p.cover_image ?? undefined,
          excerpt: p.excerpt,
        });
      });
      setBlogUrl("");
      setMsg("추가됨 — 저장을 눌러야 반영돼요.");
    } catch (e) {
      setError("미리보기 실패: " + (e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  if (loading || !bundle) return <p className="text-gray-500">불러오는 중…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sticky top-20 bg-black/80 backdrop-blur py-2 z-10">
        <div>
          <h1 className="text-2xl font-bold">이력서 — 역량 편집</h1>
          <p className="text-xs text-gray-500 mt-1">
            소스: <span className={source === "db" ? "text-green-400" : "text-amber-400"}>{source === "db" ? "DB" : "정적(미저장)"}</span>{" "}
            · 프로젝트 내용은 <span className="text-gray-300">‘프로젝트 관리’</span>의 resume 필드에서 편집해요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-gray-700 overflow-hidden text-sm">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 ${lang === l ? "bg-white text-black" : "text-gray-400 hover:bg-gray-900"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={loadStatic} className="px-3 py-2 text-sm border border-gray-700 rounded text-gray-300 hover:bg-gray-900">정적값</button>
          <button onClick={load} className="px-3 py-2 text-sm border border-gray-700 rounded text-gray-300 hover:bg-gray-900">되돌리기</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      {msg && <p className="text-green-400 text-sm mb-3">{msg}</p>}
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {/* 블로그 (직접 고른 글) */}
      <div className="rounded border border-gray-800 bg-gray-900/50 p-4 mb-4">
        <h3 className="font-semibold mb-1">블로그 — 직접 고른 글</h3>
        <p className="text-xs text-gray-500 mb-3">티스토리 글 URL을 붙여넣으면 제목·날짜·이미지를 가져와요. 이력서 ‘블로그’ 섹션에 카드로 표시됩니다.</p>
        <div className="flex gap-2 mb-3">
          <input
            className="input flex-1"
            placeholder="https://yourblog.tistory.com/123"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPost()}
          />
          <button onClick={addPost} disabled={adding} className="px-4 py-2 text-sm bg-white text-black rounded font-medium disabled:opacity-50 whitespace-nowrap">
            {adding ? "가져오는 중…" : "추가"}
          </button>
        </div>
        <ul className="space-y-2">
          {(bundle.featuredPosts ?? []).map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {p.image ? <img src={p.image} alt="" className="w-12 h-9 object-cover rounded shrink-0" /> : <span className="w-12 h-9 rounded bg-gray-800 shrink-0" />}
              <span className="flex-1 truncate">{p.title}</span>
              <span className="text-xs text-gray-500 shrink-0">{(p.date ?? "").slice(0, 10)}</span>
              <button onClick={() => update((b) => { b.featuredPosts?.splice(i, 1); })} className="text-xs text-red-400 hover:text-red-300 shrink-0">삭제</button>
            </li>
          ))}
          {(bundle.featuredPosts ?? []).length === 0 && <li className="text-xs text-gray-600">아직 없음 — URL을 추가하세요.</li>}
        </ul>
      </div>

      {/* 핵심 역량 카드 (라벨·레벨·색·스킬칩) — 포폴 Skills + 이력서 공통 */}
      <div className="rounded border border-gray-800 bg-gray-900/50 p-4 mb-4">
        <h3 className="font-semibold mb-1">핵심 역량 (카드)</h3>
        <p className="text-xs text-gray-500 mb-3">역량 바의 라벨·레벨·색·스킬칩. 포트폴리오 Skills 와 이력서에 공통 적용. (key 는 근거/제목과 연결되니 함부로 바꾸지 마세요)</p>
        <div className="space-y-3">
          {(bundle.competencies ?? []).map((c, i) => (
            <div key={i} className="rounded border border-gray-800 bg-gray-950/60 p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="라벨" value={c.label} onChange={(e) => update((b) => { b.competencies![i].label = e.target.value; })} />
                <input type="number" className="input w-20" placeholder="레벨" value={c.level} onChange={(e) => update((b) => { b.competencies![i].level = Number(e.target.value) || 0; })} />
                <select className="input w-28" value={c.accent} onChange={(e) => update((b) => { b.competencies![i].accent = e.target.value; })}>
                  {["blue", "violet", "emerald", "amber", "rose", "indigo"].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={() => update((b) => { b.competencies!.splice(i, 1); })} className="text-xs text-red-400 hover:text-red-300 px-2">삭제</button>
              </div>
              <input className="input font-mono text-xs" placeholder="key" value={c.key} onChange={(e) => update((b) => { b.competencies![i].key = e.target.value; })} />
              <input className="input" placeholder="스킬 칩 (쉼표)" value={c.skills.join(", ")} onChange={(e) => update((b) => { b.competencies![i].skills = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); })} />
              <input className="input" placeholder="매칭 태그 (쉼표) — 프로젝트 태그와 겹치면 강조" value={c.tags.join(", ")} onChange={(e) => update((b) => { b.competencies![i].tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); })} />
              <input className="input" placeholder="한 줄 설명(blurb)" value={c.blurb} onChange={(e) => update((b) => { b.competencies![i].blurb = e.target.value; })} />
            </div>
          ))}
          <button
            onClick={() => update((b) => { (b.competencies ??= []).push({ key: "new", label: "새 역량", level: 80, blurb: "", skills: [], tags: [], accent: "blue" }); })}
            className="text-xs text-blue-400 hover:text-blue-300"
          >+ 역량 추가</button>
        </div>
      </div>

      <div className="space-y-4">
        {(bundle.competencies ?? []).map(({ key, label }) => (
          <div key={key} className="rounded border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="font-semibold mb-3">{label} <span className="text-xs text-gray-500">({key}) · 제목은 ‘핵심 역량(카드)’의 라벨을 그대로 씁니다</span></h3>
            <p className="text-xs text-gray-500 mb-1">설명</p>
            <textarea
              rows={3}
              value={bundle.competencyDesc[lang]?.[key] ?? ""}
              onChange={(e) => update((b) => { (b.competencyDesc[lang] ??= {})[key] = e.target.value; })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 leading-6 focus:outline-none focus:border-gray-400 mb-3"
            />
            <p className="text-xs text-gray-500 mb-1">근거 (이렇게 활용했어요)</p>
            <div className="space-y-3">
              {(bundle.competencyEvidence[lang]?.[key] ?? []).map((ev, i) => (
                <div key={i} className="rounded border border-gray-800 bg-gray-950/60 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="input flex-1"
                      value={ev.projectId}
                      onChange={(e) => update((b) => { b.competencyEvidence[lang][key][i].projectId = e.target.value; })}
                    >
                      {PROJECT_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
                      {!PROJECT_IDS.includes(ev.projectId) && <option value={ev.projectId}>{ev.projectId}</option>}
                    </select>
                    <button onClick={() => update((b) => { b.competencyEvidence[lang][key].splice(i, 1); })} className="text-xs text-red-400 hover:text-red-300 px-2">삭제</button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="한 일"
                    value={ev.what}
                    onChange={(e) => update((b) => { b.competencyEvidence[lang][key][i].what = e.target.value; })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 leading-6 focus:outline-none focus:border-gray-400"
                  />
                  <input className="input" placeholder="성능·효과 (선택)" value={ev.impact ?? ""} onChange={(e) => update((b) => { b.competencyEvidence[lang][key][i].impact = e.target.value || undefined; })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" placeholder="이미지 경로 (선택)" value={ev.image ?? ""} onChange={(e) => update((b) => { b.competencyEvidence[lang][key][i].image = e.target.value || undefined; })} />
                    <input className="input" placeholder="이미지 캡션 (선택)" value={ev.caption ?? ""} onChange={(e) => update((b) => { b.competencyEvidence[lang][key][i].caption = e.target.value || undefined; })} />
                  </div>
                </div>
              ))}
              <button
                onClick={() => update((b) => { (b.competencyEvidence[lang] ??= {})[key] ??= []; b.competencyEvidence[lang][key].push({ projectId: PROJECT_IDS[0] ?? "", what: "" }); })}
                className="text-xs text-blue-400 hover:text-blue-300"
              >+ 근거 추가</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
