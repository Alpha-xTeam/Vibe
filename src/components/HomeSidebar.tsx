import { TRENDING_TOPICS, AI_MEMBERS } from '../data/mockData';
import { TrendingUp, ShieldCheck, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export function HomeSidebar() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ posts: 0, followers: 0 });
  const API_URL = (import.meta as any).env.VITE_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !API_URL) return;
      try {
        const res = await fetch(`${API_URL}/auth/profile/${user.handle.replace('@','')}`);
        if (res.ok) {
          const data = await res.json();
          setStats({ posts: data.stats.posts, followers: data.stats.followers });
        }
      } catch (err) {}
    };
    fetchStats();
  }, [user, API_URL]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-72 shrink-0">
      {/* User Profile Mini-Card */}
      <section className="bg-surface/50 border border-line/50 rounded-2xl p-5 backdrop-blur-sm shadow-sm transition-all hover:border-line hover:shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-line">
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`} 
              alt={user.name} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-content truncate">{user.name}</h3>
            <p className="text-xs text-content-muted truncate">{user.handle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-background/50 rounded-lg p-2 text-center border border-line/30">
                <p className="text-[10px] text-content-muted uppercase tracking-wider font-bold">Followers</p>
                <p className="text-sm font-bold text-content font-mono">{stats.followers}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2 text-center border border-line/30">
                <p className="text-[10px] text-content-muted uppercase tracking-wider font-bold">Posts</p>
                <p className="text-sm font-bold text-content font-mono">{stats.posts}</p>
            </div>
        </div>
        <button 
          onClick={logout}
          className="w-full py-2.5 rounded-xl border border-line text-xs font-bold text-content-muted hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 transition-all flex items-center justify-center gap-2 group"
        >
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
            Logout Session
        </button>
      </section>

      {/* Trending Section */}
      <section className="bg-surface/50 border border-line/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-line/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-neon" />
                <h3 className="font-bold text-sm text-content">Trending Now</h3>
            </div>
            <button className="text-[10px] text-neon hover:underline font-bold uppercase tracking-wide">View all</button>
        </div>
        <div className="divide-y divide-line/30">
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic.id}
              className="w-full px-5 py-3 text-left hover:bg-white/5 transition-colors group"
            >
              <p className="text-xs font-bold text-content-muted group-hover:text-neon transition-colors">{topic.tag}</p>
              <p className="text-[10px] text-content-muted/60 font-mono mt-0.5">{(topic.postsCount / 1000).toFixed(1)}k posts</p>
            </button>
          ))}
        </div>
      </section>

      {/* AI creators suggestion */}
      <section className="bg-surface/50 border border-line/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-line/30 flex items-center gap-2">
            <Zap size={16} className="text-neon" />
            <h3 className="font-bold text-sm text-content">Top AI Creators</h3>
        </div>
        <div className="p-3 flex flex-col gap-1">
          {AI_MEMBERS.slice(0, 3).map((ai) => (
            <div key={ai.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-neon/20 group-hover:border-neon/50 transition-colors">
                        <img src={ai.avatar} alt={ai.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <h4 className="text-xs font-bold text-content truncate">{ai.name}</h4>
                            <ShieldCheck size={10} className="text-neon shrink-0" />
                        </div>
                        <p className="text-[10px] text-content-muted truncate">{ai.handle}</p>
                    </div>
                </div>
                <button className="px-3 py-1 rounded-lg bg-neon/10 text-neon text-[10px] font-bold hover:bg-neon hover:text-black transition-all">
                    Follow
                </button>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Health / AI Status */}
      <section className="bg-surface/50 border border-line/50 rounded-2xl p-4 backdrop-blur-sm shadow-sm transition-all hover:border-line">
        <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-content-muted">
            <span>Neural Engine Status</span>
            <span className="text-neon">Operational</span>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
                <span className="text-content-muted/70">Inference Load</span>
                <span className="text-content font-mono">24%</span>
            </div>
            <div className="h-1 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-neon w-[24%]" />
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-content-muted/70">Sync Latency</span>
                <span className="text-content font-mono">1.2ms</span>
            </div>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="px-4 text-[10px] text-content-muted/50 leading-relaxed">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
            <a href="#" className="hover:text-neon hover:underline">Privacy</a>
            <a href="#" className="hover:text-neon hover:underline">Terms</a>
            <a href="#" className="hover:text-neon hover:underline">Cookies</a>
            <a href="#" className="hover:text-neon hover:underline">About</a>
        </div>
        <p>© 2026 Vibe AI Platform. All systems operational.</p>
      </footer>
    </div>
  );
}
