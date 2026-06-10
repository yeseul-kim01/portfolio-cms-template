// 프로젝트 관리. 중첩 구조가 커서 JSON 직접 편집 방식(개발자 친화적).
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/types/project";

const TEMPLATE = {
  id: "new-project",
  slug: "new-project",
  name: "새 프로젝트",
  title: "새 프로젝트",
  category: "project",
  order: 500,
  tagline: "",
  period: "",
  role: "",
  summary: "",
  tags: [],
  links: {},
  sections: [],
};

export default function ProjectsAdmin() {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    api
      .listProjects()
      .then((p) => {
        setProjects(p);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(load, [load]);

  const edit = (p: Project) => {
    setSelectedId(p.id);
    setDraft(JSON.stringify(p, null, 2));
    setMsg(null);
    setError(null);
  };

  const newProject = () => {
    setSelectedId("__new__");
    setDraft(JSON.stringify(TEMPLATE, null, 2));
    setMsg(null);
    setError(null);
  };

  const save = async () => {
    if (!accessToken) return;
    let parsed: Project;
    try {
      parsed = JSON.parse(draft);
    } catch {
      return setError("JSON 형식이 올바르지 않습니다.");
    }
    if (!parsed.id) return setError("id 필드는 필수입니다.");
    try {
      await api.upsertProject(accessToken, parsed.id, parsed);
      setMsg("저장되었습니다.");
      setSelectedId(parsed.id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (p: Project) => {
    if (!accessToken) return;
    if (!confirm(`"${p.title ?? p.id}" 프로젝트를 삭제할까요?`)) return;
    await api.deleteProject(accessToken, p.id);
    if (selectedId === p.id) setSelectedId(null);
    load();
  };

  // 이미지 업로드 → S3 → URL 반환(클립보드 복사). JSON 의 image.src 에 붙여넣기.
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setUploading(true);
    setError(null);
    try {
      const prefix = `projects/${selectedId === "__new__" ? "new" : selectedId}`;
      const url = await api.uploadImage(accessToken, file, prefix);
      setUploadedUrl(url);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* 클립보드 권한 없으면 무시 — 아래에 URL 표시됨 */
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">프로젝트 관리</h1>
        <button
          onClick={newProject}
          className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200"
        >
          + 새 프로젝트
        </button>
      </div>

      {loading && <p className="text-gray-500">불러오는 중…</p>}
      {error && <p className="mb-4 text-red-400">{error}</p>}
      {msg && <p className="mb-4 text-green-400">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* 목록 */}
        <ul className="space-y-1">
          {projects.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded px-3 py-2 ${
                selectedId === p.id ? "bg-gray-800" : "hover:bg-gray-900"
              }`}
            >
              <button onClick={() => edit(p)} className="text-left min-w-0 truncate">
                <span className="block truncate">{p.title ?? p.id}</span>
                <span className="block text-xs text-gray-500">{p.category}</span>
              </button>
              <button
                onClick={() => remove(p)}
                className="text-red-400 hover:text-red-300 text-sm shrink-0 ml-2"
              >
                삭제
              </button>
            </li>
          ))}
          {!loading && projects.length === 0 && (
            <li className="text-gray-500 text-sm">프로젝트가 없습니다.</li>
          )}
        </ul>

        {/* 편집기 */}
        <div>
          {selectedId ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                className="w-full h-[520px] font-mono text-sm bg-gray-900 border border-gray-700 rounded p-3 text-white"
              />
              <div className="flex gap-3 mt-3 items-center">
                <button
                  onClick={save}
                  className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200"
                >
                  저장
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {uploading ? "업로드 중…" : "이미지 업로드"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  className="hidden"
                />
              </div>

              {uploadedUrl && (
                <div className="mt-3 p-3 bg-gray-900 border border-gray-700 rounded text-xs">
                  <p className="text-green-400 mb-1">✅ 업로드 완료 (URL 복사됨). 아래를 JSON 에 붙여넣으세요:</p>
                  <code className="block break-all text-gray-300 mb-2">{uploadedUrl}</code>
                  <p className="text-gray-500">
                    예) sections 의 한 항목에:&nbsp;
                    <code className="text-gray-300">
                      "image": {`{`} "src": "{uploadedUrl}", "alt": "", "caption": "" {`}`}
                    </code>
                  </p>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                구조는 src/types/project.ts 참고. sections/links 는 중첩 JSON 그대로 작성하세요.
                이미지는 위 ‘이미지 업로드’로 올린 뒤 나온 URL 을 image.src 에 넣으면 됩니다.
              </p>
            </>
          ) : (
            <p className="text-gray-500">왼쪽에서 프로젝트를 선택하거나 새로 만드세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
