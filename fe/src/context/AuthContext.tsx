import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "city_archive_staff_session";

export interface AuthUser {
  first_name: string;
  [key: string]: unknown;
}

interface AuthSession {
  user: AuthUser;
  token: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (userPayload: AuthUser, token?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "user" in parsed &&
      parsed.user &&
      typeof parsed.user === "object" &&
      "first_name" in parsed.user
    ) {
      const obj = parsed as Record<string, unknown>;
      const tokenValue = obj.token;
      return {
        user: parsed.user as AuthUser,
        token: typeof tokenValue === "string" ? tokenValue : null,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = readStoredSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
    setIsReady(true);
  }, []);

  const login = useCallback((userPayload: AuthUser, tokenValue?: string | null) => {
    setUser(userPayload);
    const t = tokenValue ?? null;
    setToken(t);
    const session: AuthSession = { user: userPayload, token: t };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.href = "/";
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isReady,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
