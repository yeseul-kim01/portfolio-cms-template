// 단일 비밀번호 로그인. 로그인 시 받은 JWT 를 localStorage 에 저장하고
// 쓰기 요청에 Bearer 로 첨부한다.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "./api";

const TOKEN_KEY = "portfolio_admin_token";
const EXPIRES_KEY = "portfolio_admin_expires";

type AuthState = {
  accessToken: string | null;
  isAdmin: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return null;
  if (new Date(expires).getTime() < Date.now()) {
    // 만료 → 정리
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  return token;
}

export function AuthRoot({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => readToken());

  const login = useCallback(async (password: string) => {
    const { token, expires_at } = await api.login(password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_KEY, expires_at);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setAccessToken(null);
  }, []);

  // 다른 탭에서 로그인/로그아웃 시 동기화
  useEffect(() => {
    const onStorage = () => setAccessToken(readToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, isAdmin: Boolean(accessToken), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthRoot");
  return ctx;
}
