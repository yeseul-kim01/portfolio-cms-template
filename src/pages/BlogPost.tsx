// 블로그 글 상세 (/blog/:slug). 마크다운 렌더링.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import { isApiEnabled } from "@/lib/config";
import { useApplyTheme } from "@/lib/useSiteTheme";
import { SiteNav } from "@/components/layout/SiteNav";
import type { Post } from "@/lib/types";

export default function BlogPost() {
  useApplyTheme("blog");
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !isApiEnabled) {
      setLoading(false);
      return;
    }
    api
      .getPost(slug, "ko")
      .then((p) => {
        setPost(p);
        api.track("post_view", slug);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-300">
          ← 목록으로
        </Link>

        {loading && <p className="mt-8 text-gray-500">불러오는 중…</p>}
        {error && <p className="mt-8 text-red-400">글을 찾을 수 없습니다.</p>}

        {post && (
          <article className="mt-6">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {post.published_at && (
              <time className="block mt-2 text-sm text-gray-500">
                {new Date(post.published_at).toLocaleDateString("ko-KR")}
              </time>
            )}
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt=""
                className="mt-6 rounded-lg w-full object-cover"
              />
            )}
            <div className="prose prose-invert max-w-none mt-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
            {post.source_url && (
              <p className="mt-10 pt-6 border-t border-gray-800 text-sm text-gray-500">
                원문:{" "}
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-gray-300"
                >
                  {post.source_url}
                </a>
              </p>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
