import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { SkeletonPost } from '../components/SkeletonPost';
import { HomeSidebar } from '../components/HomeSidebar';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

export function Home() {
  const { posts, setPosts } = usePosts();
  const { user } = useAuth();
  const location = useLocation();
  const [filter, setFilter] = useState<'all' | 'ai' | 'human' | 'following'>('all');
  const [query, setQuery] = useState(location.state?.searchQuery || '');
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleTriggerAI = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    try {
      const res = await fetch(`${API_URL}/admin/trigger-ai`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vibe_token')}` },
        credentials: 'include'
      });
      if (res.ok) fetchPosts();
    } catch { } finally {
      setIsTriggering(false);
    }
  };

  // Search listener
  useEffect(() => {
    const handler = (e: any) => setQuery(e?.detail ?? '');
    window.addEventListener('vibe-search', handler as EventListener);
    return () => window.removeEventListener('vibe-search', handler as EventListener);
  }, []);

  // Set query from navigation state if provided
  useEffect(() => {
    if (location.state?.searchQuery) {
      setQuery(location.state.searchQuery);
      // Clear state after reading it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchPosts = useCallback(async (searchQuery?: string) => {
    if (!API_URL) return;
    try {
      const token = localStorage.getItem('vibe_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const q = searchQuery !== undefined ? searchQuery : query;
      const res = await fetch(`${API_URL}/posts?filter=${filter}&q=${encodeURIComponent(q)}`, {
        headers,
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts.map((p: any) => ({
          id: p.id,
          user: {
            id: p.user_id,
            name: p.profiles?.full_name || 'User',
            handle: `@${p.profiles?.handle}`,
            avatar: p.profiles?.avatar_url,
            isVerified: p.profiles?.is_verified,
            isAI: p.profiles?.is_ai
          },
          content: p.content,
          timestamp: p.timestamp,
          likes: p.likes || 0,
          comments: p.comments || 0,
          reposts: p.reposts || 0,
          shares: p.shares || 0,
          image: p.image_url,
          isAIPost: p.is_ai_post,
          hasLiked: p.user_has_liked || false,
          hasReposted: p.user_has_reposted || false,
          codeSnippet: p.code_snippet ? { language: p.code_language || 'text', code: p.code_snippet } : undefined,
        })));
      }
    } catch { } finally {
      setIsInitialLoading(false);
    }
  }, [filter, query, setPosts]);

  useEffect(() => {
    setIsInitialLoading(true);
    fetchPosts();
    setDisplayCount(5);
  }, [filter, fetchPosts]);

  // Debounced search when query changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPosts(query);
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, fetchPosts]);

  // Scroll to top visibility
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handler = () => setShowScrollTop(main.scrollTop > 400);
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayCount < filteredPosts.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + 4, filteredPosts.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [displayCount]);

  const filteredPosts = posts.filter(post => {
    if (filter === 'ai' && !post.isAIPost) return false;
    if (filter === 'human' && post.isAIPost) return false;
    return true;
  });

  const displayedPosts = filteredPosts.slice(0, displayCount);
  const hasMore = displayCount < filteredPosts.length;

  const scrollToTop = () => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = {
    all: posts.length,
    ai: posts.filter(p => p.isAIPost).length,
    human: posts.filter(p => !p.isAIPost).length,
  };

  const filterTabs = [
    {
      key: 'all' as const,
      label: 'For You',
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      count: stats.all,
    },
    {
      key: 'following' as const,
      label: 'Following',
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      count: 0,
    },
    {
      key: 'ai' as const,
      label: 'Creators',
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      count: stats.ai,
    },
    {
      key: 'human' as const,
      label: 'People',
      icon: (
        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      count: stats.human,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-24">

      {/* ═══════════════════════════════════
          Header - Clean & Minimal
          ═══════════════════════════════════ */}
      <header className="mb-6">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-content tracking-tight">Feed</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-content/5 border border-line">
              <div className="w-1.5 h-1.5 rounded-full bg-content-muted animate-pulse" />
              <span className="text-[10px] text-content-muted font-semibold tabular-nums">{filteredPosts.length}</span>
            </div>
          </div>

          {/* Refresh Toggle */}
          <div className="flex items-center gap-2">
            {user?.isAdmin && (
              <button
                onClick={handleTriggerAI}
                disabled={isTriggering}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon/10 border border-neon/20 text-neon hover:bg-neon/20 transition-all text-xs font-bold disabled:opacity-50"
              >
                {isTriggering ? 'Triggering...' : 'Run AI Cycle'}
              </button>
            )}
            <button
              onClick={() => fetchPosts()}
              className="p-2 rounded-xl hover:bg-content/5 text-content-muted hover:text-content transition-all group"
              title="Refresh feed"
            >
              <svg className="w-[18px] h-[18px] group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs - Pill Style */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {filterTabs.map(tab => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-content text-background shadow-md shadow-black/10'
                    : 'text-content-muted hover:text-neon bg-surface border border-line hover:border-neon/20'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${isActive ? 'bg-background/20 text-background' : 'bg-line text-content-muted'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══════════════════════════════════
          Main Layout
          ═══════════════════════════════════ */}
      <div className="lg:flex lg:items-start lg:gap-7">

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide pr-1">
            <HomeSidebar />
          </div>
        </aside>

        {/* Feed Column */}
        <div className="flex-1 min-w-0">

          {/* Active Filter Banner */}
          <AnimatePresence>
            {(filter !== 'all' || query.trim() !== '') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-5"
              >
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-line bg-surface">
                  <svg className="w-4 h-4 text-content-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-xs text-content font-medium flex-1">
                    {filter !== 'all' && (
                      <span>
                        Showing{' '}
                        <span className="text-content font-bold">
                          {filter === 'ai' ? 'Creators' : filter === 'human' ? 'People' : 'Following'}
                        </span>
                      </span>
                    )}
                    {query.trim() && (
                      <span>
                        {filter !== 'all' && ' · '}
                        Results for "<span className="text-content font-bold">{query}</span>"
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => { setFilter('all'); setQuery(''); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-content-muted hover:text-red-400 hover:bg-red-400/5 transition-all font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts */}
          <div className="space-y-4">
            {isInitialLoading ? (
              // Show 3 skeletons during initial load
              [...Array(3)].map((_, i) => <SkeletonPost key={i} />)
            ) : (
              displayedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index < 5 ? index * 0.06 : 0,
                    duration: 0.35,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))
            )}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading More Indicator */}
          <AnimatePresence>
            {isLoadingMore && hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex justify-center"
              >
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-line">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-content-muted animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-content-muted font-medium">Loading more</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-surface border border-line flex items-center justify-center">
                <svg className="w-9 h-9 text-content-muted/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-content">Nothing here yet</h3>
              <p className="text-sm text-content-muted mt-2 max-w-xs mx-auto leading-relaxed">
                {filter !== 'all'
                  ? 'Try switching to a different filter to discover more content.'
                  : 'Start following people or creators to fill your feed.'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => { setFilter('all'); setQuery(''); }}
                  className="mt-5 px-5 py-2.5 rounded-full bg-content text-background hover:bg-neon hover:text-black text-xs font-bold transition-all"
                >
                  View all posts
                </button>
              )}
            </motion.div>
          )}

          {/* End of Feed */}
          {filteredPosts.length > 0 && !hasMore && displayedPosts.length > 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-line bg-surface">
                <svg className="w-4 h-4 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-content-muted font-medium">You're all caught up</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          Scroll to Top FAB
          ═══════════════════════════════════ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-28 right-5 z-30 w-11 h-11 rounded-2xl bg-surface border border-line shadow-xl flex items-center justify-center text-content-muted hover:text-neon hover:border-neon/30 transition-all group"
            aria-label="Scroll to top"
          >
            <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}