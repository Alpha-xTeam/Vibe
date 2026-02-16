import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, User } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { PostCard } from '../components/PostCard';
import { usePosts } from '../context/PostContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/api';

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  live_url?: string;
  github_url?: string;
  thumbnail_url?: string;
  images: string[];
  likes: number;
  created_at: string;
}

export function Profile() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'likes' | 'media' | 'about'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list'>('grid');
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [followUsers, setFollowUsers] = useState<User[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const { handle } = useParams<{ handle?: string }>();

  const [profileData, setProfileData] = useState<{
    profile: User | null;
    stats: { posts: number; followers: number; following: number; likes: number; is_following?: boolean };
    posts: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
            isVerified: data.profile.is_verified,
            isAdmin: data.profile.is_admin
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

  const fetchProjects = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchFollowUsers = async (type: 'followers' | 'following') => {
    if (!profileData?.profile?.id) return;
    setFollowLoading(true);
    setFollowModalType(type);
    setIsFollowersModalOpen(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile/${profileData.profile.id}/${type}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFollowUsers(data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          handle: `@${u.handle}`,
          avatar: u.avatar_url,
          bio: u.bio,
          isVerified: u.is_verified,
        })));
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}`, err);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [handle, API_URL]);

  useEffect(() => {
    if (profileData?.profile?.id) {
      fetchProjects(profileData.profile.id);
    }
  }, [profileData?.profile?.id]);

  // Reset image gallery to first image when opening a new project
  useEffect(() => {
    if (selectedProject) {
      setCurrentImageIndex(0);
    }
  }, [selectedProject?.id]);

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

  const handleAdminVerify = async () => {
    if (!profileData?.profile || !authUser?.isAdmin) return;
    const action = profileData.profile.isVerified ? 'unverify' : 'verify';
    const token = localStorage.getItem('vibe_token');
    try {
      const res = await fetch(`${API_URL}/admin/${action}/${profileData.profile.id}`, {
        method: 'POST', credentials: 'include',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        showToast(`User ${action === 'verify' ? 'verified' : 'unverified'}`, 'success');
        fetchProfile();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.detail || 'Admin action failed', 'error');
      }
    } catch { showToast('Admin action failed', 'error'); }
  };

  const handleAdminDelete = async () => {
    if (!profileData?.profile || !authUser?.isAdmin) return;
    if (!confirm(`Are you sure you want to PERMANENTLY delete user ${profileData.profile.handle}?`)) return;
    const token = localStorage.getItem('vibe_token');
    try {
      const res = await fetch(`${API_URL}/admin/user/${profileData.profile.id}`, {
        method: 'DELETE', credentials: 'include',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        showToast('User deleted from system', 'success');
        window.location.href = '/';
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.detail || 'Admin delete failed', 'error');
      }
    } catch { showToast('Admin delete failed', 'error'); }
  };

  const selectedUser = useMemo(() => {
    if (profileData?.profile) return profileData.profile;
    if (!handle && authUser) return authUser;
    return {
      id: 'loading', name: 'Loading...', handle: handle || '', avatar: '',
      hasProfile: false, isAdmin: false, isVerified: false, bio: '', location: '', website: '', createdAt: ''
    } as User;
  }, [profileData, handle, authUser]);

  const { posts: globalPosts } = usePosts();

  const userPosts = useMemo(() => {
    if (profileData?.posts) {
      return profileData.posts.map((p: any) => {
        // Find if this post exists in global context (which has optimistic updates)
        const globalPost = globalPosts.find(gp => gp.id === p.id);

        return {
          id: p.id,
          user: selectedUser,
          content: p.content,
          timestamp: p.timestamp,
          likes: globalPost ? globalPost.likes : (p.likes || 0),
          comments: globalPost ? globalPost.comments : (p.comments || 0),
          reposts: globalPost ? globalPost.reposts : (p.reposts || 0),
          image: p.image_url,
          hasLiked: globalPost ? globalPost.hasLiked : (p.user_has_liked || false),
          hasReposted: globalPost ? globalPost.hasReposted : (p.user_has_reposted || false),
          isAIPost: selectedUser.handle?.includes('_ai') || selectedUser.isAI
        };
      });
    }
    return [];
  }, [profileData, selectedUser, globalPosts]);

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
            <div className="absolute inset-0 rounded-full border-2 border-content/30 border-t-content animate-spin" />
            <div className="absolute inset-3 rounded-full bg-content/5 flex items-center justify-center">
              <svg className="w-5 h-5 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          🎯 HERO PROFILE CARD
          ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <div className="relative rounded-3xl overflow-hidden border border-line bg-surface">
          {/* Cover Art */}
          <div className="relative h-44 sm:h-56 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-content/5 via-background/50 to-content/10" />
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-content/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-content/5 rounded-full blur-[60px]" />
            </div>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundSize: '30px 30px',
              backgroundImage: `linear-gradient(to right, var(--color-line) 1px, transparent 1px),
                               linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)`,
            }} />
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-content/10 to-transparent" style={{ top: '40%' }} />
            </div>

            <div className="absolute top-4 left-5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 backdrop-blur-md border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-content-muted" />
                <span className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Active Status</span>
              </div>
            </div>

            <div className="absolute top-4 right-5 flex items-center gap-2">
              {isOwnProfile && (
                <>
                  <Link to="/settings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/50 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-wider">Settings</span>
                  </Link>
                  <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/50 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-wider">Edit</span>
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem('vibe_token'); window.location.href = '/login'; }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-wider">Logout</span>
                  </button>
                </>
              )}
              <button className="p-2 rounded-lg bg-black/30 backdrop-blur-md border border-white/10 text-white/80 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent" />
          </div>

          {/* Profile Content */}
          <div className="relative px-5 sm:px-8 pb-6 -mt-20">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="flex flex-col items-center sm:items-start shrink-0">
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-content/20 via-content/5 to-content/10 opacity-60 blur-sm group-hover:from-content/40 group-hover:to-content/20 transition-all duration-500" />
                  <div className="relative">
                    <img src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.handle}`} alt={selectedUser.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-surface shadow-2xl" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-content border-3 border-surface flex items-center justify-center shadow-lg group-hover:bg-white group-hover:text-black transition-colors">
                      <svg className="w-3.5 h-3.5 text-background group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left pt-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl md:text-3xl font-black text-content tracking-tight">{selectedUser.name}</h1>
                      {selectedUser.isVerified && (
                        <svg className={`w-6 h-6 ${selectedUser.handle === '@x' ? 'text-red-500' : 'text-sky-500'} shrink-0`} viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <span className="text-sm text-content-muted font-mono">{selectedUser.handle}</span>
                      {selectedUser.isVerified && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-md ${selectedUser.handle === '@x' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-sky-500/10 border-sky-500/20 text-sky-500'} font-bold uppercase tracking-wider`}>
                          {selectedUser.handle === '@x' ? 'Alpha Leader' : 'Verified'}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isOwnProfile && (
                    <div className="flex flex-col gap-2">
                      <button onClick={handleFollow} className={`group relative overflow-hidden px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${profileData?.stats.is_following ? 'border border-line text-content hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30' : 'bg-content text-background hover:bg-white hover:text-black hover:shadow-xl hover:shadow-white/10 active:scale-95'}`}>
                        {!profileData?.stats.is_following && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                        <span className="relative flex items-center gap-2">
                          {profileData?.stats.is_following ? (
                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Following</>
                          ) : (
                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Follow</>
                          )}
                        </span>
                      </button>
                      {authUser?.isAdmin && (
                        <div className="flex gap-2">
                          <button onClick={handleAdminVerify} className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${profileData?.profile?.isVerified ? 'border-sky-500/30 text-sky-500 hover:bg-sky-500/10' : 'border-white/10 text-white/40 hover:text-sky-500 hover:border-sky-500/30'}`}>
                            {profileData?.profile?.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button onClick={handleAdminDelete} className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all">Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-content/80 leading-relaxed mt-4 max-w-lg mx-auto sm:mx-0" dir="auto">
                  {selectedUser.bio || 'No bio yet. This mystery keeps us intrigued.'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  {selectedUser.location && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-content-muted hover:border-neon/20 hover:text-neon transition-all cursor-default">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {selectedUser.location}
                    </span>
                  )}
                  {selectedUser.website && (
                    <a href={selectedUser.website.startsWith('http') ? selectedUser.website : `https://${selectedUser.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-neon hover:border-neon/30 hover:bg-neon/5 transition-all">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {selectedUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-line text-xs text-content-muted">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Joined {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-line">
            <div className="grid grid-cols-4">
              {[
                { key: 'posts', label: 'Posts', value: profileData?.stats.posts || 0, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                { key: 'followers', label: 'Followers', value: profileData?.stats.followers || 0, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                { key: 'following', label: 'Following', value: profileData?.stats.following || 0, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
                { key: 'likes', label: 'Resonances', value: profileData?.stats.likes || 0, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" /></svg> },
              ].map((stat, i) => (
                <button
                  key={stat.key}
                  onMouseEnter={() => setHoveredStat(stat.key)}
                  onMouseLeave={() => setHoveredStat(null)}
                  onClick={() => {
                    if (stat.key === 'followers' || stat.key === 'following') {
                      fetchFollowUsers(stat.key);
                    } else {
                      setActiveTab(stat.key as any);
                    }
                  }}
                  className={`relative py-4 text-center transition-all duration-300 group ${i < 3 ? 'border-r border-line' : ''} ${hoveredStat === stat.key ? 'bg-content/5' : 'hover:bg-content/[0.02]'}`}
                >
                  {hoveredStat === stat.key && (
                    <motion.div layoutId="stat-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-content" transition={{ type: 'spring', damping: 20, stiffness: 300 }} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <span className={`transition-colors ${hoveredStat === stat.key ? 'text-content' : 'text-content-muted'}`}>{stat.icon}</span>
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-content">{stat.value.toLocaleString()}</span>
                    <span className="text-[10px] text-content-muted font-medium uppercase tracking-wider">{stat.label}</span>
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
          { key: 'projects' as const, label: 'Projects', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, count: projects.length },
          { key: 'likes' as const, label: 'Resonances', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" /></svg>, count: profileData?.stats.likes },
          { key: 'media' as const, label: 'Media', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, count: userPosts.filter(p => p.image).length },
          { key: 'about' as const, label: 'About', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap ${activeTab === t.key ? 'bg-content text-background shadow-lg shadow-black/10' : 'text-content-muted hover:text-content hover:bg-content/5'}`}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === t.key ? 'bg-background/20 text-background' : 'bg-line text-content-muted'}`}>{t.count}</span>
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

          {/* ══════════════════════════════════════════════════
              📌 POSTS TAB
              ══════════════════════════════════════════════════ */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {userPosts.length > 0 ? userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as any}
                />
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

          {/* ══════════════════════════════════════════════════════════════
              🚀 PROJECTS TAB — UNIQUE DESIGN
              ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'projects' && (
            <div>
              {/* ── Projects Header Bar ── */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-xl bg-neon/10 blur-md" />
                    <div className="relative w-10 h-10 rounded-xl bg-surface border border-neon/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-content leading-none">Portfolio</h2>
                    <p className="text-[11px] text-content-muted mt-0.5 font-medium">
                      {projects.length} project{projects.length !== 1 ? 's' : ''} showcased
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center gap-0.5 p-1 rounded-xl bg-surface border border-line">
                    <button
                      onClick={() => setProjectViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${projectViewMode === 'grid' ? 'bg-content text-background' : 'text-content-muted hover:text-content'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setProjectViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${projectViewMode === 'list' ? 'bg-content text-background' : 'text-content-muted hover:text-content'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Add Button */}
                  {isOwnProfile && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neon text-black text-xs font-bold hover:shadow-lg hover:shadow-neon/25 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      New Project
                    </motion.button>
                  )}
                </div>
              </div>

              {/* ── Featured/Pinned Project (first one) ── */}
              {projects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div
                    onClick={() => setSelectedProject(projects[0])}
                    className="group relative rounded-3xl border border-line bg-surface overflow-hidden cursor-pointer hover:border-neon/30 transition-all duration-500"
                  >
                    {/* Featured Banner */}
                    <div className="relative h-56 sm:h-72 overflow-hidden">
                      {(projects[0].thumbnail_url || projects[0].images?.[0]) ? (
                        <img
                          src={projects[0].thumbnail_url || projects[0].images[0]}
                          alt={projects[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neon/5 via-surface to-content/5 flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute -inset-8 rounded-full bg-neon/5 blur-2xl" />
                            <svg className="relative w-20 h-20 text-content-muted/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

                      {/* Featured badge */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon/15 backdrop-blur-xl border border-neon/20">
                          <svg className="w-3 h-3 text-neon" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span className="text-[10px] text-neon font-bold uppercase tracking-wider">Featured</span>
                        </div>
                      </div>

                      {/* Image count */}
                      {projects[0].images?.length > 1 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {projects[0].images.length}
                        </div>
                      )}
                    </div>

                    {/* Featured Content */}
                    <div className="relative p-6 -mt-16">
                      <h3 className="text-2xl font-black text-content group-hover:text-neon transition-colors duration-300 line-clamp-1">
                        {projects[0].title}
                      </h3>
                      <p className="text-sm text-content-muted mt-2 line-clamp-2 leading-relaxed max-w-2xl" dir="auto">
                        {projects[0].description}
                      </p>

                      {/* Tech + Links Row */}
                      <div className="flex items-end justify-between gap-4 mt-4">
                        {projects[0].tech_stack?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {projects[0].tech_stack.slice(0, 5).map(tech => (
                              <span key={tech} className="px-2.5 py-1 rounded-lg bg-neon/8 border border-neon/10 text-neon text-[10px] font-bold uppercase tracking-wider">
                                {tech}
                              </span>
                            ))}
                            {projects[0].tech_stack.length > 5 && (
                              <span className="px-2 py-1 rounded-lg bg-content/5 text-content-muted text-[10px] font-bold">
                                +{projects[0].tech_stack.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                          {projects[0].live_url && (
                            <a href={projects[0].live_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neon text-black text-[11px] font-bold hover:shadow-lg hover:shadow-neon/25 transition-all">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Live
                            </a>
                          )}
                          {projects[0].github_url && (
                            <a href={projects[0].github_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line text-content-muted hover:text-content text-[11px] font-bold hover:bg-content/5 transition-all">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                              Code
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Rest of Projects ── */}
              {projects.length > 1 && (
                <>
                  {/* Section divider */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-line/50" />
                    <span className="text-[10px] font-bold text-content-muted/50 uppercase tracking-[0.15em]">
                      All Projects
                    </span>
                    <div className="h-px flex-1 bg-line/50" />
                  </div>

                  <AnimatePresence mode="wait">
                    {projectViewMode === 'grid' ? (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {projects.slice(1).map((project, i) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => setSelectedProject(project)}
                            className="group relative rounded-2xl border border-line bg-surface overflow-hidden cursor-pointer hover:border-neon/25 hover:shadow-xl hover:shadow-neon/5 transition-all duration-500"
                          >
                            {/* Thumbnail with corner accent */}
                            <div className="relative h-44 overflow-hidden">
                              {(project.thumbnail_url || project.images?.[0]) ? (
                                <img
                                  src={project.thumbnail_url || project.images[0]}
                                  alt={project.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-content/[0.03] to-content/[0.08] flex items-center justify-center">
                                  <svg className="w-14 h-14 text-content-muted/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                              )}

                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Corner accents */}
                              <div className="absolute top-0 left-0 w-8 h-8">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-neon/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              </div>

                              {/* Image count */}
                              {project.images?.length > 1 && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white text-[9px] font-bold">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {project.images.length}
                                </div>
                              )}

                              {/* Index number */}
                              <div className="absolute bottom-3 left-3">
                                <span className="text-[40px] font-black text-content/[0.06] leading-none select-none">
                                  {String(i + 2).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                              <h3 className="text-base font-bold text-content group-hover:text-neon transition-colors duration-300 line-clamp-1">
                                {project.title}
                              </h3>
                              <p className="text-[13px] text-content-muted mt-1.5 line-clamp-2 leading-relaxed" dir="auto">
                                {project.description}
                              </p>

                              {/* Tech Stack */}
                              {project.tech_stack?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {project.tech_stack.slice(0, 3).map(tech => (
                                    <span key={tech} className="px-2 py-0.5 rounded-md bg-neon/8 border border-neon/10 text-neon text-[9px] font-bold uppercase tracking-wider">
                                      {tech}
                                    </span>
                                  ))}
                                  {project.tech_stack.length > 3 && (
                                    <span className="px-2 py-0.5 rounded-md bg-content/5 text-content-muted text-[9px] font-bold">
                                      +{project.tech_stack.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/50">
                                <div className="flex items-center gap-3">
                                  {project.live_url && (
                                    <a href={project.live_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                      className="flex items-center gap-1 text-[11px] text-neon hover:underline font-semibold">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Demo
                                    </a>
                                  )}
                                  {project.github_url && (
                                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                      className="flex items-center gap-1 text-[11px] text-content-muted hover:text-content font-semibold">
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                      Code
                                    </a>
                                  )}
                                </div>
                                <span className="text-[10px] text-content-muted/50 font-mono">
                                  {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      /* ── List View ── */
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        {projects.slice(1).map((project, i) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setSelectedProject(project)}
                            className="group flex items-center gap-4 p-4 rounded-2xl border border-line bg-surface cursor-pointer hover:border-neon/20 hover:bg-neon/[0.02] transition-all duration-300"
                          >
                            {/* Mini Thumbnail */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-line">
                              {(project.thumbnail_url || project.images?.[0]) ? (
                                <img src={project.thumbnail_url || project.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-content/5 to-content/10 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-content-muted/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                              )}
                              {/* Number overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                                <span className="text-white/0 group-hover:text-white/90 text-lg font-black transition-all duration-300">
                                  {String(i + 2).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="text-sm font-bold text-content group-hover:text-neon transition-colors line-clamp-1">
                                    {project.title}
                                  </h3>
                                  <p className="text-[12px] text-content-muted mt-1 line-clamp-1" dir="auto">
                                    {project.description}
                                  </p>
                                </div>
                                <svg className="w-4 h-4 text-content-muted/30 group-hover:text-neon shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>

                              {/* Tech + Date */}
                              <div className="flex items-center gap-2 mt-2">
                                {project.tech_stack?.slice(0, 3).map(tech => (
                                  <span key={tech} className="px-1.5 py-0.5 rounded bg-neon/8 text-neon text-[8px] font-bold uppercase tracking-wider">
                                    {tech}
                                  </span>
                                ))}
                                <span className="ml-auto text-[9px] text-content-muted/40 font-mono">
                                  {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* ── Create First Project (Empty State) ── */}
              {projects.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  {/* Decorative background */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.015]" style={{
                      backgroundSize: '24px 24px',
                      backgroundImage: `radial-gradient(circle, var(--color-content) 1px, transparent 1px)`,
                    }} />
                  </div>

                  <div className="relative py-24 text-center">
                    {/* Animated icon container */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-3xl bg-neon/5 border border-neon/10 rotate-6 animate-pulse" />
                      <div className="absolute inset-0 rounded-3xl bg-neon/3 border border-neon/5 -rotate-3" />
                      <div className="relative w-full h-full rounded-3xl bg-surface border border-line flex items-center justify-center">
                        <svg className="w-10 h-10 text-content-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-content">
                      {isOwnProfile ? 'Start Your Portfolio' : 'No projects yet'}
                    </h3>
                    <p className="text-sm text-content-muted mt-2 max-w-sm mx-auto leading-relaxed">
                      {isOwnProfile
                        ? 'Showcase your best work. Add projects with images, tech stack, and live demos.'
                        : "This user hasn't added any projects yet. Check back later!"}
                    </p>

                    {isOwnProfile && (
                      <div className="mt-8 flex flex-col items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsCreateProjectOpen(true)}
                          className="group relative overflow-hidden px-8 py-3.5 rounded-2xl bg-neon text-black text-sm font-bold shadow-lg shadow-neon/20 hover:shadow-xl hover:shadow-neon/30 transition-all"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <span className="relative flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create First Project
                          </span>
                        </motion.button>

                        {/* Feature hints */}
                        <div className="flex items-center gap-4 mt-2">
                          {['Images', 'Tech Stack', 'Live Demo', 'Source Code'].map((feature, i) => (
                            <span key={feature} className="flex items-center gap-1 text-[10px] text-content-muted/50">
                              <svg className="w-2.5 h-2.5 text-neon/40" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Projects Stats Footer ── */}
              {projects.length > 0 && (
                <div className="mt-8 p-5 rounded-2xl border border-line/50 bg-surface/50">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Projects', value: projects.length, icon: '📦' },
                      { label: 'Technologies', value: [...new Set(projects.flatMap(p => p.tech_stack || []))].length, icon: '⚡' },
                      { label: 'With Live Demo', value: projects.filter(p => p.live_url).length, icon: '🌐' },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <span className="text-lg">{stat.icon}</span>
                        <div className="text-xl font-black text-content tabular-nums mt-1">{stat.value}</div>
                        <div className="text-[10px] text-content-muted font-medium uppercase tracking-wider mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              ❤️ LIKES TAB
              ══════════════════════════════════════════════════ */}
          {activeTab === 'likes' && (
            <EmptyState
              icon={<svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" /></svg>}
              title="No likes yet"
              description="Liked posts will appear here."
            />
          )}

          {/* ══════════════════════════════════════════════════
              🖼️ MEDIA TAB
              ══════════════════════════════════════════════════ */}
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
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h3.25l1.5 4.75l4 -12.5l3.25 11l2 -3.25h3" /></svg>
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

          {/* ══════════════════════════════════════════════════
              ℹ️ ABOUT TAB
              ══════════════════════════════════════════════════ */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} title="About">
                <p className="text-sm text-content-muted leading-relaxed" dir="auto">{selectedUser.bio || "This user hasn't shared their story yet."}</p>
              </InfoCard>
              <InfoCard icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} title="Details">
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
              <InfoCard icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} title="Activity">
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
              <InfoCard icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} title="Interests">
                <div className="flex flex-wrap gap-2">
                  {['Technology', 'AI', 'Design', 'Open Source', 'Music', 'Photography'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-xl border border-line text-xs text-content-muted hover:text-neon hover:border-neon/30 hover:bg-neon/5 cursor-pointer transition-all font-medium">{tag}</span>
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
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={profileData.profile} onUpdate={fetchProfile} />
      )}

      {/* Followers/Following Modal */}
      <AnimatePresence>
        {isFollowersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFollowersModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[70vh] overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
                <h2 className="text-lg font-black text-content capitalize">{followModalType}</h2>
                <button onClick={() => setIsFollowersModalOpen(false)} className="p-2 rounded-xl hover:bg-content/5 text-content-muted transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {followLoading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-8 h-8 border-2 border-neon/20 border-t-neon rounded-full animate-spin" />
                    <p className="text-xs text-content-muted font-mono">Loading users...</p>
                  </div>
                ) : followUsers.length > 0 ? (
                  <div className="space-y-2">
                    {followUsers.map((u) => (
                      <Link
                        key={u.id}
                        to={`/profile/${u.handle}`}
                        onClick={() => setIsFollowersModalOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-content/5 transition-all group"
                      >
                        <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-sm font-bold text-content truncate group-hover:text-neon transition-colors">{u.name}</h4>
                            {u.isVerified && (
                              <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[11px] text-content-muted font-mono truncate">{u.handle}</p>
                        </div>
                        <button className="px-4 py-1.5 rounded-lg bg-content/5 border border-line text-[10px] font-bold text-content hover:bg-content hover:text-background transition-all">
                          View
                        </button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-content/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-content-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-content-muted font-medium">No users found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={() => {
          setIsCreateProjectOpen(false);
          if (profileData?.profile?.id) fetchProjects(profileData.profile.id);
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          🔍 PROJECT DETAIL MODAL — ENHANCED
          ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl flex flex-col"
            >
              {/* Modal Header Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-content leading-none">Project Details</h2>
                    <p className="text-[10px] text-content-muted mt-0.5 font-mono">
                      {new Date(selectedProject.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-xl border border-line hover:bg-content/5 text-content-muted hover:text-content transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1">
                {/* Images Gallery */}
                {selectedProject.images?.length > 0 && (
                  <div className="relative">
                    {/* Main Image Display */}
                    <motion.img
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={selectedProject.images[currentImageIndex]}
                      alt={selectedProject.title}
                      className="w-full h-64 sm:h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />

                    {/* Navigation Arrows - Only show if more than 1 image */}
                    {selectedProject.images.length > 1 && (
                      <>
                        {/* Previous Button */}
                        {currentImageIndex > 0 && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentImageIndex(prev => prev - 1)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </motion.button>
                        )}

                        {/* Next Button */}
                        {currentImageIndex < selectedProject.images.length - 1 && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentImageIndex(prev => prev + 1)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.button>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs font-mono">
                          {currentImageIndex + 1} / {selectedProject.images.length}
                        </div>
                      </>
                    )}

                    {/* Thumbnail Gallery */}
                    {selectedProject.images.length > 1 && (
                      <div className="flex gap-2 px-6 py-3 overflow-x-auto scrollbar-hide -mt-8 relative z-10">
                        {selectedProject.images.map((img, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentImageIndex(i)}
                            className="relative shrink-0 cursor-pointer"
                          >
                            <img
                              src={img}
                              alt={`Preview ${i + 1}`}
                              className={`h-14 w-20 rounded-xl object-cover border-2 transition-all shadow-lg ${i === currentImageIndex
                                ? 'border-neon scale-105 ring-2 ring-neon/30'
                                : 'border-surface hover:border-neon/50'
                                }`}
                            />
                            {i === 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Project Info */}
                <div className="p-6">
                  <h2 className="text-2xl font-black text-content leading-tight">{selectedProject.title}</h2>
                  <p className="text-sm text-content-muted mt-3 leading-relaxed" dir="auto">{selectedProject.description}</p>

                  {/* Tech Stack Section */}
                  {selectedProject.tech_stack?.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-[10px] font-bold text-content-muted uppercase tracking-[0.1em] mb-2.5">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech_stack.map(tech => (
                          <span key={tech} className="px-3 py-1.5 rounded-xl bg-neon/8 border border-neon/10 text-neon text-xs font-bold hover:bg-neon/15 transition-colors cursor-default">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-line">
                    {selectedProject.live_url && (
                      <a href={selectedProject.live_url} target="_blank" rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon text-black text-sm font-bold hover:shadow-lg hover:shadow-neon/25 transition-all">
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Demo
                      </a>
                    )}
                    {selectedProject.github_url && (
                      <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line text-content text-sm font-bold hover:bg-content/5 transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        Source Code
                      </a>
                    )}
                  </div>

                  {/* Delete option */}
                  {isOwnProfile && (
                    <div className="mt-6 pt-4 border-t border-line/50">
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this project?')) return;
                          const token = localStorage.getItem('vibe_token');
                          const res = await fetch(`${API_URL}/projects/${selectedProject.id}`, {
                            method: 'DELETE', credentials: 'include',
                            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                          });
                          if (res.ok) {
                            showToast('Project deleted', 'success');
                            setSelectedProject(null);
                            if (profileData?.profile?.id) fetchProjects(profileData.profile.id);
                          } else {
                            showToast('Failed to delete project', 'error');
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs text-red-500/70 hover:text-red-500 transition-colors group"
                      >
                        <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete this project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  icon: React.ReactNode; title: string; description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="py-20 text-center">
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface border border-line flex items-center justify-center text-content-muted/30">{icon}</div>
      <h3 className="text-lg font-bold text-content">{title}</h3>
      <p className="text-sm text-content-muted mt-2 max-w-xs mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-5 px-6 py-2.5 rounded-xl bg-neon text-black text-sm font-bold hover:shadow-lg hover:shadow-neon/25 active:scale-95 transition-all">{action.label}</button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   📦 CREATE PROJECT MODAL — UNIQUE MULTI-STEP WIZARD DESIGN
   ═══════════════════════════════════════════════════════════ */

function CreateProjectModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 3;
  const canGoNext = step === 1 ? title.trim().length > 0 && description.trim().length > 0 : true;

  const suggestedTechs = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Tailwind', 'PostgreSQL', 'Firebase', 'Docker', 'GraphQL', 'Flutter', 'Swift'];

  const handleAddTech = (tech?: string) => {
    const val = (tech || techInput).trim();
    if (val && !techStack.includes(val)) {
      setTechStack(prev => [...prev, val]);
      if (!tech) setTechInput('');
    }
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const token = localStorage.getItem('vibe_token');
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        const res = await fetch(`${API_URL}/uploads/post-image`, {
          method: 'POST', credentials: 'include',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, data.url]);
        } else {
          showToast('Failed to upload image', 'error');
        }
      } catch {
        showToast('Upload error', 'error');
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleImageUpload(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem('vibe_token');
    try {
      const res = await fetch(`${API_URL}/projects/create`, {
        method: 'POST', credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tech_stack: techStack,
          live_url: liveUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          thumbnail_url: images[0] || null,
          images,
        }),
      });
      if (res.ok) {
        showToast('Project created successfully! 🎉', 'success');
        setTitle(''); setDescription(''); setTechStack([]); setTechInput('');
        setLiveUrl(''); setGithubUrl(''); setImages([]); setStep(1);
        onCreated();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Failed to create project', 'error');
      }
    } catch {
      showToast('Error creating project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1); setTitle(''); setDescription(''); setTechStack([]); setTechInput('');
    setLiveUrl(''); setGithubUrl(''); setImages([]);
    onClose();
  };

  if (!isOpen) return null;

  const stepLabels = ['Details', 'Tech & Links', 'Images'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-line bg-surface shadow-2xl shadow-black/40"
        >
          {/* ── Decorative top edge glow ── */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon/50 to-transparent" />

          {/* ── Header with step progress ── */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-neon/15 blur-md animate-pulse" />
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon/20 to-neon/5 border border-neon/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-content leading-none">Create Project</h2>
                  <p className="text-[10px] text-content-muted mt-1 font-medium">Step {step} of {totalSteps} · {stepLabels[step - 1]}</p>
                </div>
              </div>
              <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-content/5 text-content-muted hover:text-content transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Step Indicator ── */}
            <div className="flex items-center gap-2">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => { if (i + 1 < step || canGoNext) setStep(i + 1); }}
                    className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all duration-300 ${step === i + 1
                      ? 'bg-neon/10 text-neon border border-neon/20'
                      : i + 1 < step
                        ? 'bg-content/5 text-content border border-transparent'
                        : 'text-content-muted/40 border border-transparent'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${step === i + 1 ? 'bg-neon text-black' : i + 1 < step ? 'bg-content text-background' : 'bg-content/10 text-content-muted/40'
                      }`}>
                      {i + 1 < step ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className="hidden sm:inline truncate">{label}</span>
                  </button>
                  {i < stepLabels.length - 1 && (
                    <div className={`w-4 h-[2px] rounded-full shrink-0 transition-colors ${i + 1 < step ? 'bg-content/30' : 'bg-content/5'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Step Content ── */}
          <div className="px-6 pb-4 min-h-[280px]">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Basic Info ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 rounded-full bg-neon" />
                      Project Title
                    </label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="What's your project called?"
                      autoFocus
                      className="w-full px-4 py-3.5 rounded-2xl border border-line bg-background text-content text-sm placeholder-content-muted/40 focus:border-neon/40 focus:ring-2 focus:ring-neon/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 rounded-full bg-neon" />
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Tell the world what your project does and why it matters..."
                      rows={5}
                      className="w-full px-4 py-3.5 rounded-2xl border border-line bg-background text-content text-sm placeholder-content-muted/40 focus:border-neon/40 focus:ring-2 focus:ring-neon/10 outline-none transition-all resize-none"
                      dir="auto"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-[10px] font-mono ${description.length > 500 ? 'text-orange-400' : 'text-content-muted/30'}`}>
                        {description.length}/500
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Tech & Links ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Tech Stack */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 rounded-full bg-neon" />
                      Tech Stack
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={techInput}
                        onChange={e => setTechInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTech(); } }}
                        placeholder="Type and press Enter..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-line bg-background text-content text-sm placeholder-content-muted/40 focus:border-neon/40 outline-none transition-all"
                      />
                      <button onClick={() => handleAddTech()} className="px-4 py-2.5 rounded-xl bg-neon/10 text-neon text-sm font-bold hover:bg-neon/20 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Added techs */}
                    {techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl border border-neon/10 bg-neon/[0.02]">
                        {techStack.map(tech => (
                          <motion.span
                            key={tech}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon/10 border border-neon/15 text-neon text-xs font-bold"
                          >
                            {tech}
                            <button onClick={() => setTechStack(techStack.filter(t => t !== tech))} className="opacity-50 hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}

                    {/* Quick suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedTechs.filter(t => !techStack.includes(t)).slice(0, 8).map(tech => (
                        <button
                          key={tech}
                          onClick={() => handleAddTech(tech)}
                          className="px-2.5 py-1 rounded-lg border border-line text-[10px] text-content-muted font-medium hover:text-neon hover:border-neon/20 hover:bg-neon/5 transition-all"
                        >
                          + {tech}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-content-muted uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-neon" />
                      Project Links
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-neon/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <input
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                        placeholder="https://your-project.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-background text-content text-sm placeholder-content-muted/40 focus:border-neon/40 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-content-muted/30" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </div>
                      <input
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-background text-content text-sm placeholder-content-muted/40 focus:border-neon/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Images ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="flex items-center gap-2 text-xs font-bold text-content-muted uppercase tracking-wider mb-3">
                    <span className="w-1 h-1 rounded-full bg-neon" />
                    Project Images
                  </label>

                  <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={e => e.target.files && handleImageUpload(e.target.files)} className="hidden" />

                  {/* Drag & Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${dragOver
                      ? 'border-neon bg-neon/5 scale-[1.02]'
                      : 'border-line hover:border-neon/30 hover:bg-neon/[0.02]'
                      }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-neon/20 border-t-neon rounded-full animate-spin" />
                        <span className="text-sm font-bold text-neon">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-neon/5 border border-neon/10 flex items-center justify-center">
                          <svg className="w-7 h-7 text-neon/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-content">
                            {dragOver ? 'Drop images here!' : 'Drag & drop images'}
                          </p>
                          <p className="text-[11px] text-content-muted mt-1">or click to browse · PNG, JPG, WebP</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {images.map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-line"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, idx) => idx !== i)); }}
                              className="p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {i === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 py-0.5 bg-neon text-center">
                              <span className="text-[7px] text-black font-black uppercase tracking-wider">Cover</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer Navigation ── */}
          <div className="px-6 py-4 border-t border-line flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : resetAndClose()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-content-muted hover:text-content hover:bg-content/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {step > 1 ? 'Back' : 'Cancel'}
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 === step ? 'w-6 bg-neon' : i + 1 < step ? 'w-1.5 bg-content/40' : 'w-1.5 bg-content/10'
                    }`}
                />
              ))}
            </div>

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neon text-black text-sm font-bold hover:shadow-lg hover:shadow-neon/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neon text-black text-sm font-bold hover:shadow-lg hover:shadow-neon/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Publish
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}