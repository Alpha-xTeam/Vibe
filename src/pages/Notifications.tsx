import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type NotifType = 'all' | 'posts' | 'mentions' | 'follows';

export function Notifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NotifType>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const fetchNotifications = async () => {
    if (!API_URL || !user) return;
    try {
      const res = await fetch(`${API_URL}/auth/notifications`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, API_URL]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIconColor = (type: string) => {
    switch (type) {
        case 'comment': return 'text-blue-400 bg-blue-400/10';
        case 'follow': return 'text-purple-400 bg-purple-400/10';
        case 'like': return 'text-rose-400 bg-rose-400/10';
        default: return 'text-neon bg-neon/10';
    }
  };

  const getNotificationText = (n: any) => {
    switch(n.type) {
        case 'like': return 'liked your post';
        case 'comment': return 'commented on your post';
        case 'follow': return 'started following you';
        default: return 'interacted with you';
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'posts') return n.type === 'like' || n.type === 'comment';
    if (activeTab === 'follows') return n.type === 'follow';
    return true;
  });

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-neon border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-8 pb-24">
      {/* Header */}
      <div className="relative rounded-2xl border border-line bg-surface/50 p-6 md:p-8 mb-6 overflow-hidden">
        {/* Subtle Decorative Background instead of large blurs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4 mb-2 sm:mb-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-neon/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon text-black text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-content tracking-tight">Notifications</h1>
                <p className="text-xs text-content-muted mt-0.5">Stay updated with your latest activity</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neon bg-neon/10 hover:bg-neon/20 border border-neon/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-line/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon" />
              <span className="text-[11px] font-medium text-content-muted">{unreadCount} unread</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-line" />
              <span className="text-[11px] font-medium text-content-muted">{notifications.length} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Scrollable on mobile */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-line mb-6 overflow-x-auto scrollbar-hide no-scrollbar">
        {[
          { key: 'all' as const, label: 'All', icon: <div className="w-1.5 h-1.5 rounded-full bg-current" /> },
          { key: 'posts' as const, label: 'Activity', icon: '📝' },
          { key: 'follows' as const, label: 'Follows', icon: '👤' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 shrink-0 ${
              activeTab === tab.key
                ? 'bg-neon text-black shadow-lg shadow-neon/20'
                : 'text-content-muted hover:text-content'
            }`}
          >
            <span className="text-xs">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifs.map((n) => (
          <div
            key={n.id}
            className={`group relative rounded-2xl border p-4 transition-all duration-300 cursor-pointer shadow-sm ${
              n.is_read
                ? 'border-line bg-surface/40 hover:bg-surface/60'
                : 'border-neon/10 bg-neon/[0.03] hover:bg-neon/[0.05]'
            }`}
          >
            {/* Unread indicator */}
            {!n.is_read && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-neon shadow-[0_0_8px_var(--color-neon)]" />
            )}

            <div className="flex items-start gap-3 md:gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={n.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender?.handle}`}
                  alt={n.sender?.full_name}
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 transition-all ${
                    n.is_read ? 'ring-line' : 'ring-neon/20'
                  }`}
                />
                {/* Type Badge */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${getIconColor(n.type)} border-2 border-surface shadow-sm`}>
                  <div className="w-2.5 h-2.5">
                    {n.type === 'comment' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                    {n.type === 'follow' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    )}
                    {n.type === 'like' && (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-content leading-relaxed">
                      <span className="font-bold text-content">
                        {n.sender?.full_name}
                      </span>
                      {' '}
                      <span className={n.is_read ? 'text-content-muted' : 'text-content'}>
                        {getNotificationText(n)}
                        {n.post && <span className="italic"> "{n.post.content.slice(0, 30)}..."</span>}
                      </span>
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-content-muted flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDistanceToNow(new Date(n.created_at))} ago
                      </span>
                      <span className="text-xs text-content-muted opacity-30">•</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getIconColor(n.type)}`}>
                        {n.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredNotifs.length === 0 && (
          <div className="text-center py-20 border border-dashed border-line rounded-2xl bg-surface/50">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-neon/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-neon/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-content font-medium text-lg">No notifications</p>
            <p className="text-sm text-content-muted mt-2 max-w-xs mx-auto">
              {activeTab === 'all'
                ? "You're all caught up! Check back later for new activity."
                : `No ${activeTab} notifications yet.`}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-5 px-5 py-2 text-xs text-neon bg-neon/10 rounded-xl hover:bg-neon/20 transition-colors font-medium"
              >
                View All Notifications
              </button>
            )}
          </div>
        )}

        {/* End Indicator */}
        {filteredNotifs.length > 0 && (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 border border-neon/20 rounded-full text-xs text-neon font-medium bg-neon/5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon" />
              You're all caught up
            </div>
          </div>
        )}
      </div>
    </div>
  );
}