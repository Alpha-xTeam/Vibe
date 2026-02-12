import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt?: string;
  hasProfile: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeJson = async (r: Response) => {
  const text = await r.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  // src/context/AuthContext.tsx

const fetchMe = async () => {
  try {
    const r = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (r.ok) {
      const data = await safeJson(r);
      if (data.id) {
        const hasProfile = !!(data.profile?.full_name && data.profile?.handle);
        setUser({
          id: data.id,
          name: data.profile?.full_name || data.user_metadata?.full_name || '',
          handle: data.profile?.handle ? `@${data.profile.handle}` : '',
          avatar: data.profile?.avatar_url || '',
          hasProfile
        });
      }
    }
  } catch (err) {
    setUser(null);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchMe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const r = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!r.ok) {
      const errData = await safeJson(r);
      throw new Error(errData.detail || 'Sign in failed');
    }
    // fetch /auth/me directly and return the result so callers can decide next steps
    const meRes = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    const data = await safeJson(meRes);
    if (meRes.ok && data.authenticated !== false) {
      const hasProfile = !!(data.profile?.full_name && data.profile?.handle);
      setUser({
        id: data.id,
        name: data.profile?.full_name || data.user_metadata?.full_name || '',
        handle: data.profile?.handle ? `@${data.profile.handle}` : '',
        avatar: data.profile?.avatar_url || '',
        hasProfile
      });
    } else {
      setUser(null);
    }
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const r = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await safeJson(r);
    if (!r.ok) {
      throw new Error(data.detail || 'Sign up failed');
    }
    if (data.session) {
      await fetchMe();
    }
    return data;
  };

  const signOut = async () => {
    await fetch(`${API_URL}/auth/signout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const refresh = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
