import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  Copy,
  Cpu,
  Terminal,
  ShieldCheck,
  Bookmark,
  Check,
  Sparkles,
} from 'lucide-react';
import { Post } from '../data/mockData';
import { usePosts } from '../context/PostContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post & { hasLiked?: boolean };
}

export const PostCard = ({ post }: PostCardProps) => {
  const isAI = post.isAIPost;
  const { likePost, commentOnPost } = usePosts();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [localComments, setLocalComments] = React.useState<any[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const API_URL = (import.meta as any).env.VITE_API_URL;

  const handleCopyCode = () => {
    if (post.codeSnippet) {
      navigator.clipboard.writeText(post.codeSnippet.code);
      setCopied(true);
      showToast('Code copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async () => {
    if (!user) {
        showToast('Please login to like posts', 'info');
        return;
    }
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
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    await commentOnPost(post.id, commentText);
    showToast('Reply sent!', 'success');
    setCommentText('');
    fetchComments(); // Refresh comments list
  };

  return (
    <div
      className={`
        w-full max-w-2xl mx-auto
        relative rounded-2xl overflow-hidden
        bg-surface/80 backdrop-blur-sm
        border border-line/50
        shadow-lg shadow-black/5
        hover:shadow-xl hover:shadow-black/10
        hover:border-line
        transition-all duration-300
      `}
    >
      {/* AI Gradient Accent */}


      {/* Header Bar */}
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-line/30">
        <div className="flex items-center gap-3 text-[11px] font-mono text-content-muted">
          {isAI && (
            <div className="flex items-center gap-1.5 text-neon">
              <Sparkles size={12} />
              <span className="font-semibold">AI</span>
            </div>
          )}
          <span className="opacity-60">#{post.id.slice(0, 8)}</span>
          <span className="opacity-30">•</span>
          <span className="opacity-60">
            {formatDistanceToNow(new Date(post.timestamp))} ago
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="
              p-1.5 rounded-lg
              text-content-muted hover:text-content
              hover:bg-white/5
              transition-all duration-200
            "
          >
            <MoreVertical size={14} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="
                absolute top-full right-0 mt-1 z-50
                w-44 py-1.5
                bg-surface border border-line
                rounded-xl shadow-2xl shadow-black/20
                overflow-hidden
              "
            >
              {['Report', 'Hide', 'Not Interested'].map((item) => (
                <button
                  key={item}
                  onClick={() => setShowMenu(false)}
                  className="
                    w-full px-4 py-2 text-left text-sm
                    text-content-muted hover:text-content
                    hover:bg-white/5 transition-colors
                  "
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative p-5">
        {/* User Info */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative">
            <Link to={`/profile/${post.user.handle.replace('@','')}`} className="block">
              <div
                className={`
                w-11 h-11 rounded-xl overflow-hidden
                border-2 transition-colors duration-300
                border-line hover:border-line/80
              `}
              >
                <img
  src={post.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.handle || post.user.id}`}
  alt={post.user.name}
  className="w-full h-full object-cover"
/>
              </div>
            </Link>

            {isAI && (
              <div
                className="
                  absolute -bottom-1 -right-1
                  bg-background rounded-md p-[3px]
                  border border-line
                  shadow-sm shadow-black/10
                "
              >
                <Cpu size={10} className="text-content" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-content truncate">
                {post.user.name}
              </h3>
              {isAI && (
                <div className="flex-shrink-0">
                  <ShieldCheck size={14} className="text-content-muted" />
                </div>
              )}
            </div>
            <p className="text-xs text-content-muted font-mono truncate">
              {post.user.handle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4 text-content text-[14.5px] leading-[1.7] whitespace-pre-wrap">
          {post.content}
        </div>

        {/* AI Status Badge */}
        {isAI && post.aiStatus && (
          <div
            className="
              mb-4 inline-flex items-center gap-2
              px-3 py-1.5 rounded-lg
              bg-surface/10
              border border-line
              text-content text-[11px] font-mono font-medium
            "
          >
            <span className="w-1.5 h-1.5 rounded-full bg-line" />
            <span className="capitalize tracking-wide">
              Status: {post.aiStatus}
            </span>
          </div>
        )}

        {/* Code Snippet */}
        {post.codeSnippet && (
          <div
            className="
              mb-4 rounded-xl overflow-hidden
              border border-line/50
              bg-[#0d1117]
              shadow-inner
            "
          >
            {/* Code Header */}
            <div
              className="
              flex items-center justify-between
              px-4 py-2.5
              bg-white/[0.03]
              border-b border-white/[0.06]
            "
            >
              <div className="flex items-center gap-3">
                {/* Window Dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-content-muted/60 font-mono">
                  <Terminal size={12} />
                  <span>{post.codeSnippet.language}</span>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="
                  flex items-center gap-1.5
                  px-2.5 py-1 rounded-md
                  text-content-muted/60 hover:text-neon
                  hover:bg-neon/10
                  transition-all duration-200
                  text-[11px] font-mono
                "
              >
                {copied ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Check size={12} />
                    <span>Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Copy size={12} />
                    <span>Copy</span>
                  </div>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="relative">
              <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-6 text-gray-300">
                <code>{post.codeSnippet.code}</code>
              </pre>
              {/* Fade effect at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Image Support */}
        {post.image && (
          <div
            className="
              mb-4 rounded-xl overflow-hidden
              border border-line/30
              group/img relative
            "
          >
            <img
              src={post.image}
              alt=""
              className="w-full object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-line/30 mt-2">
          <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`
                flex items-center gap-2
                px-3 py-2 rounded-xl
                text-sm font-medium
                transition-all duration-200
                ${
                  post.hasLiked
                    ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/15'
                    : 'text-content-muted hover:text-rose-400 hover:bg-rose-500/5'
                }
              `}
            >
              <div>
                <Heart
                  size={17}
                  className={post.hasLiked ? 'fill-current' : ''}
                />
              </div>
              <span className="text-[13px]">{post.likes}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={handleToggleComments}
              className={`
                flex items-center gap-2
                px-3 py-2 rounded-xl
                text-sm transition-all duration-200
                ${showComments ? 'text-sky-400 bg-sky-400/10' : 'text-content-muted hover:text-sky-400 hover:bg-sky-400/5'}
              `}
            >
              <MessageSquare size={17} />
              <span className="text-[13px]">{post.comments ?? 0}</span>
            </button>

            {/* Share Button */}
            <button
              className="
                flex items-center gap-2
                px-3 py-2 rounded-xl
                text-sm text-content-muted
                hover:text-emerald-400 hover:bg-emerald-400/5
                transition-all duration-200
              "
            >
              <Share2 size={17} />
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            className="p-2 rounded-xl text-content-muted hover:text-amber-400 hover:bg-amber-400/5 transition-all duration-200"
          >
            <Bookmark size={17} />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-line/10 space-y-4">
            {/* Comment Input */}
            {user ? (
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`} 
                      className="w-8 h-8 rounded-lg shrink-0" 
                    />
                    <div className="flex-1 flex gap-2">
                        <input 
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Add a vibe..."
                          className="flex-1 bg-background/50 border border-line rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon transition-colors"
                        />
                        <button 
                          disabled={!commentText.trim()}
                          type="submit"
                          className="px-4 py-2 bg-neon text-black text-xs font-bold rounded-xl disabled:opacity-50"
                        >
                            Reply
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-xs text-content-muted text-center py-2">Sign in to join the conversation</p>
            )}

            {/* Comments List */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {loadingComments ? (
                    <div className="flex justify-center py-4">
                        <div className="w-4 h-4 border-2 border-neon border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : localComments.length > 0 ? (
                    localComments.map((c: any) => (
                        <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                             <img 
                                src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.handle}`} 
                                className="w-7 h-7 rounded-lg shrink-0" 
                             />
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-content">{c.profiles?.full_name}</span>
                                    <span className="text-[10px] text-content-muted">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                </div>
                                <p className="text-sm text-content-muted mt-0.5">{c.content}</p>
                             </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-middle text-content-muted py-4 text-center">No comments yet. Be the first!</p>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};