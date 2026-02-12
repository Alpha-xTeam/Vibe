import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AI_MEMBERS, TRENDING_TOPICS } from '../data/mockData';

export function Explore() {
  const [activeTab, setActiveTab] = useState<'trending' | 'users' | 'discover'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: any[], users: any[] }>({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const toggleFollow = (id: string) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const filteredTopics = useMemo(() => {
    return TRENDING_TOPICS.filter(t => 
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !API_URL) return;
    setLoading(true);
    try {
      const [postRes, userRes] = await Promise.all([
        fetch(`${API_URL}/posts?q=${encodeURIComponent(searchQuery)}`),
        fetch(`${API_URL}/posts/search/users?q=${encodeURIComponent(searchQuery)}`)
      ]);
      
      const postsData = await postRes.json();
      const usersData = await userRes.json();
      
      setSearchResults({
        posts: postsData.posts.map((p: any) => ({
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
            image: p.image_url
        })),
        users: usersData.users
      });
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">
      <div className="relative rounded-2xl border border-line bg-surface/50 p-6 md:p-8 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-content tracking-tight mb-2">Explore</h1>
          <p className="text-content-muted text-sm max-w-lg mb-6">Discover posts and people in the Vibe network.</p>
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for vibes or users..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-line bg-surface/80 backdrop-blur-sm text-content placeholder:text-content-muted text-sm focus:outline-none focus:ring-2 focus:ring-neon/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <section className="flex-1 min-w-0">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-line mb-6 w-fit">
            <button onClick={() => setActiveTab('trending')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'trending' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-content-muted hover:text-content text-sm'}`}>Topics</button>
            <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-content-muted hover:text-content text-sm'}`}>People</button>
            <button onClick={() => setActiveTab('discover')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-neon text-black shadow-lg shadow-neon/20' : 'text-content-muted hover:text-content text-sm'}`}>Discover</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-neon border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'trending' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-content uppercase tracking-wider">Trending Topics</h3>
                    <span className="text-xs text-content-muted bg-surface border border-line px-3 py-1 rounded-full">{filteredTopics.length} topics</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTopics.map((t, index) => (
                      <div key={t.id} className="group relative rounded-2xl border border-line p-5 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300 cursor-pointer">
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-neon/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-neon">#{index + 1}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center shrink-0 group-hover:bg-neon/20 transition-colors">
                            <span className="text-neon font-bold text-sm">#</span>
                          </div>
                          <div>
                            <div className="font-semibold text-content group-hover:text-neon transition-colors text-base">{t.tag}</div>
                            <div className="text-sm text-content-muted mt-1.5 flex items-center gap-2">
                              {formatCount(t.postsCount)} posts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.users.length > 0 ? (
                    searchResults.users.map(u => (
                      <Link to={`/profile/${u.handle}`} key={u.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-line bg-surface hover:border-neon/30 hover:shadow-lg transition-all">
                        <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`} className="w-12 h-12 rounded-xl object-cover ring-2 ring-line group-hover:ring-neon/20" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-content group-hover:text-neon transition-colors truncate">{u.full_name}</div>
                          <div className="text-xs text-content-muted truncate">@{u.handle}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-neon/10 text-neon group-hover:bg-neon group-hover:text-black transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" /></svg>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 text-content-muted border border-dashed border-line rounded-2xl">
                      <p>Type something to find users</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'discover' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="group rounded-2xl border border-line p-6 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
                      <div className="font-semibold text-content text-lg">AI Agent Spotlights</div>
                      <div className="text-sm text-content-muted mt-2">Curated agents and their recent highlights.</div>
                   </div>
                   <div className="group rounded-2xl border border-line p-6 bg-surface hover:border-neon/30 hover:shadow-lg hover:shadow-neon/5 transition-all duration-300 cursor-pointer relative overflow-hidden">
                      <div className="font-semibold text-content text-lg">Trending Threads</div>
                      <div className="text-sm text-content-muted mt-2">Top threads people are talking about this week.</div>
                   </div>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="w-80 shrink-0 hidden lg:block">
          <div className="sticky top-8">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="text-sm font-semibold text-content uppercase tracking-wider mb-5">AI Agents</h3>
              <div className="space-y-3">
                {AI_MEMBERS.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-2 hover:bg-neon/5 rounded-xl transition-all">
                    <img src={a.avatar} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{a.name}</div>
                      <div className="text-xs text-content-muted truncate">{a.handle}</div>
                    </div>
                    <button onClick={() => toggleFollow(a.id)} className={`px-3 py-1 text-xs rounded-lg font-bold ${followedIds.has(a.id) ? 'bg-neon/20 text-neon' : 'bg-neon text-black'}`}>
                       {followedIds.has(a.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
