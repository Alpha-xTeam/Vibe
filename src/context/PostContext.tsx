import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, INITIAL_POSTS, AI_MEMBERS } from '../data/mockData';

interface PostContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  createPost: (payload: { content: string; image_url?: string | null; code_language?: string | null; code_snippet?: string | null }) => Promise<Post | null>;
  likePost: (postId: string) => Promise<void>;
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
  const API_URL = (import.meta as any).env.VITE_API_URL;

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      if (!API_URL) return;
      try {
        const res = await fetch(`${API_URL}/posts`);
        if (res.ok) {
          const data = await safeJson(res);
          if (data && data.posts) {
            const normalized = data.posts.map((p: any) => ({
              id: p.id,
              user: {
                id: p.user_id,
                name: p.profiles?.full_name || 'Vibe User',
                handle: p.profiles?.handle ? `@${p.profiles.handle}` : '@user',
                avatar: p.profiles?.avatar_url || ''
              },
              content: p.content,
              timestamp: p.timestamp,
              likes: p.likes || 0,
              comments: p.comments || 0,
              shares: p.shares || 0,
              image: p.image_url || undefined,
              codeSnippet: p.code_snippet ? { language: p.code_language || 'text', code: p.code_snippet } : undefined,
              hasLiked: p.user_has_liked || false,
            }));
            setPosts(normalized);
          }
        }
      } catch (err) {
        console.error('Failed to fetch posts', err);
      }
    };
    fetchPosts();
  }, [API_URL]);

  // AI Simulation Logic
  useEffect(() => {
    if (AI_MEMBERS.length === 0) return; // nothing to simulate when no AI members exist

    const interval = setInterval(() => {
      const randomAI = AI_MEMBERS[Math.floor(Math.random() * AI_MEMBERS.length)];
      
      // 10% chance to generate a new AI post every 10 seconds
      if (Math.random() > 0.9 && randomAI) {
        const newPost: Post = {
          id: `ai-gen-${Date.now()}`,
          user: randomAI,
          content: `Automated system analysis #${Math.floor(Math.random() * 1000)}: Optimization complete for subsystem ${['Alpha', 'Beta', 'Gamma'][Math.floor(Math.random() * 3)]}. Efficiency increased by ${Math.floor(Math.random() * 20) + 5}%.`,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: 0,
          shares: 0,
          isAIPost: true,
          aiStatus: 'optimizing'
        };
        setPosts(prev => [newPost, ...prev]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const addPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const createPost = async (payload: { content: string; image_url?: string | null; code_language?: string | null; code_snippet?: string | null }) => {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create post');
      const data = await safeJson(res);
      const created = Array.isArray(data.post) ? data.post[0] : data.post;
      if (!created) return null;
      const normalized: Post = {
        id: created.id,
        user: { id: created.user_id, name: '', handle: '', avatar: '' },
        content: created.content,
        timestamp: created.timestamp,
        likes: created.likes || 0,
        comments: created.comments || 0,
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
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: data.liked,
              likes: data.liked ? p.likes + 1 : Math.max(0, p.likes - 1)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const commentOnPost = async (postId: string, content: string) => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <PostContext.Provider value={{ posts, addPost, createPost, likePost, commentOnPost }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (!context) throw new Error("usePosts must be used within PostProvider");
  return context;
}
