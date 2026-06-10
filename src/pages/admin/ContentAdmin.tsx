// 사이트 텍스트 전체 편집 (nav/home/about/contact/modal …).
// 문자열은 입력칸으로, 중첩 배열(stacks/career 등)은 JSON 블록으로 편집.
// DB 에 아직 없으면 기존 정적 데이터를 불러와 편집/저장.
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { contentKo } from "@/data/content.ko";
import { contentEn } from "@/data/content.en";

type Lang = "ko" | "en";
type Json = Record<string, unknown>;

const STATIC: Record<Lang, Json> = {
  ko: contentKo as unknown as Json,
  en: contentEn as unknown as Json,
};

// 편집 화면에서 제외할 경로 (프로젝트 항목은 '프로젝트 관리'에서 편집)
const EXCLUDE = new Set(["projects.items"]);

// ---- 불변 path 헬퍼 ----
function setAtPath(root: unknown, path: string[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const obj = Array.isArray(root) ? [...root] : { ...(root as Json) };
  // @ts-expect-error 동적 인덱싱
  obj[head] = setAtPath((root as Json)?.[head], rest, value);
  return obj;
}

export default function ContentAdmin() {
  const { accessToken } = useAuth();
  const [lang, setLang] = useState<Lang>("ko");
  const [doc, setDoc] = useState<Json | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((l: Lang) => {
    setLoading(true);
    setMsg(null);
    setError(null);
    api
      .getContent(l)
      .then((data) => setDoc(data as Json))
      .catch(() => setDoc(structuredClone(STATIC[l]))) // 미등록 → 정적 데이터로 시작
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(lang), [lang, load]);

  const update = (path: string[], value: unknown) =>
    setDoc((d) => setAtPath(d, path, value) as Json);

  const save = async () => {
    if (!accessToken || !doc) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await api.putContent(accessToken, lang, doc);
      setMsg("저장되었습니다. (공개 사이트에 바로 반영)");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사이트 내용</h1>
        <div className="flex gap-2">
          {(["ko", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded text-sm ${
                lang === l ? "bg-white text-black" : "bg-gray-800 text-gray-300"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {msg && <p className="mb-4 text-green-400">{msg}</p>}
      {error && <p className="mb-4 text-red-400">{error}</p>}

      {loading || !doc ? (
        <p className="text-gray-500">불러오는 중…</p>
      ) : (
        <>
          <Node value={doc} path={[]} onChange={update} />
          <div className="sticky bottom-0 bg-black/90 py-4 mt-6 border-t border-gray-800">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2.5 bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- 재귀 노드 렌더러 ----
function Node({
  value,
  path,
  onChange,
}: {
  value: unknown;
  path: string[];
  onChange: (path: string[], value: unknown) => void;
}) {
  const key = path[path.length - 1];

  // 섹션 종류(type)는 드롭다운으로
  if (typeof value === "string" && key === "type") {
    const TYPES = ["timeline", "list", "cards", "text"];
    return (
      <Labeled label="type (섹션 종류)">
        <select value={value} onChange={(e) => onChange(path, e.target.value)} className="input">
          {!TYPES.includes(value) && <option value={value}>{value || "(선택하세요)"}</option>}
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
      </Labeled>
    );
  }

  // 문자열
  if (typeof value === "string") {
    const multiline = value.length > 60 || value.includes("\n");
    return (
      <Labeled label={key}>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
            className="input"
            rows={Math.min(8, value.split("\n").length + 1)}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(path, e.target.value)}
            className="input"
          />
        )}
      </Labeled>
    );
  }

  // 숫자/불리언
  if (typeof value === "number") {
    return (
      <Labeled label={key}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value))}
          className="input"
        />
      </Labeled>
    );
  }
  if (typeof value === "boolean") {
    return (
      <Labeled label={key}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
      </Labeled>
    );
  }

  // 배열 → 항목 추가/삭제 폼
  if (Array.isArray(value)) {
    return (
      <Labeled label={`${key} (목록)`}>
        <ArrayEditor value={value} path={path} onChange={onChange} />
      </Labeled>
    );
  }

  // 객체 → 재귀
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Json).filter(
      ([k]) => !EXCLUDE.has([...path, k].join(".")),
    );
    return (
      <div className={path.length === 0 ? "space-y-6" : "space-y-3 pl-3 border-l border-gray-800"}>
        {path.length > 0 && key && !/^\d+$/.test(key) && (
          <p className="text-sm font-semibold text-gray-300 pt-2">{key}</p>
        )}
        {entries.map(([k, v]) => (
          <Node key={k} value={v} path={[...path, k]} onChange={onChange} />
        ))}
        {path.join(".") === "projects" && (
          <p className="text-xs text-gray-500">
            ※ 프로젝트 항목 추가/수정은 ‘프로젝트 관리’ 탭에서 합니다.
          </p>
        )}
      </div>
    );
  }

  return null;
}

function Labeled({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      {children}
    </div>
  );
}

// 새 항목용 빈 값 (마지막 항목 구조를 복제해 비움)
function blank(v: unknown): unknown {
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v as Json).map(([k, x]) => [k, blank(x)]));
  return "";
}

// 배열 항목을 폼으로 추가/삭제 (각 항목은 재귀 렌더)
function ArrayEditor({
  value,
  path,
  onChange,
}: {
  value: unknown[];
  path: string[];
  onChange: (path: string[], value: unknown) => void;
}) {
  const add = () => onChange(path, [...value, value.length ? blank(value[value.length - 1]) : ""]);
  const remove = (i: number) => onChange(path, value.filter((_, idx) => idx !== i));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(path, next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded border border-gray-800 bg-gray-950/40 p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-600">#{i + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-gray-400 hover:text-white disabled:opacity-30" title="위로">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-xs text-gray-400 hover:text-white disabled:opacity-30" title="아래로">↓</button>
              <button onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
            </div>
          </div>
          <Node value={item} path={[...path, String(i)]} onChange={onChange} />
        </div>
      ))}
      <button onClick={add} className="text-xs text-blue-400 hover:text-blue-300">+ 추가</button>
    </div>
  );
}
