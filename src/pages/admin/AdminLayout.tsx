// 관리자 레이아웃 + 인증 가드. 비밀번호로 로그인한 본인만 통과.
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { isApiEnabled } from "@/lib/config";
import { site } from "@/config/site";

export default function AdminLayout() {
  const { isAdmin, login, logout } = useAuth();

  if (!isApiEnabled) {
    return (
      <Centered>
        <p className="text-gray-400">
          관리자 기능을 쓰려면 .env 에 VITE_API_BASE_URL 을 먼저 설정하세요.
        </p>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <LoginForm onLogin={login} />
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 w-full bg-black/90 border-b border-gray-800 z-40">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex gap-6 items-center text-sm">
            <Link to="/" className="font-bold">
              {site.brand}
            </Link>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }
            >
              글 관리
            </NavLink>
            <NavLink
              to="/admin/projects"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }
            >
              프로젝트 관리
            </NavLink>
            <NavLink
              to="/admin/content"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }
            >
              사이트 내용
            </NavLink>
            <NavLink
              to="/admin/resume"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }
            >
              이력서 편집
            </NavLink>
            <NavLink
              to="/admin/theme"
              className={({ isActive }) =>
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              }
            >
              색 테마
            </NavLink>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
            로그아웃
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <Outlet />
      </main>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (pw: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onLogin(password);
    } catch (err) {
      setError((err as Error).message || "로그인 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-xs">
      <h1 className="text-2xl font-bold mb-6">관리자 로그인</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        autoFocus
        className="input mb-3"
      />
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full px-5 py-2.5 bg-white text-black rounded font-medium hover:bg-gray-200 disabled:opacity-50"
      >
        {busy ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">
      {children}
    </div>
  );
}
