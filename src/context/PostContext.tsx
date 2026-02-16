import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post } from '../data/mockData';
import { API_URL } from '../utils/api';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

interface PostContextType {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  addPost: (post: Post) => void;
  createPost: (payload: { content: string; image_url?: string | null; code_language?: string | null; code_snippet?: string | null }) => Promise<Post | null>;
  likePost: (postId: string) => Promise<void>;
  repostPost: (postId: string) => Promise<void>;
  commentOnPost: (postId: string, content: string) => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

const safeJson = async (r: Response) => {
  const text = await r.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
};

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const { user } = useAuth();

  const getHeaders = () => {
    const token = localStorage.getItem('vibe_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Helper to normalize backend post to frontend format
  const normalizePost = (p: any) => ({
    id: p.id,
    user: {
      id: p.user_id,
      name: p.profiles?.full_name || 'Vibe User',
      handle: p.profiles?.handle ? `@${p.profiles.handle}` : '@user',
      avatar: p.profiles?.avatar_url || '',
      isAI: p.profiles?.is_ai || false,
      isVerified: p.profiles?.is_verified || false
    },
    content: p.content,
    timestamp: p.timestamp,
    likes: p.likes || 0,
    comments: p.comments || 0,
    reposts: p.reposts || 0,
    shares: p.shares || 0,
    image: p.image_url || undefined,
    codeSnippet: p.code_snippet ? { language: p.code_language || 'text', code: p.code_snippet } : undefined,
    hasLiked: p.user_has_liked || false,
    hasReposted: p.user_has_reposted || false,
  });

  // Fetch posts from backend


  // Posts are fetched by individual pages (Home.tsx, etc.) - no auto-fetch here to avoid duplicates

  // Real-time listener for posts
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newPostRaw = payload.new;

            // Avoid duplicates
            setPosts(prev => {
              if (prev.find(p => p.id === newPostRaw.id)) return prev;

              const fetchFullPost = async () => {
                try {
                  const res = await fetch(`${API_URL}/posts?q=${newPostRaw.id}`, {
                    headers: getHeaders(),
                    credentials: 'include'
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const fullPost = data.posts?.find((p: any) => p.id === newPostRaw.id);
                    if (fullPost) {
                      setPosts(currentPosts => {
                        if (currentPosts.find(p => p.id === fullPost.id)) return currentPosts;
                        return [normalizePost(fullPost), ...currentPosts];
                      });
                    }
                  }
                } catch (err) {
                  console.error("Failed to fetch new real-time post details", err);
                }
              };
              fetchFullPost();
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setPosts(prev => prev.map(p =>
              p.id === updated.id
                ? { ...p, likes: updated.likes, comments: updated.comments, reposts: updated.reposts ?? p.reposts }
                : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old;
            setPosts(prev => prev.filter(p => p.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [API_URL]);

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const createPost = async (payload: { content: string; image_url?: string | null; code_language?: string | null; code_snippet?: string | null }) => {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create post');
      const data = await safeJson(res);
      const created = Array.isArray(data.post) ? data.post[0] : data.post;
      if (!created) return null;
      const normalized: Post = {
        id: created.id,
        user: {
          id: user?.id || created.user_id,
          name: user?.name || 'Vibe User',
          handle: user?.handle || '@user',
          avatar: user?.avatar || ''
        },
        content: created.content,
        timestamp: created.timestamp,
        likes: created.likes || 0,
        comments: created.comments || 0,
        reposts: 0,
        shares: created.shares || 0,
        image: created.image_url || undefined,
        codeSnippet: created.code_snippet ? { language: created.code_language || 'text', code: created.code_snippet } : undefined,
      };
      setPosts(prev => [normalized, ...prev]);
      return normalized;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const likePost = async (postId: string) => {
    if (!API_URL) return;

    // 1. Optimistic Update
    let originalPost: Post | undefined;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        originalPost = { ...p };
        const newHasLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked: newHasLiked,
          likes: newHasLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      }
      return p;
    }));

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        // Rollback if request failed
        if (originalPost) {
          setPosts(prev => prev.map(p => p.id === postId ? originalPost! : p));
        }
      } else {
        const data = await res.json();
        // Sync with server data just in case
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: data.liked,
              likes: data.new_count !== undefined ? data.new_count : p.likes
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to like post', err);
      // Rollback on network error
      if (originalPost) {
        setPosts(prev => prev.map(p => p.id === postId ? originalPost! : p));
      }
    }
  };

  const repostPost = async (postId: string) => {
    if (!API_URL) return;

    // Optimistic Update
    let originalPost: Post | undefined;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        originalPost = { ...p };
        const newHasReposted = !p.hasReposted;
        return {
          ...p,
          hasReposted: newHasReposted,
          reposts: newHasReposted ? (p.reposts || 0) + 1 : Math.max(0, (p.reposts || 0) - 1)
        };
      }
      return p;
    }));

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/repost`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        if (originalPost) {
          setPosts(prev => prev.map(p => p.id === postId ? originalPost! : p));
        }
      } else {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasReposted: data.reposted,
              reposts: data.reposts !== undefined ? data.reposts : p.reposts
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to repost', err);
      if (originalPost) {
        setPosts(prev => prev.map(p => p.id === postId ? originalPost! : p));
      }
    }
  };

  const commentOnPost = async (postId: string, content: string) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: p.comments + 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to comment', err);
    }
  };

  return (
    <PostContext.Provider value={{ posts, setPosts, addPost, createPost, likePost, repostPost, commentOnPost }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (!context) throw new Error("usePosts must be used within PostProvider");
  return context;
}
