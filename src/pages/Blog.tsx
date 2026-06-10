// 개발기록 목록 (/blog). 프로젝트(카테고리) 필터 + 프로젝트별 그룹 + 더보기.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import { useApplyTheme } from "@/lib/useSiteTheme";
import { SiteNav } from "@/components/layout/SiteNav";
import type { Post } from "@/lib/types";
import type { Project } from "@/types/project";
import { site } from "@/config/site";

const PREVIEW_COUNT = 4; // 전체 보기에서 프로젝트별 기본 노출 개수
const TISTORY_URL = site.blogUrl;

export default function Blog() {
  useApplyTheme("blog");
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all"); // "all" | project_id

  useEffect(() => {
    if (!isApiEnabled) {
      setLoading(false);
      return;
    }
    Promise.all([api.listPosts("ko"), api.listProjects().catch(() => [])])
      .then(([p, pr]) => {
        setPosts(p);
        setProjects(pr);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // 프로젝트 순서대로 그룹핑(각 그룹 최신순). projects 목록에 없는 태그는 뒤로.
  const groups = useMemo(() => {
    const byId = new Map<string, Post[]>();
    for (const post of posts) {
      const key = post.project_id || "_none";
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key)!.push(post);
    }
    for (const list of byId.values())
      list.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

    const ordered: { id: string; name: string; posts: Post[] }[] = [];
    for (const proj of projects) {
      const list = byId.get(proj.id);
      if (list?.length) {
        ordered.push({ id: proj.id, name: proj.title ?? proj.name ?? proj.id, posts: list });
        byId.delete(proj.id);
      }
    }
    for (const [key, list] of byId)
      ordered.push({ id: key, name: key === "_none" ? "기타" : key, posts: list });
    return ordered;
  }, [posts, projects]);

  const visibleGroups = filter === "all" ? groups : groups.filter((g) => g.id === filter);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* 헤더 */}
        <h1 className="text-3xl font-bold mb-3">개발기록</h1>
        <p className="text-gray-400 leading-7">
          프로젝트를 진행하며 남긴 개발 기록입니다.
          {posts.length > 0 && <span className="text-gray-600"> · 총 {posts.length}개</span>}
        </p>
        <a
          href={TISTORY_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-gray-300 hover:text-white border-b border-gray-700 hover:border-gray-400 pb-0.5"
        >
          티스토리에서 공부기록 보기 <ArrowUpRight size={14} />
        </a>

        {/* 카테고리(프로젝트) 필터 */}
        {groups.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              전체
            </Chip>
            {groups.map((g) => (
              <Chip key={g.id} active={filter === g.id} onClick={() => setFilter(g.id)}>
                {g.name}
                <span className="ml-1 opacity-60">{g.posts.length}</span>
              </Chip>
            ))}
          </div>
        )}

        {/* 상태 */}
        {!isApiEnabled && (
          <p className="mt-10 text-gray-500">
            아직 백엔드가 연결되지 않았습니다. (.env 의 VITE_API_BASE_URL 설정 필요)
          </p>
        )}
        {loading && isApiEnabled && <p className="mt-10 text-gray-500">불러오는 중…</p>}
        {error && <p className="mt-10 text-red-400">에러: {error}</p>}
        {!loading && isApiEnabled && posts.length === 0 && !error && (
          <p className="mt-10 text-gray-500">아직 작성된 글이 없습니다.</p>
        )}

        {/* 목록 */}
        <div className="mt-10 space-y-14">
          {visibleGroups.map((group) => {
            // 전체 보기에서만 접기, 단일 카테고리 보기에선 전부 노출
            const open = filter !== "all" || expanded.has(group.id);
            const visible = open ? group.posts : group.posts.slice(0, PREVIEW_COUNT);
            const hidden = group.posts.length - visible.length;
            return (
              <section key={group.id}>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-bold">{group.name}</h2>
                  <span className="text-xs text-gray-500">{group.posts.length}개</span>
                </div>
                <ul className="space-y-3">
                  {visible.map((post) => (
                    <li key={post.id}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="block rounded-xl border border-gray-800/80 bg-gray-950/40 px-5 py-4 transition-colors hover:border-gray-600 hover:bg-gray-900/60"
                      >
                        <h3 className="font-semibold leading-snug">{post.title}</h3>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                          {post.published_at && (
                            <time>{new Date(post.published_at).toLocaleDateString("ko-KR")}</time>
                          )}
                          {post.tags?.slice(0, 3).map((t) => (
                            <span key={t} className="text-gray-600">
                              #{t}
                            </span>
                          ))}
                        </div>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-6">
                            {post.excerpt}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                {filter === "all" && group.posts.length > PREVIEW_COUNT && (
                  <button
                    onClick={() => toggle(group.id)}
                    className="mt-4 text-sm text-gray-400 hover:text-white"
                  >
                    {expanded.has(group.id) ? "접기" : `+ ${hidden}개 더 보기`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-white text-black border-white"
          : "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
