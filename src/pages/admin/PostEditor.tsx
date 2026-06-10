// 글 작성/수정 에디터. 마크다운 + 이미지 업로드 + 임시저장/발행.
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { PostInput } from "@/lib/types";
import type { Project } from "@/types/project";

const EMPTY: PostInput = {
  slug: "",
  lang: "ko",
  title: "",
  excerpt: "",
  content: "",
  cover_image: "",
  tags: [],
  status: "draft",
  project_id: "",
  source_url: "",
};

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PostInput>(EMPTY);
  const [tagsText, setTagsText] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // 프로젝트 목록 (선택용)
  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => undefined);
  }, []);

  // 티스토리 단일 글 가져오기 → 폼 미리채우기
  const importFromTistory = async () => {
    if (!accessToken || !importUrl.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const p = await api.importPreview(accessToken, importUrl.trim());
      setForm((f) => ({
        ...f,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        cover_image: p.cover_image ?? "",
        tags: p.tags,
        source_url: p.source_url,
      }));
      setTagsText(p.tags.join(", "));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  // 수정 모드: 기존 글 로드 (관리자 목록에서 id 매칭)
  useEffect(() => {
    if (!isEdit || !accessToken) return;
    api
      .listPostsAdmin(accessToken, "ko")
      .then((posts) => {
        const found = posts.find((p) => p.id === id);
        if (!found) throw new Error("글을 찾을 수 없습니다.");
        setForm({
          slug: found.slug,
          lang: found.lang,
          title: found.title,
          excerpt: found.excerpt,
          content: found.content,
          cover_image: found.cover_image ?? "",
          tags: found.tags ?? [],
          status: found.status,
          project_id: found.project_id ?? "",
          source_url: found.source_url ?? "",
        });
        setTagsText((found.tags ?? []).join(", "));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit, accessToken]);

  const set = <K extends keyof PostInput>(key: K, val: PostInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const autoSlug = () => {
    if (form.slug) return;
    const s = form.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
    if (s) set("slug", s);
  };

  const save = async (status: "draft" | "published") => {
    if (!accessToken) return;
    if (!form.title.trim()) return setError("제목을 입력하세요.");
    if (!form.slug.trim()) return setError("slug(주소)를 입력하세요.");
    if (!form.project_id) return setError("프로젝트를 선택하세요.");

    setSaving(true);
    setError(null);
    const payload: PostInput = {
      ...form,
      status,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isEdit && id) {
        await api.updatePost(accessToken, id, payload);
      } else {
        await api.createPost(accessToken, payload);
      }
      navigate("/admin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    try {
      const url = await api.uploadImage(accessToken, file, "posts");
      set("content", `${form.content}\n\n![${file.name}](${url})\n`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) return <p className="text-gray-500">불러오는 중…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "글 수정" : "새 글"}</h1>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {/* 티스토리에서 가져오기 */}
      {!isEdit && (
        <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded">
          <label className="block text-sm text-gray-300 mb-2">
            티스토리 글 URL 로 가져오기 (선택)
          </label>
          <div className="flex gap-2">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="input flex-1"
              placeholder="https://yourblog.tistory.com/123"
            />
            <button
              type="button"
              onClick={importFromTistory}
              disabled={importing || !importUrl.trim()}
              className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
            >
              {importing ? "가져오는 중…" : "가져오기"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            URL 을 넣고 ‘가져오기’ 를 누르면 제목·본문·태그가 자동으로 채워집니다. (여러 글 일괄
            가져오기는 글 목록 화면의 ‘티스토리 태그 가져오기’)
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Field label="프로젝트 (필수)">
          <select
            value={form.project_id ?? ""}
            onChange={(e) => set("project_id", e.target.value)}
            className="input"
          >
            <option value="">— 프로젝트 선택 —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ?? p.name ?? p.id}
              </option>
            ))}
          </select>
        </Field>

        <Field label="제목">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            onBlur={autoSlug}
            className="input"
            placeholder="글 제목"
          />
        </Field>

        <Field label="주소(slug)">
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="input"
            placeholder="my-first-post"
          />
        </Field>

        <Field label="요약 (목록에 표시)">
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            className="input h-20"
            placeholder="한두 줄 요약"
          />
        </Field>

        <Field label="태그 (쉼표로 구분)">
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="input"
            placeholder="Spring Boot, AWS, 회고"
          />
        </Field>

        <Field label="대표 이미지 URL (선택)">
          <input
            value={form.cover_image ?? ""}
            onChange={(e) => set("cover_image", e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">본문 (마크다운)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
            >
              이미지 업로드
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onImagePick}
              className="hidden"
            />
          </div>
          <div data-color-mode="dark">
            <MDEditor
              value={form.content}
              onChange={(v) => set("content", v ?? "")}
              height={460}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={saving}
            onClick={() => save("draft")}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            disabled={saving}
            onClick={() => save("published")}
            className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            발행하기
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
