import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { motion, AnimatePresence } from 'framer-motion';

export function Profile() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'media' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const { handle } = useParams<{ handle?: string }>();

  const [profileData, setProfileData] = useState<{
    profile: User | null;
    stats: { posts: number; followers: number; following: number; likes: number; is_following?: boolean };
    posts: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = (import.meta as any).env.VITE_API_URL;

  const fetchProfile = async () => {
    if (!handle) return;
    try {
      const res = await fetch(`${API_URL}/auth/profile/${handle.replace('@', '')}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          profile: {
            id: data.profile.id,
            name: data.profile.full_name,
            handle: `@${data.profile.handle}`,
            avatar: data.profile.avatar_url,
            bio: data.profile.bio,
            location: data.profile.location,
            website: data.profile.website,
            createdAt: data.profile.created_at,
            hasProfile: true,
          },
          stats: data.stats,
          posts: data.posts,
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [handle, API_URL]);

  const handleFollow = async () => {
    if (!profileData?.profile || !authUser) {
      showToast('Please login to follow', 'info');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/posts/follow/${profileData.profile.id}`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          data.following ? `Followed ${profileData.profile.handle}` : `Unfollowed ${profileData.profile.handle}`,
          'success'
        );
        fetchProfile();
      }
    } catch { showToast('Action failed', 'error'); }
  };

  const selectedUser = useMemo(() => {
    if (profileData?.profile) return profileData.profile;
    if (!handle && authUser) return authUser;
    return { id: 'loading', name: 'Loading...', handle: handle || '', avatar: '', hasProfile: false };
  }, [profileData, handle, authUser]);

  const userPosts = useMemo(() => {
    if (profileData?.posts) {
      return profileData.posts.map((p: any) => ({
        id: p.id, user: selectedUser, content: p.content,
        timestamp: p.timestamp, likes: p.likes || 0,
        comments: p.comments || 0, image: p.image_url,
      }));
    }
    return [];
  }, [profileData, selectedUser]);

  const isOwnProfile = authUser && selectedUser.id === authUser.id;

  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-line" />
            <div className="absolute inset-0 rounded-full border-2 border-neon border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-neon/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-content-muted font-mono">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

      {/* ═══════════════════════════════════════
          🎯 HERO PROFILE CARD - Unique Design
          ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        {/* Main Profile Card */}
        <div className="relative rounded-3xl overflow-hidden border border-line bg-surface">

          {/* Generative Cover Art */}
          <div className="relative h-44 sm:h-56 overflow-hidden">
            {/* Layered Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon/30 via-background to-neon-secondary/20" />

            {/* Animated Mesh */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-neon-secondary/10 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon/20 rounded-full blur-[50px]" />
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundSize: '30px 30px',
              backgroundImage: `linear-gradient(to right, var(--color-neon) 1px, transparent 1px),
                               linear-gradient(to bottom, var(--color-neon) 1px, transparent 1px)`,
            }} />

            {/* Scan Line */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon/40 to-transparent animate-pulse" style={{ top: '40%' }} />
            </div>

            {/* Top HUD Elements */}
            <div className="absolute top-4 left-5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-white/80 font-mono uppercase tracking-widest">Online</span>
              </div>
            </div>

            <div className="absolute top-4 right-5 flex items-center gap-2">
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Edit</span>
                </button>
              )}
              <button className="p-2 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent" />
          </div>

          {/* Profile Content */}
          <div className="relative px-5 sm:px-8 pb-6 -mt-20">
            <div className="flex flex-col sm:flex-row gap-5">

              {/* Avatar Column */}
              <div className="flex flex-col items-center sm:items-start shrink-0">
                {/* Avatar with Ring */}
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-neon via-neon/50 to-neon-secondary opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
                  <div className="relative">
                    <img
                      src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.handle}`}
                      alt={selectedUser.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-surface shadow-2xl"
                    />
                    {/* Status Dot */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-green-500 border-3 border-surface flex items-center justify-center shadow-lg shadow-green-500/30">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Under Avatar */}
                <div className="flex items-center gap-1.5 mt-4">
                  {[
                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>, label: 'Share' },
                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, label: 'Message' },
                    { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>, label: 'Notify' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      className="p-2 rounded-xl border border-line hover:border-neon/30 hover:bg-neon/5 text-content-muted hover:text-neon transition-all group"
                      title={action.label}
                    >
                      <span className="group-hover:scale-110 inline-block transition-transform">{action.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Column */}
              <div className="flex-1 min-w-0 text-center sm:text-left pt-2">
                {/* Name Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl md:text-3xl font-black text-content tracking-tight">
                        {selectedUser.name}
                      </h1>
                      <svg className="w-6 h-6 text-neon shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="text-sm text-content-muted font-mono">{selectedUser.handle}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-neon/10 text-neon font-bold uppercase tracking-wider">
                        Creator
                      </span>
                    </div>
                  </div>

                  {/* Follow / Edit Button */}
                  {!isOwnProfile && (
                    <button
                      onClick={handleFollow}
                      className={`group relative overflow-hidden px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        profileData?.stats.is_following
                          ? 'border border-line text-content hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30'
                          : 'bg-neon text-black hover:shadow-xl hover:shadow-neon/30 active:scale-95'
                      }`}
                    >
                      {!profileData?.stats.is_following && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      )}
                      <span className="relative flex items-center gap-2">
                        {profileData?.stats.is_following ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Following
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Follow
                          </>
                        )}
                      </span>
                    </button>
                  )}
                </div>

                {/* Bio */}
                <p className="text-sm text-content/80 leading-relaxed mt-4 max-w-lg mx-auto sm:mx-0">
                  {selectedUser.bio || 'No bio yet. This mystery keeps us intrigued.'}
                </p>

                {/* Meta Info Chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  {selectedUser.location && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-content-muted hover:border-neon/20 hover:text-neon transition-all cursor-default">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {selectedUser.location}
                    </span>
                  )}
                  {selectedUser.website && (
                    <a
                      href={selectedUser.website.startsWith('http') ? selectedUser.website : `https://${selectedUser.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-neon hover:border-neon/30 hover:bg-neon/5 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {selectedUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-content-muted">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Joined {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar - Bottom of Card */}
          <div className="border-t border-line">
            <div className="grid grid-cols-4">
              {[
                {
                  key: 'posts',
                  label: 'Posts',
                  value: profileData?.stats.posts || 0,
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                },
                {
                  key: 'followers',
                  label: 'Followers',
                  value: profileData?.stats.followers || 0,
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                },
                {
                  key: 'following',
                  label: 'Following',
                  value: profileData?.stats.following || 0,
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
                },
                {
                  key: 'likes',
                  label: 'Likes',
                  value: profileData?.stats.likes || 0,
                  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
                },
              ].map((stat, i) => (
                <button
                  key={stat.key}
                  onMouseEnter={() => setHoveredStat(stat.key)}
                  onMouseLeave={() => setHoveredStat(null)}
                  onClick={() => setActiveTab(stat.key === 'followers' || stat.key === 'following' ? 'about' : stat.key as any)}
                  className={`relative py-4 text-center transition-all duration-300 group ${
                    i < 3 ? 'border-r border-line' : ''
                  } ${hoveredStat === stat.key ? 'bg-neon/5' : 'hover:bg-neon/[0.02]'}`}
                >
                  {/* Active Indicator */}
                  {hoveredStat === stat.key && (
                    <motion.div
                      layoutId="stat-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <span className={`transition-colors ${hoveredStat === stat.key ? 'text-neon' : 'text-content-muted'}`}>
                      {stat.icon}
                    </span>
                    <span className={`text-xl sm:text-2xl font-black tabular-nums transition-colors ${
                      hoveredStat === stat.key ? 'text-neon' : 'text-content'
                    }`}>
                      {stat.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-content-muted font-medium uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════
          📑 CONTENT TABS
          ═══════════════════════════════════════ */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-surface border border-line mb-6 overflow-x-auto scrollbar-hide">
        {[
          { key: 'posts' as const, label: 'Posts', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>, count: profileData?.stats.posts },
          { key: 'likes' as const, label: 'Likes', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, count: profileData?.stats.likes },
          { key: 'media' as const, label: 'Media', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, count: userPosts.filter(p => p.image).length },
          { key: 'about' as const, label: 'About', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-neon text-black shadow-lg shadow-neon/20'
                : 'text-content-muted hover:text-content hover:bg-neon/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-line text-content-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          📝 TAB CONTENT
          ═══════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {userPosts.length > 0 ? userPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl border border-line bg-surface overflow-hidden hover:border-neon/20 hover:shadow-xl hover:shadow-neon/5 transition-all duration-300"
                >
                  {/* Post Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <img
                        src={post.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.handle}`}
                        alt={post.user.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-line shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-content">{post.user.name}</span>
                          <span className="text-xs text-content-muted font-mono">{post.user.handle}</span>
                          <span className="text-content-muted">·</span>
                          <span className="text-xs text-content-muted">{timeAgo(post.timestamp)}</span>
                        </div>

                        <p
                          className="text-sm text-content mt-2 leading-relaxed cursor-pointer"
                          onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        >
                          {expandedPost === post.id
                            ? post.content
                            : post.content.length > 200
                              ? `${post.content.slice(0, 200)}...`
                              : post.content}
                        </p>
                        {post.content.length > 200 && (
                          <button
                            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            className="text-xs text-neon mt-1 hover:underline"
                          >
                            {expandedPost === post.id ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Image */}
                    {post.image && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-line ml-13">
                        <img src={post.image} alt="" className="w-full h-52 md:h-72 object-cover hover:scale-[1.02] transition-transform duration-500" />
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-5 pb-4 flex items-center gap-1 ml-13">
                    {[
                      { icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>, count: post.comments, hoverColor: 'hover:text-blue-400 hover:bg-blue-400/10' },
                      { icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, count: post.likes, hoverColor: 'hover:text-rose-400 hover:bg-rose-400/10' },
                      { icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, count: null, label: 'Repost', hoverColor: 'hover:text-green-400 hover:bg-green-400/10' },
                      { icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>, count: null, hoverColor: 'hover:text-neon hover:bg-neon/10' },
                    ].map((action, i) => (
                      <button
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-content-muted transition-all ${action.hoverColor} group/action`}
                      >
                        <span className="group-hover/action:scale-110 transition-transform">{action.icon}</span>
                        {action.count !== null && <span className="tabular-nums">{action.count}</span>}
                        {action.label && <span className="hidden sm:inline">{action.label}</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )) : (
                <EmptyState
                  icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  title="No posts yet"
                  description={isOwnProfile ? "Share your first thought with the world." : "When this user posts, they'll show up here."}
                  action={isOwnProfile ? { label: 'Create Post', onClick: () => window.dispatchEvent(new Event('open-create')) } : undefined}
                />
              )}
            </div>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <EmptyState
              icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
              title="No likes yet"
              description="Liked posts will appear here."
            />
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            userPosts.filter(p => p.image).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPosts.filter(p => p.image).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-line cursor-pointer hover:border-neon/30 transition-all"
                  >
                    <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-white font-bold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-white font-bold">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                title="No media yet"
                description="Images shared in posts will appear here."
              />
            )
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                title="About"
              >
                <p className="text-sm text-content-muted leading-relaxed">
                  {selectedUser.bio || "This user hasn't shared their story yet."}
                </p>
              </InfoCard>

              <InfoCard
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Details"
              >
                <ul className="space-y-3">
                  {[
                    { label: 'Location', value: selectedUser.location || 'Not specified', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                    { label: 'Website', value: selectedUser.website || 'None', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg> },
                    { label: 'Joined', value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Recently', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                  ].map(item => (
                    <li key={item.label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neon/10 flex items-center justify-center text-neon shrink-0">{item.icon}</div>
                      <div>
                        <div className="text-[10px] text-content-muted uppercase tracking-wider font-medium">{item.label}</div>
                        <div className="text-sm text-content font-medium">{item.value}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </InfoCard>

              <InfoCard
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                title="Activity"
              >
                <div className="space-y-3">
                  {[
                    { label: 'Posts', value: profileData?.stats.posts || 0 },
                    { label: 'Followers', value: profileData?.stats.followers || 0 },
                    { label: 'Following', value: profileData?.stats.following || 0 },
                    { label: 'Total Likes', value: profileData?.stats.likes || 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neon/5 transition-all">
                      <span className="text-xs text-content-muted">{item.label}</span>
                      <span className="text-sm font-bold text-content tabular-nums">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>

              <InfoCard
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                title="Interests"
              >
                <div className="flex flex-wrap gap-2">
                  {['Technology', 'AI', 'Design', 'Open Source', 'Music', 'Photography'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-xl border border-line text-xs text-content-muted hover:text-neon hover:border-neon/30 hover:bg-neon/5 cursor-pointer transition-all font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* End Indicator */}
      <div className="py-10 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs text-neon font-medium border border-neon/20 bg-neon/5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
          Profile synced
        </div>
      </div>

      {/* Edit Modal */}
      {profileData?.profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={profileData.profile}
          onUpdate={fetchProfile}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   🧩 REUSABLE SUB-COMPONENTS
   ═══════════════════════════════════════ */

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 md:p-6 hover:border-neon/10 transition-all">
      <h3 className="text-sm font-bold text-content flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-neon/10 flex items-center justify-center text-neon">{icon}</div>
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="py-20 text-center">
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface border border-line flex items-center justify-center text-content-muted/30">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-content">{title}</h3>
      <p className="text-sm text-content-muted mt-2 max-w-xs mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-6 py-2.5 rounded-xl bg-neon text-black text-sm font-bold hover:shadow-lg hover:shadow-neon/25 active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}