import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const TOKEN_KEY = 'gh_admin_token';
const USER_KEY = 'gh_admin_user';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  points_balance: number;
}

interface AuthContextValue {
  token: string | null;
  user: AdminUser | null;
  isAdmin: boolean;
  validating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  // True while we're verifying a stored token against the server.
  // Prevents flashing protected routes before validation completes.
  const [validating, setValidating] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  const isAdmin = user?.role === 'admin';

  // On mount, if a token is stored, validate it server-side.
  // This prevents any string in localStorage from bypassing auth.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setValidating(false);
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('invalid');
        const freshUser: AdminUser = await res.json();
        if (freshUser.role !== 'admin') throw new Error('not_admin');
        // Refresh stored user data with server-fresh values
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Token is expired, invalid, or belongs to a non-admin — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setValidating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email: string, password: string) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Login failed');
    }
    const data = await res.json();
    if (data.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, validating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
