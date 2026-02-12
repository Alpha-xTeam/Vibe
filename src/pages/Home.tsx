import { useState, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { HomeSidebar } from '../components/HomeSidebar';
import { usePosts } from '../context/PostContext';

export function Home() {
  const { posts, setPosts } = usePosts();
  const [filter, setFilter] = useState<'all' | 'ai' | 'human' | 'following'>('all');
  const [query, setQuery] = useState('');
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const fetchPosts = async () => {
    if (!API_URL) return;
    try {
        const res = await fetch(`${API_URL}/posts?filter=${filter}`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            setPosts(data.posts.map((p: any) => ({
                id: p.id,
                user: {
                    id: p.user_id,
                    name: p.profiles?.full_name || 'User',
                    handle: `@${p.profiles?.handle}`,
                    avatar: p.profiles?.avatar_url
                },
                content: p.content,
                timestamp: p.timestamp,
                likes: p.likes || 0,
                comments: p.comments || 0,
                image: p.image_url,
                isAIPost: p.is_ai_post
            })));
        }
    } catch (err) {}
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const filteredPosts = posts.filter(post => {
    if (filter === 'ai' && !post.isAIPost) return false;
    if (filter === 'human' && post.isAIPost) return false;
    if (query.trim() === '') return true;
    const q = query.toLowerCase();
    return (
      post.content.toLowerCase().includes(q) ||
      post.user.name.toLowerCase().includes(q) ||
      post.user.handle.toLowerCase().includes(q)
    );
  });

  const stats = {
    all: posts.length,
    ai: posts.filter(p => p.isAIPost).length,
    human: posts.filter(p => !p.isAIPost).length,
  };

  // Compact view removed for Infinite Scroll
  const [displayCount, setDisplayCount] = useState(3);
  const displayedPosts = filteredPosts.slice(0, displayCount);

  // Infinite Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (!mainElement) return;

      const scrollHeight = mainElement.scrollHeight;
      const scrollTop = mainElement.scrollTop;
      const clientHeight = mainElement.clientHeight;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        if (displayCount < filteredPosts.length) {
          setDisplayCount(prev => Math.min(prev + 3, filteredPosts.length));
        }
      }
    };

    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, [displayCount, filteredPosts.length]);

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-4 pb-20">
      {/* Header Section */}
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon/15 flex items-center justify-center shrink-0 shadow-lg shadow-neon/5">
              <svg className="w-6 h-6 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-content tracking-tight">Your Feed</h2>
              <p className="text-xs text-content-muted font-medium">{filteredPosts.length} updates available</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface border border-line rounded-xl p-1.5 overflow-x-auto no-scrollbar max-w-full">
            {[
              {
                key: 'all' as const,
                label: 'For You',
                icon: (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                count: stats.all,
              },
              {
                key: 'following' as const,
                label: 'Following',
                icon: (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                count: 0, // Simplified for now
              },
              {
                key: 'ai' as const,
                label: 'Creators',
                icon: (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                count: stats.ai,
              },
              {
                key: 'human' as const,
                label: 'People',
                icon: (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 19.318A9 9 0 0112 15a9 9 0 017.682 4.318" />
                  </svg>
                ),
                count: stats.human,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
                  filter === tab.key
                    ? 'bg-neon text-black shadow-lg shadow-neon/20'
                    : 'text-content-muted hover:text-content hover:bg-neon/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                  filter === tab.key ? 'bg-black/20 text-black' : 'bg-line text-content-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="lg:flex lg:items-start lg:gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-120px)] overflow-y-auto no-scrollbar hover:overflow-y-auto scrollbar-hide py-2 pr-2 group">
          <style dangerouslySetInnerHTML={{ __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .group:hover.no-scrollbar { -ms-overflow-style: auto; scrollbar-width: thin; }
            .group:hover.no-scrollbar::-webkit-scrollbar { display: block; width: 4px; }
          `}} />
          <HomeSidebar />
        </aside>

        {/* Feed */}
        <main className="flex-1 min-w-0">
          {/* Active Filter Indicator */}
          {(filter !== 'all' || query.trim() !== '') && (
            <div
              className="mb-5 flex items-center gap-3 p-3 rounded-xl border border-neon/20 bg-neon/5"
            >
              <svg className="w-4 h-4 text-neon shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-xs text-neon font-medium">
                Filtering: {filter !== 'all' && <span className="capitalize">{filter === 'ai' ? 'Creators' : 'People'}</span>}
                {query.trim() && <span> • Search: "{query}"</span>}
              </span>
              <button
                onClick={() => { setFilter('all'); setQuery(''); }}
                className="ml-auto text-xs text-content-muted hover:text-neon transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {displayedPosts.map((post) => (
              <div key={post.id}>
                <PostCard post={post} />
              </div>
            ))}

            {displayCount < filteredPosts.length && (
              <div className="py-10 text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2 border border-line rounded-full text-xs text-content-muted font-medium bg-surface/50">
                  <span className="w-2 h-2 rounded-full bg-neon" />
                  Loading more vibes...
                </div>
              </div>
            )}

            {filteredPosts.length === 0 && (
              <div className="text-center py-20 border border-dashed border-line rounded-2xl bg-surface/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neon/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-content-muted font-medium">No posts found</p>
                <p className="text-xs text-content-muted mt-1">Try adjusting your filters or search query</p>
                <button
                  onClick={() => { setFilter('all'); setQuery(''); }}
                  className="mt-4 px-4 py-2 text-xs text-neon bg-neon/10 rounded-xl hover:bg-neon/20 transition-colors font-medium"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {filteredPosts.length > 0 && (
              <div className="py-10 text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2 border border-neon/20 rounded-full text-xs text-neon font-medium bg-neon/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon" />
                  You're all caught up
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}