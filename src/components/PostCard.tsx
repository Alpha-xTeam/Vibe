import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../data/mockData';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../utils/supabase';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: Post & { hasLiked?: boolean };
}

const renderContentWithMentions = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.match(/^@\w+$/)) {
      const handle = part.slice(1);
      return (
        <Link
          key={i}
          to={`/profile/${handle}`}
          className="text-neon hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

export const PostCard = ({ post }: PostCardProps) => {
  const isAI = post.user.isAI || post.isAIPost;
  const { likePost, repostPost, commentOnPost, setPosts } = usePosts();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [likers, setLikers] = useState<any[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [resonateAnim, setResonateAnim] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const isLong = post.content.length > 280;
  const displayContent = expanded || !isLong ? post.content : post.content.slice(0, 280);

  useEffect(() => {
    if (!showComments) return;
    const channel = supabase
      .channel(`post-comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`
        },
        async () => {
          try {
            const res = await fetch(`${API_URL}/posts/${post.id}/comments`);
            if (res.ok) {
              const data = await res.json();
              setLocalComments(data.comments);
            }
          } catch (err) { }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showComments, post.id, API_URL]);

  useEffect(() => {
    if (!showMenu && !showLikers) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu, showLikers]);

  const fetchLikers = async () => {
    if (!API_URL || loadingLikers) return;
    setLoadingLikers(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/likers`);
      if (res.ok) {
        const data = await res.json();
        setLikers(data.likers);
      }
    } catch { } finally { setLoadingLikers(false); }
  };

  const handleToggleResonators = () => {
    if (!showLikers) fetchLikers();
    setShowLikers(!showLikers);
  };

  const handleCopy = () => {
    if (post.codeSnippet) {
      navigator.clipboard.writeText(post.codeSnippet.code);
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResonate = async () => {
    if (!user) return showToast('Sign in to resonate with posts', 'info');
    setResonateAnim(true);
    setTimeout(() => setResonateAnim(false), 600);
    await likePost(post.id);
  };

  const fetchComments = async () => {
    if (!API_URL) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setLocalComments(data.comments);
      }
    } catch { } finally { setLoadingComments(false); }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
      if (!commentText.trim()) {
        const handle = post.user.handle?.replace('@', '');
        if (handle) setCommentText(`@${handle} `);
      }
      // Focus input after a small delay to allow animation to start
      setTimeout(() => {
        const input = document.getElementById(`reply-input-${post.id}`) as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    await commentOnPost(post.id, commentText);
    showToast('Reply sent', 'success');
    setCommentText('');
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('حذف التعليق؟')) return;
    try {
      const token = localStorage.getItem('vibe_token');
      const res = await fetch(`${API_URL}/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        setLocalComments(prev => prev.filter((c: any) => c.id !== commentId));
        showToast('تم حذف التعليق', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(`خطأ: ${errData.detail || 'فشل الحذف'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  };

  const handleNotInterested = () => {
    setPosts(prev => prev.filter(p => p.id !== post.id));
    showToast('We will show you fewer posts like this', 'info');
    setShowMenu(false);
  };

  const handleMute = async () => {
    try {
      const token = localStorage.getItem('vibe_token');
      const res = await fetch(`${API_URL}/posts/mute/${post.user.id}`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.user.id !== post.user.id));
        showToast(`User ${post.user.handle} muted`, 'success');
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
    setShowMenu(false);
  };

  const handleReport = async () => {
    const reason = prompt('Reason for reporting?');
    if (!reason) return;
    try {
      const token = localStorage.getItem('vibe_token');
      const res = await fetch(`${API_URL}/posts/${post.id}/report`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        showToast('Report submitted', 'success');
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
    setShowMenu(false);
  };

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(post.timestamp), { addSuffix: false }); }
    catch { return ''; }
  })();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      {/* Outer glow on hover */}
      <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-br from-neon/0 via-transparent to-sky-400/0 group-hover:from-neon/10 group-hover:to-sky-400/10 transition-all duration-500 pointer-events-none" />

      <div className="relative bg-surface/80 backdrop-blur-xl border border-line/60 rounded-[20px] overflow-hidden hover:border-line transition-all duration-300">

        {/* AI Indicator Strip */}
        {isAI && (
          <div className="h-[2px] bg-gradient-to-r from-transparent via-neon/60 to-transparent" />
        )}

        <div className="p-5 sm:p-6">

          {/* ═══ Author Header ═══ */}
          <div className="flex items-start gap-3.5">

            {/* Avatar with status ring */}
            <Link
              to={`/profile/${post.user.handle?.replace('@', '')}`}
              className="shrink-0 relative group/avatar"
            >
              <div className={`absolute -inset-[3px] rounded-2xl bg-gradient-to-br ${isAI ? 'from-neon/40 to-sky-400/40' : 'from-transparent to-transparent'} group-hover/avatar:from-neon/30 group-hover/avatar:to-sky-400/30 transition-all duration-300`} />
              <img
                src={post.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.handle || post.user.id}`}
                alt=""
                className="relative w-11 h-11 rounded-2xl object-cover ring-2 ring-surface"
              />
              {isAI && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-neon to-neon/80 flex items-center justify-center shadow-lg shadow-neon/20"
                >
                  <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </motion.div>
              )}
            </Link>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${post.user.handle?.replace('@', '')}`}
                  className="font-bold text-[15px] text-content hover:text-neon transition-colors truncate"
                >
                  {post.user.name}
                </Link>
                {(isAI || post.user.isVerified || post.user.handle === '@x') && (
                  <div className="flex items-center gap-1">
                    <div className={`p-0.5 rounded-md ${post.user.handle === '@x' ? 'bg-red-500/10' : (post.user.isVerified ? 'bg-sky-500/10' : 'bg-neon/10')}`}>
                      <svg className={`w-3.5 h-3.5 ${post.user.handle === '@x' ? 'text-red-500' : (post.user.isVerified ? 'text-sky-500' : 'text-neon')}`} viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {post.user.handle === '@x' && (
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Alpha Leader</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-content-muted/60 text-[13px] font-mono truncate">{post.user.handle}</span>
                  <span className="w-1 h-1 rounded-full bg-content-muted/20" />
                  <span className="text-content-muted/50 text-[12px] font-mono whitespace-nowrap">{timeAgo}</span>
                </div>
              </div>

              {isAI && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon/5 border border-neon/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                    <span className="text-[10px] text-neon font-semibold tracking-wide uppercase">AI Generated</span>
                  </div>
                  {post.aiStatus && (
                    <span className="text-[10px] text-content-muted/50 font-mono capitalize px-1.5 py-0.5 rounded-md bg-line/30">{post.aiStatus}</span>
                  )}
                </div>
              )}
            </div>

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl text-content-muted/30 hover:text-content-muted hover:bg-line/40 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute top-full right-0 mt-2 z-50 w-48 py-1.5 bg-surface border border-line rounded-2xl shadow-2xl shadow-black/20 overflow-hidden backdrop-blur-xl"
                  >
                    <MenuItem
                      icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />}
                      label="Not interested"
                      onClick={handleNotInterested}
                    />
                    <MenuItem
                      icon={<path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />}
                      label="Mute user"
                      onClick={handleMute}
                    />

                    {(user?.isAdmin || user?.id === post.user.id) && (
                      <>
                        <div className="my-1 border-t border-line/50" />
                        <button
                          onClick={async () => {
                            if (confirm('Delete post?')) {
                              try {
                                const token = localStorage.getItem('vibe_token');
                                const url = user?.isAdmin ? `${API_URL}/admin/post/${post.id}` : `${API_URL}/posts/${post.id}`;
                                const res = await fetch(url, {
                                  method: 'DELETE',
                                  headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                                  credentials: 'include'
                                });
                                if (res.ok) {
                                  showToast('Post deleted', 'success');
                                  setPosts(prev => prev.filter(p => p.id !== post.id));
                                  setShowMenu(false);
                                } else {
                                  const errData = await res.json().catch(() => ({}));
                                  showToast(`Error: ${errData.detail || 'Access denied'}`, 'error');
                                }
                              } catch (err: any) {
                                showToast(`Network error: ${err.message}`, 'error');
                              }
                            }
                          }}
                          className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-red-500/5 transition-all flex items-center gap-3 text-red-400 font-bold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {user?.isAdmin && user?.id !== post.user.id ? 'Admin Delete' : 'Delete'}
                        </button>
                      </>
                    )}

                    <div className="my-1 border-t border-line/50" />
                    <MenuItem
                      icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />}
                      label="Report"
                      onClick={handleReport}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ═══ Post Content ═══ */}
          <div className="mt-4 ml-[58px]">

            {/* Text */}
            <div className="relative">
              <p
                className="text-[15px] leading-[1.75] text-content/90 whitespace-pre-wrap break-words selection:bg-neon/20"
                dir="auto"
              >
                {renderContentWithMentions(displayContent)}
                {isLong && !expanded && (
                  <span className="text-content-muted/40">…</span>
                )}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1.5 text-neon/80 text-[13px] font-semibold hover:text-neon transition-colors flex items-center gap-1"
                >
                  {expanded ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ═══ Code Block ═══ */}
            {post.codeSnippet && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-line/40 bg-[#0a0e14] shadow-lg shadow-black/10">
                {/* Code Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="h-4 w-[1px] bg-white/5" />
                    <span className="text-[11px] text-white/25 font-mono tracking-wider uppercase">{post.codeSnippet.language}</span>
                  </div>
                  <motion.button
                    onClick={handleCopy}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
                  >
                    {copied ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-green-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span>Copied!</span>
                      </motion.div>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>Copy</span>
                      </>
                    )}
                  </motion.button>
                </div>
                {/* Code Body */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-white/[0.01] border-r border-white/[0.03] flex flex-col items-end pr-3 pt-4 gap-[1.35rem] pointer-events-none">
                    {post.codeSnippet.code.split('\n').map((_, i) => (
                      <span key={i} className="text-[11px] font-mono text-white/10 leading-relaxed">{i + 1}</span>
                    ))}
                  </div>
                  <pre className="pl-14 pr-4 py-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-gray-300/90 scrollbar-hide">
                    <code>{post.codeSnippet.code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* ═══ Image ═══ */}
            {post.image && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-line/40 relative group/img">
                {!imgLoaded && (
                  <div className="w-full h-72 bg-gradient-to-br from-line/10 to-line/5 animate-pulse rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-content-muted/10 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                <img
                  src={post.image}
                  alt=""
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full max-h-[450px] object-cover transition-all duration-500 group-hover/img:scale-[1.01] ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                />
                {/* Image overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            )}

            {/* ═══ Action Bar ═══ */}
            <div className="flex items-center justify-between mt-4 pt-1">
              <div className="flex items-center gap-0.5">

                {/* Comment */}
                <ActionButton
                  onClick={handleToggleComments}
                  active={showComments}
                  color="sky"
                  count={post.comments ?? 0}
                  tooltip="Reply"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </ActionButton>

                {/* Like */}
                <div className="flex items-center relative">
                  <AnimatePresence>
                    {resonateAnim && (
                      <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <svg className="w-5 h-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <ActionButton
                    onClick={handleResonate}
                    active={!!post.hasLiked}
                    color="neon"
                    tooltip="Resonate"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </ActionButton>
                  <button
                    onClick={handleToggleResonators}
                    className={`text-[12px] font-mono transition-colors -ml-1 tabular-nums ${post.hasLiked ? 'text-neon' : 'text-content-muted/50 hover:text-neon'}`}
                  >
                    {post.likes > 0 && post.likes}
                  </button>
                </div>

                {/* Repost */}
                <div className="flex items-center gap-0.5">
                  <ActionButton
                    onClick={() => {
                      if (!user) { showToast('Sign in to repost', 'error'); return; }
                      repostPost(post.id);
                    }}
                    active={!!post.hasReposted}
                    color="green"
                    tooltip={post.hasReposted ? 'Undo Repost' : 'Repost'}
                  >
                    <svg className="w-[18px] h-[18px]" fill={post.hasReposted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </ActionButton>
                  {(post.reposts || 0) > 0 && (
                    <span className={`text-[12px] font-mono transition-colors -ml-1 tabular-nums ${post.hasReposted ? 'text-green-500' : 'text-content-muted/50'
                      }`}>
                      {post.reposts}
                    </span>
                  )}
                </div>

                {/* Share */}
                <ActionButton
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                    showToast('Link copied', 'success');
                  }}
                  color="neon"
                  tooltip="Share"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </ActionButton>
              </div>

              {/* Bookmark */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                className="p-2 rounded-xl text-content-muted/30 hover:text-amber-400 hover:bg-amber-400/5 transition-all duration-200"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ Likers Drawer ═══ */}
        <AnimatePresence>
          {showLikers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="mx-5 mb-5 ml-[78px]">
                <div className="bg-background/50 backdrop-blur-sm rounded-2xl border border-line/40 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-line/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-[11px] font-bold text-content-muted/70 uppercase tracking-widest">Resonated by</span>
                    </div>
                    <button onClick={() => setShowLikers(false)} className="p-1 rounded-lg text-content-muted/40 hover:text-content hover:bg-line/30 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-2.5 max-h-44 overflow-y-auto scrollbar-hide space-y-1">
                    {loadingLikers ? (
                      <div className="flex justify-center py-4">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -6, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                              className="w-1.5 h-1.5 rounded-full bg-rose-400/60"
                            />
                          ))}
                        </div>
                      </div>
                    ) : likers.length > 0 ? (
                      likers.map((liker: any, idx: number) => (
                        <motion.div
                          key={liker.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Link
                            to={`/profile/${liker.handle}`}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-line/20 transition-all group/liker"
                          >
                            <img src={liker.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.handle}`} alt="" className="w-7 h-7 rounded-xl border border-line group-hover/liker:border-rose-400/30 transition-colors" />
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-content truncate">{liker.full_name}</p>
                              <p className="text-[10px] text-content-muted/50 font-mono truncate">@{liker.handle}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-[11px] text-content-muted/40">No likes yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Comments Section ═══ */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="border-t border-line/30">
                <div className="p-5 sm:p-6 ml-[58px]">

                  {/* Comment Input */}
                  {user ? (
                    <form onSubmit={handleComment} className="flex items-start gap-3">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                        className="w-9 h-9 rounded-xl shrink-0 ring-2 ring-surface border border-line"
                        alt=""
                      />
                      <div className="flex-1 bg-background/60 border border-line/50 rounded-2xl overflow-hidden focus-within:border-neon/30 focus-within:shadow-[0_0_20px_rgba(var(--neon-rgb),0.05)] transition-all duration-300">
                        <input
                          id={`reply-input-${post.id}`}
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full px-4 py-3 bg-transparent text-sm text-content placeholder:text-content-muted/30 focus:outline-none"
                        />
                        <div className="flex items-center justify-between px-3 pb-2">
                          <div className="flex items-center gap-1">
                            <button type="button" className="p-1.5 rounded-lg text-content-muted/30 hover:text-content-muted hover:bg-line/20 transition-all">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button type="button" className="p-1.5 rounded-lg text-content-muted/30 hover:text-content-muted hover:bg-line/20 transition-all">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            disabled={!commentText.trim()}
                            type="submit"
                            className="px-4 py-1.5 rounded-xl bg-neon/10 text-neon text-[12px] font-bold disabled:opacity-20 hover:bg-neon/20 transition-all"
                          >
                            Reply
                          </motion.button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4 px-6 bg-background/30 rounded-2xl border border-line/30">
                      <p className="text-[13px] text-content-muted/60">
                        <Link to="/login" className="text-neon font-semibold hover:underline">Sign in</Link> to join the conversation
                      </p>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="mt-5 space-y-4 max-h-72 overflow-y-auto scrollbar-hide">
                    {loadingComments ? (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -8, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                              className="w-2 h-2 rounded-full bg-neon/40"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-content-muted/30 font-mono">Loading replies</span>
                      </div>
                    ) : localComments.length > 0 ? (
                      localComments.map((c: any, idx: number) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex gap-3 group/comment relative"
                        >
                          {/* Thread line */}
                          {idx < localComments.length - 1 && (
                            <div className="absolute left-[14px] top-9 bottom-0 w-[2px] bg-line/20 -mb-4" />
                          )}

                          <Link to={`/profile/${c.profiles?.handle}`} className="shrink-0">
                            <img
                              src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.handle}`}
                              className="w-7 h-7 rounded-xl ring-1 ring-line"
                              alt=""
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="bg-background/40 rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-line/20">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  to={`/profile/${c.profiles?.handle}`}
                                  className="text-[13px] font-bold text-content hover:text-neon transition-colors"
                                >
                                  {c.profiles?.full_name}
                                </Link>
                                {(c.profiles?.is_ai || c.profiles?.is_verified || c.profiles?.handle === 'x' || c.profiles?.handle === '@x') && (
                                  <div className="flex items-center gap-1">
                                    <div className={`p-0.5 rounded-md ${c.profiles?.handle === 'x' || c.profiles?.handle === '@x' ? 'bg-red-500/10' : (c.profiles?.is_verified ? 'bg-sky-500/10' : 'bg-neon/10')}`}>
                                      <svg className={`w-[10px] h-[10px] ${c.profiles?.handle === 'x' || c.profiles?.handle === '@x' ? 'text-red-500' : (c.profiles?.is_verified ? 'text-sky-500' : 'text-neon')}`} viewBox="0 0 24 24" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    {(c.profiles?.handle === 'x' || c.profiles?.handle === '@x') && (
                                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">Leader</span>
                                    )}
                                  </div>
                                )}
                                <span className="text-[10px] text-content-muted/40 font-mono">
                                  {(() => { try { return formatDistanceToNow(new Date(c.created_at), { addSuffix: false }); } catch { return ''; } })()}
                                </span>
                              </div>
                              <p className="text-[13px] text-content/75 leading-relaxed mt-1" dir="auto">
                                {renderContentWithMentions(c.content)}
                              </p>
                            </div>

                            {/* Comment Actions */}
                            <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-0 group-hover/comment:opacity-100 transition-all duration-200">
                              <button className="px-2 py-1 rounded-lg text-[11px] text-content-muted/40 hover:text-rose-400 hover:bg-rose-400/5 transition-all font-medium">Like</button>
                              <button
                                onClick={() => {
                                  const handle = c.profiles?.handle;
                                  if (handle && !commentText.includes(`@${handle}`)) {
                                    setCommentText(prev => `${prev}@${handle} `.trimStart());
                                  }
                                  // Find the input and focus it
                                  const input = document.getElementById(`reply-input-${post.id}`) as HTMLInputElement;
                                  if (input) input.focus();
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] text-content-muted/40 hover:text-sky-400 hover:bg-sky-400/5 transition-all font-medium"
                              >
                                Reply
                              </button>
                              {(user?.id === c.user_id || user?.isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="px-2 py-1 rounded-lg text-[11px] text-content-muted/40 hover:text-red-400 hover:bg-red-400/5 transition-all font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-line/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-content-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <p className="text-[12px] text-content-muted/30 font-medium">No replies yet</p>
                        <p className="text-[11px] text-content-muted/20">Be the first to reply</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

/* ═══════════════════════════════════
   Menu Item Component
   ═══════════════════════════════════ */
function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-line/20 text-content-muted hover:text-content transition-all flex items-center gap-3 group/item"
    >
      <svg className="w-4 h-4 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        {icon}
      </svg>
      {label}
    </button>
  );
}

/* ═══════════════════════════════════
   Action Button Component
   ═══════════════════════════════════ */
function ActionButton({
  children,
  onClick,
  active,
  color,
  count,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  color: 'sky' | 'rose' | 'green' | 'neon';
  count?: number;
  tooltip?: string;
}) {
  const colors = {
    sky: { text: 'text-sky-400', bg: 'bg-sky-400/8', hover: 'hover:text-sky-400 hover:bg-sky-400/8' },
    rose: { text: 'text-rose-500', bg: 'bg-rose-500/8', hover: 'hover:text-rose-400 hover:bg-rose-500/8' },
    green: { text: 'text-green-400', bg: 'bg-green-400/8', hover: 'hover:text-green-400 hover:bg-green-400/8' },
    neon: { text: 'text-neon', bg: 'bg-neon/8', hover: 'hover:text-neon hover:bg-neon/8' },
  };
  const c = colors[color];

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 group/action ${active ? `${c.text} ${c.bg}` : `text-content-muted/40 ${c.hover}`
        }`}
      title={tooltip}
    >
      <span className="group-hover/action:scale-110 group-active/action:scale-90 transition-transform duration-200">
        {children}
      </span>
      {count !== undefined && count > 0 && (
        <span className="tabular-nums text-[12px] font-mono">{count}</span>
      )}
    </motion.button>
  );
}