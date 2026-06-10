import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Portfolio from "./pages/Portfolio";

// 블로그/관리자는 코드 분할 — 공개 첫 화면(포트폴리오) 번들을 가볍게 유지
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Resume = lazy(() => import("./pages/Resume"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const PostEditor = lazy(() => import("./pages/admin/PostEditor"));
const ProjectsAdmin = lazy(() => import("./pages/admin/ProjectsAdmin"));
const ContentAdmin = lazy(() => import("./pages/admin/ContentAdmin"));
const ResumeAdmin = lazy(() => import("./pages/admin/ResumeAdmin"));
const ThemeAdmin = lazy(() => import("./pages/admin/ThemeAdmin"));

const Loading = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <p className="text-gray-500">불러오는 중…</p>
  </div>
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/resume" element={<Resume />} />

        {/* 관리자 (본인만) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="content" element={<ContentAdmin />} />
          <Route path="resume" element={<ResumeAdmin />} />
          <Route path="theme" element={<ThemeAdmin />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
