"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getToken, setToken, removeToken } from "./token-store";

import { API_BASE } from "./config";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  tenant_id: number;
  email_verified: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    (async () => {
      const token = await getToken("access_token");
      const refresh = await getToken("refresh_token");
      if (token) {
        setState((s) => ({
          ...s,
          accessToken: token,
          refreshToken: refresh,
          isLoading: false,
        }));
        fetchUser(token);
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  async function fetchUser(token: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setState((s) => ({ ...s, user }));
      } else {
        await removeToken("access_token");
        await removeToken("refresh_token");
        deleteCookie("token");
        setState((s) => ({ ...s, accessToken: null, refreshToken: null }));
      }
    } catch {
      // API not available — keep token, user stays null
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const detail = await res
        .json()
        .then((d) => d.detail)
        .catch(() => "Login fehlgeschlagen");
      throw new Error(detail);
    }
    const data = await res.json();
    await setToken("access_token", data.access_token);
    await setToken("refresh_token", data.refresh_token);
    setCookie("token", data.access_token, 7);
    setState((s) => ({
      ...s,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }));
    await fetchUser(data.access_token);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const detail = await res
          .json()
          .then((d) => d.detail)
          .catch(() => "Registrierung fehlgeschlagen");
        throw new Error(detail);
      }
      const data = await res.json();
      await setToken("access_token", data.access_token);
      await setToken("refresh_token", data.refresh_token);
      setCookie("token", data.access_token, 7);
      setState((s) => ({
        ...s,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }));
      await fetchUser(data.access_token);
    },
    [],
  );

  const logout = useCallback(() => {
    removeToken("access_token");
    removeToken("refresh_token");
    deleteCookie("token");
    setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
    });
  }, []);

  const verifyEmail = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          if (state.accessToken) await fetchUser(state.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [state.accessToken],
  );

  const resendVerification = useCallback(async (): Promise<boolean> => {
    if (!state.accessToken) return false;
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${state.accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [state.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
