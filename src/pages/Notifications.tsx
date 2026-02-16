import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type TabKey = 'all' | 'activity' | 'follows';

export function Notifications() {
  const { user, setUnreadCount } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabKey>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const fetchNotifications = async () => {
    if (!API_URL || !user) { setLoading(false); return; }
    try {
      const token = localStorage.getItem('vibe_token');
      const res = await fetch(`${API_URL}/auth/notifications`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user, API_URL]);

  useEffect(() => {
    if (user && notifications.some(n => !n.is_read)) {
      const timer = setTimeout(() => { markAllRead(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications.length, user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      const res = await fetch(`${API_URL}/auth/notifications/read-all`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vibe_token')}` }
      });
      if (res.ok) showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      showToast('Failed to update notifications', 'error');
    }
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${API_URL}/auth/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vibe_token')}` }
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const filtered = notifications.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'activity') return n.type === 'like' || n.type === 'comment' || n.type === 'mention';
    if (tab === 'follows') return n.type === 'follow';
    return true;
  });

  const timeAgo = (date: string) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: false }); }
    catch { return ''; }
  };

  const typeConfig: Record<string, { text: string; color: string; iconBg: string; icon: React.ReactNode }> = {
    like: {
      text: 'resonated with your post',
      color: 'text-neon',
      iconBg: 'bg-neon/10 border-neon/20',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" />
        </svg>
      ),
    },
    comment: {
      text: 'replied to your post',
      color: 'text-sky-400',
      iconBg: 'bg-sky-400/10 border-sky-400/20',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    follow: {
      text: 'followed you',
      color: 'text-purple-400',
      iconBg: 'bg-purple-400/10 border-purple-400/20',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    mention: {
      text: 'mentioned you in a post',
      color: 'text-neon',
      iconBg: 'bg-neon/10 border-neon/20',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
    },
  };

  const tabConfig = [
    {
      key: 'all' as TabKey,
      label: 'All',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      key: 'activity' as TabKey,
      label: 'Activity',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: 'follows' as TabKey,
      label: 'Follows',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 pb-28">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-36 rounded-lg bg-surface animate-pulse" />
          <div className="h-5 w-20 rounded-lg bg-surface animate-pulse" />
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-10 w-24 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
        {/* Items skeleton */}
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-surface animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="w-11 h-11 rounded-full bg-line shrink-0" />
              <div className="flex-1 space-y-2.5 pt-1">
                <div className="h-3.5 w-3/4 rounded-md bg-line" />
                <div className="h-3 w-1/2 rounded-md bg-line" />
                <div className="h-2.5 w-16 rounded-md bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 pb-28">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neon/10 border border-neon/15 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-content tracking-tight leading-none">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-[12px] text-neon font-medium mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] text-neon font-bold 
                       bg-neon/5 border border-neon/15 hover:bg-neon/10 hover:border-neon/25 
                       transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark all read
          </motion.button>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-line/50 mb-5" />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-2xl bg-surface/50 border border-line/50">
        {tabConfig.map(t => {
          const isActive = tab === t.key;
          const count = t.key === 'all'
            ? notifications.length
            : t.key === 'activity'
              ? notifications.filter(n => n.type === 'like' || n.type === 'comment' || n.type === 'mention').length
              : notifications.filter(n => n.type === 'follow').length;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${isActive
                ? 'bg-neon text-black shadow-lg shadow-neon/20'
                : 'text-content-muted hover:text-content hover:bg-surface'
                }`}
            >
              <span className={isActive ? 'text-black' : ''}>{t.icon}</span>
              <span>{t.label}</span>
              {count > 0 && (
                <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full tabular-nums ${isActive
                  ? 'bg-black/15 text-black'
                  : 'bg-line text-content-muted'
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notifications List ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {filtered.length > 0 ? (
            <div>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const groups: { label: string; items: typeof filtered }[] = [];
                const todayItems = filtered.filter(n => new Date(n.created_at) >= today);
                const yesterdayItems = filtered.filter(n => {
                  const d = new Date(n.created_at);
                  return d >= yesterday && d < today;
                });
                const olderItems = filtered.filter(n => new Date(n.created_at) < yesterday);

                if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
                if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
                if (olderItems.length) groups.push({ label: 'Earlier', items: olderItems });
                if (groups.length === 0) groups.push({ label: '', items: filtered });

                return groups.map((group, gi) => (
                  <div key={gi} className={gi > 0 ? 'mt-2' : ''}>
                    {group.label && (
                      <div className="flex items-center gap-3 px-1 pt-4 pb-3">
                        <span className="text-[11px] font-extrabold text-content-muted/60 uppercase tracking-[0.1em]">
                          {group.label}
                        </span>
                        <div className="flex-1 h-px bg-line/40" />
                        <span className="text-[10px] font-bold text-content-muted/40 tabular-nums">
                          {group.items.length}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {group.items.map((n, i) => {
                        const config = typeConfig[n.type] || typeConfig.like;

                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
                          >
                            <button
                              onClick={() => markRead(n.id)}
                              className={`w-full text-left flex items-start gap-3.5 px-3.5 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${n.is_read
                                ? 'hover:bg-surface/80'
                                : 'bg-neon/[0.03] hover:bg-neon/[0.07] border border-neon/[0.06] hover:border-neon/[0.12]'
                                }`}
                            >
                              {/* Left accent for unread */}
                              {!n.is_read && (
                                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-neon/60" />
                              )}

                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <Link to={`/profile/${n.sender?.handle}`} onClick={e => e.stopPropagation()}>
                                  <img
                                    src={n.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender?.handle}`}
                                    alt=""
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-line/50 group-hover:ring-neon/20 transition-all duration-200"
                                  />
                                </Link>
                                {/* Type badge */}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center 
                                                 border ${config.iconBg} ${config.color} shadow-sm`}>
                                  {config.icon}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-[14px] leading-relaxed">
                                  <Link
                                    to={`/profile/${n.sender?.handle}`}
                                    onClick={e => e.stopPropagation()}
                                    className="font-bold text-content hover:text-neon transition-colors duration-150"
                                    dir="auto"
                                  >
                                    {n.sender?.full_name}
                                  </Link>
                                  {' '}
                                  <span className="text-content-muted font-normal">{config.text}</span>
                                </p>

                                {/* Post excerpt */}
                                {n.post?.content && (
                                  <div className="mt-1.5 px-3 py-2 rounded-xl bg-surface/60 border border-line/40">
                                    <p className="text-[12px] text-content-muted/70 line-clamp-2 leading-relaxed" dir="auto">
                                      "{n.post.content}"
                                    </p>
                                  </div>
                                )}

                                {/* Time */}
                                <div className="flex items-center gap-1.5 mt-2">
                                  <svg className="w-3 h-3 text-content-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-[11px] text-content-muted/40 font-medium">
                                    {timeAgo(n.created_at)}
                                  </span>
                                </div>
                              </div>

                              {/* Unread indicator */}
                              {!n.is_read && (
                                <div className="shrink-0 mt-2.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-neon shadow-sm shadow-neon/30 animate-pulse" />
                                </div>
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            /* ── Empty State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-20 text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-3xl bg-neon/5 border border-neon/10 rotate-6" />
                <div className="relative w-full h-full rounded-3xl bg-surface border border-line flex items-center justify-center">
                  <svg className="w-8 h-8 text-content-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-bold text-content">
                {tab === 'all' ? "You're all caught up!" : `No ${tab} yet`}
              </h3>
              <p className="text-[13px] text-content-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
                {tab === 'all'
                  ? 'New notifications will appear here when someone interacts with your posts.'
                  : 'Check back later for new activity.'}
              </p>
              {tab !== 'all' && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTab('all')}
                  className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] text-neon font-bold bg-neon/5 border border-neon/15 hover:bg-neon/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  View all notifications
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── End indicator ── */}
      {filtered.length > 0 && (
        <div className="py-10 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-line/30" />
          <span className="text-[11px] text-content-muted/30 font-medium">That's everything</span>
          <div className="h-px w-12 bg-line/30" />
        </div>
      )}
    </div>
  );
}