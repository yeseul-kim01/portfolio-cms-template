// 글 관리 대시보드: 임시저장 포함 목록 + 새 글/수정/삭제 + 티스토리 태그 일괄 가져오기.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { COMPETENCIES } from "@/data/competencies";
import type { Post } from "@/lib/types";
import type { Project } from "@/types/project";

type Analytics = { event: string; target: string; count: number };

export default function Dashboard() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 티스토리 전체 가져오기 상태
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    api
      .listPostsAdmin(accessToken, "ko")
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(load, [load]);
  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => undefined);
  }, []);

  // 조회수 분석
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  useEffect(() => {
    if (!accessToken) return;
    api.getAnalytics(accessToken).then(setAnalytics).catch(() => undefined);
  }, [accessToken]);

  const sumEvent = (e: string) =>
    analytics.filter((a) => a.event === e).reduce((s, a) => s + (a.count || 0), 0);
  const topByEvent = (e: string) =>
    analytics.filter((a) => a.event === e).sort((a, b) => b.count - a.count);

  const runBulkImport = async () => {
    if (!accessToken) return;
    setBulkBusy(true);
    setBulkResult(null);
    setError(null);
    try {
      const r = await api.importSitemap(accessToken);
      const summary = Object.entries(r.by_project)
        .map(([pid, v]) => `${pid} +${v.created}`)
        .join(" · ");
      setBulkResult(`전체 ${r.scanned}개 스캔 → ${summary || "신규 없음"}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const projectName = (id?: string | null) =>
    projects.find((p) => p.id === id)?.title ?? id ?? "—";

  const handleDelete = async (post: Post) => {
    if (!accessToken) return;
    if (!confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    await api.deletePost(accessToken, post.id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">글 관리</h1>
        <Link
          to="/admin/posts/new"
          className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200"
        >
          + 새 글
        </Link>
      </div>

      {/* 이력서 조회 대시보드 */}
      <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded">
        <p className="text-sm text-gray-300 mb-3">📊 이력서 조회 대시보드</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="이력서 조회" value={sumEvent("resume_view")} />
          <StatCard label="포트폴리오 조회" value={sumEvent("portfolio_view")} />
          <StatCard label="프로젝트 열람" value={sumEvent("project_open")} />
          <StatCard label="역량 클릭" value={sumEvent("competency_open")} />
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <TopList
            title="많이 본 프로젝트"
            rows={topByEvent("project_open").map((a) => ({
              name: projectName(a.target),
              count: a.count,
            }))}
          />
          <TopList
            title="많이 본 역량"
            rows={topByEvent("competency_open").map((a) => ({
              name: COMPETENCIES.find((c) => c.key === a.target)?.label ?? a.target,
              count: a.count,
            }))}
          />
          <TopList
            title="많이 본 글"
            rows={topByEvent("post_view").map((a) => ({
              name: posts.find((p) => p.slug === a.target)?.title ?? a.target,
              count: a.count,
            }))}
          />
        </div>
        {analytics.length === 0 && (
          <p className="text-xs text-gray-600 mt-3">아직 조회 기록이 없습니다.</p>
        )}
      </div>

      {/* 티스토리 전체 개발기록 가져오기 (sitemap → 프로젝트기록-* 태그 자동 분류) */}
      <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-300">티스토리 전체 개발기록 가져오기</p>
            <p className="text-xs text-gray-500 mt-1">
              블로그 sitemap을 훑어 글마다 ‘프로젝트기록-&lt;id&gt;’ 태그를 읽고 해당 프로젝트로 자동 분류합니다. (이미 있는 글은 건너뜀 · 1~2분 소요)
            </p>
          </div>
          <button
            onClick={runBulkImport}
            disabled={bulkBusy}
            className="px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
          >
            {bulkBusy ? "가져오는 중…" : "전체 가져오기"}
          </button>
        </div>
        {bulkResult && <p className="text-green-400 text-sm mt-3">{bulkResult}</p>}
      </div>

      {loading && <p className="text-gray-500">불러오는 중…</p>}
      {error && <p className="text-red-400">에러: {error}</p>}
      {!loading && posts.length === 0 && (
        <p className="text-gray-500">아직 글이 없습니다. 새 글을 작성해보세요.</p>
      )}

      <ul className="divide-y divide-gray-800">
        {posts.map((post) => (
          <li key={post.id} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{post.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    post.status === "published"
                      ? "bg-green-900 text-green-300"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {post.status === "published" ? "발행됨" : "임시저장"}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                /{post.slug} · <span className="text-gray-400">{projectName(post.project_id)}</span>
              </p>
            </div>
            <div className="flex gap-3 text-sm shrink-0">
              <Link to={`/admin/posts/${post.id}`} className="text-gray-300 hover:text-white">
                수정
              </Link>
              <button
                onClick={() => handleDelete(post)}
                className="text-red-400 hover:text-red-300"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-3">
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-600">—</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.slice(0, 8).map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-300 truncate">{r.name}</span>
              <span className="font-mono text-xs text-gray-500 shrink-0">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
