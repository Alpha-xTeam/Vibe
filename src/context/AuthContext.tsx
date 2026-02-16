import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../utils/api';
import { supabase } from '../utils/supabase';

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
  isAdmin: boolean;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
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
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count initial
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('vibe_token');
      if (!token) return;

      const res = await fetch(`${API_URL}/auth/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.notifications?.filter((n: any) => !n.is_read).length || 0;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();

      // Real-time notifications listener
      const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setUnreadCount(0);
    }
  }, [user?.id]);

  // src/context/AuthContext.tsx

  const fetchMe = async () => {
    try {
      let token = localStorage.getItem('vibe_token');

      // Check for token in URL fragment (Supabase redirect)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const urlToken = params.get('access_token');
        const type = params.get('type');

        if (urlToken) {
          token = urlToken;
          localStorage.setItem('vibe_token', token);
          // Clear hash from URL without reloading
          window.history.replaceState(null, '', window.location.pathname);

          if (type === 'recovery') {
            window.location.href = '/reset-password';
            return;
          }
        }
      }

      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const r = await fetch(`${API_URL}/auth/me`, {
        headers,
        credentials: 'include'
      });
      if (r.ok) {
        const data = await safeJson(r);
        if (data.id && data.authenticated !== false) {
          const hasProfile = !!(data.profile?.full_name && data.profile?.handle);
          setUser({
            id: data.id,
            name: data.profile?.full_name || data.user_metadata?.full_name || '',
            handle: data.profile?.handle ? `@${data.profile.handle}` : '',
            avatar: data.profile?.avatar_url || '',
            bio: data.profile?.bio || '',
            location: data.profile?.location || '',
            website: data.profile?.website || '',
            createdAt: data.profile?.created_at || '',
            hasProfile,
            isAdmin: !!data.profile?.is_admin,
            isVerified: !!data.profile?.is_verified
          });
        } else {
          setUser(null);
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
    const data = await safeJson(r);
    if (!r.ok) {
      throw new Error(data.detail || 'Sign in failed');
    }

    if (data.access_token) {
      localStorage.setItem('vibe_token', data.access_token);
    }

    // fetch /auth/me directly and return the result so callers can decide next steps
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` },
      credentials: 'include'
    });
    const meData = await safeJson(meRes);
    if (meRes.ok && meData.authenticated !== false) {
      const hasProfile = !!(meData.profile?.full_name && meData.profile?.handle);
      setUser({
        id: meData.id,
        name: meData.profile?.full_name || meData.user_metadata?.full_name || '',
        handle: meData.profile?.handle ? `@${meData.profile.handle}` : '',
        avatar: meData.profile?.avatar_url || '',
        bio: meData.profile?.bio || '',
        location: meData.profile?.location || '',
        website: meData.profile?.website || '',
        createdAt: meData.profile?.created_at || '',
        hasProfile,
        isAdmin: !!meData.profile?.is_admin,
        isVerified: !!meData.profile?.is_verified
      });
    } else {
      setUser(null);
    }
    return meData;
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
    if (data.access_token) {
      localStorage.setItem('vibe_token', data.access_token);
    }
    if (data.session) {
      await fetchMe();
    }
    return data;
  };

  const signOut = async () => {
    localStorage.removeItem('vibe_token');
    await fetch(`${API_URL}/auth/signout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    setUnreadCount(0);
  };

  const refresh = async () => {
    await fetchMe();
  };

  const resetPassword = async (email: string) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.detail || 'Failed to send reset email');
    }
  };

  const updatePassword = async (password: string) => {
    const token = localStorage.getItem('vibe_token');
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data.detail || 'Failed to update password');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, unreadCount, setUnreadCount, signIn, signUp, signOut, refresh, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
