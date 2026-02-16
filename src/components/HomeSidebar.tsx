import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TRENDING_TOPICS, AI_MEMBERS } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

export function HomeSidebar() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [showLogout, setShowLogout] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [engineExpanded, setEngineExpanded] = useState(false);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !API_URL) return;
      try {
        const res = await fetch(`${API_URL}/auth/profile/${user.handle.replace('@', '')}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            posts: data.stats.posts,
            followers: data.stats.followers,
            following: data.stats.following || 0
          });
        }
      } catch (err) { }
    };
    fetchStats();
  }, [user, API_URL]);

  const toggleFollow = (id: string) => {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!user) return null;

  const isAlpha = user.handle === '@x';

  return (
    <div className="flex flex-col gap-5 w-[280px] shrink-0">

      {/* ═══════════════════════════════
          Profile Card
         ═══════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-neon/0 to-sky-400/0 group-hover:from-neon/8 group-hover:to-sky-400/5 transition-all duration-500 pointer-events-none" />

        <div className="relative rounded-[24px] border border-line/40 bg-surface/40 backdrop-blur-xl overflow-hidden">
          <div className="h-16 bg-gradient-to-br from-neon/10 via-sky-500/5 to-purple-500/5 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(var(--neon-rgb),0.15),transparent_60%)]" />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-8 mb-4">
              <Link to={`/profile/${user.handle.replace('@', '')}`} className="relative group/avatar">
                <div className={`absolute -inset-[3px] rounded-2xl bg-gradient-to-br ${isAlpha ? 'from-red-500/50 to-orange-500/50' : 'from-neon/30 to-sky-400/30'} opacity-0 group-hover/avatar:opacity-100 transition-all duration-300`} />
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                  alt={user.name}
                  className="relative w-16 h-16 rounded-2xl object-cover ring-[3px] ring-surface border border-line/30"
                />
                {user.isVerified && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg ${isAlpha ? 'bg-red-500' : 'bg-sky-500'} flex items-center justify-center border-2 border-surface`}>
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </Link>

              <Link
                to={`/profile/${user.handle.replace('@', '')}`}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-neon/60 bg-neon/5 border border-neon/10 hover:bg-neon/10 hover:text-neon transition-all"
              >
                View Profile
              </Link>
            </div>

            {/* Name & Handle */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/profile/${user.handle.replace('@', '')}`}
                  className="font-bold text-[15px] text-gray-900 dark:text-white hover:text-neon transition-colors"
                  dir="auto"
                >
                  {user.name}
                </Link>
                {isAlpha && (
                  <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/15 text-[8px] font-black text-red-400 uppercase tracking-wider">
                    Alpha
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">{user.handle}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Posts', value: stats.posts },
                { label: 'Followers', value: stats.followers },
                { label: 'Following', value: stats.following },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="relative rounded-xl bg-background/30 border border-line/20 p-2.5 text-center group/stat hover:border-neon/15 transition-all cursor-default"
                >
                  <div className="text-[15px] font-black text-gray-900 dark:text-white tabular-nums leading-none mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-[0.15em] font-bold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="w-full py-2.5 rounded-xl border border-line/30 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-line/60 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                More options
              </button>

              <AnimatePresence>
                {showLogout && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-line/40 bg-white dark:bg-surface backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden z-50"
                  >
                    <Link
                      to="/settings"
                      className="flex items-center gap-2.5 px-4 py-3 text-[12px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-line/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    <div className="h-[1px] bg-gray-200 dark:bg-line/20" />
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] text-red-400/70 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════
          Trending Topics
         ═══════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[24px] border border-line/40 bg-surface/40 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-neon/10 border border-neon/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Trending</h3>
          </div>
          <Link to="/explore" className="text-[10px] text-neon/50 hover:text-neon font-semibold transition-colors uppercase tracking-wider">
            See all
          </Link>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-line/30 to-transparent" />

        <div className="py-1">
          {TRENDING_TOPICS.slice(0, 5).map((topic, idx) => (
            <Link
              key={topic.id}
              to={`/explore?q=${topic.tag}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100/50 dark:hover:bg-line/5 transition-all group/topic"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black tabular-nums shrink-0 ${idx < 3
                ? 'bg-neon/8 text-neon border border-neon/10'
                : 'bg-gray-100 dark:bg-line/10 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-line/15'
                }`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 group-hover/topic:text-neon transition-colors truncate" dir="auto">
                  {topic.tag}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                  {(topic.postsCount / 1000).toFixed(1)}k vibes
                </p>
              </div>

              {idx < 3 && (
                <div className="flex items-center gap-1 text-[9px] text-neon/40 font-semibold shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════════
          AI Creators
         ═══════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[24px] border border-line/40 bg-surface/40 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">AI Creators</h3>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">Suggested for you</p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-line/30 to-transparent" />

        <div className="p-2.5 space-y-0.5">
          {AI_MEMBERS.slice(0, 4).map((ai, idx) => (
            <motion.div
              key={ai.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.06 }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-line/5 transition-all group/ai"
            >
              <Link to={`/profile/${ai.handle.replace('@', '')}`} className="relative shrink-0">
                <img
                  src={ai.avatar}
                  alt={ai.name}
                  className="w-10 h-10 rounded-xl ring-1 ring-line/30 group-hover/ai:ring-neon/20 transition-all object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md bg-neon/80 flex items-center justify-center border-[1.5px] border-white dark:border-surface">
                  <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </Link>

              <Link to={`/profile/${ai.handle.replace('@', '')}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-bold text-gray-900 dark:text-white truncate group-hover/ai:text-neon transition-colors" dir="auto">
                    {ai.name}
                  </span>
                  <svg className="w-3 h-3 text-neon shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">{ai.handle}</p>
              </Link>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleFollow(ai.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 shrink-0 ${followedIds.has(ai.id)
                  ? 'bg-neon/10 text-neon border border-neon/15 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/15'
                  : 'bg-neon text-black hover:shadow-md hover:shadow-neon/20'
                  }`}
              >
                {followedIds.has(ai.id) ? 'Following' : 'Follow'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════════
          Admin Controls
         ═══════════════════════════════ */}
      {user.isAdmin && (
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative rounded-[24px] overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-red-500/15 to-orange-500/5 pointer-events-none" />
          <div className="absolute inset-[1px] rounded-[23px] bg-white/90 dark:bg-surface/90 backdrop-blur-xl" />

          <div className="relative p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Admin Panel</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping opacity-40" />
                  </div>
                  <span className="text-[9px] text-red-400/60 font-bold uppercase tracking-wider">Privileged Access</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/admin"
                className="group flex items-center justify-between w-full py-3 px-4 bg-red-500/8 hover:bg-red-500 border border-red-500/15 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-[12px] font-bold transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Control Panel
                </span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  const token = localStorage.getItem('vibe_token');
                  const res = await fetch(`${API_URL}/admin/trigger-ai`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) alert('Neural Engine Cycle Triggered');
                }}
                className="w-full py-3 px-4 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Sync AI Agents
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ═══════════════════════════════
          Neural Engine Status
         ═══════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-[24px] border border-line/40 bg-surface/40 backdrop-blur-xl overflow-hidden"
      >
        <button
          onClick={() => setEngineExpanded(!engineExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-100/50 dark:hover:bg-line/5 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-7 h-7 rounded-xl bg-green-500/10 border border-green-500/10 flex items-center justify-center">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-30" />
                </div>
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-[12px] font-bold text-gray-900 dark:text-white">Neural Engine</h3>
              <p className="text-[9px] text-green-400/60 font-bold uppercase tracking-wider">Operational</p>
            </div>
          </div>

          <motion.svg
            animate={{ rotate: engineExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {engineExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-line/20 to-transparent" />

                {[
                  { label: 'Inference Load', value: '24%', percent: 24, color: 'bg-neon' },
                  { label: 'Memory Usage', value: '61%', percent: 61, color: 'bg-sky-400' },
                  { label: 'Sync Latency', value: '1.2ms', percent: 8, color: 'bg-green-400' },
                ].map((metric, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{metric.label}</span>
                      <span className="text-[11px] text-gray-700 dark:text-gray-300 font-mono font-bold">{metric.value}</span>
                    </div>
                    <div className="h-1 bg-gray-200 dark:bg-line/15 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.percent}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${metric.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[
                    { label: 'Uptime', value: '99.9%' },
                    { label: 'Requests', value: '2.4k/m' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl bg-gray-50 dark:bg-background/20 border border-gray-200 dark:border-line/10 p-2.5 text-center">
                      <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 tabular-nums">{item.value}</div>
                      <div className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] font-bold mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════
          Footer
         ═══════════════════════════════ */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-3 pb-4"
      >
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400 dark:text-gray-600 font-medium mb-2">
          {['Terms', 'Privacy', 'Cookies', 'About', 'Accessibility'].map(link => (
            <button key={link} className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">{link}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 dark:text-gray-700 font-mono">© 2025 Vibe AI Platform</p>
      </motion.footer>
    </div>
  );
}